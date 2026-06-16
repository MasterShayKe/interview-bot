import { describe, it, expect } from "vitest";
import { safeCalc, PLAYGROUND_TOOLS } from "../src/playground.js";

describe("safeCalc", () => {
  it("evaluates arithmetic with precedence and parens", () => {
    expect(safeCalc("2 + 3 * 4")).toBe(14);
    expect(safeCalc("(2 + 3) * 4")).toBe(20);
    expect(safeCalc("10 / 4")).toBe(2.5);
  });
  it("rejects anything non-arithmetic", () => {
    expect(() => safeCalc("process.exit(1)")).toThrow();
    expect(() => safeCalc("2 ** 99999")).toThrow(); // ** not allowed
    expect(() => safeCalc("alert(1)")).toThrow();
  });
});

describe("PLAYGROUND_TOOLS registry", () => {
  it("exposes calculator, word_count, github_lookup with schemas", () => {
    const names = PLAYGROUND_TOOLS.map((t) => t.name).sort();
    expect(names).toContain("calculator");
    expect(names).toContain("word_count");
    expect(names).toContain("github_lookup");
    for (const t of PLAYGROUND_TOOLS) {
      expect(t.tool.name).toBe(t.name);
      expect(t.tool.input_schema.type).toBe("object");
      expect(typeof t.run).toBe("function");
    }
  });
  it("calculator run returns the computed value as text", async () => {
    const calc = PLAYGROUND_TOOLS.find((t) => t.name === "calculator")!;
    expect(await calc.run({ expression: "6 * 7" }, {} as any)).toBe("42");
  });
  it("word_count counts words", async () => {
    const wc = PLAYGROUND_TOOLS.find((t) => t.name === "word_count")!;
    expect(await wc.run({ text: "one two three" }, {} as any)).toContain("3");
  });
});
