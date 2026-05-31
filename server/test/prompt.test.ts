import { describe, it, expect } from "vitest";
import { buildSystemPrompt } from "../src/prompt.js";
import type { Spec } from "../src/spec.js";

const spec: Spec = {
  persona: {
    name: "Test Rep",
    subject_name: "Test Person",
    tone: "Professional and concise.",
    language_rule: "Respond in the user's language.",
    contact_email: "test@example.com",
    budget_rest_message: "Resting.",
    rules: ["Answer only from the facts.", "Never invent dates."],
    suggested_questions: ["What did Test Person build?"],
  },
  facts: [
    { path: "cv.md", content: "Test Person is an engineer." },
    { path: "projects/demo.md", content: "Built a demo app." },
  ],
};

describe("buildSystemPrompt", () => {
  it("includes persona, tone, language rule, and every rule", () => {
    const p = buildSystemPrompt(spec);
    expect(p).toContain("Test Person");
    expect(p).toContain("Professional and concise.");
    expect(p).toContain("Respond in the user's language.");
    expect(p).toContain("Answer only from the facts.");
    expect(p).toContain("Never invent dates.");
  });

  it("embeds the content of every fact file", () => {
    const p = buildSystemPrompt(spec);
    expect(p).toContain("Test Person is an engineer.");
    expect(p).toContain("Built a demo app.");
  });

  it("speaks ABOUT the subject in third person (no impersonation directive)", () => {
    const p = buildSystemPrompt(spec);
    expect(p).toMatch(/third person/i);
  });
});
