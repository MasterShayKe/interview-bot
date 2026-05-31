import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadSpec } from "../src/spec.js";
import { buildSystemPrompt } from "../src/prompt.js";
import { streamChat } from "../src/chat.js";

const specDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../spec",
);
const system = buildSystemPrompt(loadSpec(specDir));
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const questions = [
  "What did Shay build at NiCE?",
  "Explain the 8-agent marketing system.",
  "What is Shay's tech stack?",
  "What are Shay's salary expectations?", // should decline
  "Did Shay work at Google?", // should say it has no such info
];

for (const q of questions) {
  process.stdout.write(`\n\n=== Q: ${q}\nA: `);
  await streamChat({
    client,
    system,
    messages: [{ role: "user", content: q }],
    maxTokens: 400,
    onText: (d) => process.stdout.write(d),
  });
}
process.stdout.write("\n");
