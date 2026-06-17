# Projects Portal — Plan 2: Bento Landing UI

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **MANDATORY for every UI task in this plan:** the implementer MUST invoke the `frontend-design` skill BEFORE writing any component/JSX/CSS, and build against the approved mockup (see "Design reference"). Do not hand-wave the aesthetic — frontend-design drives the craft.

**Goal:** Replace the current single-column chat landing with a purple, enterprise-grade **bento grid** that showcases Shay's projects (from `/api/projects`), career timeline, about, and partners — with the existing Claude chat repositioned as a sticky **IDE/terminal-styled guide** panel.

**Architecture:** Extends the `interview-bot` `web/` React app and adds a small structured-profile endpoint to the server. This plan ships a fully working bento page with the existing chat embedded as the guide. The guide's `focusProject`/`github` tools and the live GitHub heatmap are deliberately deferred to Plans 3 and 4 — in this plan the GitHub tile renders a static "coming from GitHub" placeholder and tiles open a detail drawer on click only.

**Tech Stack:** React 18, Vite 6, Tailwind 3, TypeScript. Fonts already loaded: Instrument Serif (display), Schibsted Grotesk (sans), JetBrains Mono (mono). Server: Fastify.

**Plan series:** Plan 2 of 5. Depends on Plan 1 (done): `/api/projects` and the `Project` type exist.

**Branch:** `projects-portal`.

**Design reference (read before building):** the approved mockup is saved at
`/Users/shaykopilevich/projects-portal/.superpowers/brainstorm/36940-1781556572/content/bento-purple-mockup.html`.
It defines: purple-forward dark theme, top bar (wordmark + GitHub pill), a large hero tile, project tiles with a left cluster-color accent stripe + tagline + stack chips + optional "live" badge, an experience timeline with a vertical purple gradient line, an "Outside of work" tile, a "Brands I've built for" (partners) tile, and a sticky full-height IDE/terminal guide panel on the right (chrome dots, `guide — ~/ask-about-shay`, online dot, greeting bubble, terminal-style suggestion chips, `›` prompt). Reproduce that layout and feel with the real React components and live data; do NOT copy the mockup's throwaway inline CSS — use Tailwind + the theme tokens defined in Task 1.

---

## Design tokens (use everywhere)

- Primary accent (violet): `#a855f7`; dimmer: `#8b5cf6`.
- Cluster accents: AI `#8b5cf6`, Trading `#34d399`, Community `#ec4899`, Web `#fbbf24`.
- Background stays the dark `ink` family already defined; atmosphere gradients shift from lime/blue to violet.
- "online/live" status keeps a green dot (`#34d399`) for legibility.

## File Structure

Server (small additions):
- Create: `spec/profile.json` — structured hero/experience/about/partners content.
- Create: `server/src/profile.ts` — `Profile` type + `loadProfile()` (mirror `projects.ts` style + validation).
- Create: `server/test/profile.test.ts` — loader tests.
- Modify: `server/src/index.ts` — load profile + `GET /api/profile`.

Web:
- Modify: `web/tailwind.config.js` — purple accent + cluster colors + a `live` green.
- Modify: `web/src/index.css` — `--accent` → violet; `::selection`; `.bg-atmosphere` gradients → violet.
- Modify: `web/src/lib/api.ts` — add `Project`, `ProfileResponse` types + `fetchProjects()`, `fetchProfile()`.
- Create: `web/src/components/portal/ProjectTile.tsx`
- Create: `web/src/components/portal/ProjectGrid.tsx`
- Create: `web/src/components/portal/ProjectDetailDrawer.tsx`
- Create: `web/src/components/portal/HeroTile.tsx`
- Create: `web/src/components/portal/ExperienceTimeline.tsx`
- Create: `web/src/components/portal/AboutTile.tsx`
- Create: `web/src/components/portal/PartnersTile.tsx`
- Create: `web/src/components/portal/GitHubTile.tsx` (static placeholder this plan)
- Create: `web/src/components/portal/GuidePanel.tsx` (wraps existing chat in terminal chrome)
- Modify: `web/src/App.tsx` — compose the bento layout (left content column + sticky GuidePanel), responsive.

