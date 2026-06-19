// Curated from spec/facts/projects/*.md — the only projects the portal surfaces.
// Kept in sync by hand so the 3D portal stays grounded in verified facts.

export interface PortalProject {
  id: string;
  title: string;
  tagline: string;
  summary: string;
  stack: string[];
  /** Hue offset (radians) used to tint this node's glow within the lime palette. */
  hue: number;
}

export const projects: PortalProject[] = [
  {
    id: "unboxing-hq",
    title: "AI Marketing Department",
    tagline: "8 orchestrated Claude agents · flagship",
    summary:
      "A full-stack platform where eight specialized Claude-powered agents operate as a complete marketing team. A CMO/orchestrator delegates to specialists for reels strategy, daily and sales stories, long-form content, analytics, A/B experiments, and a knowledge librarian — streaming over SSE with full token-usage and cost accounting, and a RAG-style prompt assembly editable in-app.",
    stack: ["TypeScript", "Express", "React / Vite", "PostgreSQL", "Claude API", "RAG", "Render"],
    hue: 0.0,
  },
  {
    id: "business-operations",
    title: "AI Business Operations Stack",
    tagline: "End-to-end ops, built by one person",
    summary:
      "An entire operational stack for a financial-services business, built solo: a custom CRM as system of record, a WhatsApp customer-support AI channel, an automated lead pipeline watching WhatsApp and email, and a multi-agent assistant routed by phone number across WhatsApp and Telegram — an agentic tool-use loop spanning the CRM, Calendly, Google Calendar, and Gmail.",
    stack: ["Node.js", "TypeScript", "WhatsApp Cloud API", "Telegram", "OAuth2", "Agentic tool-use"],
    hue: 0.55,
  },
  {
    id: "decision-support-system",
    title: "AI Decision-Support System",
    tagline: "Signals with a built-in risk layer",
    summary:
      "A personal AI decision-support system that turns noisy, high-volume market data into clear, risk-managed signals. It combines a weighted technical-indicator signal engine, end-to-end automation, and a risk layer (loss limits, drawdown auto-stop, cooldowns) operated through a Telegram control interface — running in a safe demo/paper mode to explore agent design and guardrails.",
    stack: ["Python", "SQLAlchemy", "PostgreSQL", "Docker", "Telegram"],
    hue: -0.5,
  },
];
