# Interview Bot — platform

A multi-tenant platform for **strictly-grounded interview agents**. Anyone signs
in, builds a personal AI agent from their own experience and projects, and shares
it at `/u/<handle>`. Each agent answers **only** from its declared facts - no
hallucinations, no overclaiming.

Built as a live portfolio piece: Fastify + TypeScript API (Claude over SSE,
prompt caching), Postgres for multi-tenant data, "Sign in with LinkedIn"
(OpenID Connect), and a React/Vite/Tailwind UI with a knowledge editor.

- **Public bot:** `/u/<handle>` - the grounded chat + fit-report experience.
- **Dashboard:** `/dashboard` - edit persona, add/edit/reorder/delete knowledge,
  pick a handle, set an accent color, publish.
- **Auth:** `/login` - LinkedIn OIDC (name/email/photo). Bot knowledge is built
  in the editor (LinkedIn's API does not expose work history).

The flagship demo bot (Shay Kopilevich) is seeded at `/u/shay`.

## Architecture

- `server/` — Fastify + TypeScript. Postgres via `pg` with SQL migrations
  (`server/migrations/`, run automatically on boot). Per-bot prompt building is
  cached and invalidated on edit. The strict grounding/safety rules live in code
  (`server/src/persona-defaults.ts`) so every tenant inherits them; only persona
  and knowledge are per-user data.
- `web/` — React + Vite + Tailwind. Public chat page, dashboard editor, landing,
  and the WebGL projects portal.
- `spec/` — the seed source for Shay's bot (migrated into the DB by `seed-shay`).

## Develop

```
npm install
createdb interview_bot        # or use a managed Postgres
# add ANTHROPIC_API_KEY, DATABASE_URL, COOKIE_SECRET and LINKEDIN_* to server/.env
npm run migrate   -w @interview-bot/server   # apply schema
npm run seed-shay -w @interview-bot/server   # seed the demo bot at /u/shay
npm run dev -w @interview-bot/server         # API on :3000
npm run dev -w @interview-bot/web            # UI on :5173 (proxies /api)
```

To sign in locally, create a LinkedIn developer app (product: "Sign In with
LinkedIn using OpenID Connect") and set the redirect URI to
`http://localhost:3000/api/auth/linkedin/callback`.

## Test

```
npm test -w @interview-bot/server            # unit tests
npm run smoke -w @interview-bot/server [handle]  # golden-question check (uses API + DB)
```

## Deploy

Render, via `render.yaml`: one Node service (serves the API and the built web
app) plus a managed Postgres. Set `ANTHROPIC_API_KEY`, `LINKEDIN_CLIENT_ID/
SECRET/REDIRECT_URI`, and `WEB_ORIGIN` in the dashboard; `DATABASE_URL` and
`COOKIE_SECRET` are wired automatically.
