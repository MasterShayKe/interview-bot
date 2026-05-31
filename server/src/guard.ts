export interface GuardOptions {
  windowMs: number;
  maxRequests: number;
  dailyTokenBudget: number;
  clock?: () => number;
}

export interface Guard {
  checkRateLimit(ip: string): { ok: boolean };
  recordUsage(tokens: number): void;
  isBudgetExceeded(): boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function createGuard(opts: GuardOptions): Guard {
  const clock = opts.clock ?? Date.now;
  const hits = new Map<string, number[]>();
  let tokensUsed = 0;
  let dayStart = clock();

  function rolloverDay() {
    const now = clock();
    if (now - dayStart >= DAY_MS) {
      tokensUsed = 0;
      dayStart = now;
    }
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
    recordUsage(tokens) {
      rolloverDay();
      tokensUsed += tokens;
    },
    isBudgetExceeded() {
      rolloverDay();
      return tokensUsed >= opts.dailyTokenBudget;
    },
  };
}
