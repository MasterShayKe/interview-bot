import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import Anthropic from "@anthropic-ai/sdk";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import { loadSpec } from "./spec.js";
import { buildSystemPrompt } from "./prompt.js";
import { createGuard } from "./guard.js";
import { streamChat, type ChatMessage } from "./chat.js";
import { buildVisitorContext, type ClientContext } from "./context.js";

const SPEC_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../spec",
);

const spec = loadSpec(SPEC_DIR);
const systemPrompt = buildSystemPrompt(spec);
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const guard = createGuard({
  windowMs: 60_000,
  maxRequests: Number(process.env.RATE_LIMIT_MAX ?? 10),
  dailyTokenBudget: Number(process.env.DAILY_TOKEN_BUDGET ?? 1_000_000),
});

const MAX_OUTPUT_TOKENS = Number(process.env.MAX_OUTPUT_TOKENS ?? 800);
const MAX_MESSAGES = 20;

const app = Fastify({ logger: true });
await app.register(cors, { origin: process.env.WEB_ORIGIN ?? true });

app.get("/health", async () => ({ ok: true }));

app.get("/api/spec", async () => ({
  persona: spec.persona,
  facts: spec.facts,
}));

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
    const tokens = await streamChat({
      client,
      system: systemPrompt,
      messages,
      maxTokens: MAX_OUTPUT_TOKENS,
      onText: (delta) => send("delta", { text: delta }),
      visitorContext,
    });
    guard.recordUsage(tokens);
    send("done", {});
  } catch (err) {
    app.log.error(err);
    send("error", { message: "Something went wrong. Please try again." });
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
