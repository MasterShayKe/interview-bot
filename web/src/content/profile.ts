// Single source of truth for the executive profile landing page.
// Every figure here is verified. Keep this consistent with the chat knowledge
// base under /spec/facts. Never introduce a metric that is not in both places.

export const profile = {
  name: "Shay Kopilevich",
  title: "Global IT Operations & AI Transformation Leader",
  role: "Global IT Operations + Applied AI",
  tagline:
    "I run enterprise IT organizations at global scale, and personally build the production AI that modernizes them. Not a roadmap - shipped, to an 11,000-person workforce.",
  // Scope-over-title frame: pre-empts the "Manager by title" objection.
  scope:
    "$8M budget - 67 people - 8 countries - 8 acquisitions - reporting to the CIO on strategy.",
  location: "Hod HaSharon, Israel",
  availability:
    "Open to IT Operations, Global IT Management, AI Operations, and enterprise automation leadership roles in Israel - onsite, hybrid, or remote.",
  // Own the gap: surfaced confidently instead of hidden in the chat.
  availabilityNote:
    "Available because the NiCE role relocated to the United States with the CEO - not because of performance. Ready to lead the next transformation now.",
  email: "shaykopi@gmail.com",
  linkedin: "https://www.linkedin.com/in/shay-kopilevich-25b828145/",
  github: "https://github.com/MasterShayKe/",
} as const;

// Drop a professional headshot at web/public/shay-photo.jpg and set available: true.
// Until then the UI falls back to the SK monogram.
export const photo = {
  available: true,
  path: "/shay-photo.jpg",
} as const;

// A real resume PDF is generated from this content into web/public.
export const resume = {
  available: true,
  path: "/Shay-Kopilevich-Resume.pdf",
} as const;

// What a recruiter needs to qualify the fit in five seconds.
export const lookingFor = {
  level: "Director / Head of IT Operations",
  function: "Global IT Operations, AI Operations, Enterprise Automation",
  geography: "Israel",
  model: "Onsite, hybrid, or remote",
};

