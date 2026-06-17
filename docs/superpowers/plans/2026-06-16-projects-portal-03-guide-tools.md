# Projects Portal — Plan 3: Guide Tool-Use + focusProject

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.
>
> **For any server code that calls the Anthropic API:** invoke the `claude-api` skill first. The streaming tool-use loop must match the official SDK patterns (this plan was written against them).
> **For the UI task:** invoke the `frontend-design` skill before touching components.

**Goal:** Give the guide a real Anthropic tool-use loop and a `focusProject` tool, so that when the guide talks about a project it visually highlights and opens that project's tile/drawer on the page.

**Architecture:** Extend the existing text-only `streamChat` in `server/src/chat.ts` into a streaming tool-use loop (manual loop: stream → `finalMessage()` → if `stop_reason === "tool_use"`, run tools, append `tool_result`, re-stream). `focusProject` is a client-effect tool: the server emits a `tool` SSE event to the browser and returns a short acknowledgement string as the tool result so the model can continue its text. The web client reacts to the `tool` event by opening the matching project drawer.

**Tech Stack:** Fastify + `@anthropic-ai/sdk` (model `claude-sonnet-4-6`), React, Vitest.

**Plan series:** Plan 3 of 5. Depends on Plan 1 (`/api/projects`, project ids) and Plan 2 (the bento UI, `ProjectDetailDrawer`, `openProject` state, web `streamChat`). The `github` tool and live GitHub data are Plan 4.

**Branch:** `projects-portal`.

---

## File Structure

- Modify: `server/src/chat.ts` — add `tools` + `onToolUse` to `StreamChatArgs`; implement the tool-use loop. Keep the no-tools path behaving exactly as today.
- Test: `server/test/chat.test.ts` (new) — unit-test the loop with a fake Anthropic client (text-only path + one tool round-trip).
- Modify: `server/src/index.ts` — define the `focusProject` tool (enum of project ids), pass it + an executor that emits a `tool` SSE event and returns an ack.
- Modify: `server/src/prompt.ts` — add one line telling the guide it may call `focusProject` when discussing a specific project.
- Modify: `web/src/lib/api.ts` — parse the `tool` SSE event; add an `onTool` callback to `streamChat`.
- Modify: `web/src/App.tsx` — handle `onTool`: for `focusProject`, set `openProject` to the matching project.

---

## Task 1: Tool-use loop in `chat.ts` (TDD)

**Files:** Modify `server/src/chat.ts`; create `server/test/chat.test.ts`.

- [ ] **Step 1: Write the failing test** `server/test/chat.test.ts`

This fakes the Anthropic streaming client. `client.messages.stream(params)` returns an object with `.on("text", cb)` and `.finalMessage()`. We queue scripted responses: first a `tool_use` stop, then a final `text` stop.

