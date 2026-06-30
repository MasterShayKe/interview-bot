import path from "node:path";
import { fileURLToPath } from "node:url";
import { query } from "./db/pool.js";
import { loadSpec } from "./spec.js";
import {
  upsertUserByLinkedIn,
  getBotByUser,
  getBotByHandle,
  createBotForUser,
  updateBot,
  addKnowledge,
} from "./repo.js";
import type { Bot, KnowledgeKind } from "./model.js";

// spec/ lives at the repo root, two levels up from this module in both dev
// (server/src) and prod (server/dist).
const SPEC_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../spec",
);

const SHAY_HANDLE = "shay";

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

/**
 * Seeds the flagship Shay bot at /u/shay from the file-based spec/.
 *
 * Idempotent. With `force: false` (the startup default) it does nothing if a
 * bot already exists at the handle - so a redeploy never clobbers edits made
 * through the dashboard. With `force: true` (the CLI script) it always rewrites
 * the persona and knowledge from spec/.
 */
export async function seedShay(
  opts: { force?: boolean } = {},
): Promise<Bot | null> {
  const existing = await getBotByHandle(SHAY_HANDLE);
  if (existing && !opts.force) return existing;

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
    handle: SHAY_HANDLE,
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
    extraRules: [
      "It is fine and encouraged to note that this very chatbot is one of Shay's builds.",
    ],
  });

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

  return bot;
}
