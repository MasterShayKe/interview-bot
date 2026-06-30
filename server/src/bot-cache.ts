import { buildSystemPrompt, buildFitSystemPrompt } from "./prompt.js";
import { getBotByHandle, listKnowledge } from "./repo.js";
import type { Bot } from "./model.js";

interface CachedPrompts {
  bot: Bot;
  chatPrompt: string;
  fitPrompt: string;
  builtFrom: string; // bot.updatedAt the prompts were built from
}

// Compiled prompts are expensive-ish to assemble and rarely change, so cache
// them per bot and invalidate whenever the bot's updated_at advances (every
// persona/knowledge edit bumps it via repo.touchBot).
const cache = new Map<string, CachedPrompts>();

/**
 * Resolves a published bot by handle and returns its compiled chat + fit
 * prompts, rebuilding only when the bot changed. Returns null if there is no
 * published bot for the handle.
 */
export async function getPublishedBotPrompts(
  handle: string,
): Promise<CachedPrompts | null> {
  const bot = await getBotByHandle(handle);
  if (!bot || bot.status !== "published") return null;

  const hit = cache.get(bot.id);
  if (hit && hit.builtFrom === bot.updatedAt) return hit;

  const items = await listKnowledge(bot.id);
  const built: CachedPrompts = {
    bot,
    chatPrompt: buildSystemPrompt(bot, items),
    fitPrompt: buildFitSystemPrompt(bot, items),
    builtFrom: bot.updatedAt,
  };
  cache.set(bot.id, built);
  return built;
}

/** Drops a bot's cached prompts (e.g. after unpublish). */
export function invalidateBot(botId: string): void {
  cache.delete(botId);
}