// Named recommendations render only when populated. Do not invent entries -
// paste real LinkedIn recommendations here (name, title, company, quote).
export interface Recommendation {
  quote: string;
  name: string;
  title: string;
  company: string;
}
export const recommendations: Recommendation[] = [];

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
  { value: "11,000", label: "Workforce served", note: "Across 8 countries", primary: true },
  { prefix: "$", value: "8", suffix: "M", label: "Budget owned", note: "Full CAPEX + OPEX", primary: true },
  { value: "67", label: "IT professionals led", note: "Three tiers + delivery", primary: true },
  { value: "8", label: "Acquisitions absorbed", note: "Zero downtime, growth on demand", primary: true },
  { value: "35", suffix: "%", label: "Frontline cost removed", note: "Production AI, headcount held" },
  { prefix: "~", value: "9,000", label: "Engineering hours reclaimed / yr", note: "Redeployed from provisioning" },
  { value: "12,000", label: "Endpoints modernized", note: "Windows, macOS & Linux" },
  { value: "65 → 80", suffix: "%", label: "Resolved on first contact", note: "Employee experience" },
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
// Ordered to lead with the AI and M&A stories - the differentiating and the
// most executive - and to keep the tactical helpdesk metric out of the lead.
export const caseStudies: CaseStudy[] = [
  {
    index: "01",
    title: "Production AI in the core of support",
    domain: "Applied AI",
    before: ["Every recurring issue hit a human", "Manual ticket handling", "Full frontline cost"],
    after: ["AI resolves from approved knowledge", "Opens and escalates tickets itself", "~35% of frontline cost removed, headcount held"],
    headline: { value: "35%", label: "Of frontline cost removed" },
  },
  {
    index: "02",
    title: "M&A integration at will",
    domain: "M&A Integration",
    before: ["Ad-hoc, slow integrations", "Identity and endpoint gaps", "Downtime risk to the deal"],
    after: ["Repeatable integration playbook", "8 acquisitions, 50-400 people each", "2-3 months each, zero downtime"],
    headline: { value: "8", label: "Acquisitions absorbed, zero downtime" },
  },
  {
    index: "03",
    title: "Endpoint provisioning, re-engineered",
    domain: "Endpoint Engineering",
    before: ["4-5 hours per device", "Office network required", "Manual SCCM imaging"],
    after: ["Under 2 hours, anywhere with internet", "Intune + Windows Autopilot", "~9,000 engineering hours reclaimed / year"],
    headline: { value: "~9,000", label: "Hours returned to engineering / yr" },
  },
  {
    index: "04",
    title: "Contractor access under governance",
    domain: "Security & Risk",
    before: ["Unmanaged personal devices", "Uncontrolled network access", "~800 in scope"],
    after: ["Fully managed corporate devices", "Controlled access methodology", "~2,000 brought under governance in year one"],
    headline: { value: "~2,000", label: "Endpoints brought under governance" },
  },
  {
    index: "05",
    title: "First-contact resolution",
    domain: "Service Delivery",
    before: ["Ticket-only channels", "Resolved on first contact: 65%", "Slower first response"],
    after: ["First company-wide Live Chat, global", "Secured CIO sponsorship, piloted, scaled", "First-contact resolution to 80%"],
    headline: { value: "65 → 80%", label: "Resolved on first contact" },
  },
  {
    index: "06",
    title: "Mac at enterprise scale",
    domain: "Platform Engineering",
    before: ["Macs for a few designers only", "No support stack", "No management or security"],
    after: ["MacBooks for developer teams", "~70% faster developer workflows", "Full Jamf stack built from scratch"],
    headline: { value: "~70%", label: "Faster developer workflows" },
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
  category: "production" | "personal";
  summary: string;
  points: string[];
}

export const aiSystems: AiSystem[] = [
  {
    title: "Enterprise support agent",
    tag: "In production at NiCE",
    category: "production",
    summary:
      "AI Tier-0 support for 11,000 employees, wired into knowledge, incident, request, and escalation workflows.",
    points: [
      "Resolves from approved knowledge and opens tickets on the user's behalf",
      "Removed ~35% of frontline cost with headcount held flat",
    ],
  },
  {
    title: "Orchestrated marketing team",
    tag: "In production at Unboxing",
    category: "production",
    summary:
      "A multi-agent platform running a full marketing department for Unboxing - an orchestrator directing strategy, content, scheduling, analytics, and experimentation.",
    points: [
      "Agents own reels, stories, long-form, scheduling, and A/B testing",
      "RAG-style versioned brand context, cost accounting, admin dashboard",
    ],
  },
  {
    title: "AI content engine",
    tag: "In production at Bawnzy",
    category: "production",
    summary:
      "An AI-driven content engine producing Instagram content for Bawnzy end to end - from idea to published post, on a schedule, with no human in the loop.",
    points: [
      "End-to-end script, design, render, and publish pipeline",
      "Running in production, not a demo",
    ],
  },
  {
    title: "Multi-channel assistants",
    tag: "Built and shipped solo",
    category: "personal",
    summary:
      "Tool-using agents on WhatsApp and Telegram with CRM, calendar, and email integration.",
    points: [
      "Lead intake, booking, reminders, follow-ups, daily briefings",
      "Production integrations, not a demo",
    ],
  },
  {
    title: "This interview agent",
    tag: "Built and shipped solo",
    category: "personal",
    summary:
      "The grounded AI answering questions on this page - strict fact-grounding, streaming, no hallucination.",
    points: [
      "Node.js, TypeScript, the Claude API",
      "Answers only from verified experience, and says so when it cannot",
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

// The one-line category claim - the thing only he can say.
export const thesis =
  "Most enterprises are still planning their AI. Shay has already put it into the core of IT operations, at 11,000-person scale, while running the whole global organization - and he builds it himself.";

export const navItems = [
  { id: "impact", label: "Impact" },
  { id: "ai", label: "AI Systems" },
  { id: "transformation", label: "Transformations" },
  { id: "leadership", label: "Leadership" },
  { id: "interview", label: "Interview" },
  { id: "contact", label: "Contact" },
];
