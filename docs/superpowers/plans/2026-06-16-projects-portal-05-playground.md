# Projects Portal — Plan 5: Build-a-bot Playground

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`).
> **Server Anthropic API code (the agent loop):** invoke `claude-api` first. **UI task:** invoke `frontend-design` first.

**Goal:** A self-serve sandbox where a visitor configures a tiny agent (a persona + 1–2 sandboxed tools + a task) and watches a real, capped Claude tool-use loop run live — reasoning, each tool call, each tool result, final answer. The page's signature "wow" feature: visitors don't just read that Shay builds agents — they build and run one.

**Architecture:** A dedicated `server/src/playground.ts` defines a small palette of **sandboxed, read-only/pure tools** and a capped agent loop that streams structured events (`text`, `tool_call`, `tool_result`, `done`/`error`). A new `POST /api/playground` SSE endpoint validates input, enforces its **own budget bucket + tighter rate limit** (separate from the guide), and streams the loop. A `Playground` UI (launched from a tile/button) lets the visitor pick a persona + tools + task and renders the loop in the terminal aesthetic. Uses `claude-haiku-4-5` to keep this public demo cheap. Hard caps on iterations, output tokens, and input sizes.

**Tech Stack:** Fastify, `@anthropic-ai/sdk` (`claude-haiku-4-5`), the existing `createGuard`, React, Vitest.

**Plan series:** Plan 5 of 5. Depends on Plan 1 (guard pattern), Plan 4 (`getGitHubSummary` for the `github_lookup` tool), and Plan 2 (the bento UI + terminal styling to match).

**Branch:** `projects-portal`.

---

## File Structure

- Create: `server/src/playground.ts` — `safeCalc()` (pure arithmetic evaluator), the tool registry (`PLAYGROUND_TOOLS`), and `runPlayground({client, persona, toolNames, task, onEvent, getGitHub})`.
- Test: `server/test/playground.test.ts` — `safeCalc`, the pure tool `run`s, and the loop (fake client) emitting `tool_call`/`tool_result`.
- Modify: `server/src/index.ts` — a second `createGuard` (playground bucket) + `POST /api/playground` SSE endpoint.
- Modify: `web/src/lib/api.ts` — `runPlayground()` SSE client + event types.
- Create: `web/src/components/portal/Playground.tsx` — the configurator + live transcript (terminal-styled dialog/panel).
- Modify: `web/src/App.tsx` — a launch entry point (a "Build a bot" tile/button) that opens the Playground.

---

## Task 1: Safe calculator + tool registry (TDD)

**Files:** `server/test/playground.test.ts`, `server/src/playground.ts`.

- [ ] **Step 1: Write the failing test** (calculator + pure tools first):

```ts
import { describe, it, expect } from "vitest";
import { safeCalc, PLAYGROUND_TOOLS } from "../src/playground.js";

describe("safeCalc", () => {
  it("evaluates arithmetic with precedence and parens", () => {
    expect(safeCalc("2 + 3 * 4")).toBe(14);
    expect(safeCalc("(2 + 3) * 4")).toBe(20);
    expect(safeCalc("10 / 4")).toBe(2.5);
  });
  it("rejects anything non-arithmetic", () => {
    expect(() => safeCalc("process.exit(1)")).toThrow();
    expect(() => safeCalc("2 ** 99999")).toThrow(); // ** not allowed
    expect(() => safeCalc("alert(1)")).toThrow();
  });
});

describe("PLAYGROUND_TOOLS registry", () => {
  it("exposes calculator, word_count, github_lookup with schemas", () => {
    const names = PLAYGROUND_TOOLS.map((t) => t.name).sort();
    expect(names).toContain("calculator");
    expect(names).toContain("word_count");
    expect(names).toContain("github_lookup");
    for (const t of PLAYGROUND_TOOLS) {
      expect(t.tool.name).toBe(t.name);
      expect(t.tool.input_schema.type).toBe("object");
      expect(typeof t.run).toBe("function");
    }
  });
  it("calculator run returns the computed value as text", async () => {
    const calc = PLAYGROUND_TOOLS.find((t) => t.name === "calculator")!;
    expect(await calc.run({ expression: "6 * 7" }, {} as any)).toBe("42");
  });
  it("word_count counts words", async () => {
    const wc = PLAYGROUND_TOOLS.find((t) => t.name === "word_count")!;
    expect(await wc.run({ text: "one two three" }, {} as any)).toContain("3");
  });
});
```

- [ ] **Step 2: Run, expect fail**

Run: `npm test -w @interview-bot/server -- playground`
Expected: FAIL (module missing).

- [ ] **Step 3: Implement `server/src/playground.ts`** (calculator + registry; loop added in Task 2)

```ts
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
```

- [ ] **Step 4: Run, expect pass**

Run: `npm test -w @interview-bot/server -- playground`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/src/playground.ts server/test/playground.test.ts
git commit -m "feat: playground safe calculator + sandboxed tool registry"
```

---

## Task 2: The capped agent loop (TDD)

**Files:** Modify `server/src/playground.ts`; extend `server/test/playground.test.ts`.