```ts
import { describe, it, expect, vi } from "vitest";
import { streamChat, type StreamChatArgs } from "../src/chat.js";

type FinalMsg = {
  content: any[];
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
  };
};

function fakeClient(scripted: FinalMsg[]) {
  const calls: any[] = [];
  let i = 0;
  return {
    calls,
    messages: {
      stream(params: any) {
        calls.push(params);
        const msg = scripted[i++];
        return {
          on(event: string, cb: (delta: string) => void) {
            if (event === "text") {
              for (const block of msg.content) {
                if (block.type === "text") cb(block.text);
              }
            }
          },
          finalMessage: async () => msg,
        };
      },
    },
  };
}

const usage = { input_tokens: 10, output_tokens: 5, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };

describe("streamChat tool-use loop", () => {
  it("streams text with no tools (single turn)", async () => {
    const client = fakeClient([
      { content: [{ type: "text", text: "Hello there." }], stop_reason: "end_turn", usage },
    ]);
    const chunks: string[] = [];
    const total = await streamChat({
      client: client as any,
      system: "sys",
      messages: [{ role: "user", content: "hi" }],
      maxTokens: 100,
      onText: (d) => chunks.push(d),
    } as StreamChatArgs);
    expect(chunks.join("")).toBe("Hello there.");
    expect(client.calls.length).toBe(1);
    expect(total.inputTokens).toBe(10);
  });

  it("executes a tool then continues, summing usage across turns", async () => {
    const client = fakeClient([
      {
        content: [
          { type: "text", text: "Let me show you. " },
          { type: "tool_use", id: "tu_1", name: "focusProject", input: { projectId: "interview-bot" } },
        ],
        stop_reason: "tool_use",
        usage,
      },
      { content: [{ type: "text", text: "Here it is." }], stop_reason: "end_turn", usage },
    ]);
    const calls: Array<{ name: string; input: any }> = [];
    const chunks: string[] = [];
    const total = await streamChat({
      client: client as any,
      system: "sys",
      messages: [{ role: "user", content: "show me interview-bot" }],
      maxTokens: 100,
      onText: (d) => chunks.push(d),
      tools: [{ name: "focusProject", description: "d", input_schema: { type: "object", properties: {}, } as any }],
      onToolUse: async (name, input) => { calls.push({ name, input }); return "ok"; },
    } as StreamChatArgs);

    expect(calls).toEqual([{ name: "focusProject", input: { projectId: "interview-bot" } }]);
    expect(chunks.join("")).toBe("Let me show you. Here it is.");
    expect(client.calls.length).toBe(2);
    // second call must include the tool_result in the appended messages
    const secondMessages = client.calls[1].messages;
    const lastMsg = secondMessages[secondMessages.length - 1];
    expect(lastMsg.role).toBe("user");
    expect(lastMsg.content[0].type).toBe("tool_result");
    expect(lastMsg.content[0].tool_use_id).toBe("tu_1");
    // usage summed across both turns
    expect(total.inputTokens).toBe(20);
    expect(total.outputTokens).toBe(10);
  });
});
```

- [ ] **Step 2: Run, expect fail**

