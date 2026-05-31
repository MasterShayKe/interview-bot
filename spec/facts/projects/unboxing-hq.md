# Flagship project: AI Marketing Department (8 orchestrated agents)
Shay designed and built a full-stack platform where eight specialized
Claude-powered agents operate as a complete marketing team. A CMO/orchestrator
agent delegates to specialists for reels strategy, daily stories, sales/launch
stories, long-form content, performance analytics, A/B experiments, and a
knowledge librarian.

Architecture: a monorepo with an Express + TypeScript API, a React / Vite /
Tailwind web app, and PostgreSQL (JSONB, idempotent migrations). Agents stream
responses from the Claude API over SSE, with full token-usage and cost
accounting. A RAG-style knowledge system assembles each agent's system prompt
from versioned brand-voice and audience knowledge, editable through the app UI.
Includes an admin dashboard for usage/cost monitoring, conversation auditing,
and role-based access, plus an Instagram insights integration feeding the
analytics agent. Deployed to production on Render. (Built for a private
financial-services business; the business name is kept confidential.)
