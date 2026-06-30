export interface GuardOptions {
  windowMs: number;
  maxRequests: number;
  dailyTokenBudget: number;
  clock?: () => number;
}

export interface Guard {
  checkRateLimit(ip: string): { ok: boolean };
  recordUsage(tokens: number, key?: string): void;
  isBudgetExceeded(key?: string): boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const GLOBAL_KEY = "__global__";

export function createGuard(opts: GuardOptions): Guard {
  const clock = opts.clock ?? Date.now;
  const hits = new Map<string, number[]>();
  // Token usage is tracked per key (one key per bot) so a busy bot only rests
  // itself, never the whole platform.
  const usage = new Map<string, { tokens: number; dayStart: number }>();

  function bucket(key: string) {
    const now = clock();
    let b = usage.get(key);
    if (!b) {
      b = { tokens: 0, dayStart: now };
      usage.set(key, b);
    } else if (now - b.dayStart >= DAY_MS) {
      b.tokens = 0;
      b.dayStart = now;
    }
    return b;
  }

  return {
    checkRateLimit(ip) {
      const now = clock();
      const recent = (hits.get(ip) ?? []).filter(
        (t) => now - t < opts.windowMs,
      );
      if (recent.length >= opts.maxRequests) {
        hits.set(ip, recent);
        return { ok: false };
      }
      recent.push(now);
      hits.set(ip, recent);
      return { ok: true };
    },
    recordUsage(tokens, key = GLOBAL_KEY) {
      bucket(key).tokens += tokens;
    },
    isBudgetExceeded(key = GLOBAL_KEY) {
      return bucket(key).tokens >= opts.dailyTokenBudget;
    },
  };
}
