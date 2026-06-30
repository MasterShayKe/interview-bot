// Domain types shared across the server. These mirror the DB columns (camelCased
// at the repo boundary) rather than the raw row shapes.

export interface User {
  id: string;
  linkedinSub: string | null;
  googleSub: string | null;
  email: string | null;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Pronouns {
  subject: string; // he / she / they
  object: string; // him / her / them
  possessive: string; // his / her / their
}

export type BotStatus = "draft" | "published";

export interface Bot {
  id: string;
  userId: string;
  handle: string | null;
  status: BotStatus;
  displayName: string;
  subjectName: string;
  pronouns: Pronouns;
  tone: string;
  languageRule: string;
  contactEmail: string;
  targetRole: string;
  budgetRestMessage: string;
  suggestedQuestions: string[];
  extraRules: string[];
  theme: BotTheme;
  createdAt: string;
  updatedAt: string;
}

export interface BotTheme {
  accent?: string; // hex, e.g. #C6F24E
  accentDim?: string;
  background?: string;
  logoUrl?: string;
  avatarUrl?: string;
}

export type KnowledgeKind =
  | "cv"
  | "experience"
  | "project"
  | "personal"
  | "custom";

export interface KnowledgeItem {
  id: string;
  botId: string;
  kind: KnowledgeKind;
  title: string;
  body: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}
