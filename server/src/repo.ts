import { query, queryOne } from "./db/pool.js";
import { NEW_BOT_DEFAULTS } from "./persona-defaults.js";
import type {
  Bot,
  BotStatus,
  BotTheme,
  KnowledgeItem,
  KnowledgeKind,
  Pronouns,
  User,
} from "./model.js";

// --- row → domain mappers -------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapUser(r: any): User {
  return {
    id: r.id,
    linkedinSub: r.linkedin_sub,
    email: r.email,
    name: r.name,
    avatarUrl: r.avatar_url,
    createdAt: r.created_at,
  };
}

function mapBot(r: any): Bot {
  return {
    id: r.id,
    userId: r.user_id,
    handle: r.handle,
    status: r.status as BotStatus,
    displayName: r.display_name,
    subjectName: r.subject_name,
    pronouns: r.pronouns as Pronouns,
    tone: r.tone,
    languageRule: r.language_rule,
    contactEmail: r.contact_email,
    targetRole: r.target_role,
    budgetRestMessage: r.budget_rest_message,
    suggestedQuestions: r.suggested_questions as string[],
    extraRules: r.extra_rules as string[],
    theme: r.theme as BotTheme,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapItem(r: any): KnowledgeItem {
  return {
    id: r.id,
    botId: r.bot_id,
    kind: r.kind as KnowledgeKind,
    title: r.title,
    body: r.body,
    position: r.position,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// --- users ----------------------------------------------------------------

/** Upserts a user keyed on their LinkedIn subject id; returns the user row. */
export async function upsertUserByLinkedIn(profile: {
  sub: string;
  email: string | null;
  name: string;
  avatarUrl: string | null;
}): Promise<User> {
  const row = await queryOne(
    `INSERT INTO users (linkedin_sub, email, name, avatar_url)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (linkedin_sub) DO UPDATE
       SET email = EXCLUDED.email,
           name = EXCLUDED.name,
           avatar_url = EXCLUDED.avatar_url
     RETURNING *`,
    [profile.sub, profile.email, profile.name, profile.avatarUrl],
  );
  return mapUser(row);
}

export async function getUser(id: string): Promise<User | null> {
  const row = await queryOne("SELECT * FROM users WHERE id = $1", [id]);
  return row ? mapUser(row) : null;
}

// --- bots -----------------------------------------------------------------

export async function getBotByUser(userId: string): Promise<Bot | null> {
  const row = await queryOne("SELECT * FROM bots WHERE user_id = $1", [userId]);
  return row ? mapBot(row) : null;
}

export async function getBotByHandle(handle: string): Promise<Bot | null> {
  const row = await queryOne("SELECT * FROM bots WHERE handle = $1", [handle]);
  return row ? mapBot(row) : null;
}

/** Creates the user's single bot, seeded with sensible defaults. */
export async function createBotForUser(
  userId: string,
  seed: { displayName: string; subjectName: string; contactEmail: string },
): Promise<Bot> {
  const row = await queryOne(
    `INSERT INTO bots
       (user_id, display_name, subject_name, contact_email, tone, language_rule, budget_rest_message, suggested_questions)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
     RETURNING *`,
    [
      userId,
      seed.displayName,
      seed.subjectName,
      seed.contactEmail,
      NEW_BOT_DEFAULTS.tone,
      NEW_BOT_DEFAULTS.languageRule,
      NEW_BOT_DEFAULTS.budgetRestMessage,
      JSON.stringify(NEW_BOT_DEFAULTS.suggestedQuestions),
    ],
  );
  return mapBot(row);
}

// Columns the owner may patch, mapped to their domain keys.
const BOT_PATCH_COLUMNS: Record<string, string> = {
  handle: "handle",
  status: "status",
  displayName: "display_name",
  subjectName: "subject_name",
  pronouns: "pronouns",
  tone: "tone",
  languageRule: "language_rule",
  contactEmail: "contact_email",
  targetRole: "target_role",
  budgetRestMessage: "budget_rest_message",
  suggestedQuestions: "suggested_questions",
  extraRules: "extra_rules",
  theme: "theme",
};

const JSONB_KEYS = new Set([
  "pronouns",
  "suggestedQuestions",
  "extraRules",
  "theme",
]);

/** Patches whitelisted bot columns. Always bumps updated_at (busts the cache). */
export async function updateBot(
  botId: string,
  patch: Record<string, unknown>,
): Promise<Bot> {
  const sets: string[] = [];
  const params: unknown[] = [];
  let i = 1;
  for (const [key, col] of Object.entries(BOT_PATCH_COLUMNS)) {
    if (!(key in patch)) continue;
    if (JSONB_KEYS.has(key)) {
      sets.push(`${col} = $${i}::jsonb`);
      params.push(JSON.stringify(patch[key]));
    } else {
      sets.push(`${col} = $${i}`);
      params.push(patch[key]);
    }
    i++;
  }
  sets.push(`updated_at = now()`);
  params.push(botId);
  const row = await queryOne(
    `UPDATE bots SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
    params,
  );
  return mapBot(row);
}

export async function isHandleTaken(
  handle: string,
  exceptBotId: string,
): Promise<boolean> {
  const row = await queryOne(
    "SELECT 1 FROM bots WHERE handle = $1 AND id <> $2",
    [handle, exceptBotId],
  );
  return Boolean(row);
}

// --- knowledge items ------------------------------------------------------

export async function listKnowledge(botId: string): Promise<KnowledgeItem[]> {
  const rows = await query(
    "SELECT * FROM knowledge_items WHERE bot_id = $1 ORDER BY position, created_at",
    [botId],
  );
  return rows.map(mapItem);
}

export async function addKnowledge(
  botId: string,
  item: { kind: KnowledgeKind; title: string; body: string; position?: number },
): Promise<KnowledgeItem> {
  const position =
    item.position ??
    (
      (await queryOne<{ next: number }>(
        "SELECT COALESCE(MAX(position) + 1, 0) AS next FROM knowledge_items WHERE bot_id = $1",
        [botId],
      )) ?? { next: 0 }
    ).next;
  const row = await queryOne(
    `INSERT INTO knowledge_items (bot_id, kind, title, body, position)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [botId, item.kind, item.title, item.body, position],
  );
  await touchBot(botId);
  return mapItem(row);
}

export async function updateKnowledge(
  botId: string,
  itemId: string,
  patch: { kind?: KnowledgeKind; title?: string; body?: string },
): Promise<KnowledgeItem | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  let i = 1;
  for (const key of ["kind", "title", "body"] as const) {
    if (patch[key] === undefined) continue;
    sets.push(`${key} = $${i}`);
    params.push(patch[key]);
    i++;
  }
  if (!sets.length) return getKnowledge(botId, itemId);
  sets.push(`updated_at = now()`);
  params.push(itemId, botId);
  const row = await queryOne(
    `UPDATE knowledge_items SET ${sets.join(", ")}
     WHERE id = $${i} AND bot_id = $${i + 1} RETURNING *`,
    params,
  );
  if (!row) return null;
  await touchBot(botId);
  return mapItem(row);
}

async function getKnowledge(
  botId: string,
  itemId: string,
): Promise<KnowledgeItem | null> {
  const row = await queryOne(
    "SELECT * FROM knowledge_items WHERE id = $1 AND bot_id = $2",
    [itemId, botId],
  );
  return row ? mapItem(row) : null;
}

export async function deleteKnowledge(
  botId: string,
  itemId: string,
): Promise<boolean> {
  const rows = await query(
    "DELETE FROM knowledge_items WHERE id = $1 AND bot_id = $2 RETURNING id",
    [itemId, botId],
  );
  if (rows.length) await touchBot(botId);
  return rows.length > 0;
}

/** Persists a new ordering. Ids not belonging to the bot are ignored. */
export async function reorderKnowledge(
  botId: string,
  orderedIds: string[],
): Promise<void> {
  await query(
    `UPDATE knowledge_items AS k
       SET position = v.pos, updated_at = now()
     FROM (SELECT unnest($2::uuid[]) AS id,
                  generate_subscripts($2::uuid[], 1) AS pos) AS v
     WHERE k.id = v.id AND k.bot_id = $1`,
    [botId, orderedIds],
  );
  await touchBot(botId);
}

/** Bumps a bot's updated_at so the prompt cache invalidates after edits. */
async function touchBot(botId: string): Promise<void> {
  await query("UPDATE bots SET updated_at = now() WHERE id = $1", [botId]);
}
