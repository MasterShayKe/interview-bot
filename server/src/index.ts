import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import Anthropic from "@anthropic-ai/sdk";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";
import { runMigrations } from "./db/migrate.js";
import { seedShay } from "./seed.js";
import { createGuard } from "./guard.js";
import { registerAuthRoutes } from "./auth/routes.js";
import { registerBotRoutes } from "./bot-routes.js";
import { registerOnboardingRoutes } from "./onboarding-routes.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const guard = createGuard({
  windowMs: 60_000,
  maxRequests: Number(process.env.RATE_LIMIT_MAX ?? 10),
  dailyTokenBudget: Number(process.env.DAILY_TOKEN_BUDGET ?? 1_000_000),
});

const MAX_OUTPUT_TOKENS = Number(process.env.MAX_OUTPUT_TOKENS ?? 800);
const FIT_MAX_OUTPUT_TOKENS = Number(process.env.FIT_MAX_OUTPUT_TOKENS ?? 1100);
const MAX_JD_CHARS = Number(process.env.MAX_JD_CHARS ?? 8000);

// Apply any pending DB migrations before serving traffic.
await runMigrations();

// Optionally seed the flagship /u/shay demo bot. Seeds only when missing, so a
// redeploy never overwrites dashboard edits. Non-fatal if it fails.
if (process.env.SEED_DEMO === "true") {
  try {
    const bot = await seedShay({ force: false });
    if (bot) console.log(`[seed] demo bot ready at /u/${bot.handle}`);
  } catch (err) {
    console.error("[seed] demo seed failed (continuing):", err);
  }
}

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.WEB_ORIGIN ?? true,
  credentials: true,
});
await app.register(cookie, {
  secret: process.env.COOKIE_SECRET ?? "dev-insecure-cookie-secret-change-me",
});

app.get("/health", async () => ({ ok: true }));

registerAuthRoutes(app);
registerBotRoutes({
  app,
  client,
  guard,
  maxOutputTokens: MAX_OUTPUT_TOKENS,
  fitMaxOutputTokens: FIT_MAX_OUTPUT_TOKENS,
  maxJdChars: MAX_JD_CHARS,
});
registerOnboardingRoutes({
  app,
  client,
  guard,
  maxOutputTokens: MAX_OUTPUT_TOKENS,
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
