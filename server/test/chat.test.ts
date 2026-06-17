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
