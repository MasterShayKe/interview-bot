import type { FastifyInstance } from "fastify";
import Anthropic from "@anthropic-ai/sdk";
import { streamChat, type TokenUsage } from "./chat.js";
import { generateFollowUps } from "./suggest.js";
import { buildVisitorContext, type ClientContext } from "./context.js";
import { getPublishedBotPrompts } from "./bot-cache.js";
import { defaultRules } from "./persona-defaults.js";
import { requireAuth } from "./auth/session.js";
import {
  getBotByUser,
  updateBot,
  isHandleTaken,
  listKnowledge,
  addKnowledge,
  updateKnowledge,
  deleteKnowledge,
  reorderKnowledge,
} from "./repo.js";
import type { Bot, KnowledgeItem, KnowledgeKind } from "./model.js";
import type { Guard } from "./guard.js";

const KNOWLEDGE_KINDS: KnowledgeKind[] = [
  "cv",
  "experience",
  "project",
  "personal",
  "custom",
];

const RESERVED_HANDLES = new Set([
  "api",
  "auth",
  "login",
  "logout",
  "dashboard",
  "onboarding",
  "portal",
  "u",
  "me",
  "health",
  "admin",
  "settings",
]);

/** Validates a public handle (slug). Returns an error string or null if valid. */
export function validateHandle(handle: string): string | null {
  if (!/^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/.test(handle)) {
    return "Handle must be 3-30 lowercase letters, numbers, or hyphens, and not start or end with a hyphen.";
  }
  if (RESERVED_HANDLES.has(handle)) return "That handle is reserved.";
  return null;
}

interface BotRouteDeps {
  app: FastifyInstance;
  client: Anthropic;
  guard: Guard;
  maxOutputTokens: number;
  fitMaxOutputTokens: number;
  maxJdChars: number;
}

const MAX_MESSAGES = 20;

/** Public, read-only view of a bot for its chat page. */
function publicBotView(bot: Bot, items: KnowledgeItem[]) {
  return {
    handle: bot.handle,
    displayName: bot.displayName,
    subjectName: bot.subjectName,
    tone: bot.tone,
    contactEmail: bot.contactEmail,
    targetRole: bot.targetRole,
    suggestedQuestions: bot.suggestedQuestions,
    theme: bot.theme,
    // The effective grounding rules, surfaced read-only for transparency.
    rules: [...defaultRules(bot), ...bot.extraRules],
    facts: items.map((it) => ({
      kind: it.kind,
      title: it.title,
      body: it.body,
    })),
  };
}

