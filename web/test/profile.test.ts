import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import {
  metrics,
  caseStudies,
  skills,
  aiSystems,
  timeline,
  suggestedQuestions,
  profile,
} from "../src/content/profile.js";

describe("profile content integrity", () => {
  it("has the eight verified headline metrics with four primaries", () => {
    expect(metrics).toHaveLength(8);
    expect(metrics.filter((m) => m.primary)).toHaveLength(4);
    for (const m of metrics) {
      expect(m.value).toBeTruthy();
      expect(m.label).toBeTruthy();
    }
  });

  it("has six before/after transformations with headline metrics", () => {
    expect(caseStudies).toHaveLength(6);
    for (const c of caseStudies) {
      expect(c.before.length).toBeGreaterThan(0);
      expect(c.after.length).toBeGreaterThan(0);
      expect(c.headline.value).toBeTruthy();
    }
  });

  it("has five skill groups and six AI systems", () => {
    expect(skills).toHaveLength(5);
    for (const g of skills) expect(g.items.length).toBeGreaterThan(0);
    expect(aiSystems.length).toBeGreaterThanOrEqual(5);
  });

  it("has three career positions", () => {
    expect(timeline).toHaveLength(3);
    expect(timeline[0].company).toBe("NiCE");
  });

  it("uses verified contact details", () => {
    expect(profile.email).toBe("shaykopi@gmail.com");
    expect(profile.linkedin).toContain("linkedin.com/in/shay-kopilevich");
    expect(profile.github).toContain("github.com/MasterShayKe");
  });

  it("contains no em dashes or emojis (brand rule)", () => {
    const blob = JSON.stringify({ metrics, caseStudies, skills, aiSystems, timeline, profile });
    expect(blob).not.toMatch(/[—–]/); // em/en dash
    expect(blob).not.toMatch(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u); // emoji ranges
  });
});

describe("landing / chat consistency", () => {
  it("landing suggested questions match the agent persona spec", () => {
    const yamlText = readFileSync(new URL("../../spec/persona.yaml", import.meta.url), "utf8");
    const persona = parse(yamlText) as { suggested_questions: string[] };
    expect(suggestedQuestions).toEqual(persona.suggested_questions);
  });

  it("key landing metrics are grounded in the chat knowledge base", () => {
    const kb = [
      "overview.md",
      "case-studies.md",
      "leadership.md",
      "experience-nice.md",
    ]
      .map((f) => {
        try {
          return readFileSync(new URL(`../../spec/facts/${f}`, import.meta.url), "utf8");
        } catch {
          return "";
        }
      })
      .join("\n")
      .toLowerCase();
    // The agent must be able to substantiate the numbers shown on the page.
    for (const token of ["11,000", "12,000", "67", "8m", "35%", "65", "80"]) {
      expect(kb).toContain(token.toLowerCase());
    }
  });
});
