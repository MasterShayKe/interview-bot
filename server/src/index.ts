import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import Anthropic from "@anthropic-ai/sdk";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import { loadSpec } from "./spec.js";
import { loadProjects } from "./projects.js";
import { loadProfile } from "./profile.js";
import { buildSystemPrompt, buildFitSystemPrompt } from "./prompt.js";
import { createGuard } from "./guard.js";
import { streamChat, type ChatMessage, type TokenUsage } from "./chat.js";
import { buildVisitorContext, type ClientContext } from "./context.js";
import type { Spec } from "./spec.js";
import { getGitHubSummary } from "./github.js";

const SPEC_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../spec",
);

const spec = loadSpec(SPEC_DIR);
const projects = loadProjects(path.join(SPEC_DIR, "projects.json"));
const profile = loadProfile(path.join(SPEC_DIR, "profile.json"));
const systemPrompt = buildSystemPrompt(spec);
const fitSystemPrompt = buildFitSystemPrompt(spec);
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const focusProjectTool: Anthropic.Tool = {
  name: "focusProject",
  description:
    "Visually highlight and open one of Shay's projects on the page when you start discussing it. Call this the moment you begin talking about a specific project, before describing it.",
  input_schema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        enum: projects.map((p) => p.id),
        description: "The id of the project to focus.",
      },
    },
    required: ["projectId"],
  },
};
const githubTool: Anthropic.Tool = {
  name: "github",
  description:
    "Look up Shay's live GitHub activity (public repo count, total stars, top languages, and most recently updated repos). Call this when the visitor asks about his GitHub, recent activity, languages, or what he's shipped lately.",
  input_schema: { type: "object", properties: {} },
};

const projectIds = new Set(projects.map((p) => p.id));

const guard = createGuard({
  windowMs: 60_000,
  maxRequests: Number(process.env.RATE_LIMIT_MAX ?? 10),
  dailyTokenBudget: Number(process.env.DAILY_TOKEN_BUDGET ?? 1_000_000),
});

const GITHUB_LOGIN = process.env.GITHUB_LOGIN ?? "MasterShayKe";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const MAX_OUTPUT_TOKENS = Number(process.env.MAX_OUTPUT_TOKENS ?? 800);
const FIT_MAX_OUTPUT_TOKENS = Number(process.env.FIT_MAX_OUTPUT_TOKENS ?? 1100);
const MAX_JD_CHARS = Number(process.env.MAX_JD_CHARS ?? 8000);
const MAX_MESSAGES = 20;
const SUGGESTIONS_MODEL = "claude-haiku-4-5-20251001";

async function generateFollowUps(
  anthropic: Anthropic,
  messages: ChatMessage[],
  persona: Spec["persona"],
): Promise<string[]> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  if (!lastUser || !lastAssistant) return [];

  const result = await anthropic.messages.create({
    model: SUGGESTIONS_MODEL,
    max_tokens: 150,
    system: `You generate follow-up questions for a chatbot about ${persona.subject_name}. Return ONLY a valid JSON array of exactly 3 short questions (under 8 words each). No markdown, no extra text.`,
    messages: [
      {
        role: "user",
        content: `Question asked: "${lastUser.content}"\nAnswer given: "${lastAssistant.content.slice(0, 400)}"\n\nGenerate 3 follow-up questions.`,
      },
    ],
  });

  const text = result.content[0].type === "text" ? result.content[0].text.trim() : "[]";
  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
}

const app = Fastify({ logger: true });
await app.register(cors, { origin: process.env.WEB_ORIGIN ?? true });

app.get("/health", async () => ({ ok: true }));

app.get("/api/spec", async () => ({
  persona: spec.persona,
  facts: spec.facts,
}));

app.get("/api/projects", async () => projects);
app.get("/api/profile", async () => profile);
app.get("/api/github", async () =>
  getGitHubSummary({ login: GITHUB_LOGIN, token: GITHUB_TOKEN }),
);

