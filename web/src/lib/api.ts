export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SpecResponse {
  persona: {
    name: string;
    subject_name: string;
    suggested_questions: string[];
    [k: string]: unknown;
  };
  facts: { path: string; content: string }[];
}

export async function fetchSpec(): Promise<SpecResponse> {
  const res = await fetch("/api/spec");
  if (!res.ok) throw new Error("Failed to load spec");
  return res.json();
}

/**
 * Streams a chat response. Calls onDelta for each text chunk.
 * Resolves when the stream is done; rejects on transport error.
 */
export async function streamChat(
  messages: ChatMessage[],
  onDelta: (text: string) => void,
): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Request failed");
  }
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const evt of events) {
      const lines = evt.split("\n");
      const type = lines.find((l) => l.startsWith("event: "))?.slice(7);
      const dataLine = lines.find((l) => l.startsWith("data: "))?.slice(6);
      if (!dataLine) continue;
      const data = JSON.parse(dataLine);
      if (type === "delta") onDelta(data.text);
      else if (type === "error") throw new Error(data.message);
    }
  }
}