- [ ] **Step 1: Add a loop test** (append to the existing test file) using a fake client like Plan 3's `chat.test`:

```ts
import { runPlayground } from "../src/playground.js";

function fakeClient(scripted: any[]) {
  let i = 0;
  const calls: any[] = [];
  return {
    calls,
    messages: {
      create: async (params: any) => { calls.push(params); return scripted[i++]; },
    },
  };
}
const usage = { input_tokens: 5, output_tokens: 3 };

describe("runPlayground loop", () => {
  it("runs a tool then finishes, emitting structured events", async () => {
    const client = fakeClient([
      {
        content: [
          { type: "text", text: "I'll compute that." },
          { type: "tool_use", id: "t1", name: "calculator", input: { expression: "6 * 7" } },
        ],
        stop_reason: "tool_use",
        usage,
      },
      { content: [{ type: "text", text: "The answer is 42." }], stop_reason: "end_turn", usage },
    ]);
    const events: any[] = [];
    await runPlayground({
      client: client as any,
      persona: "a helpful math bot",
      toolNames: ["calculator"],
      task: "what is 6 times 7?",
      onEvent: (e) => events.push(e),
      getGitHub: async () => ({ available: false } as any),
    });
    const types = events.map((e) => e.type);
    expect(types).toContain("text");
    expect(types).toContain("tool_call");
    expect(types).toContain("tool_result");
    expect(types).toContain("done");
    const call = events.find((e) => e.type === "tool_call");
    expect(call.name).toBe("calculator");
    const result = events.find((e) => e.type === "tool_result");
    expect(result.output).toBe("42");
    // only the selected tool is offered to the model
    expect(client.calls[0].tools.map((t: any) => t.name)).toEqual(["calculator"]);
  });

  it("rejects unknown tool names", async () => {
    await expect(
      runPlayground({
        client: {} as any, persona: "x", toolNames: ["danger"], task: "hi",
        onEvent: () => {}, getGitHub: async () => ({ available: false } as any),
      }),
    ).rejects.toThrow(/unknown tool/i);
  });
});
```

- [ ] **Step 2: Run, expect fail** — `npm test -w @interview-bot/server -- playground` (no `runPlayground` yet).

- [ ] **Step 3: Implement `runPlayground` in `server/src/playground.ts`** (append):

```ts
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
```

Note: `runPlayground` swallows runtime errors into an `error` event, but the **unknown-tool validation throws synchronously before the loop** (so the "rejects unknown tool names" test sees a rejected promise). Keep the tool-resolution `.map()` (which throws) OUTSIDE the try block.

- [ ] **Step 4: Run, expect pass** — `npm test -w @interview-bot/server -- playground`, then full suite `npm test -w @interview-bot/server`.

- [ ] **Step 5: Commit**

```bash
git add server/src/playground.ts server/test/playground.test.ts
git commit -m "feat: capped playground agent loop with structured events"
```

---

## Task 3: `POST /api/playground` endpoint (own budget bucket)

**Files:** Modify `server/src/index.ts`.

- [ ] **Step 1: Imports + a second guard + caps** — add `import { runPlayground, PLAYGROUND_TOOLS } from "./playground.js";`. Near the existing `guard`, add a separate playground guard:

```ts
const playgroundGuard = createGuard({
  windowMs: 60_000,
  maxRequests: Number(process.env.PLAYGROUND_RATE_MAX ?? 3),
  dailyTokenBudget: Number(process.env.PLAYGROUND_TOKEN_BUDGET ?? 300_000),
});
const PLAYGROUND_TOOL_NAMES = new Set(PLAYGROUND_TOOLS.map((t) => t.name));
const MAX_PLAYGROUND_TASK_CHARS = 600;
const MAX_PLAYGROUND_PERSONA_CHARS = 200;
```

- [ ] **Step 2: Endpoint** — after `/api/fit`:

```ts
app.post("/api/playground", async (req, reply) => {
  const ip = req.ip;
  if (playgroundGuard.isBudgetExceeded()) {
    reply.code(503);
    return { error: spec.persona.budget_rest_message };
  }
  if (!playgroundGuard.checkRateLimit(ip).ok) {
    reply.code(429);
    return { error: "Too many playground runs - please wait a moment." };
  }

  const body = req.body as { persona?: string; toolNames?: string[]; task?: string };
  const persona = (body.persona ?? "a helpful assistant").trim().slice(0, MAX_PLAYGROUND_PERSONA_CHARS);
  const task = (body.task ?? "").trim().slice(0, MAX_PLAYGROUND_TASK_CHARS);
  const toolNames = (Array.isArray(body.toolNames) ? body.toolNames : [])
    .filter((n) => PLAYGROUND_TOOL_NAMES.has(n))
    .slice(0, 2);
  if (task.length < 3) {
    reply.code(400);
    return { error: "Give your agent a task to run." };
  }

  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  const send = (event: string, data: unknown) =>
    reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  try {
    await runPlayground({
      client,
      persona,
      toolNames,
      task,
      getGitHub: () => getGitHubSummary({ login: GITHUB_LOGIN, token: GITHUB_TOKEN }),
      onEvent: (e) => {
        if (e.type === "done") {
          playgroundGuard.recordUsage(e.usage.inputTokens + e.usage.outputTokens);
        }
        send(e.type, e);
      },
    });
  } catch (err) {
    app.log.error(err);
    send("error", { type: "error", message: "Something went wrong running your agent." });
  } finally {
    reply.raw.end();
  }
});
```