Each component has one responsibility and a typed prop interface. Keep files focused.

> Note: `web/` currently has NO test runner. UI verification is: `npm run build -w @interview-bot/web` (runs `tsc --noEmit` + vite build) must pass, plus a manual visual check via `npm run dev` (Vite proxies `/api` to `localhost:3000`). Each UI task's "verify" step uses the build + a described manual check. The server tasks (1-3) use vitest as in Plan 1.

---

## Task 1: Structured profile loader + test (server, TDD)

**Files:** Create `server/test/profile.test.ts`, `server/src/profile.ts`, `server/test/fixtures/profile-invalid.json`.

- [ ] **Step 1: Write failing test** `server/test/profile.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { loadProfile } from "../src/profile.js";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const REAL = path.join(here, "../../spec/profile.json");
const INVALID = path.join(here, "fixtures/profile-invalid.json");

describe("loadProfile", () => {
  it("loads hero, stats, experience, about, partners", () => {
    const p = loadProfile(REAL);
    expect(p.hero.headline).toBeTruthy();
    expect(p.hero.subhead).toBeTruthy();
    expect(p.stats.length).toBeGreaterThanOrEqual(3);
    expect(p.experience.length).toBeGreaterThanOrEqual(4);
    for (const job of p.experience) {
      expect(job.period).toBeTruthy();
      expect(job.role).toBeTruthy();
      expect(job.org).toBeTruthy();
    }
    expect(p.about.length).toBeGreaterThan(0);
    expect(p.partners.length).toBeGreaterThan(0);
  });

  it("throws on an invalid profile", () => {
    expect(() => loadProfile(INVALID)).toThrow(/headline/);
  });
});
```

- [ ] **Step 2: Invalid fixture** `server/test/fixtures/profile-invalid.json`

```json
{ "hero": { "subhead": "no headline" }, "stats": [], "experience": [], "about": [], "partners": [] }
```

- [ ] **Step 3: Run, expect fail**

Run: `npm test -w @interview-bot/server -- profile`
Expected: FAIL (module not found).

- [ ] **Step 4: Implement** `server/src/profile.ts`

```ts
import fs from "node:fs";

export interface Stat { value: string; label: string; }
export interface Job { period: string; role: string; org: string; }
export interface Partner { name: string; blurb: string; url?: string; }
export interface Profile {
  hero: { kicker?: string; headline: string; subhead: string };
  stats: Stat[];
  experience: Job[];
  about: string[];
  partners: Partner[];
}

function str(v: unknown): v is string { return typeof v === "string" && v.length > 0; }

export function loadProfile(file: string): Profile {
  const p = JSON.parse(fs.readFileSync(file, "utf8")) as any;
  if (!str(p?.hero?.headline)) throw new Error("profile.hero.headline must be a non-empty string");
  if (!str(p?.hero?.subhead)) throw new Error("profile.hero.subhead must be a non-empty string");
  if (!Array.isArray(p.stats)) throw new Error("profile.stats must be an array");
  p.stats.forEach((s: any, i: number) => {
    if (!str(s?.value) || !str(s?.label)) throw new Error(`profile.stats[${i}] needs value+label`);
  });
  if (!Array.isArray(p.experience)) throw new Error("profile.experience must be an array");
  p.experience.forEach((j: any, i: number) => {
    if (!str(j?.period) || !str(j?.role) || !str(j?.org)) throw new Error(`profile.experience[${i}] needs period+role+org`);
  });
  if (!Array.isArray(p.about) || !p.about.every((a: unknown) => str(a))) throw new Error("profile.about must be string[]");
  if (!Array.isArray(p.partners)) throw new Error("profile.partners must be an array");
  p.partners.forEach((pt: any, i: number) => {
    if (!str(pt?.name) || !str(pt?.blurb)) throw new Error(`profile.partners[${i}] needs name+blurb`);
    if (pt.url !== undefined && typeof pt.url !== "string") throw new Error(`profile.partners[${i}].url must be a string when present`);
  });
  return p as Profile;
}
```

