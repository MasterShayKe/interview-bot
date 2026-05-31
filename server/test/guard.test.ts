import { describe, it, expect } from "vitest";
import { createGuard } from "../src/guard.js";

describe("createGuard", () => {
  it("allows up to maxRequests per window, then blocks", () => {
    let now = 1000;
    const guard = createGuard({
      windowMs: 60000,
      maxRequests: 2,
      dailyTokenBudget: 1000,
      clock: () => now,
    });
    expect(guard.checkRateLimit("ip1").ok).toBe(true);
    expect(guard.checkRateLimit("ip1").ok).toBe(true);
    expect(guard.checkRateLimit("ip1").ok).toBe(false);
  });

  it("resets the rate window after windowMs", () => {
    let now = 1000;
    const guard = createGuard({
      windowMs: 60000,
      maxRequests: 1,
      dailyTokenBudget: 1000,
      clock: () => now,
    });
    expect(guard.checkRateLimit("ip1").ok).toBe(true);
    expect(guard.checkRateLimit("ip1").ok).toBe(false);
    now += 60001;
    expect(guard.checkRateLimit("ip1").ok).toBe(true);
  });

  it("tracks token usage and reports budget exceeded", () => {
    const now = 1000;
    const guard = createGuard({
      windowMs: 60000,
      maxRequests: 100,
      dailyTokenBudget: 500,
      clock: () => now,
    });
    expect(guard.isBudgetExceeded()).toBe(false);
    guard.recordUsage(300);
    expect(guard.isBudgetExceeded()).toBe(false);
    guard.recordUsage(300);
    expect(guard.isBudgetExceeded()).toBe(true);
  });
});
