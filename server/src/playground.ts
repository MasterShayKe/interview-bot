import Anthropic from "@anthropic-ai/sdk";
import type { GitHubSummary } from "./github.js";

/** Tiny safe arithmetic evaluator: numbers and + - * / ( ) only. No eval. */
export function safeCalc(expr: string): number {
  const tokens = expr.match(/\d+\.?\d*|[+\-*/()]/g);
  if (!tokens || tokens.join("") !== expr.replace(/\s+/g, "")) {
    throw new Error("Only numbers and + - * / ( ) are allowed.");
  }
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  function parseExpr(): number {
    let v = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = next();
      const r = parseTerm();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }
  function parseTerm(): number {
    let v = parseFactor();
    while (peek() === "*" || peek() === "/") {
      const op = next();
      const r = parseFactor();
      v = op === "*" ? v * r : v / r;
    }
    return v;
  }
  function parseFactor(): number {
    if (peek() === "(") {
      next();
      const v = parseExpr();
      if (next() !== ")") throw new Error("Unbalanced parentheses.");
      return v;
    }
    const t = next();
    const n = Number(t);
    if (Number.isNaN(n)) throw new Error(`Unexpected token: ${t}`);
    return n;
  }
  const result = parseExpr();
  if (pos !== tokens.length) throw new Error("Trailing tokens.");
  if (!Number.isFinite(result)) throw new Error("Non-finite result.");
  return result;
}

export interface ToolContext {
  getGitHub: () => Promise<GitHubSummary>;
}

export interface PlaygroundTool {
  name: string;
  tool: Anthropic.Tool;
  run: (input: any, ctx: ToolContext) => Promise<string>;
}

export const PLAYGROUND_TOOLS: PlaygroundTool[] = [
  {
    name: "calculator",
    tool: {
      name: "calculator",
      description: "Evaluate a basic arithmetic expression (+, -, *, /, parentheses).",
      input_schema: {
        type: "object",
        properties: { expression: { type: "string", description: "e.g. (2 + 3) * 4" } },
        required: ["expression"],
      },
    },
    run: async (input) => {
      try {
        return String(safeCalc(String(input?.expression ?? "")));
      } catch (e) {
        return `Error: ${(e as Error).message}`;
      }
    },
  },
  {
    name: "word_count",
    tool: {
      name: "word_count",
      description: "Count the words and characters in a piece of text.",
      input_schema: {
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"],
      },
    },
    run: async (input) => {
      const text = String(input?.text ?? "");
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      return `${words} words, ${text.length} characters.`;
    },
  },
  {
    name: "github_lookup",
    tool: {
      name: "github_lookup",
      description: "Look up Shay's live public GitHub stats (repos, stars, top languages, recent repos).",
      input_schema: { type: "object", properties: {} },
    },
    run: async (_input, ctx) => {
      const g = await ctx.getGitHub();
      if (!g.available) return "GitHub data is temporarily unavailable.";
      const langs = g.languages.slice(0, 4).map((l) => `${l.name}(${l.count})`).join(", ");
      return `${g.publicRepos} public repos, ${g.totalStars} stars. Top languages: ${langs}. Most recent: ${g.recent[0]?.name ?? "n/a"}.`;
    },
  },
];

export type PlaygroundEvent =
  | { type: "text"; text: string }
  | { type: "tool_call"; name: string; input: unknown }
  | { type: "tool_result"; name: string; output: string }
  | { type: "done"; usage: { inputTokens: number; outputTokens: number } }
  | { type: "error"; message: string };

export interface RunPlaygroundArgs {
  client: Anthropic;
  persona: string;
  toolNames: string[];
  task: string;
  onEvent: (e: PlaygroundEvent) => void;
  getGitHub: () => Promise<GitHubSummary>;
}

const PLAYGROUND_MODEL = "claude-haiku-4-5";
const MAX_ITERS = 4;
const MAX_OUTPUT = 600;

export async function runPlayground(args: RunPlaygroundArgs): Promise<void> {
  const selected = args.toolNames.map((n) => {
    const t = PLAYGROUND_TOOLS.find((pt) => pt.name === n);
    if (!t) throw new Error(`Unknown tool: ${n}`);
    return t;
  });
  const tools = selected.map((t) => t.tool);
  const ctx: ToolContext = { getGitHub: args.getGitHub };

  const system =
    `You are a small demo agent a visitor just configured on Shay Kopilevich's portfolio. ` +
    `Persona: ${args.persona}. Use the provided tools when they help; think briefly, act, then give a short final answer. Keep it concise.`;

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: args.task }];
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    for (let iter = 0; iter < MAX_ITERS; iter++) {
      const res = await args.client.messages.create({
        model: PLAYGROUND_MODEL,
        max_tokens: MAX_OUTPUT,
        system,
        messages,
        ...(tools.length ? { tools } : {}),
      });
      inputTokens += res.usage?.input_tokens ?? 0;
      outputTokens += res.usage?.output_tokens ?? 0;

      for (const block of res.content) {
        if (block.type === "text" && block.text.trim()) {
          args.onEvent({ type: "text", text: block.text });
        }
      }

      if (res.stop_reason !== "tool_use") break;

      const toolUses = res.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );
      messages.push({ role: "assistant", content: res.content });

      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const tu of toolUses) {
        args.onEvent({ type: "tool_call", name: tu.name, input: tu.input });
        const tool = selected.find((t) => t.name === tu.name);
        const output = tool ? await tool.run(tu.input, ctx) : `Unknown tool: ${tu.name}`;
        args.onEvent({ type: "tool_result", name: tu.name, output });
        results.push({ type: "tool_result", tool_use_id: tu.id, content: output });
      }
      messages.push({ role: "user", content: results });
    }
    args.onEvent({ type: "done", usage: { inputTokens, outputTokens } });
  } catch (e) {
    args.onEvent({ type: "error", message: (e as Error).message });
  }
}
