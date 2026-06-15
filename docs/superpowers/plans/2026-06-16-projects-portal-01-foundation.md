# Projects Portal — Plan 1: Content & Persona Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the grounded content layer for the Projects Portal — evolve the persona to a "concierge with a dash of fun," add the four missing project fact files, and expose a typed project manifest the UI and guide will both consume.

**Architecture:** Extends the `interview-bot` monorepo. This plan is backend/content only and must not break the existing chat or fit endpoints. New: a `spec/projects.json` manifest, a `server/src/projects.ts` loader+validator, and an `/api/projects` endpoint. Persona and facts are plain content edits guarded by `vitest` tests that load the real `spec/` directory.

**Tech Stack:** TypeScript (ES modules), Fastify, Vitest, YAML/Markdown/JSON spec files.

**Plan series:** This is Plan 1 of 5. See sibling plans `…-02-bento-ui`, `…-03-guide-tools`, `…-04-github`, `…-05-playground` (written after this one ships).

**Branch:** Work on `projects-portal` (already created; spec committed there).

---

## File Structure

- Modify: `spec/persona.yaml` — tone/rules/suggested_questions evolve to the portal voice.
- Create: `spec/facts/projects/interview-bot.md`
- Create: `spec/facts/projects/discord-tcg-bot.md`
- Create: `spec/facts/projects/machlifot.md`
- Create: `spec/facts/projects/unboxing-finance.md`
- Create: `spec/projects.json` — the project manifest (UI + guide source of truth).
- Create: `server/src/projects.ts` — `Project` type + `loadProjects()` validator.
- Create: `server/test/projects.test.ts` — unit tests for the loader against the real manifest + invalid fixtures.
- Create: `server/test/content.test.ts` — guards that the real persona + new facts load correctly.
- Modify: `server/src/index.ts` — register `GET /api/projects`.

(Existing fact files already cover three tiles and are NOT touched: `unboxing-hq.md` → unboxing-hq, `business-operations.md` → unboxing-agent, `decision-support-system.md` → KAITO.)

---

## Task 1: Guard test for persona + new facts (write first, will fail)

**Files:**
- Test: `server/test/content.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { loadSpec } from "../src/spec.js";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SPEC_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../spec",
);

describe("real spec content", () => {
  const spec = loadSpec(SPEC_DIR);

  it("persona allows tasteful emoji (the no-emoji rule is gone)", () => {
    const rules = spec.persona.rules.join("\n").toLowerCase();
    expect(rules).not.toContain("do not use emojis");
  });

  it("persona tone reflects the portal voice", () => {
    expect(spec.persona.tone.toLowerCase()).toContain("playful");
  });

  it("includes the four new project fact files", () => {
    const paths = spec.facts.map((f) => f.path);
    expect(paths).toContain("projects/interview-bot.md");
    expect(paths).toContain("projects/discord-tcg-bot.md");
    expect(paths).toContain("projects/machlifot.md");
    expect(paths).toContain("projects/unboxing-finance.md");
  });

  it("new facts mention their defining keyword", () => {
    const byPath = Object.fromEntries(spec.facts.map((f) => [f.path, f.content]));
    expect(byPath["projects/interview-bot.md"]).toMatch(/SSE/i);
    expect(byPath["projects/discord-tcg-bot.md"]).toMatch(/discord/i);
    expect(byPath["projects/machlifot.md"]).toMatch(/substitute/i);
    expect(byPath["projects/unboxing-finance.md"]).toMatch(/Base44/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -w @interview-bot/server -- content`
Expected: FAIL — emoji rule still present and new fact files not found.

- [ ] **Step 3: Commit the failing test**

```bash
git add server/test/content.test.ts
git commit -m "test: guard portal persona + new project facts"
```

---

## Task 2: Evolve the persona voice

**Files:**
- Modify: `spec/persona.yaml`

- [ ] **Step 1: Update `tone`**

Replace the `tone:` block with:

```yaml
tone: >-
  Warm, sharp, and confident with a dash of fun - a great concierge, not
  corporate filler. Playful but never flippant; concise, concrete, and
  specific over buzzwords. Hosts visitors through Shay's work and welcomes
  curiosity.
```

- [ ] **Step 2: Relax the emoji rule**

Find the rule:

```yaml
  - "Always write with a regular hyphen (-); never use em dashes or en dashes. Do not use emojis."
```

Replace it with:

```yaml
  - "Always write with a regular hyphen (-); never use em dashes or en dashes. Tasteful, occasional emoji are welcome - keep them light, never more than one per message."
```

- [ ] **Step 3: Refresh `suggested_questions`**

Replace the `suggested_questions:` list with:

