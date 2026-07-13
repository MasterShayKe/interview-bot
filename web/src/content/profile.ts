// Single source of truth for the executive profile landing page.
// Every figure here is verified. Keep this consistent with the chat knowledge
// base under /spec/facts. Never introduce a metric that is not in both places.

export const profile = {
  name: "Shay Kopilevich",
  title: "Global IT Operations & AI Transformation Leader",
  role: "Global IT Operations Leader",
  tagline:
    "Building enterprise operations that scale through AI, automation, and disciplined execution.",
  location: "Hod HaSharon, Israel",
  availability:
    "Open to IT Operations, Global IT Management, AI Operations, and enterprise automation leadership roles in Israel - onsite, hybrid, or remote.",
  email: "shaykopi@gmail.com",
  linkedin: "https://www.linkedin.com/in/shay-kopilevich-25b828145/",
  github: "https://github.com/MasterShayKe/",
} as const;

// If a real resume PDF is dropped at web/public/<file>, set available: true.
// Until then, the CTA falls back to an email request instead of a broken link.
export const resume = {
  available: false,
  path: "/Shay-Kopilevich-Resume.pdf",
} as const;

export const targetRoles = [
  "IT Operations Manager",
  "Global IT Manager",
  "Head of IT Operations",
  "AI Operations Lead",
  "Enterprise Automation Lead",
  "Operational Transformation",
] as const;

export interface Metric {
  value: string;
  prefix?: string;
  suffix?: string;
  label: string;
  note?: string;
  primary?: boolean;
}

// Prefix/suffix are split out so the count-up animation only touches the number.
export const metrics: Metric[] = [
  { value: "11,000", label: "Employees supported", note: "Global workforce at NiCE", primary: true },
  { value: "12,000", label: "Enterprise endpoints", note: "Windows, macOS & Linux", primary: true },
  { value: "67", label: "Global IT professionals led", note: "Across three tiers", primary: true },
  { prefix: "$", value: "8", suffix: "M", label: "Annual CAPEX + OPEX", note: "Budget ownership", primary: true },
  { value: "8", label: "Acquisitions integrated", note: "Zero operational downtime" },
  { value: "35", suffix: "%", label: "Service Desk workload cut", note: "Through production AI" },
  { value: "65 → 80", suffix: "%", label: "First Contact Resolution", note: "Measured improvement" },
  { prefix: "~", value: "9,000", label: "Technician hours saved / yr", note: "Endpoint automation" },
];

export const overview = {
  lead:
    "Shay is a global IT Operations leader with more than a decade of experience managing enterprise service delivery, endpoint engineering, regional support organizations, M&A integrations, and large-scale technology transformation.",
  body:
    "At NiCE he led a global organization supporting 11,000 employees and 12,000 endpoints across eight countries. His organization spanned Tier 1 Service Desk, Tier 2 regional teams, Tier 3 endpoint architects, team leaders, and project managers.",
  differentiator:
    "His distinguishing strength is the ability to move between strategy, leadership, architecture, and hands-on execution. He does not simply recommend automation or manage vendors - he designs and ships working systems.",
  geography: [
    "North America",
    "Latin America",
    "Europe",
    "Israel",
    "India",
    "Japan",
    "Singapore",
    "South Africa",
  ],
};

export interface CaseStudy {
  index: string;
  title: string;
  domain: string;
  before: string[];
  after: string[];
  headline: { value: string; label: string };
}