app.post("/api/chat", async (req, reply) => {
  const ip = req.ip;
  if (guard.isBudgetExceeded()) {
    reply.code(503);
    return { error: spec.persona.budget_rest_message };
  }
  if (!guard.checkRateLimit(ip).ok) {
    reply.code(429);
    return { error: "Too many messages - please slow down a moment." };
  }

  const body = req.body as {
    messages?: ChatMessage[];
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

  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const send = (event: string, data: unknown) => {
    reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const usage: TokenUsage = await streamChat({
      client,
      system: systemPrompt,
      messages,
      maxTokens: MAX_OUTPUT_TOKENS,
      onText: (delta) => send("delta", { text: delta }),
      visitorContext,
      tools: [focusProjectTool, githubTool],
      onToolUse: async (name, input) => {
        if (name === "focusProject") {
          const id = (input as { projectId?: string }).projectId ?? "";
          if (projectIds.has(id)) {
            send("tool", { name: "focusProject", projectId: id });
            return `Focused project ${id} on the page.`;
          }
          return `No project with id "${id}".`;
        }
        if (name === "github") {
          const g = await getGitHubSummary({ login: GITHUB_LOGIN, token: GITHUB_TOKEN });
          if (!g.available) return "GitHub data is temporarily unavailable.";
          const langs = g.languages.map((l) => `${l.name} (${l.count})`).join(", ");
          const recent = g.recent.map((r) => `${r.name} - ${r.language ?? "?"}, ${r.stars}*`).join("; ");
          return `Public repos: ${g.publicRepos}. Total stars: ${g.totalStars}. Languages: ${langs}. Recent: ${recent}.`;
        }
        return `Unknown tool: ${name}`;
      },
    });
    guard.recordUsage(
      usage.inputTokens + usage.outputTokens + usage.cacheCreationTokens + usage.cacheReadTokens,
    );
    send("done", { usage });

    try {
      const questions = await generateFollowUps(client, messages, spec.persona);
      if (questions.length) send("suggestions", { questions });
    } catch {
      // non-critical — silently skip
    }
  } catch (err) {
    app.log.error(err);
    send("error", { message: "Something went wrong. Please try again." });
  } finally {
    reply.raw.end();
  }
});

app.post("/api/fit", async (req, reply) => {
  const ip = req.ip;
  if (guard.isBudgetExceeded()) {
    reply.code(503);
    return { error: spec.persona.budget_rest_message };
  }
  if (!guard.checkRateLimit(ip).ok) {
    reply.code(429);
    return { error: "Too many requests - please slow down a moment." };
  }

  const body = req.body as {
    jobDescription?: string;
    clientContext?: ClientContext;
    sessionDurationSeconds?: number;
  };
  const jd = (body.jobDescription ?? "").trim().slice(0, MAX_JD_CHARS);
  if (jd.length < 40) {
    reply.code(400);
    return { error: "Please paste a fuller job description to analyze." };
  }

  const visitorContext = buildVisitorContext(
    req,
    body.clientContext,
    body.sessionDurationSeconds,
  );

  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const send = (event: string, data: unknown) => {
    reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const usage: TokenUsage = await streamChat({
      client,
      system: fitSystemPrompt,
      messages: [
        {
          role: "user",
          content: `Assess ${spec.persona.subject_name}'s fit for the role described below, following the required output format.\n\n--- JOB DESCRIPTION ---\n${jd}\n--- END JOB DESCRIPTION ---`,
        },
      ],
      maxTokens: FIT_MAX_OUTPUT_TOKENS,
      onText: (delta) => send("delta", { text: delta }),
      visitorContext,
    });
    guard.recordUsage(
      usage.inputTokens + usage.outputTokens + usage.cacheCreationTokens + usage.cacheReadTokens,
    );
    send("done", { usage });
  } catch (err) {
    app.log.error(err);
    send("error", { message: "Something went wrong analyzing the role. Please try again." });
  } finally {
    reply.raw.end();
  }
});

// In production, serve the built web app from this same service (single origin).
const WEB_DIST = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../web/dist",
);

if (fs.existsSync(WEB_DIST)) {
  await app.register(fastifyStatic, { root: WEB_DIST });
  app.setNotFoundHandler((req, reply) => {
    if (req.method === "GET" && !req.url.startsWith("/api")) {
      return reply.sendFile("index.html");
    }
    reply.code(404).send({ error: "Not found" });
  });
}

const port = Number(process.env.PORT ?? 3000);
await app.listen({ port, host: "0.0.0.0" });
