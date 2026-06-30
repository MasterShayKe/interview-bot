import { query, queryOne } from "./db/pool.js";

export interface AdminOverview {
  users: number;
  newUsers7: number;
  bots: number;
  botsPublished: number;
  knowledgeItems: number;
  tokensToday: number;
  tokens7: number;
  tokens30: number;
  tokensAll: number;
  chatsToday: number;
  chatsAll: number;
  perDay: { day: string; tokens: number; requests: number }[];
  topBots: {
    handle: string | null;
    subjectName: string;
    status: string;
    tokens: number;
    requests: number;
  }[];
  recentUsers: { name: string; email: string | null; createdAt: string }[];
}

/** Platform-wide insights for the admin dashboard. */
export async function adminOverview(): Promise<AdminOverview> {
  const counts = await queryOne<{
    users: string;
    new_users_7: string;
    bots: string;
    bots_published: string;
    knowledge_items: string;
  }>(
    `SELECT
       (SELECT COUNT(*) FROM users)                                  AS users,
       (SELECT COUNT(*) FROM users WHERE created_at >= now() - interval '7 days') AS new_users_7,
       (SELECT COUNT(*) FROM bots)                                   AS bots,
       (SELECT COUNT(*) FROM bots WHERE status = 'published')        AS bots_published,
       (SELECT COUNT(*) FROM knowledge_items)                        AS knowledge_items`,
  );

  const usage = await queryOne<{
    tokens_today: string;
    tokens_7: string;
    tokens_30: string;
    tokens_all: string;
    chats_today: string;
    chats_all: string;
  }>(
    `SELECT
       COALESCE(SUM(total_tokens) FILTER (WHERE day = current_date), 0)       AS tokens_today,
       COALESCE(SUM(total_tokens) FILTER (WHERE day >= current_date - 6), 0)  AS tokens_7,
       COALESCE(SUM(total_tokens) FILTER (WHERE day >= current_date - 29), 0) AS tokens_30,
       COALESCE(SUM(total_tokens), 0)                                         AS tokens_all,
       COALESCE(SUM(requests) FILTER (WHERE day = current_date), 0)           AS chats_today,
       COALESCE(SUM(requests), 0)                                            AS chats_all
     FROM bot_usage`,
  );

  const perDay = await query<{ day: string; tokens: string; requests: string }>(
    `SELECT to_char(day, 'YYYY-MM-DD') AS day,
            SUM(total_tokens) AS tokens, SUM(requests) AS requests
     FROM bot_usage
     WHERE day >= current_date - 29
     GROUP BY day ORDER BY day`,
  );

  const topBots = await query<{
    handle: string | null;
    subject_name: string;
    status: string;
    tokens: string;
    requests: string;
  }>(
    `SELECT b.handle, b.subject_name, b.status,
            COALESCE(SUM(u.total_tokens), 0) AS tokens,
            COALESCE(SUM(u.requests), 0) AS requests
     FROM bots b
     LEFT JOIN bot_usage u ON u.bot_id = b.id
     GROUP BY b.id
     ORDER BY tokens DESC
     LIMIT 10`,
  );

  const recentUsers = await query<{
    name: string;
    email: string | null;
    created_at: string;
  }>(
    `SELECT name, email, to_char(created_at, 'YYYY-MM-DD') AS created_at
     FROM users ORDER BY created_at DESC LIMIT 10`,
  );

  return {
    users: Number(counts?.users ?? 0),
    newUsers7: Number(counts?.new_users_7 ?? 0),
    bots: Number(counts?.bots ?? 0),
    botsPublished: Number(counts?.bots_published ?? 0),
    knowledgeItems: Number(counts?.knowledge_items ?? 0),
    tokensToday: Number(usage?.tokens_today ?? 0),
    tokens7: Number(usage?.tokens_7 ?? 0),
    tokens30: Number(usage?.tokens_30 ?? 0),
    tokensAll: Number(usage?.tokens_all ?? 0),
    chatsToday: Number(usage?.chats_today ?? 0),
    chatsAll: Number(usage?.chats_all ?? 0),
    perDay: perDay.map((r) => ({
      day: r.day,
      tokens: Number(r.tokens),
      requests: Number(r.requests),
    })),
    topBots: topBots.map((r) => ({
      handle: r.handle,
      subjectName: r.subject_name,
      status: r.status,
      tokens: Number(r.tokens),
      requests: Number(r.requests),
    })),
    recentUsers: recentUsers.map((r) => ({
      name: r.name,
      email: r.email,
      createdAt: r.created_at,
    })),
  };
}
