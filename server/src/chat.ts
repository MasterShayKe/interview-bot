import Anthropic from "@anthropic-ai/sdk";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface StreamChatArgs {
  client: Anthropic;
  system: string;
  messages: ChatMessage[];
  maxTokens: number;
  onText: (delta: string) => void;
}

const MODEL = "claude-sonnet-4-6";

/** Streams a Claude response. Returns total tokens used (input + output). */
export async function streamChat(args: StreamChatArgs): Promise<number> {
  const stream = args.client.messages.stream({
    model: MODEL,
    max_tokens: args.maxTokens,
    system: [
      {
        type: "text",
        text: args.system,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: args.messages,
  });

  stream.on("text", (delta) => args.onText(delta));

  const final = await stream.finalMessage();
  const u = final.usage;
  return (
    (u.input_tokens ?? 0) +
    (u.output_tokens ?? 0) +
    (u.cache_creation_input_tokens ?? 0) +
    (u.cache_read_input_tokens ?? 0)
  );
}
