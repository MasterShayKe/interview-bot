import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import {
  buildAuthorizeUrl,
  exchangeCode,
  fetchProfile,
  isConfigured,
} from "./linkedin.js";
import { startSession, endSession, currentUser, isAdmin } from "./session.js";
import { upsertUserByLinkedIn, getBotByUser, createBotForUser } from "../repo.js";

const STATE_COOKIE = "ib_oauth_state";

export function registerAuthRoutes(app: FastifyInstance): void {
  // Kick off the LinkedIn consent flow.
  app.get("/api/auth/linkedin", async (req, reply) => {
    if (!isConfigured()) {
      reply.code(503);
      return { error: "LinkedIn sign-in is not configured on this server." };
    }
    const state = crypto.randomBytes(16).toString("hex");
    reply.setCookie(STATE_COOKIE, state, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      signed: true,
      maxAge: 600,
    });
    reply.redirect(buildAuthorizeUrl(state));
  });

  // OAuth callback: verify state, exchange code, upsert the user, ensure a bot.
  app.get("/api/auth/linkedin/callback", async (req, reply) => {
    const q = req.query as { code?: string; state?: string; error?: string };
    if (q.error) return reply.redirect("/login?error=denied");

    const raw = req.cookies[STATE_COOKIE];
    const unsigned = raw ? req.unsignCookie(raw) : { valid: false, value: null };
    if (!q.code || !q.state || !unsigned.valid || q.state !== unsigned.value) {
      return reply.redirect("/login?error=state");
    }
    reply.clearCookie(STATE_COOKIE, { path: "/" });

    try {
      const token = await exchangeCode(q.code);
      const profile = await fetchProfile(token);
      const user = await upsertUserByLinkedIn(profile);

      let bot = await getBotByUser(user.id);
      const isNew = !bot;
      if (!bot) {
        bot = await createBotForUser(user.id, {
          displayName: user.name ? `${user.name}'s AI Representative` : "AI Representative",
          subjectName: user.name,
          contactEmail: user.email ?? "",
        });
      }

      await startSession(reply, user.id);
      reply.redirect(isNew ? "/onboarding" : "/dashboard");
    } catch (err) {
      app.log.error(err);
      reply.redirect("/login?error=auth");
    }
  });

  app.post("/api/auth/logout", async (req, reply) => {
    await endSession(req, reply);
    return { ok: true };
  });

  // Current session: the user plus their bot (or null when logged out).
  app.get("/api/me", async (req, reply) => {
    const user = await currentUser(req);
    if (!user) {
      reply.code(401);
      return { error: "Not authenticated." };
    }
    const bot = await getBotByUser(user.id);
    return { user, bot, isAdmin: isAdmin(user) };
  });
}
