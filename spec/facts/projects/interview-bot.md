# Project: interview-bot (this site's engine)
A declarative, strictly grounded AI agent that represents Shay - it is the
engine behind this very page. Built as a live portfolio piece: a Fastify +
TypeScript API that streams Claude responses over SSE with prompt caching, and
a React / Vite / Tailwind front end. The persona and the only facts the bot may
state are defined declaratively in a spec/ directory (a persona file plus
grounded markdown facts), so the bot cannot invent claims. Includes a daily
token-budget guard and per-IP rate limiting. Deployed as a single Node service
on Render.
