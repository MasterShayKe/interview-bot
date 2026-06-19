// Curated from the verified project list (spec/projects.json). The portal only
// ever surfaces these — kept grounded in real, shippable work.

export type Cluster = "ai" | "trading" | "community" | "web";

export interface ProjectLink {
  label: string;
  url?: string;
}

export interface PortalProject {
  id: string;
  title: string;
  tagline: string;
  summary: string;
  stack: string[];
  cluster: Cluster;
  link: ProjectLink;
}

// Hue offset (added to the lime accent's hue) used to tint each cluster's
// planet so the four families read as distinct worlds.
export const clusterHue: Record<Cluster, number> = {
  ai: 0.0, // lime / green
  trading: -0.1, // amber
  community: 0.68, // magenta
  web: 0.38, // blue / cyan
};

export const clusterLabel: Record<Cluster, string> = {
  ai: "AI Agents",
  trading: "Trading",
  community: "Community",
  web: "Web",
};

export const projects: PortalProject[] = [
  {
    id: "unboxing-hq",
    title: "AI Marketing Department",
    tagline: "8-agent AI marketing department",
    summary:
      "A full-stack platform where eight specialized Claude-powered agents operate as a complete marketing team, orchestrated by a CMO agent. Express + TypeScript API, React/Vite/Tailwind app, PostgreSQL, RAG-style versioned knowledge, cost accounting, and an admin dashboard. Deployed to production.",
    stack: ["TypeScript", "PostgreSQL", "Claude", "SSE"],
    cluster: "ai",
    link: { label: "Built for UNBOXING" },
  },
  {
    id: "unboxing-agent",
    title: "AI Business-Ops Concierge",
    tagline: "Multi-agent WhatsApp / Telegram concierge",
    summary:
      "An end-to-end business-operations stack built solo: a custom CRM, an automated leads system watching WhatsApp and email, and a multi-agent assistant (customer-facing + private executive assistant) routed by phone number across WhatsApp and Telegram, using an agentic tool-use loop over CRM, Calendly, Google Calendar, and Gmail.",
    stack: ["TypeScript", "Node.js"],
    cluster: "ai",
    link: { label: "Built for UNBOXING" },
  },
  {
    id: "interview-bot",
    title: "Interview Bot",
    tagline: "Grounded AI agent — the bot you're chatting with",
    summary:
      "A declarative, strictly grounded AI agent that represents Shay and powers this very page. Fastify + TypeScript API streaming Claude over SSE with prompt caching, a React/Vite/Tailwind UI, and a spec/ directory that defines the persona and the only facts it may state. Includes a daily token-budget guard and per-IP rate limiting.",
    stack: ["Claude", "Fastify", "TypeScript", "React"],
    cluster: "ai",
    link: {
      label: "GitHub",
      url: "https://github.com/MasterShayKe/interview-bot",
    },
  },
  {
    id: "crypto-kaito",
    title: "KAITO",
    tagline: "Telegram crypto decision-support agent",
    summary:
      "A personal AI decision-support system that turns noisy market data into clear, risk-managed signals. A weighted signal engine plus a built-in risk layer (loss limits, drawdown auto-stop, cooldowns), operated through a Telegram control interface. Runs in safe demo/paper mode — a research project into agent design and guardrails, not a live trading product.",
    stack: ["Python", "PostgreSQL", "Docker"],
    cluster: "trading",
    link: { label: "Private" },
  },
  {
    id: "discord-tcg-bot",
    title: "Discord TCG Bot + IG Studio",
    tagline: "TCG community bot + IG content studio",
    summary:
      "A Discord bot for an active trading-card-game community: server setup, member onboarding, community engagement, and content automation — including an Instagram content studio that generates National-Geographic-style imagery and turns cards into short animations via external generation APIs, with an approval step before publishing.",
    stack: ["Python"],
    cluster: "community",
    link: { label: "Private" },
  },
  {
    id: "machlifot",
    title: "Machlifot",
    tagline: "Teacher-substitute tracker (RTL)",
    summary:
      "A web app with a right-to-left Hebrew interface for tracking and managing substitute teachers — who is covering which class, when, and the resulting records — replacing a manual, error-prone process with a clean real-time system.",
    stack: ["Next.js", "Firebase", "Tailwind"],
    cluster: "web",
    link: { label: "Private" },
  },
  {
    id: "unboxing-finance",
    title: "unboxing.finance",
    tagline: "Finance web app, shipped on Base44",
    summary:
      "A finance web app built from scratch on Base44 (an AI app-building platform) and shipped live. Demonstrates rapid end-to-end delivery on a low-code stack when that is the right tool for the job.",
    stack: ["Base44"],
    cluster: "web",
    link: { label: "Visit site", url: "https://unboxing.finance" },
  },
];