export function registerBotRoutes(deps: BotRouteDeps): void {
  const { app, client, guard, maxOutputTokens, fitMaxOutputTokens, maxJdChars } =
    deps;

  // --- public: a bot's spec, chat, and fit, scoped by handle ---------------

  app.get("/api/bots/:handle/spec", async (req, reply) => {
    const { handle } = req.params as { handle: string };
    const prompts = await getPublishedBotPrompts(handle);
    if (!prompts) {
      reply.code(404);
      return { error: "No published bot at this address." };
    }
    const items = await listKnowledge(prompts.bot.id);
    return publicBotView(prompts.bot, items);
  });

  app.post("/api/bots/:handle/chat", async (req, reply) => {
    const { handle } = req.params as { handle: string };
    const prompts = await getPublishedBotPrompts(handle);
    if (!prompts) {
      reply.code(404);
      return { error: "No published bot at this address." };
    }
    const bot = prompts.bot;

    if (guard.isBudgetExceeded(bot.id)) {
      reply.code(503);
      return { error: bot.budgetRestMessage };
    }
    if (!guard.checkRateLimit(req.ip).ok) {
      reply.code(429);
      return { error: "Too many messages - please slow down a moment." };
    }

    const body = req.body as {
      messages?: { role: "user" | "assistant"; content: string }[];
      clientContext?: ClientContext;
      sessionDurationSeconds?: number;
    };
    const messages = (body.messages ?? []).slice(-MAX_MESSAGES);
    if (messages.length === 0) {
      reply.code(400);
      return { error: "No messages provided." };
    }

    const visitorContext = buildVisitorContext(
      req,
      body.clientContext,
      body.sessionDurationSeconds,
    );

    streamSse(reply, async (send) => {
      const usage: TokenUsage = await streamChat({
        client,
        system: prompts.chatPrompt,
        messages,
        maxTokens: maxOutputTokens,
        onText: (delta) => send("delta", { text: delta }),
        visitorContext,
      });
      guard.recordUsage(totalTokens(usage), bot.id);
      send("done", { usage });

      try {
        const questions = await generateFollowUps(
          client,
          messages,
          bot.subjectName,
        );
        if (questions.length) send("suggestions", { questions });
      } catch {
        // non-critical - silently skip
      }
    });
  });

  app.post("/api/bots/:handle/fit", async (req, reply) => {
    const { handle } = req.params as { handle: string };
    const prompts = await getPublishedBotPrompts(handle);
    if (!prompts) {
      reply.code(404);
      return { error: "No published bot at this address." };
    }
    const bot = prompts.bot;

    if (guard.isBudgetExceeded(bot.id)) {
      reply.code(503);
      return { error: bot.budgetRestMessage };
    }
    if (!guard.checkRateLimit(req.ip).ok) {
      reply.code(429);
      return { error: "Too many requests - please slow down a moment." };
    }

    const body = req.body as {
      jobDescription?: string;
      clientContext?: ClientContext;
      sessionDurationSeconds?: number;
    };
    const jd = (body.jobDescription ?? "").trim().slice(0, maxJdChars);
    if (jd.length < 40) {
      reply.code(400);
      return { error: "Please paste a fuller job description to analyze." };
    }

    const visitorContext = buildVisitorContext(
      req,
      body.clientContext,
      body.sessionDurationSeconds,
    );

    streamSse(reply, async (send) => {
      const usage: TokenUsage = await streamChat({
        client,
        system: prompts.fitPrompt,
        messages: [
          {
            role: "user",
            content: `Assess ${bot.subjectName}'s fit for the role described below, following the required output format.\n\n--- JOB DESCRIPTION ---\n${jd}\n--- END JOB DESCRIPTION ---`,
          },
        ],
        maxTokens: fitMaxOutputTokens,
        onText: (delta) => send("delta", { text: delta }),
        visitorContext,
      });
      guard.recordUsage(totalTokens(usage), bot.id);
      send("done", { usage });
    });
  });

  // --- owner editor (authenticated, operates on the caller's own bot) -------

  app.get("/api/bots/me", { preHandler: requireAuth }, async (req, reply) => {
    const bot = await getBotByUser(req.authUser!.id);
    if (!bot) {
      reply.code(404);
      return { error: "No bot for this account." };
    }
    const items = await listKnowledge(bot.id);
    return { bot, knowledge: items };
  });

  app.patch("/api/bots/me", { preHandler: requireAuth }, async (req, reply) => {
    const bot = await getBotByUser(req.authUser!.id);
    if (!bot) {
      reply.code(404);
      return { error: "No bot for this account." };
    }
    const body = (req.body ?? {}) as Record<string, unknown>;

    // Theme can carry inline avatar/logo data URLs; keep the row bounded.
    if (body.theme !== undefined) {
      if (JSON.stringify(body.theme).length > 1_500_000) {
        reply.code(413);
        return { error: "Theme is too large. Use a smaller image." };
      }
    }

    if (typeof body.handle === "string") {
      const handle = body.handle.toLowerCase().trim();
      const err = validateHandle(handle);
      if (err) {
        reply.code(400);
        return { error: err };
      }
      if (await isHandleTaken(handle, bot.id)) {
        reply.code(409);
        return { error: "That handle is already taken." };
      }
      body.handle = handle;
    }

    // Publishing requires a handle and at least one knowledge item.
    if (body.status === "published") {
      const handle = (body.handle as string) ?? bot.handle;
      const items = await listKnowledge(bot.id);
      if (!handle || items.length === 0) {
        reply.code(400);
        return {
          error: "Set a handle and add at least one knowledge item before publishing.",
        };
      }
    }

    const updated = await updateBot(bot.id, body);
    return { bot: updated };
  });

  app.post(
    "/api/bots/me/knowledge",
    { preHandler: requireAuth },
    async (req, reply) => {
      const bot = await getBotByUser(req.authUser!.id);
      if (!bot) {
        reply.code(404);
        return { error: "No bot for this account." };
      }
      const body = (req.body ?? {}) as {
        kind?: string;
        title?: string;
        body?: string;
      };
      const kind = (KNOWLEDGE_KINDS as string[]).includes(body.kind ?? "")
        ? (body.kind as KnowledgeKind)
        : "custom";
      const item = await addKnowledge(bot.id, {
        kind,
        title: (body.title ?? "").trim(),
        body: (body.body ?? "").trim(),
      });
      reply.code(201);
      return { item };
    },
  );

  app.patch(
    "/api/bots/me/knowledge/:id",
    { preHandler: requireAuth },
    async (req, reply) => {
      const bot = await getBotByUser(req.authUser!.id);
      if (!bot) {
        reply.code(404);
        return { error: "No bot for this account." };
      }
      const { id } = req.params as { id: string };
      const body = (req.body ?? {}) as {
        kind?: string;
        title?: string;
        body?: string;
      };
      const patch: { kind?: KnowledgeKind; title?: string; body?: string } = {};
      if (body.kind && (KNOWLEDGE_KINDS as string[]).includes(body.kind))
        patch.kind = body.kind as KnowledgeKind;
      if (body.title !== undefined) patch.title = body.title;
      if (body.body !== undefined) patch.body = body.body;
      const item = await updateKnowledge(bot.id, id, patch);
      if (!item) {
        reply.code(404);
        return { error: "Item not found." };
      }
      return { item };
    },
  );

  app.delete(
    "/api/bots/me/knowledge/:id",
    { preHandler: requireAuth },
    async (req, reply) => {
      const bot = await getBotByUser(req.authUser!.id);
      if (!bot) {
        reply.code(404);
        return { error: "No bot for this account." };
      }
      const { id } = req.params as { id: string };
      const ok = await deleteKnowledge(bot.id, id);
      if (!ok) {
        reply.code(404);
        return { error: "Item not found." };
      }
      return { ok: true };
    },
  );

  app.patch(
    "/api/bots/me/knowledge/reorder",
    { preHandler: requireAuth },
    async (req, reply) => {
      const bot = await getBotByUser(req.authUser!.id);
      if (!bot) {
        reply.code(404);
        return { error: "No bot for this account." };
      }
      const body = (req.body ?? {}) as { order?: string[] };
      if (!Array.isArray(body.order)) {
        reply.code(400);
        return { error: "Expected { order: string[] }." };
      }
      await reorderKnowledge(bot.id, body.order);
      const items = await listKnowledge(bot.id);
      return { knowledge: items };
    },
  );
}

function totalTokens(u: TokenUsage): number {
  return (
    u.inputTokens + u.outputTokens + u.cacheCreationTokens + u.cacheReadTokens
  );
}

/** Opens an SSE response, runs the producer, and reports errors uniformly. */
function streamSse(
  reply: import("fastify").FastifyReply,
  produce: (send: (event: string, data: unknown) => void) => Promise<void>,
): void {
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  const send = (event: string, data: unknown) => {
    reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };
  produce(send)
    .catch((err) => {
      reply.log.error(err);
      send("error", { message: "Something went wrong. Please try again." });
    })
    .finally(() => reply.raw.end());
}
