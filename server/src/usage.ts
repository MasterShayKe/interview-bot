import { query, queryOne } from "./db/pool.js";
import type { TokenUsage } from "./chat.js";

/** Per-bot daily token ceiling. Tunable via PER_BOT_DAILY_TOKEN_CAP. */
export function dailyCapTokens(): number {
  return Number(process.env.PER_BOT_DAILY_TOKEN_CAP ?? 50_000);
}

function total(u: TokenUsage): number {
  return (
    u.inputTokens + u.outputTokens + u.cacheCreationTokens + u.cacheReadTokens
  );
}

/** Adds one request's usage to today's row for a bot. */
export async function recordBotUsage(
  botId: string,
  u: TokenUsage,
): Promise<void> {
  await query(
    `INSERT INTO bot_usage (bot_id, day, requests, input_tokens, output_tokens, total_tokens)
     VALUES ($1, current_date, 1, $2, $3, $4)
     ON CONFLICT (bot_id, day) DO UPDATE SET
       requests = bot_usage.requests + 1,
       input_tokens = bot_usage.input_tokens + EXCLUDED.input_tokens,
       output_tokens = bot_usage.output_tokens + EXCLUDED.output_tokens,
       total_tokens = bot_usage.total_tokens + EXCLUDED.total_tokens`,
    [botId, u.inputTokens, u.outputTokens, total(u)],
  );
}

/** Tokens a bot has used so far today. */
export async function usageToday(botId: string): Promise<number> {
  const row = await queryOne<{ total_tokens: string }>(
    "SELECT total_tokens FROM bot_usage WHERE bot_id = $1 AND day = current_date",
    [botId],
  );
  return row ? Number(row.total_tokens) : 0;
}

/** Whether a bot has hit its daily token cap. */
export async function isOverDailyCap(botId: string): Promise<boolean> {
  return (await usageToday(botId)) >= dailyCapTokens();
}

export interface UsageSummary {
  cap: number;
  today: number;
  todayRequests: number;
  last7: number;
  last30: number;
  allTime: number;
  allRequests: number;
  perDay: { day: string; tokens: number; requests: number }[];
}

/** Aggregates a bot's usage for the owner analytics card. */
export async function usageSummary(botId: string): Promise<UsageSummary> {
  const agg = await queryOne<{
    today_tokens: string;
    today_requests: string;
    week_tokens: string;
    month_tokens: string;
    all_tokens: string;
    all_requests: string;
  }>(
    `SELECT
       COALESCE(SUM(total_tokens) FILTER (WHERE day = current_date), 0)        AS today_tokens,
       COALESCE(SUM(requests)     FILTER (WHERE day = current_date), 0)        AS today_requests,
       COALESCE(SUM(total_tokens) FILTER (WHERE day >= current_date - 6), 0)   AS week_tokens,
       COALESCE(SUM(total_tokens) FILTER (WHERE day >= current_date - 29), 0)  AS month_tokens,
       COALESCE(SUM(total_tokens), 0)                                          AS all_tokens,
       COALESCE(SUM(requests), 0)                                             AS all_requests
     FROM bot_usage WHERE bot_id = $1`,
    [botId],
  );

  const rows = await query<{ day: string; tokens: string; requests: number }>(
    `SELECT to_char(day, 'YYYY-MM-DD') AS day, total_tokens AS tokens, requests
     FROM bot_usage
     WHERE bot_id = $1 AND day >= current_date - 13
     ORDER BY day`,
    [botId],
  );

  return {
    cap: dailyCapTokens(),
    today: Number(agg?.today_tokens ?? 0),
    todayRequests: Number(agg?.today_requests ?? 0),
    last7: Number(agg?.week_tokens ?? 0),
    last30: Number(agg?.month_tokens ?? 0),
    allTime: Number(agg?.all_tokens ?? 0),
    allRequests: Number(agg?.all_requests ?? 0),
    perDay: rows.map((r) => ({
      day: r.day,
      tokens: Number(r.tokens),
      requests: r.requests,
    })),
  };
}
