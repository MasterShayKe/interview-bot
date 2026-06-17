import { describe, it, expect } from "vitest";
import { safeCalc, PLAYGROUND_TOOLS, runPlayground } from "../src/playground.js";

function fakeClient(scripted: any[]) {
  let i = 0;
  const calls: any[] = [];
  return {
    calls,
    messages: {
      create: async (params: any) => { calls.push(params); return scripted[i++]; },
    },
  };
}
const usage = { input_tokens: 5, output_tokens: 3 };

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

describe("runPlayground loop", () => {
  it("runs a tool then finishes, emitting structured events", async () => {
    const client = fakeClient([
      {
        content: [
          { type: "text", text: "I'll compute that." },
          { type: "tool_use", id: "t1", name: "calculator", input: { expression: "6 * 7" } },
        ],
        stop_reason: "tool_use",
        usage,
      },
      { content: [{ type: "text", text: "The answer is 42." }], stop_reason: "end_turn", usage },
    ]);
    const events: any[] = [];
    await runPlayground({
      client: client as any,
      persona: "a helpful math bot",
      toolNames: ["calculator"],
      task: "what is 6 times 7?",
      onEvent: (e) => events.push(e),
      getGitHub: async () => ({ available: false } as any),
    });
    const types = events.map((e) => e.type);
    expect(types).toContain("text");
    expect(types).toContain("tool_call");
    expect(types).toContain("tool_result");
    expect(types).toContain("done");
    const call = events.find((e) => e.type === "tool_call");
    expect(call.name).toBe("calculator");
    const result = events.find((e) => e.type === "tool_result");
    expect(result.output).toBe("42");
    // only the selected tool is offered to the model
    expect(client.calls[0].tools.map((t: any) => t.name)).toEqual(["calculator"]);
  });

  it("rejects unknown tool names", async () => {
    await expect(
      runPlayground({
        client: {} as any, persona: "x", toolNames: ["danger"], task: "hi",
        onEvent: () => {}, getGitHub: async () => ({ available: false } as any),
      }),
    ).rejects.toThrow(/unknown tool/i);
  });
});
