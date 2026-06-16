# Projects Portal — Plan 4: Live GitHub + github tool

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`).
> **Server Anthropic API code (the github tool wiring):** invoke `claude-api` first. **UI task:** invoke `frontend-design` first.

**Goal:** Replace the static GitHub tile with live data from the GitHub API (public repos, stars, languages, recent activity), and give the guide a `github` tool so it can answer GitHub questions with current data.

**Architecture:** A server module fetches `MasterShayKe`'s public repos from the GitHub REST API, transforms them into a compact summary, and caches the result in-memory (1h TTL). A `GET /api/github` endpoint serves it to the live tile; the same summary backs a `github` tool added to the guide's tool list (reusing Plan 3's tool-use loop). No GitHub token required for public data; an optional `GITHUB_TOKEN` env raises the rate limit. Everything degrades gracefully if the API is unreachable.

**Tech Stack:** Fastify, Node 20 global `fetch`, `@anthropic-ai/sdk`, React, Vitest.

**Plan series:** Plan 4 of 5. Depends on Plan 2 (`GitHubTile`, the bento) and Plan 3 (the tool-use loop + `onToolUse` plumbing in `/api/chat`).

**Branch:** `projects-portal`.

**Note on the "heatmap":** GitHub's contribution calendar is only available via the authenticated GraphQL API, so this plan does NOT fetch a literal calendar. It shows real, public REST data — repo count, total stars, top languages, and the most recently pushed repos — which is honest and needs no token. The tile keeps a tasteful activity visual driven by that real data.

---

## File Structure

- Create: `server/src/github.ts` — `summarizeRepos(repos)` (pure) + `getGitHubSummary({login, token?, fetchImpl?, now?})` (fetch + cache).
- Test: `server/test/github.test.ts` — unit-test `summarizeRepos` with a fixture, and the cache (using an injected fake `fetchImpl` + clock).
- Create: `server/test/fixtures/github-repos.json` — a small fixture array of raw repo objects.
- Modify: `server/src/index.ts` — `GET /api/github`; add a `github` tool to `/api/chat`'s tool list + executor.
- Modify: `web/src/lib/api.ts` — `GitHubSummary` type + `fetchGitHub()`.
- Modify: `web/src/components/portal/GitHubTile.tsx` — render live data (props or self-fetch), with a loading + error fallback.
- Modify: `web/src/App.tsx` — fetch the GitHub summary and pass it to `GitHubTile` (or let the tile self-fetch); keep the page working if it fails.

---

## Task 1: GitHub summary transform + cache (TDD)

**Files:** `server/test/github.test.ts`, `server/test/fixtures/github-repos.json`, `server/src/github.ts`.

- [ ] **Step 1: Fixture** `server/test/fixtures/github-repos.json`

```json
[
  { "name": "interview-bot", "html_url": "https://github.com/MasterShayKe/interview-bot", "description": "grounded agent", "language": "TypeScript", "stargazers_count": 4, "fork": false, "pushed_at": "2026-06-08T10:00:00Z" },
  { "name": "crypto-trading-agent", "html_url": "https://github.com/MasterShayKe/crypto-trading-agent", "description": "KAITO", "language": "Python", "stargazers_count": 2, "fork": false, "pushed_at": "2026-06-10T10:00:00Z" },
  { "name": "discord-tcg-bot", "html_url": "https://github.com/MasterShayKe/discord-tcg-bot", "description": null, "language": "Python", "stargazers_count": 1, "fork": false, "pushed_at": "2026-06-15T10:00:00Z" },
  { "name": "some-fork", "html_url": "https://github.com/MasterShayKe/some-fork", "description": "x", "language": "Go", "stargazers_count": 99, "fork": true, "pushed_at": "2026-01-01T10:00:00Z" }
]
```

- [ ] **Step 2: Write the failing test** `server/test/github.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { summarizeRepos, getGitHubSummary } from "../src/github.js";
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
```

- [ ] **Step 3: Run, expect fail**

Run: `npm test -w @interview-bot/server -- github`
Expected: FAIL (module missing).

- [ ] **Step 4: Implement** `server/src/github.ts`

```ts
export interface RawRepo {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  pushed_at: string;
}

export interface RepoCard {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  pushedAt: string;
}

export interface GitHubSummary {
  login: string;
  available: boolean;
  publicRepos: number;
  totalStars: number;
  languages: { name: string; count: number }[];
  recent: RepoCard[];
}