```yaml
suggested_questions:
  - What has Shay actually shipped?
  - Explain the 8-agent marketing system.
  - What did he build at NiCE?
  - Show me his GitHub.
  - What is Shay like outside of work?
```

- [ ] **Step 4: Run the guard test**

Run: `npm test -w @interview-bot/server -- content`
Expected: persona tests PASS; the "four new project fact files" test still FAILS (facts not added yet).

- [ ] **Step 5: Commit**

```bash
git add spec/persona.yaml
git commit -m "feat: evolve persona to portal concierge voice"
```

---

## Task 3: Add the four new project fact files

**Files:**
- Create: `spec/facts/projects/interview-bot.md`
- Create: `spec/facts/projects/discord-tcg-bot.md`
- Create: `spec/facts/projects/machlifot.md`
- Create: `spec/facts/projects/unboxing-finance.md`

- [ ] **Step 1: Create `spec/facts/projects/interview-bot.md`**

```markdown
# Project: interview-bot (this site's engine)
A declarative, strictly grounded AI agent that represents Shay - it is the
engine behind this very page. Built as a live portfolio piece: a Fastify +
TypeScript API that streams Claude responses over SSE with prompt caching, and
a React / Vite / Tailwind front end. The persona and the only facts the bot may
state are defined declaratively in a spec/ directory (a persona file plus
grounded markdown facts), so the bot cannot invent claims. Includes a daily
token-budget guard and per-IP rate limiting. Deployed as a single Node service
on Render.
```

- [ ] **Step 2: Create `spec/facts/projects/discord-tcg-bot.md`**

```markdown
# Project: TCG community Discord bot
A Discord bot (Python, discord.py) for an active trading-card-game community.
It handles server setup and member onboarding, community engagement features,
and content automation - including an Instagram content studio that generates
National-Geographic-style imagery and turns trading cards into short animations
via external image and video generation APIs, with an approval step before
anything is published. Auto-deploys from the main branch.
```

- [ ] **Step 3: Create `spec/facts/projects/machlifot.md`**

```markdown
# Project: Machlifot (teacher-substitute tracker)
A web app (Next.js, Firebase, Tailwind) with a right-to-left Hebrew interface
for tracking and managing substitute teachers - who is covering which class,
when, and the resulting records. Built to replace a manual, error-prone process
with a clean, real-time system.
```

- [ ] **Step 4: Create `spec/facts/projects/unboxing-finance.md`**

```markdown
# Project: unboxing.finance
A finance web app Shay built from scratch on Base44 (an AI app-building
platform), shipped live at https://unboxing.finance. Demonstrates rapid
end-to-end delivery of a working product on a low-code stack when that is the
right tool for the job.
```

- [ ] **Step 5: Run the guard test**

Run: `npm test -w @interview-bot/server -- content`
Expected: PASS (all assertions, including the four new fact files and keywords).

- [ ] **Step 6: Commit**

```bash
git add spec/facts/projects/interview-bot.md spec/facts/projects/discord-tcg-bot.md spec/facts/projects/machlifot.md spec/facts/projects/unboxing-finance.md
git commit -m "feat: add fact files for interview-bot, discord bot, machlifot, unboxing.finance"
```

---

## Task 4: Project manifest loader (`projects.ts`)

**Files:**
- Test: `server/test/projects.test.ts`
- Create: `server/src/projects.ts`
- Create: `server/test/fixtures/projects-invalid.json`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { loadProjects } from "../src/projects.js";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const REAL = path.join(here, "../../spec/projects.json");
const INVALID = path.join(here, "fixtures/projects-invalid.json");

