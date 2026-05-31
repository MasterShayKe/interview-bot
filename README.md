# Interview Bot

A declarative, strictly-grounded chatbot that represents Shay Kopilevich to
interviewers. Built as a live portfolio piece: Fastify + TypeScript API
(Claude over SSE, prompt caching) and a React/Vite/Tailwind chat UI. The bot's
persona and the only facts it may state are defined declaratively in `spec/`.

## Develop

```
npm install
# add ANTHROPIC_API_KEY to server/.env
npm run dev -w @interview-bot/server   # API on :3000
npm run dev -w @interview-bot/web       # UI on :5173 (proxies /api)
```

## Test

```
npm test -w @interview-bot/server       # unit tests
npm run smoke -w @interview-bot/server  # golden-question check (uses API)
```

## Edit the bot

Change `spec/persona.yaml` or files under `spec/facts/`, then restart the API.
No code changes needed.

## Deploy

Render, via `render.yaml` (static web + node API). Set `ANTHROPIC_API_KEY` and
`WEB_ORIGIN` in the dashboard.