- [ ] **Step 3: Build** — `npm run build -w @interview-bot/server` (tsc passes).

- [ ] **Step 4: Commit**

```bash
git add server/src/index.ts
git commit -m "feat: POST /api/playground endpoint with its own budget bucket"
```

---

## Task 4: Playground UI

> Invoke `frontend-design` first. Match the IDE/terminal aesthetic of the guide (mono, violet `›`, traffic-light chrome). This is the signature feature — make it feel like a real little terminal where an agent runs.

**Files:** Modify `web/src/lib/api.ts`; create `web/src/components/portal/Playground.tsx`; modify `web/src/App.tsx`.

- [ ] **Step 1: SSE client** — append to `web/src/lib/api.ts`:

```ts
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
```

(If `web/src/lib/api.ts` already has a shared SSE-frame parser used by `streamChat`, reuse it instead of duplicating — implementer's judgment.)

- [ ] **Step 2: `Playground.tsx`** — a terminal-styled dialog/panel with:
  - **Persona**: 3 preset chips (e.g. "a witty math tutor", "a terse research assistant", "a hype-man for Shay") + a free-text input.
  - **Tools**: checkboxes for the 3 tools (`calculator`, `word_count`, `github_lookup`); enforce max 2 selected.
  - **Task**: a textarea (maxLength 600) with a couple of example prompts as quick-fills.
  - **Run** button → calls `runPlayground(...)`, disabled while running.
  - **Transcript**: renders the event stream in terminal style — `text` as the agent speaking, `tool_call` as `▸ calculator({"expression":"6*7"})`, `tool_result` as `  ⮑ 42`, `done` as a subtle footer (token usage), `error` as a red line. Auto-scroll.
  Prop interface: `{ open: boolean; onClose: () => void }`. Renders nothing when `!open`.

- [ ] **Step 3: Launch entry in `App.tsx`** — add a `Build a bot` entry point (a dedicated bento tile, or a button near the GitHub tile/footer) that opens `<Playground open={playgroundOpen} onClose={...} />` via a `playgroundOpen` state. Keep it discoverable but not in the way. (A small tile titled "🧪 Build a bot · run a live mini-agent" fits the grid well.)

- [ ] **Step 4: Build** — `npm run build -w @interview-bot/web` passes.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/api.ts web/src/components/portal/Playground.tsx web/src/App.tsx
git commit -m "feat: Build-a-bot playground UI"
```

---

## Task 5: Manual verification

- [ ] **Step 1:** `npm run build && ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY node server/dist/index.js`
- [ ] **Step 2:** Open the playground. Pick "a witty math tutor" + `calculator`, task "what is (12 + 8) * 3?". Run. Confirm the transcript shows the agent's text, a `calculator` tool call, the result `60`, and a final answer. Try `github_lookup` with task "how many repos does Shay have?" and confirm it calls the tool and reports live numbers.
- [ ] **Step 3:** Hit Run several times quickly → confirm the rate limit (429) surfaces gracefully as an error line, not a crash.

(No commit — gate.)

---

## Done criteria

- `npm test -w @interview-bot/server` passes (adds `playground` suite: `safeCalc`, tools, loop, unknown-tool rejection).
- `npm run build` (root) passes.
- A visitor can configure a persona + ≤2 tools + a task and watch a real, capped agent loop run live with visible tool calls/results.
- Hard caps enforced: ≤2 tools, ≤4 iterations, 600 output tokens, task/persona length limits, separate per-IP rate limit + daily token budget; over-budget shows the resting message.
- Tools are sandboxed (pure arithmetic via `safeCalc` — no `eval`; word count; read-only GitHub). No arbitrary code/network.

## Self-review notes (author)

- **Spec coverage:** spec §7 (Build-a-bot playground): self-serve config, visible agent loop, sandboxed tools, dedicated endpoint isolated from the guide, own budget bucket + rate limit, hard caps, graceful resting state (reuses `budget_rest_message`).
- **Sandboxing:** `safeCalc` is a hand-written recursive-descent parser over a strict token whitelist — no `eval`/`Function`. `word_count` is pure. `github_lookup` is read-only via the Plan 4 cached service. No tool touches the filesystem, shell, or arbitrary network.
- **Cost control:** `claude-haiku-4-5`, 600 max output, ≤4 iterations, separate `playgroundGuard` (own daily token budget + 3/min/IP). Usage recorded on `done`.
- **Testability:** `safeCalc`, the pure tool `run`s, and the loop (fake client → structured events) are all unit-tested; unknown-tool names throw synchronously (tested). The live model call is verified manually in Task 5.
- **Type consistency:** `PlaygroundEvent` is defined identically server-side and web-side; the SSE event name equals `e.type` for every event, so the web parser switches on `type` directly.