- [ ] **Step 5: Commit (test+impl together, as in Plan 1's loader task)**

```bash
git add server/src/profile.ts server/test/profile.test.ts server/test/fixtures/profile-invalid.json
git commit -m "feat: add structured profile loader + validation"
```

---

## Task 2: Author `spec/profile.json`

**Files:** Create `spec/profile.json`.

- [ ] **Step 1: Create the file** (grounded in `spec/facts/experience.md` and `personal.md`)

```json
{
  "hero": {
    "kicker": "Portfolio · live",
    "headline": "I build AI agents & the systems around them.",
    "subhead": "From global IT leadership (teams up to ~70) to hands-on AI implementation. Talk to my guide - it's grounded in the real facts."
  },
  "stats": [
    { "value": "7", "label": "Projects" },
    { "value": "8 yrs", "label": "IT leadership" },
    { "value": "5", "label": "Languages" },
    { "value": "3", "label": "Brands built for" }
  ],
  "experience": [
    { "period": "2023 - 2026", "role": "Global IT Support & Services Manager", "org": "NiCE · ~70 people · AI-led transformation, FCR 65->80%" },
    { "period": "2021 - 2023", "role": "Global IT Support Manager", "org": "Sapiens · ~35 people · Intune modernization" },
    { "period": "2018 - 2021", "role": "IT Service Desk Team Lead", "org": "Western Digital · ~30 people" },
    { "period": "Service", "role": "Infantry Platoon Commander", "org": "IDF · led ~40 · Lieutenant" }
  ],
  "about": [
    "Hod HaSharon, Israel · dad of two",
    "Formula 1 & Maccabi Tel Aviv",
    "3D printing & racing RC cars"
  ],
  "partners": [
    { "name": "UNBOXING", "blurb": "Multi-agent marketing system + WhatsApp/Telegram concierge + finance app" },
    { "name": "Bawnzy & Friends", "blurb": "TCG community Discord bot + Instagram content studio" }
  ]
}
```

- [ ] **Step 2: Run profile tests**

Run: `npm test -w @interview-bot/server -- profile`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add spec/profile.json
git commit -m "feat: author structured profile (hero, stats, experience, about, partners)"
```

---

## Task 3: Expose `GET /api/profile`

**Files:** Modify `server/src/index.ts`.

- [ ] **Step 1: Import + load** — alongside the projects load:

```ts
import { loadProfile } from "./profile.js";
```
```ts
const profile = loadProfile(path.join(SPEC_DIR, "profile.json"));
```

- [ ] **Step 2: Route** — after `app.get("/api/projects", ...)`:

```ts
app.get("/api/profile", async () => profile);
```

- [ ] **Step 3: Build + verify route**

```bash
npm run build -w @interview-bot/server
(node server/dist/index.js &) ; sleep 2 ; curl -s localhost:3000/api/profile | head -c 120 ; echo ; pkill -f server/dist/index.js
```
Expected: build OK; JSON starting `{"hero":{`.

- [ ] **Step 4: Full server suite**

Run: `npm test -w @interview-bot/server`
Expected: all suites pass (now includes `profile`).

- [ ] **Step 5: Commit**

```bash
git add server/src/index.ts
git commit -m "feat: expose GET /api/profile"
```

---

## Task 4: Purple theme tokens

**Files:** Modify `web/tailwind.config.js`, `web/src/index.css`.

> Invoke `frontend-design` first (theme/aesthetic work).

- [ ] **Step 1: Tailwind colors** — in `web/tailwind.config.js`, replace the `accent` color block and add clusters:

```js
        accent: {
          DEFAULT: "#a855f7",
          dim: "#8b5cf6",
        },
        cluster: {
          ai: "#8b5cf6",
          trading: "#34d399",
          community: "#ec4899",
          web: "#fbbf24",
        },
        live: "#34d399",
```

- [ ] **Step 2: CSS vars + atmosphere** — in `web/src/index.css`:
  - Change `--accent: #c6f24e;` to `--accent: #a855f7;`
  - In `.bg-atmosphere`, change the lime `rgba(198, 242, 78, 0.11)` stop to violet `rgba(168, 85, 247, 0.12)` and keep/soften the blue stop to a violet-leaning `rgba(139, 92, 246, 0.07)`.
  - Update `.prose-chat li::marker` and `h1..h4` accent references if they hardcode the lime — switch to `var(--accent)` (most already use it; fix any literal `rgba(198, 242, 78, ...)`).

- [ ] **Step 3: Verify build + visual**

Run: `npm run build -w @interview-bot/web`
Expected: build passes. Manual: run `npm run dev` in `web/`, confirm accents render violet, no lime remains.

- [ ] **Step 4: Commit**

```bash
git add web/tailwind.config.js web/src/index.css
git commit -m "feat: purple theme tokens + cluster colors"
```

---

## Task 5: Web data layer (`api.ts`)

**Files:** Modify `web/src/lib/api.ts`.

- [ ] **Step 1: Add types + fetchers** (mirror the server `Project`/`Profile` shapes). Append to `web/src/lib/api.ts`:

```ts
export type Cluster = "ai" | "trading" | "community" | "web";
export interface ProjectLink { label: string; kind: "repo" | "live" | "brand" | "private"; url?: string; }
export interface Project {
  id: string; name: string; tagline: string; cluster: Cluster;
  stack: string[]; status?: "live"; detail: string; links: ProjectLink[];
}
export interface Stat { value: string; label: string; }
export interface Job { period: string; role: string; org: string; }
export interface Partner { name: string; blurb: string; url?: string; }
export interface ProfileResponse {
  hero: { kicker?: string; headline: string; subhead: string };
  stats: Stat[]; experience: Job[]; about: string[]; partners: Partner[];
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/projects");
  if (!res.ok) throw new Error(`projects ${res.status}`);
  return res.json();
}
export async function fetchProfile(): Promise<ProfileResponse> {
  const res = await fetch("/api/profile");
  if (!res.ok) throw new Error(`profile ${res.status}`);
  return res.json();
}
```

- [ ] **Step 2: Verify + commit**

```bash
npm run build -w @interview-bot/web
git add web/src/lib/api.ts
git commit -m "feat: web data layer for projects + profile"
```

---

## Task 6: Project tile + grid + detail drawer

> Invoke `frontend-design` first. Build against the mockup's project-tile + drawer look using Tailwind + theme tokens. Tiles must size to their content (no dead space).

**Files:** Create `web/src/components/portal/ProjectTile.tsx`, `ProjectGrid.tsx`, `ProjectDetailDrawer.tsx`.

- [ ] **Step 1: `ProjectTile.tsx`** — props `{ project: Project; onOpen: (p: Project) => void }`. Renders a card with: a left vertical accent stripe colored by `cluster` (map cluster→`bg-cluster-{cluster}`), the name, tagline, stack chips, and a green "live" badge when `status === "live"`. Clicking calls `onOpen(project)`. Keyboard-accessible (role/button, Enter/Space).

- [ ] **Step 2: `ProjectGrid.tsx`** — props `{ projects: Project[]; onOpen: (p: Project) => void }`. Responsive bento grid (2 cols desktop content column, 1 col mobile). Renders a `ProjectTile` per project.

- [ ] **Step 3: `ProjectDetailDrawer.tsx`** — props `{ project: Project | null; onClose: () => void }`. A right-side drawer/modal showing name, cluster label, tagline, full `detail`, stack chips, and links (render `kind: "live"|"repo"` with `url` as anchors opening in a new tab; render `brand`/`private` as non-link labels). Closes on backdrop click and Escape. Renders nothing when `project` is null.

- [ ] **Step 4: Verify build + manual**

Run: `npm run build -w @interview-bot/web`
Expected: passes. (Wired into the page in Task 9 — manual visual check happens there.)

- [ ] **Step 5: Commit**

```bash
git add web/src/components/portal/ProjectTile.tsx web/src/components/portal/ProjectGrid.tsx web/src/components/portal/ProjectDetailDrawer.tsx
git commit -m "feat: project tile, grid, and detail drawer"
```

---

## Task 7: Hero, experience timeline, about, partners, GitHub tiles

> Invoke `frontend-design` first. Match the mockup's hero gradient (violet), timeline (vertical purple gradient line with glowing nodes), about list, partners chips, and a static GitHub tile.

**Files:** Create `HeroTile.tsx`, `ExperienceTimeline.tsx`, `AboutTile.tsx`, `PartnersTile.tsx`, `GitHubTile.tsx` under `web/src/components/portal/`.

- [ ] **Step 1: `HeroTile.tsx`** — props `{ hero: ProfileResponse["hero"]; stats: Stat[] }`. Violet-gradient large tile: kicker (mono uppercase), headline (display serif), subhead, and a stat row (`value` bold + `label` small uppercase).

- [ ] **Step 2: `ExperienceTimeline.tsx`** — props `{ experience: Job[] }`. A card titled "Experience" with a vertical purple gradient rail and a glowing node per job; each row shows `period` (small), `role` (bold), `org` (muted).

- [ ] **Step 3: `AboutTile.tsx`** — props `{ about: string[] }`. Card titled "Outside of work" listing each line.

- [ ] **Step 4: `PartnersTile.tsx`** — props `{ partners: Partner[] }`. Violet-tinted card "Brands I've built for"; each partner is a chip (anchor if `url` present, else plain). 

- [ ] **Step 5: `GitHubTile.tsx`** — props none (this plan). Static card "Live from GitHub" with the label "10 repos · contributions, stars & languages" and a placeholder note "(wired up in a later step)". (Plan 4 replaces this with live data.)

- [ ] **Step 6: Verify build + commit**

```bash
npm run build -w @interview-bot/web
git add web/src/components/portal/HeroTile.tsx web/src/components/portal/ExperienceTimeline.tsx web/src/components/portal/AboutTile.tsx web/src/components/portal/PartnersTile.tsx web/src/components/portal/GitHubTile.tsx
git commit -m "feat: hero, experience timeline, about, partners, github tiles"
```

---

## Task 8: Guide panel (IDE/terminal chrome around existing chat)

> Invoke `frontend-design` first. Wrap the EXISTING chat experience (reuse `ChatPanel`/`Composer` and the `streamChat` flow already in `App.tsx`) in the terminal chrome from the mockup: traffic-light dots, `guide — ~/ask-about-shay` path, green "online" dot, and the `›` prompt styling on the composer. Do NOT rewrite the chat/streaming logic — only restyle/compose around it.

**Files:** Create `web/src/components/portal/GuidePanel.tsx`. (May lift the existing chat state/handlers from `App.tsx` into this panel, or accept them as props — implementer's call, but keep streaming behavior identical.)

- [ ] **Step 1: Read** `web/src/App.tsx`, `web/src/components/ChatPanel.tsx`, `web/src/components/Composer.tsx` to understand the current chat wiring (messages state, `streamChat`, suggestions).

- [ ] **Step 2: Build `GuidePanel.tsx`** — terminal-chrome container that holds the existing chat transcript + composer, styled per the mockup (mono, violet `›` prompt, online dot). Sticky full-height on desktop.

- [ ] **Step 3: Verify build + commit**

```bash
npm run build -w @interview-bot/web
git add web/src/components/portal/GuidePanel.tsx
git commit -m "feat: IDE/terminal guide panel wrapping the existing chat"
```

---

## Task 9: Compose the bento layout in `App.tsx` (+ responsive)

> Invoke `frontend-design` first. This is the integration task: assemble everything into the bento, fetch data, wire the drawer, and make it responsive per the spec (single column + launchable guide sheet on mobile).

**Files:** Modify `web/src/App.tsx`.

- [ ] **Step 1: Data fetching** — on mount, `fetchProjects()` and `fetchProfile()` (in addition to the existing `fetchSpec`). Hold `projects`, `profile`, and `openProject: Project | null` in state. Handle loading + error states gracefully (skeleton or simple message; never a blank crash).

- [ ] **Step 2: Layout** — top bar (existing brand mark, now violet, + a GitHub pill linking to `https://github.com/MasterShayKe`). Two-column wrap: LEFT content column = `HeroTile`, `ProjectGrid` (+ `GitHubTile` as a tile), `ExperienceTimeline`, then a row of `AboutTile` + `PartnersTile`; RIGHT = sticky `GuidePanel`. Render `ProjectDetailDrawer` driven by `openProject`; `ProjectGrid`'s `onOpen` sets it.

- [ ] **Step 3: Responsive** — below `lg`, collapse to one column; the `GuidePanel` becomes a bottom-sheet/full-screen panel toggled by a floating "Ask the guide" button rather than a sticky side column. No layout breakage; no heavy effects on mobile.

- [ ] **Step 4: Preserve existing features** — keep the `FitDialog` ("Does Shay fit?") and `SpecDialog` entry points reachable (e.g. from the footer or guide panel). Keep `BootSequence` if it still fits the vibe, or gate it; implementer's judgment with frontend-design, but do not silently delete working features without noting it.

- [ ] **Step 5: Verify build + thorough manual check**

```bash
npm run build -w @interview-bot/web
```
Then run the app (`npm run build` at repo root, then `node server/dist/index.js`, OR `npm run dev` in web with the server running) and manually verify: tiles render from live data, clicking a tile opens the drawer with correct content + links, hero/timeline/about/partners populate from `/api/profile`, the guide chats and streams as before, and the mobile layout collapses cleanly. Capture a screenshot if possible.

- [ ] **Step 6: Commit**

```bash
git add web/src/App.tsx
git commit -m "feat: compose bento landing layout with live data + responsive"
```

---

## Done criteria

- `npm test -w @interview-bot/server` passes (adds `profile` suite).
- `npm run build -w @interview-bot/web` passes.
- The landing page renders the purple bento with all 7 projects, hero/stats, experience timeline, about, partners, a static GitHub tile, and the working guide chat in terminal chrome.
- Clicking a project opens a detail drawer with grounded content + correct links.
- Mobile collapses to one column with a launchable guide.
- Existing chat streaming + `/api/fit` remain functional.

## Self-review notes (author)

- **Spec coverage:** spec §8 (visual system / purple bento), §9 (project detail drawer), §4 (experience/about/partners surfaced on page), §10 (responsive). GitHub live data (§6) and guide tools/`focusProject` (§5) are intentionally Plans 4 and 3 — GitHub tile is a static placeholder here; tiles open via click, not yet via the guide.
- **frontend-design:** required on every UI task (4, 6, 7, 8, 9) — stated inline.
- **No placeholders in spec'd interfaces:** all prop interfaces, theme tokens, data shapes, and endpoints are concrete. Component visual craft is delegated to `frontend-design` against the saved mockup by design (the correct tool), not left vague.
- **Type consistency:** web `Project`/`ProjectLink`/`Cluster` mirror the server (Plan 1) exactly; `Profile`/`Stat`/`Job`/`Partner` match `server/src/profile.ts` (Task 1). `fetchProjects`/`fetchProfile` return those types.
- **No-test-runner caveat for web** is called out; verification is build + manual, which is honest for this repo's current setup.
```
