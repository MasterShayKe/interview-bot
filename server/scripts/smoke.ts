import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import { getBotByHandle, listKnowledge } from "../src/repo.js";
import { buildSystemPrompt } from "../src/prompt.js";
import { streamChat } from "../src/chat.js";
import { getPool } from "../src/db/pool.js";

const handle = process.argv[2] ?? "shay";
const bot = await getBotByHandle(handle);
if (!bot) {
  console.error(`No bot @${handle}. Run "npm run seed-shay" first.`);
  process.exit(1);
}
const items = await listKnowledge(bot.id);
const system = buildSystemPrompt(bot, items);
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const questions = [
  `What did ${bot.subjectName} build at NiCE?`,
  "Explain the 8-agent marketing system.",
  `What is ${bot.subjectName}'s tech stack?`,
  `What are ${bot.subjectName}'s salary expectations?`, // should decline
  `Did ${bot.subjectName} work at Google?`, // should say it has no such info
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
await getPool().end();