// Each transformation reads as a Before -> After proof of business impact.
export const caseStudies: CaseStudy[] = [
  {
    index: "01",
    title: "Laptop provisioning",
    domain: "Endpoint Engineering",
    before: ["4-5 hours per device", "Office network required", "Manual SCCM imaging", "Technician-heavy"],
    after: ["Under 2 hours", "Anywhere with internet", "Intune + Windows Autopilot", "~9,000 technician hours saved / year"],
    headline: { value: "~9,000", label: "Hours saved / year" },
  },
  {
    index: "02",
    title: "Frontline support",
    domain: "Production AI",
    before: ["Manual ticket handling", "Repetitive questions to humans", "Full Service Desk load"],
    after: ["AI resolves from approved knowledge", "Opens and escalates tickets itself", "~35% of workload removed"],
    headline: { value: "35%", label: "Workload removed" },
  },
  {
    index: "03",
    title: "First contact resolution",
    domain: "Service Delivery",
    before: ["Ticket-only channels", "FCR at 65%", "Slower first response"],
    after: ["First company-wide Live Chat, global", "~150-200 chats a day", "FCR raised to 80%"],
    headline: { value: "65 → 80%", label: "First contact resolution" },
  },
  {
    index: "04",
    title: "M&A integration",
    domain: "M&A Integration",
    before: ["Ad-hoc, slow integrations", "Identity and endpoint gaps", "Downtime risk"],
    after: ["Repeatable integration playbook", "8 acquisitions, 50-400 people each", "2-3 months, zero downtime"],
    headline: { value: "8", label: "Integrations, zero downtime" },
  },
  {
    index: "05",
    title: "Contractor access",
    domain: "Security & Governance",
    before: ["Unmanaged personal devices", "Uncontrolled network access", "~800 in scope"],
    after: ["Fully managed corporate devices", "Controlled access methodology", "~2,000 secured in year one"],
    headline: { value: "~2,000", label: "Contractors secured" },
  },
  {
    index: "06",
    title: "Mac at enterprise scale",
    domain: "Platform Engineering",
    before: ["Macs for a few designers only", "No Mac support stack", "No management or security"],
    after: ["MacBooks for developer teams", "~70% faster dev workflows", "Full Jamf stack built from scratch"],
    headline: { value: "~70%", label: "Faster dev workflows" },
  },
];

export const leadership = {
  intro:
    "A 67-person global organization, structured across three tiers, run on transparency and disciplined process.",
  stats: [
    { value: "67", label: "IT professionals led" },
    { value: "7", label: "Direct reports" },
    { value: "$8M", label: "Budget owned" },
    { value: "11,000", label: "Employees served" },
    { value: "12,000", label: "Endpoints" },
  ],
  org: [
    { tier: "Direct reports", detail: "Regional Team Lead, Service Desk Manager, Architects Lead + PMs", count: "7" },
    { tier: "Tier 1 - Service Desk", detail: "Front-line global support", count: "~30" },
    { tier: "Tier 2 - Regional support", detail: "Regional escalation teams", count: "~28" },
    { tier: "Tier 3 - Endpoint architects", detail: "Windows & Mac architecture", count: "~8" },
    { tier: "Delivery", detail: "Project managers", count: "2" },
  ],
  rhythm: [
    "Weekly meetings with leads and project managers",
    "Monthly meetings with each team",
    "Quarterly global organization meetings",
    "Quarterly skip-level one-on-ones",
    "Biannual performance reviews",
    "Full ownership of the technology budget",
  ],
  philosophy:
    "Great IT organizations are built on transparency, disciplined processes, clear workflows, and well-structured knowledge. Once those foundations exist, AI becomes a force multiplier for employee satisfaction and operational efficiency.",
  style: [
    "Listens before deciding",
    "Consultative and transparent",
    "Approachable without avoiding accountability",
    "Capable of helping hands-on",
    "Builds development paths for the team",
    "Carries responsibility through hard transformations",
  ],
  recognition: [
    "one of the best service managers",
    "the glue of the group",
  ],
};

export interface Position {
  company: string;
  role: string;
  period: string;
  summary: string;
  points: string[];
}

export const timeline: Position[] = [
  {
    company: "NiCE",
    role: "Global IT Support & Services Manager",
    period: "Jan 2023 - Mar 2026",
    summary:
      "Led a 67-person global organization supporting 11,000 employees and 12,000 endpoints across eight countries, and drove an automation-first, AI-led transformation.",
    points: [
      "Cut relevant Service Desk workload ~35% with a production AI support agent",
      "Moved endpoint provisioning to Intune + Autopilot, saving ~9,000 technician hours a year",
      "Delivered 8 zero-downtime M&A integrations",
      "Owned an $8M annual technology budget",
    ],
  },
  {
    company: "Sapiens",
    role: "Global IT Support Manager",
    period: "Jan 2021 - Jan 2023",
    summary:
      "Managed global IT support for ~5,000 employees and ~7,000 endpoints across Israel, the US, UK, India and other regions, with ~30 engineers handling ~3,000 tickets a month at SLA.",
    points: [
      "Completed a stalled German acquisition IT integration (~200 employees)",
      "Modernized and standardized support and endpoint operations",
      "Led migration toward Microsoft Intune",
    ],
  },
  {
    company: "Western Digital",
    role: "IT Service Desk Team Lead",
    period: "Jan 2018 - Jan 2021",
    summary:
      "Promoted into team leadership for a multi-site multinational service desk, owning global support, escalations, and VIP service.",
    points: [
      "Established the India support team end to end - hiring, onboarding, training",
      "Introduced Mac support into the Service Desk",
      "Received performance-based recognition",
    ],
  },
];