export function summarizeRepos(login: string, repos: RawRepo[]): GitHubSummary {
  const own = repos.filter((r) => !r.fork);
  const langCounts = new Map<string, number>();
  for (const r of own) {
    if (r.language) langCounts.set(r.language, (langCounts.get(r.language) ?? 0) + 1);
  }
  const languages = [...langCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const recent = [...own]
    .sort((a, b) => b.pushed_at.localeCompare(a.pushed_at))
    .slice(0, 5)
    .map((r) => ({
      name: r.name,
      url: r.html_url,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      pushedAt: r.pushed_at,
    }));
  return {
    login,
    available: true,
    publicRepos: own.length,
    totalStars: own.reduce((s, r) => s + r.stargazers_count, 0),
    languages,
    recent,
  };
}

interface SummaryOpts {
  login: string;
  token?: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
  ttlMs?: number;
}

let cache: { at: number; data: GitHubSummary } | null = null;

const EMPTY = (login: string): GitHubSummary => ({
  login,
  available: false,
  publicRepos: 0,
  totalStars: 0,
  languages: [],
  recent: [],
});

export async function getGitHubSummary(opts: SummaryOpts): Promise<GitHubSummary> {
  const now = opts.now ?? Date.now;
  const ttl = opts.ttlMs ?? 60 * 60 * 1000;
  const doFetch = opts.fetchImpl ?? fetch;

  if (cache && now() - cache.at < ttl) return cache.data;

  try {
    const headers: Record<string, string> = {
      "User-Agent": "projects-portal",
      Accept: "application/vnd.github+json",
    };
    if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
    const res = await doFetch(
      `https://api.github.com/users/${opts.login}/repos?per_page=100&sort=pushed`,
      { headers },
    );
    if (!(res as Response).ok) throw new Error(`github ${(res as Response).status}`);
    const repos = (await (res as Response).json()) as RawRepo[];
    const data = summarizeRepos(opts.login, repos);
    cache = { at: now(), data };
    return data;
  } catch {
    if (cache) return cache.data; // serve stale on failure
    return EMPTY(opts.login);
  }
}

/** Test-only: reset the module cache. */
export function __resetGitHubCache() {
  cache = null;
}
```

Note: add `__resetGitHubCache()` calls in the test if cache state bleeds between the two `getGitHubSummary` describe blocks — import it and call in a `beforeEach`. (Add that import + `beforeEach(__resetGitHubCache)` to the test file.)

- [ ] **Step 5: Run, expect pass**

Run: `npm test -w @interview-bot/server -- github`
Expected: PASS. Then `npm test -w @interview-bot/server` — all suites green.

- [ ] **Step 6: Commit**

```bash
git add server/src/github.ts server/test/github.test.ts server/test/fixtures/github-repos.json
git commit -m "feat: github summary transform + cached fetch"
```

---

## Task 2: `/api/github` endpoint + `github` tool

**Files:** Modify `server/src/index.ts`.

- [ ] **Step 1: Imports + config** — near the other imports add `import { getGitHubSummary } from "./github.js";`, and near the other env consts: `const GITHUB_LOGIN = process.env.GITHUB_LOGIN ?? "MasterShayKe";` and `const GITHUB_TOKEN = process.env.GITHUB_TOKEN;`

- [ ] **Step 2: Endpoint** — after `app.get("/api/profile", ...)`:

```ts
app.get("/api/github", async () =>
  getGitHubSummary({ login: GITHUB_LOGIN, token: GITHUB_TOKEN }),
);
```

- [ ] **Step 3: `github` tool** — define alongside `focusProjectTool`:

```ts
const githubTool: import("@anthropic-ai/sdk").default.Tool = {
  name: "github",
  description:
    "Look up Shay's live GitHub activity (public repo count, total stars, top languages, and most recently updated repos). Call this when the visitor asks about his GitHub, recent activity, languages, or what he's shipped lately.",
  input_schema: { type: "object", properties: {} },
};
```

- [ ] **Step 4: Add it to the tool list + executor** — in the `/api/chat` `streamChat` call, change `tools: [focusProjectTool]` to `tools: [focusProjectTool, githubTool]`, and extend the `onToolUse` to handle `github`:

```ts
        if (name === "github") {
          const g = await getGitHubSummary({ login: GITHUB_LOGIN, token: GITHUB_TOKEN });
          if (!g.available) return "GitHub data is temporarily unavailable.";
          const langs = g.languages.map((l) => `${l.name} (${l.count})`).join(", ");
          const recent = g.recent.map((r) => `${r.name} - ${r.language ?? "?"}, ${r.stars}*`).join("; ");
          return `Public repos: ${g.publicRepos}. Total stars: ${g.totalStars}. Languages: ${langs}. Recent: ${recent}.`;
        }
```

(Keep the existing `focusProject` branch and the unknown-tool fallback.)

- [ ] **Step 5: Build + smoke**

```bash
npm run build -w @interview-bot/server
(node server/dist/index.js &) ; sleep 3 ; curl -s localhost:3000/api/github | head -c 200 ; echo ; pkill -f server/dist/index.js
```
Expected: build OK; JSON with `"login":"MasterShayKe"` and `"available":true` (or `false` if the GitHub API is unreachable/rate-limited from the build host — that's acceptable, the shape is what matters).

- [ ] **Step 6: Commit**

```bash
git add server/src/index.ts
git commit -m "feat: /api/github endpoint + github tool for the guide"
```

---

## Task 3: Live GitHub tile

> Invoke `frontend-design` first. Keep the tile's existing look/feel (from Plan 2) but feed it real data; preserve the violet aesthetic and the bento sizing.

**Files:** Modify `web/src/lib/api.ts`, `web/src/components/portal/GitHubTile.tsx`, `web/src/App.tsx`.

- [ ] **Step 1: Web types + fetcher** — append to `web/src/lib/api.ts`:

```ts
export interface RepoCard {
  name: string; url: string; description: string | null;
  language: string | null; stars: number; pushedAt: string;
}
export interface GitHubSummary {
  login: string; available: boolean; publicRepos: number; totalStars: number;
  languages: { name: string; count: number }[]; recent: RepoCard[];
}
export async function fetchGitHub(): Promise<GitHubSummary> {
  const res = await fetch("/api/github");
  if (!res.ok) throw new Error(`github ${res.status}`);
  return res.json();
}
```

- [ ] **Step 2: Rewrite `GitHubTile.tsx`** to take `{ data: GitHubSummary | null }`. When `data?.available`, show: the `github.com/<login>` label, the stat trio (public repos, total stars, top language), the top-languages chips, and the most-recent repo (name + last-push date as an anchor). When `data` is null (loading) show a subtle skeleton; when `data.available === false` show a graceful "GitHub stats unavailable right now" line. Preserve the tile's violet styling and the decorative activity strip (now optionally keyed off `recent.length`). Keep it sized to content.

- [ ] **Step 3: Wire in `App.tsx`** — add `const [github, setGithub] = useState<GitHubSummary | null>(null);`, call `fetchGitHub().then(setGithub).catch(() => setGithub({ login: "MasterShayKe", available: false, publicRepos: 0, totalStars: 0, languages: [], recent: [] }))` alongside the other fetches, and pass `data={github}` to `<GitHubTile />`. The page must render fine while `github` is null and if the fetch fails.

- [ ] **Step 4: Build**

Run: `npm run build -w @interview-bot/web`
Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/api.ts web/src/components/portal/GitHubTile.tsx web/src/App.tsx
git commit -m "feat: live GitHub stats tile"
```

---

## Task 4: Manual verification

- [ ] **Step 1: Build + run**

```bash
npm run build && node server/dist/index.js
```

- [ ] **Step 2:** Open the page. Confirm the GitHub tile shows live numbers (repo count, stars, languages, a recent repo) — or, if GitHub rate-limits the request, the graceful "unavailable" state (not a crash). With an API key, ask the guide "what's on his GitHub?" and confirm it answers with live numbers (the `github` tool).

(No commit — gate.)

---

## Done criteria

- `npm test -w @interview-bot/server` passes (adds `github` suite).
- `npm run build` (root) passes.
- `GET /api/github` returns the summary shape; the tile renders live data or a graceful fallback.
- The guide can answer GitHub questions via the `github` tool.
- The page never crashes when GitHub is unreachable.

## Self-review notes (author)

- **Spec coverage:** spec §6 (live GitHub panel + `github` tool, both backed by one cached service — single source of truth).
- **Honest scope:** no literal contribution calendar (needs auth GraphQL); real REST stats instead, clearly stated. `GITHUB_TOKEN` optional for rate limits.
- **Testability:** `summarizeRepos` is pure and fully tested; the cache is tested via injected `fetchImpl` + `now` clock + `__resetGitHubCache`. The live fetch itself isn't unit-tested (network) — verified manually in Task 4.
- **Type consistency:** server `GitHubSummary`/`RepoCard` mirror the web types exactly; the `github` tool has an empty-object input schema (no args) and reuses Plan 3's `onToolUse` plumbing.
- **Resilience:** failure serves stale cache or an `available:false` empty summary; the web fetch failure sets an `available:false` object so the tile shows the fallback, never a blank crash.
