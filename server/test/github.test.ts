import { describe, it, expect, beforeEach } from "vitest";
import { summarizeRepos, getGitHubSummary, __resetGitHubCache } from "../src/github.js";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repos = JSON.parse(
  fs.readFileSync(path.join(here, "fixtures/github-repos.json"), "utf8"),
);

describe("summarizeRepos", () => {
  it("excludes forks and aggregates stats", () => {
    const s = summarizeRepos("MasterShayKe", repos);
    expect(s.login).toBe("MasterShayKe");
    expect(s.publicRepos).toBe(3); // fork excluded
    expect(s.totalStars).toBe(7); // 4 + 2 + 1
    // languages by repo count, most common first
    expect(s.languages[0]).toEqual({ name: "Python", count: 2 });
    // recent sorted by pushed_at desc, fork excluded
    expect(s.recent[0].name).toBe("discord-tcg-bot");
    expect(s.recent.length).toBeLessThanOrEqual(5);
  });
});

describe("getGitHubSummary cache", () => {
  beforeEach(__resetGitHubCache);

  it("fetches once, then serves cached within TTL", async () => {
    let calls = 0;
    let t = 0;
    const fetchImpl = (async () => {
      calls++;
      return { ok: true, json: async () => repos } as any;
    }) as typeof fetch;
    const opts = { login: "MasterShayKe", fetchImpl, now: () => t, ttlMs: 1000 };

    const a = await getGitHubSummary(opts);
    const b = await getGitHubSummary(opts);
    expect(calls).toBe(1); // cached
    expect(b).toEqual(a);

    t = 2000; // past TTL
    await getGitHubSummary(opts);
    expect(calls).toBe(2); // refetched
  });

  it("returns null-safe fallback on fetch failure with no cache", async () => {
    const fetchImpl = (async () => ({ ok: false, status: 503 }) as any) as typeof fetch;
    const s = await getGitHubSummary({ login: "x", fetchImpl, now: () => 0, ttlMs: 1000 });
    expect(s.available).toBe(false);
    expect(s.publicRepos).toBe(0);
  });
});
