import type { FastifyInstance } from "fastify";
import Anthropic from "@anthropic-ai/sdk";
import { streamChat, type ChatMessage, type TokenUsage } from "./chat.js";
import {
  buildOnboardingSystemPrompt,
  extractKnowledge,
  type ProposedItem,
} from "./onboarding.js";
import { requireAuth } from "./auth/session.js";
import { isOverDailyCap, recordBotUsage } from "./usage.js";
import { getBotByUser, addKnowledge, listKnowledge } from "./repo.js";
import type { Guard } from "./guard.js";
import type { KnowledgeKind } from "./model.js";

const KINDS: KnowledgeKind[] = ["cv", "experience", "project", "personal", "custom"];
const MAX_MESSAGES = 30;

interface Deps {
  app: FastifyInstance;
  client: Anthropic;
  guard: Guard;
  maxOutputTokens: number;
}

export function registerOnboardingRoutes(deps: Deps): void {
  const { app, client, guard, maxOutputTokens } = deps;

  // Streaming interviewer turn. Scoped to the signed-in user's own bot.
  app.post(
    "/api/onboarding/chat",
    { preHandler: requireAuth },
    async (req, reply) => {
      const bot = await getBotByUser(req.authUser!.id);
      if (!bot) {
        reply.code(404);
        return { error: "No bot for this account." };
      }
      if (guard.isBudgetExceeded() || (await isOverDailyCap(bot.id))) {
        reply.code(503);
        return { error: bot.budgetRestMessage };
      }
      if (!guard.checkRateLimit(req.ip).ok) {
        reply.code(429);
        return { error: "Too many messages - please slow down a moment." };
      }

      const body = req.body as { messages?: ChatMessage[] };
      const messages = (body.messages ?? []).slice(-MAX_MESSAGES);
      const subjectName = bot.subjectName || req.authUser!.name;
      const system = buildOnboardingSystemPrompt(subjectName);

      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      const send = (event: string, data: unknown) =>
        reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

      try {
        // Seed the very first turn so the model opens the interview.
        const convo: ChatMessage[] =
          messages.length === 0
            ? [{ role: "user", content: "Let's begin. Please start the interview." }]
            : messages;
        const usage: TokenUsage = await streamChat({
          client,
          system,
          messages: convo,
          maxTokens: maxOutputTokens,
          onText: (delta) => send("delta", { text: delta }),
        });
        guard.recordUsage(
          usage.inputTokens +
            usage.outputTokens +
            usage.cacheCreationTokens +
            usage.cacheReadTokens,
        );
        await recordBotUsage(bot.id, usage);
        send("done", { usage });
      } catch (err) {
        app.log.error(err);
        send("error", { message: "Something went wrong. Please try again." });
      } finally {
        reply.raw.end();
      }
    },
  );

  // Convert the interview transcript into proposed knowledge items.
  app.post(
    "/api/onboarding/extract",
    { preHandler: requireAuth },
    async (req, reply) => {
      const bot = await getBotByUser(req.authUser!.id);
      if (!bot) {
        reply.code(404);
        return { error: "No bot for this account." };
      }
      if (guard.isBudgetExceeded() || (await isOverDailyCap(bot.id))) {
        reply.code(503);
        return { error: bot.budgetRestMessage };
      }
      const body = req.body as { messages?: ChatMessage[] };
      const messages = (body.messages ?? []).slice(-MAX_MESSAGES);
      if (messages.length === 0) {
        reply.code(400);
        return { error: "Have a short conversation first, then build." };
      }
      const { items, usage } = await extractKnowledge(
        client,
        bot.subjectName || req.authUser!.name,
        messages,
      );
      guard.recordUsage(
        usage.inputTokens +
          usage.outputTokens +
          usage.cacheCreationTokens +
          usage.cacheReadTokens,
      );
      await recordBotUsage(bot.id, usage);
      return { items };
    },
  );

  // Accept a set of proposed items into the user's bot.
  app.post(
    "/api/onboarding/accept",
    { preHandler: requireAuth },
    async (req, reply) => {
      const bot = await getBotByUser(req.authUser!.id);
      if (!bot) {
        reply.code(404);
        return { error: "No bot for this account." };
      }
      const body = req.body as { items?: ProposedItem[] };
      const incoming = Array.isArray(body.items) ? body.items : [];
      for (const it of incoming) {
        if (!it?.title || !it?.body) continue;
        await addKnowledge(bot.id, {
          kind: (KINDS as string[]).includes(it.kind) ? it.kind : "custom",
          title: String(it.title).trim(),
          body: String(it.body).trim(),
        });
      }
      const knowledge = await listKnowledge(bot.id);
      return { knowledge };
    },
  );
}
