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
}

const MODEL = "claude-sonnet-4-6";

/** Streams a Claude response. Returns token usage breakdown. */
export async function streamChat(args: StreamChatArgs): Promise<TokenUsage> {
  const systemBlocks: Anthropic.Messages.TextBlockParam[] = [
    {
      type: "text",
      text: args.system,
      cache_control: { type: "ephemeral" },
    },
  ];

  if (args.visitorContext) {
    systemBlocks.push({ type: "text", text: args.visitorContext });
  }

  const stream = args.client.messages.stream({
    model: MODEL,
    max_tokens: args.maxTokens,
    system: systemBlocks,
    messages: args.messages,
  });

  stream.on("text", (delta) => args.onText(delta));

  const final = await stream.finalMessage();
  const u = final.usage;
  return {
    inputTokens: u.input_tokens ?? 0,
    outputTokens: u.output_tokens ?? 0,
    cacheCreationTokens: u.cache_creation_input_tokens ?? 0,
    cacheReadTokens: u.cache_read_input_tokens ?? 0,
  };
}
