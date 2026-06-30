export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type { ClientContext } from "./device.js";

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
}

export interface BotTheme {
  accent?: string;
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

export interface PublicFact {
  kind: KnowledgeKind;
  title: string;
  body: string;
}

/** Public, read-only view of a bot used by its chat page. */
export interface PublicBot {
  handle: string;
  displayName: string;
  subjectName: string;
  tone: string;
  contactEmail: string;
  targetRole: string;
  suggestedQuestions: string[];
  theme: BotTheme;
  rules: string[];
  facts: PublicFact[];
}

export async function fetchBot(handle: string): Promise<PublicBot> {
  const res = await fetch(`/api/bots/${encodeURIComponent(handle)}/spec`);
  if (res.status === 404) throw new Error("NOT_FOUND");
  if (!res.ok) throw new Error("Failed to load bot");
  return res.json();
}

// --- SSE helpers ----------------------------------------------------------

async function consumeSse(
  res: Response,
  handlers: {
    onDelta: (text: string) => void;
    onDone?: (usage: TokenUsage) => void;
    onSuggestions?: (questions: string[]) => void;
  },
): Promise<void> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Request failed");
  }
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const evt of events) {
      const lines = evt.split("\n");
      const type = lines.find((l) => l.startsWith("event: "))?.slice(7);
      const dataLine = lines.find((l) => l.startsWith("data: "))?.slice(6);
      if (!dataLine) continue;
      const data = JSON.parse(dataLine);
      if (type === "delta") handlers.onDelta(data.text);
      else if (type === "done") handlers.onDone?.(data.usage);
      else if (type === "suggestions") handlers.onSuggestions?.(data.questions);
      else if (type === "error") throw new Error(data.message);
    }
  }
}

export interface StreamChatOptions {
  handle: string;
  messages: ChatMessage[];
  onDelta: (text: string) => void;
  onDone?: (usage: TokenUsage) => void;
  onSuggestions?: (questions: string[]) => void;
  clientContext?: import("./device.js").ClientContext;
  sessionDurationSeconds?: number;
}

/** Streams a chat response from a bot, identified by handle. */
export async function streamChat(opts: StreamChatOptions): Promise<void> {
  const res = await fetch(`/api/bots/${encodeURIComponent(opts.handle)}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: opts.messages,
      clientContext: opts.clientContext,
      sessionDurationSeconds: opts.sessionDurationSeconds,
    }),
  });
  await consumeSse(res, opts);
}

export interface StreamFitOptions {
  handle: string;
  jobDescription: string;
  onDelta: (text: string) => void;
  onDone?: (usage: TokenUsage) => void;
  clientContext?: import("./device.js").ClientContext;
  sessionDurationSeconds?: number;
}

/** Streams a grounded fit analysis for a pasted job description. */
export async function streamFit(opts: StreamFitOptions): Promise<void> {
  const res = await fetch(`/api/bots/${encodeURIComponent(opts.handle)}/fit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobDescription: opts.jobDescription,
      clientContext: opts.clientContext,
      sessionDurationSeconds: opts.sessionDurationSeconds,
    }),
  });
  await consumeSse(res, opts);
}

// --- owner / auth API (the dashboard) -------------------------------------

export interface OwnerBot {
  id: string;
  handle: string | null;
  status: "draft" | "published";
  displayName: string;
  subjectName: string;
  pronouns: { subject: string; object: string; possessive: string };
  tone: string;
  languageRule: string;
  contactEmail: string;
  targetRole: string;
  budgetRestMessage: string;
  suggestedQuestions: string[];
  extraRules: string[];
  theme: BotTheme;
}

export interface KnowledgeItem {
  id: string;
  kind: KnowledgeKind;
  title: string;
  body: string;
  position: number;
}

export interface MeResponse {
  user: { id: string; name: string; email: string | null; avatarUrl: string | null };
  bot: OwnerBot | null;
}

/** Returns the signed-in user, or null when logged out. */
export async function fetchMe(): Promise<MeResponse | null> {
  const res = await fetch("/api/me");
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to load session");
  return res.json();
}

export async function fetchMyBot(): Promise<{
  bot: OwnerBot;
  knowledge: KnowledgeItem[];
}> {
  const res = await fetch("/api/bots/me");
  if (!res.ok) throw new Error("Failed to load your bot");
  return res.json();
}

async function patchJson(url: string, body: unknown, method = "PATCH") {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Request failed");
  return json;
}

export async function updateMyBot(
  patch: Partial<OwnerBot>,
): Promise<{ bot: OwnerBot }> {
  return patchJson("/api/bots/me", patch);
}

export async function addKnowledge(item: {
  kind: KnowledgeKind;
  title: string;
  body: string;
}): Promise<{ item: KnowledgeItem }> {
  return patchJson("/api/bots/me/knowledge", item, "POST");
}

export async function updateKnowledge(
  id: string,
  patch: Partial<Pick<KnowledgeItem, "kind" | "title" | "body">>,
): Promise<{ item: KnowledgeItem }> {
  return patchJson(`/api/bots/me/knowledge/${id}`, patch);
}

export async function deleteKnowledge(id: string): Promise<void> {
  const res = await fetch(`/api/bots/me/knowledge/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete");
}

export async function reorderKnowledge(
  order: string[],
): Promise<{ knowledge: KnowledgeItem[] }> {
  return patchJson("/api/bots/me/knowledge/reorder", { order });
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

/** Sends the browser into the LinkedIn consent flow. */
export function startLinkedInLogin(): void {
  window.location.href = "/api/auth/linkedin";
}
