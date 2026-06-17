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

export interface SpecResponse {
  persona: {
    name: string;
    subject_name: string;
    suggested_questions: string[];
    contact_email?: string;
    rules?: string[];
    tone?: string;
    language_rule?: string;
    [k: string]: unknown;
  };
  facts: { path: string; content: string }[];
}

export async function fetchSpec(): Promise<SpecResponse> {
  const res = await fetch("/api/spec");
  if (!res.ok) throw new Error("Failed to load spec");
  return res.json();
}

export type Cluster = "ai" | "trading" | "community" | "web";

export interface ProjectLink {
  label: string;
  kind: "repo" | "live" | "brand" | "private";
  url?: string;
}

export interface Project {
  id: string;
  name: string;
  tagline: string;
  cluster: Cluster;
  stack: string[];
  status?: "live";
  detail: string;
  links: ProjectLink[];
}

export interface Stat {
  value: string;
  label: string;
}

export interface Job {
  period: string;
  role: string;
  org: string;
}

export interface Partner {
  name: string;
  blurb: string;
  url?: string;
}

export interface ProfileResponse {
  hero: { kicker?: string; headline: string; subhead: string };
  stats: Stat[];
  experience: Job[];
  about: string[];
  partners: Partner[];
}

export interface RepoCard {
  name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  pushedAt: string;
}

export interface GitHubSummary {
  login: string;
  available: boolean;
  publicRepos: number;
  totalStars: number;
  languages: { name: string; count: number }[];
  recent: RepoCard[];
}

export async function fetchGitHub(): Promise<GitHubSummary> {
  const res = await fetch("/api/github");
  if (!res.ok) throw new Error(`github ${res.status}`);
  return res.json();
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/projects");
  if (!res.ok) throw new Error(`projects ${res.status}`);
  return res.json();
}

export async function fetchProfile(): Promise<ProfileResponse> {
  const res = await fetch("/api/profile");
  if (!res.ok) throw new Error(`profile ${res.status}`);
  return res.json();
}

export interface StreamChatOptions {
  messages: ChatMessage[];
  onDelta: (text: string) => void;
  onDone?: (usage: TokenUsage) => void;
  onSuggestions?: (questions: string[]) => void;
  onTool?: (tool: { name: string; projectId?: string }) => void;
  clientContext?: import("./device.js").ClientContext;
  sessionDurationSeconds?: number;
}

/**
 * Streams a chat response. Calls onDelta for each text chunk.
 * Resolves when the stream is done; rejects on transport error.
 */
export async function streamChat(
  options: StreamChatOptions | ChatMessage[],
  onDelta?: (text: string) => void,
): Promise<void> {
  // Support legacy positional call signature for backwards compat
  const opts: StreamChatOptions =
    Array.isArray(options)
      ? { messages: options, onDelta: onDelta! }
      : options;

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: opts.messages,
      clientContext: opts.clientContext,
      sessionDurationSeconds: opts.sessionDurationSeconds,
    }),
  });

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
      if (type === "delta") opts.onDelta(data.text);
      else if (type === "done") opts.onDone?.(data.usage);
      else if (type === "suggestions") opts.onSuggestions?.(data.questions);
      else if (type === "tool") opts.onTool?.(data);
      else if (type === "error") throw new Error(data.message);
    }
  }
}

export interface StreamFitOptions {
  jobDescription: string;
  onDelta: (text: string) => void;
  onDone?: (usage: TokenUsage) => void;
  clientContext?: import("./device.js").ClientContext;
  sessionDurationSeconds?: number;
}

/**
 * Streams a grounded fit analysis for a pasted job description.
 * Same SSE protocol as streamChat, minus follow-up suggestions.
 */
export async function streamFit(opts: StreamFitOptions): Promise<void> {
  const res = await fetch("/api/fit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobDescription: opts.jobDescription,
      clientContext: opts.clientContext,
      sessionDurationSeconds: opts.sessionDurationSeconds,
    }),
  });

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
      if (type === "delta") opts.onDelta(data.text);
      else if (type === "done") opts.onDone?.(data.usage);
      else if (type === "error") throw new Error(data.message);
    }
  }
}

export type PlaygroundEvent =
  | { type: "text"; text: string }
  | { type: "tool_call"; name: string; input: unknown }
  | { type: "tool_result"; name: string; output: string }
  | { type: "done"; usage: { inputTokens: number; outputTokens: number } }
  | { type: "error"; message: string };

export async function runPlayground(
  body: { persona: string; toolNames: string[]; task: string },
  onEvent: (e: PlaygroundEvent) => void,
): Promise<void> {
  const res = await fetch("/api/playground", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    onEvent({ type: "error", message: `Request failed (${res.status}).` });
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const frames = buf.split("\n\n");
    buf = frames.pop() ?? "";
    for (const frame of frames) {
      const dataLine = frame.split("\n").find((l) => l.startsWith("data:"));
      if (dataLine) onEvent(JSON.parse(dataLine.slice(5).trim()));
    }
  }
}
