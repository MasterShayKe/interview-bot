import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage } from "./chat.js";

const SUGGESTIONS_MODEL = "claude-haiku-4-5-20251001";

/** Generates up to 3 short follow-up questions for the last exchange. */
export async function generateFollowUps(
  client: Anthropic,
  messages: ChatMessage[],
  subjectName: string,
): Promise<string[]> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const lastAssistant = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");
  if (!lastUser || !lastAssistant) return [];

  const result = await client.messages.create({
    model: SUGGESTIONS_MODEL,
    max_tokens: 150,
    system: `You generate follow-up questions for a chatbot about ${subjectName}. Return ONLY a valid JSON array of exactly 3 short questions (under 8 words each). No markdown, no extra text.`,
    messages: [
      {
        role: "user",
        content: `Question asked: "${lastUser.content}"\nAnswer given: "${lastAssistant.content.slice(0, 400)}"\n\nGenerate 3 follow-up questions.`,
      },
    ],
  });

  const text =
    result.content[0].type === "text" ? result.content[0].text.trim() : "[]";
  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
}