describe("loadProjects", () => {
  it("loads the real manifest with all required fields", () => {
    const projects = loadProjects(REAL);
    expect(projects.length).toBe(7);
    for (const p of projects) {
      expect(p.id).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.tagline).toBeTruthy();
      expect(["ai", "trading", "community", "web"]).toContain(p.cluster);
      expect(Array.isArray(p.stack)).toBe(true);
      expect(Array.isArray(p.links)).toBe(true);
    }
  });

  it("has unique project ids", () => {
    const ids = loadProjects(REAL).map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("throws on an invalid manifest", () => {
    expect(() => loadProjects(INVALID)).toThrow(/cluster/);
  });
});
```

- [ ] **Step 2: Create the invalid fixture**

`server/test/fixtures/projects-invalid.json`:

```json
[
  { "id": "x", "name": "X", "tagline": "bad", "cluster": "nope", "stack": [], "detail": "d", "links": [] }
]
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -w @interview-bot/server -- projects`
Expected: FAIL with "Cannot find module '../src/projects.js'".

- [ ] **Step 4: Write `server/src/projects.ts`**

```ts
import fs from "node:fs";

export type Cluster = "ai" | "trading" | "community" | "web";

export interface ProjectLink {
  label: string;
  kind: "repo" | "live" | "brand" | "private";
  url?: string;
}

export interface Project {
  id: string;
  name: string;
  tagline: string;
  cluster: Cluster;
  stack: string[];
  status?: "live";
  detail: string;
  links: ProjectLink[];
}

const CLUSTERS: ReadonlySet<string> = new Set(["ai", "trading", "community", "web"]);
const LINK_KINDS: ReadonlySet<string> = new Set(["repo", "live", "brand", "private"]);

function str(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function validate(p: any, i: number): Project {
  const at = `projects[${i}]`;
  for (const k of ["id", "name", "tagline", "cluster", "detail"]) {
    if (!str(p?.[k])) throw new Error(`${at}.${k} must be a non-empty string`);
  }
  if (!CLUSTERS.has(p.cluster)) throw new Error(`${at}.cluster invalid: ${p.cluster}`);
  if (!Array.isArray(p.stack) || !p.stack.every((s: unknown) => str(s))) {
    throw new Error(`${at}.stack must be a string[]`);
  }
  if (!Array.isArray(p.links)) throw new Error(`${at}.links must be an array`);
  p.links.forEach((l: any, j: number) => {
    if (!str(l?.label)) throw new Error(`${at}.links[${j}].label must be a non-empty string`);
    if (!LINK_KINDS.has(l?.kind)) throw new Error(`${at}.links[${j}].kind invalid: ${l?.kind}`);
    if (l.url !== undefined && typeof l.url !== "string") {
      throw new Error(`${at}.links[${j}].url must be a string when present`);
    }
  });
  if (p.status !== undefined && p.status !== "live") {
    throw new Error(`${at}.status must be "live" when present`);
  }
  return p as Project;
}

export function loadProjects(file: string): Project[] {
  const raw = JSON.parse(fs.readFileSync(file, "utf8")) as unknown;
  if (!Array.isArray(raw)) throw new Error("projects.json must be an array");
  return raw.map((p, i) => validate(p, i));
}
```

- [ ] **Step 5: Run test to verify it still fails (manifest missing)**

Run: `npm test -w @interview-bot/server -- projects`
Expected: FAIL — `spec/projects.json` does not exist yet (real-manifest tests error on read).

- [ ] **Step 6: Commit**

```bash
git add server/src/projects.ts server/test/projects.test.ts server/test/fixtures/projects-invalid.json
git commit -m "feat: add project manifest loader + validation"
```

---

## Task 5: Author the real manifest (`spec/projects.json`)

**Files:**
- Create: `spec/projects.json`

- [ ] **Step 1: Create `spec/projects.json`**

```json
[
  {
    "id": "interview-bot",
    "name": "interview-bot",
    "tagline": "Grounded AI agent - the bot you're chatting with.",
    "cluster": "ai",
    "stack": ["Claude", "Fastify", "TypeScript", "React"],
    "status": "live",
    "detail": "A declarative, strictly grounded AI agent that represents Shay and powers this very page. Fastify + TypeScript API streaming Claude over SSE with prompt caching, a React/Vite/Tailwind UI, and a spec/ directory that defines the persona and the only facts it may state. Includes a daily token-budget guard and per-IP rate limiting.",
    "links": [
      { "label": "GitHub", "kind": "repo", "url": "https://github.com/MasterShayKe/interview-bot" }
    ]
  },
  {
    "id": "unboxing-hq",
    "name": "unboxing-hq",
    "tagline": "8-agent AI marketing department.",
    "cluster": "ai",
    "stack": ["TypeScript", "PostgreSQL", "Claude", "SSE"],
    "detail": "A full-stack platform where eight specialized Claude-powered agents operate as a complete marketing team, orchestrated by a CMO agent. Express + TypeScript API, React/Vite/Tailwind app, PostgreSQL, RAG-style versioned knowledge, cost accounting, and an admin dashboard. Deployed to production.",
    "links": [
      { "label": "Built for UNBOXING", "kind": "brand" }
    ]
  },
  {
    "id": "unboxing-agent",
    "name": "unboxing-agent",
    "tagline": "Multi-agent WhatsApp / Telegram concierge.",
    "cluster": "ai",
    "stack": ["TypeScript", "Node.js"],
    "detail": "An end-to-end business-operations stack built solo: a custom CRM, an automated leads system watching WhatsApp and email, and a multi-agent assistant (customer-facing + private executive assistant) routed by phone number across WhatsApp and Telegram, using an agentic tool-use loop over CRM, Calendly, Google Calendar, and Gmail.",
    "links": [
      { "label": "Built for UNBOXING", "kind": "brand" }
    ]
  },
  {
    "id": "crypto-kaito",
    "name": "KAITO",
    "tagline": "Telegram crypto decision-support agent.",
    "cluster": "trading",
    "stack": ["Python", "PostgreSQL", "Docker"],
    "detail": "A personal AI decision-support system that turns noisy market data into clear, risk-managed signals. A weighted signal engine plus a built-in risk layer (loss limits, drawdown auto-stop, cooldowns), operated through a Telegram control interface. Runs in safe demo/paper mode - a research project into agent design and guardrails, not a live trading product.",
    "links": [
      { "label": "Private", "kind": "private" }
    ]
  },
  {
    "id": "discord-tcg-bot",
    "name": "discord-tcg-bot",
    "tagline": "TCG community bot + IG content studio.",
    "cluster": "community",
    "stack": ["Python"],
    "detail": "A Discord bot for an active trading-card-game community: server setup, member onboarding, community engagement, and content automation - including an Instagram content studio that generates National-Geographic-style imagery and turns cards into short animations via external generation APIs, with an approval step before publishing.",
    "links": [
      { "label": "Private", "kind": "private" }
    ]
  },
  {
    "id": "machlifot",
    "name": "machlifot",
    "tagline": "Teacher-substitute tracker (RTL).",
    "cluster": "web",
    "stack": ["Next.js", "Firebase", "Tailwind"],
    "detail": "A web app with a right-to-left Hebrew interface for tracking and managing substitute teachers - who is covering which class, when, and the resulting records - replacing a manual, error-prone process with a clean real-time system.",
    "links": [
      { "label": "Private", "kind": "private" }
    ]
  },
  {
    "id": "unboxing-finance",
    "name": "unboxing.finance",
    "tagline": "Finance web app, built from scratch on Base44.",
    "cluster": "web",
    "stack": ["Base44"],
    "status": "live",
    "detail": "A finance web app built from scratch on Base44 (an AI app-building platform) and shipped live. Demonstrates rapid end-to-end delivery on a low-code stack when that is the right tool for the job.",
    "links": [
      { "label": "Visit site", "kind": "live", "url": "https://unboxing.finance" }
    ]
  }
]
```

- [ ] **Step 2: Run the loader tests**

Run: `npm test -w @interview-bot/server -- projects`
Expected: PASS — 7 projects, unique ids, invalid fixture throws.

- [ ] **Step 3: Commit**

```bash
git add spec/projects.json
git commit -m "feat: author project manifest (7 projects)"
```

---

## Task 6: Expose `GET /api/projects`

**Files:**
- Modify: `server/src/index.ts`

- [ ] **Step 1: Import the loader and load the manifest**

Near the other spec loads (after `const spec = loadSpec(SPEC_DIR);`), add:

```ts
import { loadProjects } from "./projects.js";
```

and below the spec load:

```ts
const projects = loadProjects(path.join(SPEC_DIR, "projects.json"));
```

- [ ] **Step 2: Register the endpoint**

After the existing `app.get("/api/spec", ...)` handler, add:

```ts
app.get("/api/projects", async () => projects);
```

- [ ] **Step 3: Verify the server builds and serves the route**

Run:
```bash
npm run build -w @interview-bot/server
(node server/dist/index.js &) ; sleep 2 ; curl -s localhost:3000/api/projects | head -c 200 ; echo ; kill %1 2>/dev/null || pkill -f server/dist/index.js
```
Expected: build succeeds; curl prints a JSON array starting with `[{"id":"interview-bot"`.

- [ ] **Step 4: Run the full server test suite (no regressions)**

Run: `npm test -w @interview-bot/server`
Expected: PASS — all suites (spec, prompt, guard, content, projects).

- [ ] **Step 5: Commit**

```bash
git add server/src/index.ts
git commit -m "feat: expose GET /api/projects"
```

---

## Done criteria

- `npm test -w @interview-bot/server` passes (including new `content` and `projects` suites).
- `GET /api/projects` returns the 7-project manifest.
- Persona reads as the portal concierge voice; emoji allowed.
- Existing `/api/chat` and `/api/fit` behavior is unchanged (no code paths altered besides additive route).

## Self-review notes (author)

- **Spec coverage:** Covers spec §3 (persona evolution), §4 (new fact files + content model + manifest). GitHub/UI/playground are later plans by design.
- **No placeholders:** all file contents and commands are concrete.
- **Type consistency:** `Project`/`ProjectLink`/`Cluster` defined once in `projects.ts`; the manifest and tests use those exact field names (`id`, `name`, `tagline`, `cluster`, `stack`, `status`, `detail`, `links[].label/kind/url`).
- **Open items deferred to later plans:** partner brand URLs (Partners UI is Plan 2), so unboxing-hq/unboxing-agent links use `kind: "brand"` with no URL for now.
