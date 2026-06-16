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
