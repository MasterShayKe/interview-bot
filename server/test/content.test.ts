import { describe, it, expect } from "vitest";
import { loadSpec } from "../src/spec.js";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SPEC_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../spec",
);

describe("real spec content", () => {
  const spec = loadSpec(SPEC_DIR);

  it("persona allows tasteful emoji (the no-emoji rule is gone)", () => {
    const rules = spec.persona.rules.join("\n").toLowerCase();
    expect(rules).not.toContain("do not use emojis");
  });

  it("persona tone reflects the portal voice", () => {
    expect(spec.persona.tone.toLowerCase()).toContain("playful");
  });

  it("includes the four new project fact files", () => {
    const paths = spec.facts.map((f) => f.path);
    expect(paths).toContain("projects/interview-bot.md");
    expect(paths).toContain("projects/discord-tcg-bot.md");
    expect(paths).toContain("projects/machlifot.md");
    expect(paths).toContain("projects/unboxing-finance.md");
  });

  it("new facts mention their defining keyword", () => {
    const byPath = Object.fromEntries(spec.facts.map((f) => [f.path, f.content]));
    expect(byPath["projects/interview-bot.md"]).toMatch(/SSE/i);
    expect(byPath["projects/discord-tcg-bot.md"]).toMatch(/discord/i);
    expect(byPath["projects/machlifot.md"]).toMatch(/substitute/i);
    expect(byPath["projects/unboxing-finance.md"]).toMatch(/Base44/i);
  });
});
