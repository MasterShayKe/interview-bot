import { describe, it, expect } from "vitest";
import { buildSystemPrompt, buildFitSystemPrompt } from "../src/prompt.js";
import type { Bot, KnowledgeItem } from "../src/model.js";

const bot: Bot = {
  id: "bot-1",
  userId: "user-1",
  handle: "test",
  status: "published",
  displayName: "Test Rep",
  subjectName: "Test Person",
  pronouns: { subject: "she", object: "her", possessive: "her" },
  tone: "Professional and concise.",
  languageRule: "Respond in the user's language.",
  contactEmail: "test@example.com",
  targetRole: "AI Lead",
  budgetRestMessage: "Resting.",
  suggestedQuestions: ["What did Test Person build?"],
  extraRules: ["Mention the demo is self-built."],
  theme: {},
  createdAt: "now",
  updatedAt: "now",
};

const items: KnowledgeItem[] = [
  {
    id: "k1",
    botId: "bot-1",
    kind: "cv",
    title: "Summary",
    body: "Test Person is an engineer.",
    position: 0,
    createdAt: "now",
    updatedAt: "now",
  },
  {
    id: "k2",
    botId: "bot-1",
    kind: "project",
    title: "Demo",
    body: "Built a demo app.",
    position: 1,
    createdAt: "now",
    updatedAt: "now",
  },
];

describe("buildSystemPrompt", () => {
  it("includes persona, tone, language rule, and the default grounding rules", () => {
    const p = buildSystemPrompt(bot, items);
    expect(p).toContain("Test Person");
    expect(p).toContain("Professional and concise.");
    expect(p).toContain("Respond in the user's language.");
    expect(p).toMatch(/Answer ONLY using the FACTS/i);
    expect(p).toMatch(/never invent/i);
  });

  it("templates the target role and the bot's own extra rules", () => {
    const p = buildSystemPrompt(bot, items);
    expect(p).toContain("AI Lead");
    expect(p).toContain("Mention the demo is self-built.");
  });

  it("uses the bot's configured pronouns", () => {
    const p = buildSystemPrompt(bot, items);
    expect(p).toContain('"Test Person" or "she"');
  });

  it("embeds the content of every knowledge item", () => {
    const p = buildSystemPrompt(bot, items);
    expect(p).toContain("Test Person is an engineer.");
    expect(p).toContain("Built a demo app.");
  });

  it("speaks ABOUT the subject in third person (no impersonation directive)", () => {
    const p = buildSystemPrompt(bot, items);
    expect(p).toMatch(/third person/i);
  });
});

describe("buildFitSystemPrompt", () => {
  it("embeds every knowledge item so the analysis stays grounded", () => {
    const p = buildFitSystemPrompt(bot, items);
    expect(p).toContain("Test Person is an engineer.");
    expect(p).toContain("Built a demo app.");
  });

  it("instructs the required report structure and honest gaps", () => {
    const p = buildFitSystemPrompt(bot, items);
    expect(p).toContain("**Verdict:**");
    expect(p).toContain("**Where she matches**");
    expect(p).toContain("**Honest gaps**");
    expect(p).toMatch(/never invent/i);
  });
});
