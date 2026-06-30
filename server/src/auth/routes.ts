import crypto from "node:crypto";
import type { FastifyInstance, FastifyReply } from "fastify";
import * as linkedin from "./linkedin.js";
import * as google from "./google.js";
import { startSession, endSession, currentUser, isAdmin } from "./session.js";
import {
  upsertUserByLinkedIn,
  upsertUserByGoogle,
  getBotByUser,
  createBotForUser,
  listKnowledge,
} from "../repo.js";
import type { User } from "../model.js";

const STATE_COOKIE = "ib_oauth_state";

/**
 * Ensures the user has a bot, starts a session, and returns the post-login path.
 * Sends anyone whose agent has no knowledge yet to the guided onboarding chat
 * (new accounts, or returning users who never finished setup); everyone else to
 * the dashboard.
 */
async function finishLogin(
  reply: FastifyReply,
  user: User,
): Promise<string> {
  let bot = await getBotByUser(user.id);
  if (!bot) {
    bot = await createBotForUser(user.id, {
      displayName: user.name ? `${user.name}'s AI Representative` : "AI Representative",
      subjectName: user.name,
      contactEmail: user.email ?? "",
    });
  }
  await startSession(reply, user.id);
  const knowledge = await listKnowledge(bot.id);
  return knowledge.length === 0 ? "/onboarding" : "/dashboard";
}

function setState(reply: FastifyReply, state: string): void {
  reply.setCookie(STATE_COOKIE, state, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    signed: true,
    maxAge: 600,
  });
}

export function registerAuthRoutes(app: FastifyInstance): void {
  // --- LinkedIn ------------------------------------------------------------
  app.get("/api/auth/linkedin", async (req, reply) => {
    if (!linkedin.isConfigured()) {
      reply.code(503);
      return { error: "LinkedIn sign-in is not configured on this server." };
    }
    const state = crypto.randomBytes(16).toString("hex");
    setState(reply, state);
    reply.redirect(linkedin.buildAuthorizeUrl(state));
  });

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
      const token = await linkedin.exchangeCode(q.code);
      const profile = await linkedin.fetchProfile(token);
      const user = await upsertUserByLinkedIn(profile);
      reply.redirect(await finishLogin(reply, user));
    } catch (err) {
      app.log.error(err);
      reply.redirect("/login?error=auth");
    }
  });

  // --- Google --------------------------------------------------------------
  app.get("/api/auth/google", async (req, reply) => {
    if (!google.isConfigured()) {
      reply.code(503);
      return { error: "Google sign-in is not configured on this server." };
    }
    const state = crypto.randomBytes(16).toString("hex");
    setState(reply, state);
    reply.redirect(google.buildAuthorizeUrl(state));
  });

  app.get("/api/auth/google/callback", async (req, reply) => {
    const q = req.query as { code?: string; state?: string; error?: string };
    if (q.error) return reply.redirect("/login?error=denied");
    const raw = req.cookies[STATE_COOKIE];
    const unsigned = raw ? req.unsignCookie(raw) : { valid: false, value: null };
    if (!q.code || !q.state || !unsigned.valid || q.state !== unsigned.value) {
      return reply.redirect("/login?error=state");
    }
    reply.clearCookie(STATE_COOKIE, { path: "/" });
    try {
      const token = await google.exchangeCode(q.code);
      const profile = await google.fetchProfile(token);
      const user = await upsertUserByGoogle(profile);
      reply.redirect(await finishLogin(reply, user));
    } catch (err) {
      app.log.error(err);
      reply.redirect("/login?error=auth");
    }
  });

  // --- session -------------------------------------------------------------
  app.post("/api/auth/logout", async (req, reply) => {
    await endSession(req, reply);
    return { ok: true };
  });

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
