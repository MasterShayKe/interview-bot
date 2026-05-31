import { describe, it, expect } from "vitest";
import { loadSpec } from "../src/spec.js";
import { fileURLToPath } from "node:url";
import path from "node:path";

const fixtureDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures/spec",
);

describe("loadSpec", () => {
  it("parses persona fields", () => {
    const spec = loadSpec(fixtureDir);
    expect(spec.persona.subject_name).toBe("Test Person");
    expect(spec.persona.contact_email).toBe("test@example.com");
    expect(spec.persona.rules).toContain("Answer only from the facts.");
    expect(spec.persona.suggested_questions).toHaveLength(1);
  });

  it("reads all facts files recursively, sorted by path", () => {
    const spec = loadSpec(fixtureDir);
    const paths = spec.facts.map((f) => f.path);
    expect(paths).toEqual(["cv.md", "projects/demo.md"]);
    expect(spec.facts[0].content).toContain("software engineer");
    expect(spec.facts[1].content).toContain("demo app");
  });
});
