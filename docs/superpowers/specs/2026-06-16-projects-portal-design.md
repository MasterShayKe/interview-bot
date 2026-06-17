# Projects Portal — Design Spec

**Date:** 2026-06-16
**Status:** Approved direction, pending final spec review
**Built on:** `interview-bot` monorepo (extends it)

## 1. Overview

A single playful-but-polished web page that showcases everything Shay
Kopilevich builds, hosted by a live, Claude-powered concierge guide. The page
uses a **bento-grid** layout (enterprise-grade, scannable) with an
**IDE/terminal-styled guide** as the interactive centerpiece. The page is
itself one of Shay's AI builds, so it doubles as living proof of skill.

Visual identity is **purple-forward** on a near-black background: premium,
calm, restrained motion. "Enterprise-grade" reads as polish and discipline,
not corporate gray.

### Audience & goal
Primary audience: **peers, the builder community, and personal brand.** Goal:
be memorable and distinctive, show personality, and prove capability. The same
grounded content also serves recruiters/clients well (the existing interview-bot
use case survives).

### Success criteria
- A visitor immediately understands what Shay builds and can explore it.
- The guide answers grounded questions about projects *and* career, and can
  pull live GitHub data.
- A visitor can **build and run a tiny agent themselves** (the wow feature).
- Mobile users get a clean, functional experience (no broken layout).
- Costs are bounded; no API key is ever exposed client-side.

## 2. Architecture — extend `interview-bot`

We grow the existing monorepo rather than start fresh.

**Reused as-is:**
- Fastify + Claude-over-SSE chat engine (`server/src/chat.ts`, `prompt.ts`,
  `context.ts`).
- The budget/cost guard (`server/src/guard.ts`, `budget_rest_message`).
- The declarative grounding system (`spec/persona.yaml`, `spec/facts/**`).
- React / Vite / Tailwind web app (`web/`).
- Single-service Render deploy (`render.yaml`); API serves the built web app on
  one origin. `ANTHROPIC_API_KEY` already wired.

**New / changed:**
- A new bento-grid landing experience in `web/` (replaces the current simple
  chat UI as the primary view; the chat becomes the embedded "guide" panel).
- Persona evolution (see §3).
- New grounded fact files for projects not yet documented (see §4).
- Two server tools the model can call: `focusProject` and `github` (see §5).
- A GitHub data endpoint + live panel/heatmap (see §6).
- The Build-a-bot playground: a sandboxed agent-loop endpoint + UI (see §7).

### Unit boundaries
- **`web/` landing** — presentational bento grid + project detail drawer.
  Depends on a small content manifest (project list) and the guide panel.
- **`web/` guide panel** — the IDE/terminal chat UI; talks to the existing
  `/chat` SSE endpoint; renders tool-call effects (focus a project, show GitHub).
- **`web/` playground** — self-contained sandbox UI; talks to a dedicated
  `/playground` endpoint; never shares state with the main chat.
- **`server/` tools** — `focusProject` (returns a project id for the client to
  scroll/open) and `github` (server-side GitHub API call, cached).
- **`server/` GitHub service** — one module that fetches + caches repo/profile
  data; backs both the live panel and the `github` tool (single source of truth).
- **`server/` playground** — a tightly capped agent loop, isolated from the
  main persona, with its own budget bucket.

## 3. The guide persona

Evolve `spec/persona.yaml` from interview-only to **"concierge with a dash of
fun"** for a peers/brand audience:
- Warm, sharp, confident, lightly playful. **Tasteful emoji allowed** (the
  current no-emoji rule is relaxed for this surface).
- Still grounded strictly in `spec/facts/**`; still answers interviewer-grade
  questions with the existing structured depth when asked.
- Still scoped to Shay's story (declines unrelated general questions).
- Bilingual EN/HE auto-detect retained.

We keep the existing structured-answer rules for substantive questions and add
a lighter register for casual ones.

## 4. Content model (grounded facts)

Projects shown as bento tiles (and known to the guide):

| Project | One-liner | Cluster | Links |
|---|---|---|---|
| interview-bot | Grounded AI agent — the bot you're chatting with | AI | repo (public) |
| unboxing-hq | 8-agent AI marketing department | AI | private (brand link) |
| unboxing-agent | Multi-agent WhatsApp/Telegram concierge | AI | private (brand link) |
| crypto · KAITO | Telegram crypto leverage trading agent | Trading | private |
| discord-tcg-bot | TCG community bot + IG content studio | Community | private (brand link) |
| machlifot | Teacher-substitute tracker (RTL) | Web | private |
| unboxing.finance | Finance web app, built from scratch on Base44 | Web | https://unboxing.finance (live) |

**New fact files to add under `spec/facts/projects/`:** `interview-bot.md`,
`crypto-kaito.md` (maps to existing decision-support-system framing),
`discord-tcg-bot.md`, `machlifot.md`, `unboxing-finance.md`. Keep
client-sensitive detail out; never expose owner-personal identities.

**Experience** (surfaced as an on-page timeline AND known to the guide — already
in `spec/facts/experience.md`): NiCE (2023–2026, ~70 people, AI-led
transformation, FCR 65→80%), Sapiens (2021–2023, ~35), Western Digital
(2018–2021, ~30), IDF Infantry Platoon Commander (~40, Lieutenant).

**Outside of work** (from `spec/facts/personal.md`): Hod HaSharon; dad of two;
Formula 1 & Maccabi Tel Aviv; 3D printing & racing RC cars.

**Partners / Brands page:** a section/page celebrating brands Shay has built for
(UNBOXING, Bawnzy & Friends, + more), each a card with a one-line "what he built"
and a link to *their* public site/profile. **Owner-personal identities stay
private — link the brand, never the personal handle.** Partner URLs are an open
item to collect from Shay.

