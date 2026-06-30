import type { FastifyReply, FastifyRequest } from "fastify";
import { query, queryOne } from "../db/pool.js";
import { getUser } from "../repo.js";
import type { User } from "../model.js";

export const SESSION_COOKIE = "ib_session";
const SESSION_TTL_DAYS = 30;

/** Creates a session row and sets the signed session cookie on the reply. */
export async function startSession(
  reply: FastifyReply,
  userId: string,
): Promise<void> {
  const row = await queryOne<{ id: string }>(
    `INSERT INTO sessions (user_id, expires_at)
     VALUES ($1, now() + ($2 || ' days')::interval)
     RETURNING id`,
    [userId, String(SESSION_TTL_DAYS)],
  );
  reply.setCookie(SESSION_COOKIE, row!.id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    signed: true,
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

/** Resolves the current user from the session cookie, or null. */
export async function currentUser(
  req: FastifyRequest,
): Promise<User | null> {
  const raw = req.cookies[SESSION_COOKIE];
  if (!raw) return null;
  const unsigned = req.unsignCookie(raw);
  if (!unsigned.valid || !unsigned.value) return null;

  const session = await queryOne<{ user_id: string }>(
    "SELECT user_id FROM sessions WHERE id = $1 AND expires_at > now()",
    [unsigned.value],
  );
  if (!session) return null;
  return getUser(session.user_id);
}

/** Deletes the current session (DB row + cookie). */
export async function endSession(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const raw = req.cookies[SESSION_COOKIE];
  if (raw) {
    const unsigned = req.unsignCookie(raw);
    if (unsigned.valid && unsigned.value) {
      await query("DELETE FROM sessions WHERE id = $1", [unsigned.value]);
    }
  }
  reply.clearCookie(SESSION_COOKIE, { path: "/" });
}

/**
 * Fastify preHandler that requires a logged-in user. On success it attaches
 * the user to req.authUser; otherwise it replies 401 and halts the route.
 */
export async function requireAuth(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const user = await currentUser(req);
  if (!user) {
    reply.code(401).send({ error: "Not authenticated." });
    return;
  }
  req.authUser = user;
}

/** Platform admins, by email, from the ADMIN_EMAILS env (comma-separated). */
export function isAdmin(user: User | null | undefined): boolean {
  if (!user?.email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(user.email.toLowerCase());
}

/** preHandler that requires the caller to be a platform admin. */
export async function requireAdmin(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const user = await currentUser(req);
  if (!user || !isAdmin(user)) {
    reply.code(403).send({ error: "Admins only." });
    return;
  }
  req.authUser = user;
}

declare module "fastify" {
  interface FastifyRequest {
    authUser?: User;
  }
}