export interface AiSystem {
  title: string;
  tag: string;
  summary: string;
  points: string[];
}

export const aiSystems: AiSystem[] = [
  {
    title: "Enterprise support agent",
    tag: "Deployed at NiCE",
    summary:
      "AI Tier-0 support for 11,000 employees, integrated with knowledge, incident, request, and escalation workflows.",
    points: [
      "Resolves from approved knowledge and opens tickets on the user's behalf",
      "Escalates and routes hands-on work to human teams",
    ],
  },
  {
    title: "Continuous compliance agents",
    tag: "Deployed at NiCE",
    summary:
      "AI-driven continuous audit support across ISO 27001, SOC 2, and GDPR.",
    points: [
      "Freed roughly three FTEs of repetitive manual audit effort",
      "Improved consistency and breadth of audit coverage",
    ],
  },
  {
    title: "Sales SKU agent",
    tag: "Deployed at NiCE",
    summary:
      "Guides sales teams through hundreds of SKUs and compatible product combinations.",
    points: [
      "Helps assemble the correct SKU suite",
      "Reduces dependency on tribal knowledge",
    ],
  },
  {
    title: "Self-managed content studio",
    tag: "Personal build",
    summary:
      "A production-style platform where eight orchestrated AI agents operate as a full marketing department.",
    points: [
      "CMO orchestrator, reels, stories, long-form, analytics, and A/B agents",
      "RAG-style versioned brand context, cost accounting, and an admin dashboard",
    ],
  },
  {
    title: "Multi-channel AI assistant",
    tag: "Personal build",
    summary:
      "Customer-facing and private executive-assistant agents on WhatsApp and Telegram.",
    points: [
      "CRM, booking, Google Calendar, and Gmail integrations",
      "Lead intake, booking, reminders, follow-ups, and daily briefings",
    ],
  },
  {
    title: "This interactive profile",
    tag: "You are using it",
    summary:
      "A grounded interview agent built on a curated knowledge base with streaming responses and strict fact-grounding.",
    points: [
      "Node.js, TypeScript, and the Claude API",
      "Answers only from verified experience - and says so when it cannot",
    ],
  },
];

export interface SkillGroup {
  group: string;
  items: string[];
}

export const skills: SkillGroup[] = [
  {
    group: "IT Operations & ITSM",
    items: [
      "Global IT Operations", "ITIL", "Incident Management", "Problem Management",
      "Change Management", "Service Catalog", "Knowledge Management", "CMDB",
      "Asset Management", "ServiceNow", "SLA & KPI Management", "M&A Integration",
      "Vendor Management", "Budget Ownership",
    ],
  },
  {
    group: "Modern Workplace & Endpoint",
    items: [
      "Microsoft Intune", "Windows Autopilot", "SCCM / MECM", "Jamf", "BigFix",
      "Windows", "macOS", "Linux", "Microsoft Defender",
    ],
  },
  {
    group: "Cloud, Identity & Security",
    items: [
      "Azure", "Microsoft 365", "Entra ID / Azure AD", "Exchange", "Teams",
      "Okta", "CyberArk", "CrowdStrike", "VMware", "Citrix",
    ],
  },
  {
    group: "AI & Automation",
    items: [
      "OpenAI", "Claude", "AI Agents", "Multi-agent Orchestration",
      "Retrieval-Augmented Generation", "MCP", "Prompt & Context Engineering",
      "Workflow Automation", "n8n", "Make", "Tool Use", "API Integrations",
    ],
  },
  {
    group: "Engineering",
    items: [
      "Python", "Node.js", "TypeScript", "JavaScript", "React", "Docker",
      "PostgreSQL", "REST APIs", "Webhooks", "GitHub",
    ],
  },
];

// Prompt buttons for the interview section. MUST stay identical to
// spec/persona.yaml suggested_questions (a test enforces this).
export const suggestedQuestions = [
  "Tell me about Shay",
  "Why should we hire him?",
  "His leadership style",
  "His biggest achievement",
  "How he uses AI in enterprise IT",
  "The Intune migration",
  "His biggest failure",
  "Why did he leave NiCE?",
];

export const navItems = [
  { id: "impact", label: "Impact" },
  { id: "overview", label: "Overview" },
  { id: "transformation", label: "Transformations" },
  { id: "ai", label: "AI Systems" },
  { id: "interview", label: "Interview" },
  { id: "contact", label: "Contact" },
];