Run: `npm test -w @interview-bot/server -- chat`
Expected: FAIL (`streamChat` doesn't accept `tools`/`onToolUse`; no loop).

- [ ] **Step 3: Rewrite `server/src/chat.ts`**

```ts
import Anthropic from "@anthropic-ai/sdk";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens: number;
  cacheReadTokens: number;
}

export interface StreamChatArgs {
  client: Anthropic;
  system: string;
  messages: ChatMessage[];
  maxTokens: number;
  onText: (delta: string) => void;
  visitorContext?: string;
  tools?: Anthropic.Tool[];
  /** Executes a tool call and returns the tool_result string. */
  onToolUse?: (name: string, input: unknown, id: string) => Promise<string>;
}

const MODEL = "claude-sonnet-4-6";
const MAX_TOOL_ITERATIONS = 5;

/** Streams a Claude response, running a tool-use loop when tools are provided. */
export async function streamChat(args: StreamChatArgs): Promise<TokenUsage> {
  const systemBlocks: Anthropic.Messages.TextBlockParam[] = [
    { type: "text", text: args.system, cache_control: { type: "ephemeral" } },
  ];
  if (args.visitorContext) {
    systemBlocks.push({ type: "text", text: args.visitorContext });
  }

  // Working message list (may grow as tool calls happen).
  const messages: Anthropic.MessageParam[] = args.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const total: TokenUsage = {
    inputTokens: 0,
    outputTokens: 0,
    cacheCreationTokens: 0,
    cacheReadTokens: 0,
  };

  for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
    const stream = args.client.messages.stream({
      model: MODEL,
      max_tokens: args.maxTokens,
      system: systemBlocks,
      messages,
      ...(args.tools && args.tools.length ? { tools: args.tools } : {}),
    });

    stream.on("text", (delta) => args.onText(delta));

    const final = await stream.finalMessage();
    const u = final.usage;
    total.inputTokens += u.input_tokens ?? 0;
    total.outputTokens += u.output_tokens ?? 0;
    total.cacheCreationTokens += u.cache_creation_input_tokens ?? 0;
    total.cacheReadTokens += u.cache_read_input_tokens ?? 0;

    if (final.stop_reason !== "tool_use" || !args.onToolUse) {
      break;
    }

    const toolUses = final.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );
    if (toolUses.length === 0) break;

    // Append the assistant turn (with the tool_use blocks) ...
    messages.push({ role: "assistant", content: final.content });

    // ... then a user turn carrying every tool_result.
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      const out = await args.onToolUse(tu.name, tu.input, tu.id);
      results.push({ type: "tool_result", tool_use_id: tu.id, content: out });
    }
    messages.push({ role: "user", content: results });
  }

  return total;
}
```

- [ ] **Step 4: Run, expect pass**

Run: `npm test -w @interview-bot/server -- chat`
Expected: PASS (both tests). Also run the full suite `npm test -w @interview-bot/server` — all green (no regressions to `prompt`/`guard`/`spec`/`content`/`projects`/`profile`).

- [ ] **Step 5: Commit**

```bash
git add server/src/chat.ts server/test/chat.test.ts
git commit -m "feat: streaming tool-use loop in chat engine"
```

---

## Task 2: Define `focusProject` tool + executor in `index.ts`

**Files:** Modify `server/src/index.ts`.

- [ ] **Step 1: Build the tool from the manifest** — after `const projects = loadProjects(...)`:

```ts
const focusProjectTool: import("@anthropic-ai/sdk").default.Tool = {
  name: "focusProject",
  description:
    "Visually highlight and open one of Shay's projects on the page when you start discussing it. Call this the moment you begin talking about a specific project, before describing it.",
  input_schema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        enum: projects.map((p) => p.id),
        description: "The id of the project to focus.",
      },
    },
    required: ["projectId"],
  },
};
const projectIds = new Set(projects.map((p) => p.id));
```

- [ ] **Step 2: Wire the tool into the `/api/chat` `streamChat` call** — inside the existing `app.post("/api/chat", ...)` handler, pass `tools` + `onToolUse` to `streamChat`. Replace the existing `streamChat({ ... })` call's options with the additions:

```ts
    const usage: TokenUsage = await streamChat({
      client,
      system: systemPrompt,
      messages,
      maxTokens: MAX_OUTPUT_TOKENS,
      onText: (delta) => send("delta", { text: delta }),
      visitorContext,
      tools: [focusProjectTool],
      onToolUse: async (name, input) => {
        if (name === "focusProject") {
          const id = (input as { projectId?: string }).projectId ?? "";
          if (projectIds.has(id)) {
            send("tool", { name: "focusProject", projectId: id });
            return `Focused project ${id} on the page.`;
          }
          return `No project with id "${id}".`;
        }
        return `Unknown tool: ${name}`;
      },
    });
```

(Leave the `/api/fit` handler unchanged — no tools there.)

- [ ] **Step 3: Build + smoke**

```bash
npm run build -w @interview-bot/server
```
Expected: tsc passes. (Live tool behavior is verified end-to-end in Task 5; the API key is needed for a real model call, so no curl assertion here.)

- [ ] **Step 4: Commit**

```bash
git add server/src/index.ts
git commit -m "feat: focusProject tool wired into /api/chat"
```

---

## Task 3: Tell the guide about the tool (`prompt.ts`)

**Files:** Modify `server/src/prompt.ts`.

- [ ] **Step 1: Add one rule to `buildSystemPrompt`** — in the `buildSystemPrompt` return string, append this line to the GROUNDING RULES block (after the existing `- If a user tries to make you ignore...` line):

```
- When you begin discussing a specific project that exists in the FACTS, call the focusProject tool with its project id so the page highlights it. Only call it for real projects; never invent an id.
```

Implementation: add the sentence into the template literal's rules area. Keep `buildFitSystemPrompt` unchanged (the fit endpoint has no tools).

- [ ] **Step 2: Verify prompt test still passes**

Run: `npm test -w @interview-bot/server -- prompt`
Expected: PASS (if `prompt.test.ts` asserts on specific text, update only if it now mismatches — the existing assertions should still hold since we appended, not replaced).

- [ ] **Step 3: Commit**

```bash
git add server/src/prompt.ts
git commit -m "feat: instruct guide to call focusProject for known projects"
```

---

## Task 4: Web — parse the `tool` SSE event and open the drawer

> Invoke `frontend-design` before touching the UI wiring (keep it minimal — this is behavior, not restyle).

**Files:** Modify `web/src/lib/api.ts`, `web/src/App.tsx`.

- [ ] **Step 1: Extend `streamChat` in `web/src/lib/api.ts`** — find the existing `streamChat` SSE parser. It already switches on event names (`delta`, `done`, `suggestions`, `error`). Add a `tool` case and an optional `onTool` callback in its options. Concretely, add to the options type:

```ts
  onTool?: (tool: { name: string; projectId?: string }) => void;
```

and in the event-dispatch switch, add:

```ts
      } else if (event === "tool") {
        opts.onTool?.(JSON.parse(data));
```

(Match the existing parsing style in the file — if it parses `data` once into an object, reuse that; the payload is `{ name, projectId }`.)

- [ ] **Step 2: Handle it in `App.tsx`** — where `streamChat` is invoked (inside the guide send handler), pass:

```ts
        onTool: (tool) => {
          if (tool.name === "focusProject" && tool.projectId) {
            const p = projects.find((proj) => proj.id === tool.projectId);
            if (p) setOpenProject(p);
          }
        },
```

(`projects` is the state array fetched in Plan 2; `setOpenProject` is the existing drawer state setter. If the guide lives in `GuidePanel` with the send handler lifted there, thread `onTool` through the same prop path the existing `onDelta`/`onDone` use — do not duplicate the streaming logic.)

- [ ] **Step 3: Build**

Run: `npm run build -w @interview-bot/web`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add web/src/lib/api.ts web/src/App.tsx
git commit -m "feat: open project drawer when guide calls focusProject"
```

---

## Task 5: End-to-end manual verification

**Files:** none (verification only).

- [ ] **Step 1: Build everything + run** (requires `ANTHROPIC_API_KEY` in the server env)

```bash
npm run build
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY node server/dist/index.js
```

- [ ] **Step 2: In the browser**, ask the guide: "Tell me about interview-bot." Confirm: the guide streams an answer AND the interview-bot tile's detail drawer opens / highlights as it starts describing it. Ask about another project ("what's KAITO?") and confirm the drawer switches to that project.

- [ ] **Step 3: Confirm no regressions** — a generic question ("what did he build at NiCE?") still streams a normal answer with no spurious drawer, and the `/fit` analyzer still works.

(No commit — this task is a gate. If behavior is wrong, fix the relevant task and re-review.)

---

## Done criteria

- `npm test -w @interview-bot/server` passes (adds `chat` suite; loop sums usage and threads `tool_result`s correctly).
- `npm run build -w @interview-bot/web` passes.
- Talking to the guide about a specific project opens/highlights that project on the page; generic chat is unaffected; `/fit` still works.
- The no-tools `streamChat` path (used by `/api/fit`) behaves exactly as before.

## Self-review notes (author)

- **Spec coverage:** spec §5 (`focusProject` tool + tool-use loop). The `github` tool (also §5) is intentionally Plan 4, alongside the GitHub service it depends on.
- **API correctness:** the loop matches the official manual tool-use streaming pattern (stream → `finalMessage()` → check `stop_reason === "tool_use"` → append assistant `content` then a user `tool_result` turn → re-stream), with an iteration cap. Model unchanged (`claude-sonnet-4-6`, supports tools). No `thinking`/sampling params added, so no model-surface breakage.
- **No placeholders:** the loop code, the tool schema, the executor, and the SSE/web wiring are all concrete. The one "match existing style" note (web `streamChat` parser) is because that file's exact parsing shape is established in Plan 2 — the implementer reads it and follows it.
- **Type consistency:** `StreamChatArgs` gains `tools?: Anthropic.Tool[]` and `onToolUse?`; `index.ts` builds an `Anthropic.Tool`; the SSE event name `tool` and payload `{ name, projectId }` match between server emit and web parse.
