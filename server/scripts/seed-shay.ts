import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runMigrations } from "../src/db/migrate.js";
import { getPool, query } from "../src/db/pool.js";
import { loadSpec } from "../src/spec.js";
import {
  upsertUserByLinkedIn,
  getBotByUser,
  createBotForUser,
  updateBot,
  addKnowledge,
} from "../src/repo.js";
import type { KnowledgeKind } from "../src/model.js";

// Migrates the original file-based spec/ into the database as Shay's account,
// so his bot becomes the flagship published demo at /u/shay. Idempotent.

const SPEC_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../spec",
);

function kindForPath(p: string): KnowledgeKind {
  if (p.startsWith("projects/")) return "project";
  if (p === "cv.md") return "cv";
  if (p === "experience.md") return "experience";
  if (p === "personal.md") return "personal";
  return "custom";
}

function titleFor(p: string, content: string): string {
  const heading = content.split("\n").find((l) => l.startsWith("# "));
  if (heading) return heading.replace(/^#\s+/, "").trim();
  return path.basename(p, ".md");
}

async function main() {
  await runMigrations();
  const spec = loadSpec(SPEC_DIR);

  const user = await upsertUserByLinkedIn({
    sub: "seed:shay",
    email: spec.persona.contact_email,
    name: spec.persona.subject_name,
    avatarUrl: null,
  });

  let bot = await getBotByUser(user.id);
  if (!bot) {
    bot = await createBotForUser(user.id, {
      displayName: spec.persona.name,
      subjectName: spec.persona.subject_name,
      contactEmail: spec.persona.contact_email,
    });
  }

  bot = await updateBot(bot.id, {
    handle: "shay",
    status: "published",
    displayName: spec.persona.name,
    subjectName: spec.persona.subject_name,
    pronouns: { subject: "he", object: "him", possessive: "his" },
    tone: spec.persona.tone,
    languageRule: spec.persona.language_rule,
    contactEmail: spec.persona.contact_email,
    targetRole: "AI Implementation Lead (Enterprise IT, Agents & Automation)",
    budgetRestMessage: spec.persona.budget_rest_message,
    suggestedQuestions: spec.persona.suggested_questions,
    // The generic grounding/format rules now live in platform defaults; only
    // Shay's meta flourish stays as a per-bot rule.
    extraRules: [
      "It is fine and encouraged to note that this very chatbot is one of Shay's builds.",
    ],
  });

  // Replace knowledge wholesale so re-running stays idempotent.
  await query("DELETE FROM knowledge_items WHERE bot_id = $1", [bot.id]);
  let position = 0;
  for (const fact of spec.facts) {
    await addKnowledge(bot.id, {
      kind: kindForPath(fact.path),
      title: titleFor(fact.path, fact.content),
      body: fact.content.trim(),
      position: position++,
    });
  }

  console.log(
    `[seed] Shay seeded: bot ${bot.id} (@${bot.handle}, ${spec.facts.length} knowledge items, published)`,
  );
  await getPool().end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