## 5. The guide + tools

The guide is the existing `/chat` SSE engine rendered in an **IDE/terminal UI**:
window chrome (traffic lights), `guide — ~/ask-about-shay` path, "online"
indicator, grounded greeting, terminal-style suggestion chips, and a `›` prompt.

Two server-side tools the model may call mid-conversation:
- **`focusProject(projectId)`** — the client scrolls to and highlights the
  matching bento tile and opens its detail drawer. Makes "talking moves you
  through the page" real (the bento analogue of camera fly-to).
- **`github(query)`** — calls the server GitHub service (repos, stars, languages,
  last push, contributions) so the guide answers GitHub questions with live data.

**Light terminal flavor (optional, low cost):** a few hidden client-side
commands (`help`, `whoami`, `ls`, `sudo`) that print playful canned responses.
This is flavor only; the headline interactive feature is the playground (§7).

## 6. GitHub integration (live + bot)

- A server module fetches profile + public repos for `MasterShayKe` (stars,
  languages, last push, contribution data), **cached** (e.g. 1h TTL) and
  rate-limited. Optional `GITHUB_TOKEN` env raises the rate limit.
- A **live GitHub tile** on the page renders the contribution heatmap + repo
  summary, fetched via a `/github` endpoint (server-cached so we never hammer the
  API or leak tokens).
- The same service backs the `github` tool, keeping panel and conversation
  consistent.
- Degrades gracefully (cached/last-known or a static fallback) if the API is down.

## 7. Build-a-bot playground (the wow feature)

A small, self-serve sandbox where a visitor **builds and runs a real mini Claude
agent** and watches it work.

**Flow (MVP):**
1. Visitor picks a **goal/persona** (preset options + a free-text field) and
   selects **1–2 mock tools** from a small palette (e.g. `calculator`,
   `web_search` (mocked/stubbed), `github_lookup` (real, read-only via the
   GitHub service)).
2. Visitor types a task and hits **Run**.
3. The page streams a **visible agent loop**: the model's reasoning steps, each
   **tool call and result**, and the final answer — rendered in the terminal
   aesthetic so the mechanics are legible.

**Constraints (hard):**
- Dedicated `/playground` endpoint, isolated from the main guide persona.
- **Tightly capped:** max turns per run, max tokens, and its own budget bucket
  via the existing guard. Per-session/IP rate limit. Tools are sandboxed and
  read-only; no arbitrary network or code execution.
- Clear "this is a demo" framing and a graceful "resting to keep costs in check"
  state reusing `budget_rest_message`.

This is the page's signature surprise: visitors don't just read about Shay
building agents — they build and run one.

## 8. Visual design system

- **Palette:** background near-black with a violet undertone (`#0a0810`);
  primary accent violet (`#a855f7` / `#8b5cf6`); cluster accents — AI violet,
  Trading emerald, Community magenta, Web amber. Purple leads (hero gradient,
  terminal accents, prompt, links).
- **Type:** Inter (UI) + a monospace (terminal/guide). Generous spacing.
- **Layout:** bento grid; content column (hero, project tiles sized to content,
  experience timeline, about + partners) with a **sticky full-height guide
  terminal** on the right.
- **Motion:** restrained — subtle hover lift on tiles, blinking terminal cursor,
  smooth scroll/highlight on `focusProject`. No heavy/space effects.
- **Tiles fit their content** (no dead space).

## 9. Project detail drawer

Clicking a tile (or the guide calling `focusProject`) opens a drawer/modal with
the project's full hook, problem, highlights, stack chips, and links (live repo
if public, or "private — built for <brand>"). Content sourced from the grounded
facts so the page and guide never diverge.

## 10. Responsive / mobile

Below a breakpoint the bento collapses to a single column; the guide terminal
moves to a launchable bottom sheet / full-screen panel rather than a sticky
side column. The playground stacks vertically. No layout breakage, no heavy
effects on phones.

## 11. Resilience, cost, security

- **API key** stays server-side only; client never sees it.
- **Budget guard** reused for both the guide and the playground (separate
  buckets); over-budget → graceful resting message.
- **GitHub** cached + rate-limited; optional token; graceful fallback.
- **Playground** sandboxed, capped, read-only tools, per-session rate limit.
- **No-JS / failure:** server-rendered fallback listing projects + contact.

## 12. Hosting

Same single Render service builds and serves `web/` + API on one origin
(extends current `render.yaml`). Env: `ANTHROPIC_API_KEY` (existing), optional
`GITHUB_TOKEN`.

## 13. Out of scope (YAGNI)

- Literal playable maze / character movement / 3D space.
- Visitor accounts/auth; a CMS/admin (facts edited in `spec/` files).
- Analytics dashboards.
- Agent-vs-agent debate, hidden full arcade game (considered, deferred).
- Languages beyond the existing EN/HE auto-detect.

## 14. Open items to collect from Shay

- Partner/brand URLs for the Partners section (UNBOXING, Bawnzy & Friends, …).
- Confirm `unboxing.finance` is OK to link publicly (assumed yes — it's live).
- Final playground tool palette (which mock tools to expose).
- Whether the existing interview-bot deployment is replaced by the portal or the
  portal ships at a new path/subdomain.

## 15. Build phasing (high level — full plan via writing-plans)

1. Persona update + new fact files.
2. Bento landing UI (static content) + project detail drawer.
3. Embed guide as IDE/terminal panel on `/chat`; add `focusProject` tool.
4. GitHub service + live tile + `github` tool.
5. Build-a-bot playground (endpoint + sandboxed loop + terminal UI).
6. Responsive pass, resilience/cost hardening, deploy.
