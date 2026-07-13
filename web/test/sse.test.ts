import { describe, it, expect, vi, afterEach } from "vitest";
import { streamChat } from "../src/lib/api.js";

afterEach(() => vi.restoreAllMocks());

describe("streamChat SSE parsing", () => {
  it("dispatches delta, suggestions, and done events in order", async () => {
    const body =
      'event: delta\ndata: {"text":"Hello "}\n\n' +
      'event: delta\ndata: {"text":"world"}\n\n' +
      'event: suggestions\ndata: {"questions":["a","b"]}\n\n' +
      'event: done\ndata: {"usage":{"inputTokens":10,"outputTokens":5,"cacheCreationTokens":0,"cacheReadTokens":0}}\n\n';
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new TextEncoder().encode(body));
        c.close();
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, body: stream, json: async () => ({}) } as unknown as Response)),
    );

    const deltas: string[] = [];
    let done = false;
    let suggestions: string[] = [];
    await streamChat({
      messages: [{ role: "user", content: "hi" }],
      onDelta: (d) => deltas.push(d),
      onDone: () => (done = true),
      onSuggestions: (q) => (suggestions = q),
    });

    expect(deltas.join("")).toBe("Hello world");
    expect(suggestions).toEqual(["a", "b"]);
    expect(done).toBe(true);
  });

  it("throws the server error message on an error event", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new TextEncoder().encode('event: error\ndata: {"message":"boom"}\n\n'));
        c.close();
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, body: stream, json: async () => ({}) } as unknown as Response)),
    );

    await expect(
      streamChat({ messages: [{ role: "user", content: "hi" }], onDelta: () => {} }),
    ).rejects.toThrow("boom");
  });
});
