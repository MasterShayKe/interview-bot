import { useCallback, useEffect, useRef, useState } from "react";
import {
  streamChat,
  streamFit,
  type ChatMessage,
  type TokenUsage,
} from "../lib/api.js";
import { collectClientContext, getSessionDuration } from "../lib/device.js";
import { track } from "../lib/analytics.js";
import Markdown from "./Markdown.js";

const clientContext = collectClientContext();

interface ChatItem extends ChatMessage {
  error?: boolean;
}

const INPUT_ID = "interview-input";

export default function InterviewChat({
  suggestions,
  onOpenFit,
}: {
  suggestions: string[];
  onOpenFit: () => void;
}) {
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [status, setStatus] = useState(""); // aria-live announcement
  const lastQuestion = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  const started = items.length > 0;

  // Keep pinned to the bottom only when the user is already near it.
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  useEffect(() => {
    if (stick.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [items]);

  const runChat = useCallback(async (question: string) => {
    lastQuestion.current = question;
    const base: ChatItem[] = [...items.filter((m) => !m.error)];
    const history: ChatMessage[] = [
      ...base.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: question },
    ];
    stick.current = true;
    setFollowUps([]);
    setBusy(true);
    setStatus("Generating a grounded answer...");
    setItems([...base, { role: "user", content: question }, { role: "assistant", content: "" }]);
    try {
      await streamChat({
        messages: history,
        clientContext,
        sessionDurationSeconds: getSessionDuration(clientContext.sessionStartedAt),
        onDelta: (delta) => {
          setItems((cur) => {
            const copy = [...cur];
            const last = copy[copy.length - 1];
            copy[copy.length - 1] = { role: "assistant", content: last.content + delta };
            return copy;
          });
        },
        onDone: (_usage: TokenUsage) => {
          setStatus("Answer complete.");
          track("chat_completed", { depth: history.length });
        },
        onSuggestions: (qs) => setFollowUps(qs),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setItems((cur) => {
        const copy = [...cur];
        copy[copy.length - 1] = { role: "assistant", content: message, error: true };
        return copy;
      });
      setStatus("The answer could not be generated. You can retry.");
      track("chat_error", { message });
    } finally {
      setBusy(false);
    }
  }, [items]);

  function send(text: string, source: "input" | "suggestion") {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    if (!started) track("chat_started", { source });
    track("message_sent", { source, length: trimmed.length });
    setInput("");
    void runChat(trimmed);
  }

  function retry() {
    if (busy || !lastQuestion.current) return;
    const q = lastQuestion.current;
    setItems((cur) => cur.filter((m) => !m.error));
    void runChat(q);
  }

  function reset() {
    if (busy) return;
    setItems([]);
    setFollowUps([]);
    setStatus("Conversation cleared.");
    lastQuestion.current = null;
  }

  const promptRail = started ? followUps : suggestions;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-900/70 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full rounded-full bg-accent/40 animate-pulse-dot" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_1px] shadow-accent/60" />
          </span>
          <span className="eyebrow text-paper-muted">Shay&rsquo;s AI &middot; Grounded</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenFit}
            className="rounded-md px-2.5 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-paper-faint transition-colors hover:text-accent focus-visible:text-accent"
          >
            Fit&nbsp;check
          </button>
          {started && (
            <button
              onClick={reset}
              disabled={busy}
              className="rounded-md px-2.5 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-paper-faint transition-colors hover:text-accent focus-visible:text-accent disabled:opacity-40"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="max-h-[26rem] min-h-[13rem] overflow-y-auto px-4 py-5 sm:px-6"
      >
        {!started ? (
          <div className="flex h-full min-h-[11rem] flex-col justify-center py-2">
            <p className="max-w-md font-display text-xl leading-snug text-paper/90">
              Ask what you would ask in a first interview.
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-paper-muted">
              Answers are drawn only from Shay&rsquo;s verified experience. The agent
              distinguishes fact from interpretation, and says so when it does not know.
            </p>
          </div>
        ) : (
          <ul className="space-y-5">
            {items.map((m, i) => (
              <li
                key={i}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                {m.role === "user" ? (
                  <div className="max-w-[85%] rounded-2xl rounded-br-md border border-accent/25 bg-accent/[0.08] px-4 py-2.5 text-[0.95rem] text-paper">
                    {m.content}
                  </div>
                ) : (
                  <div className="max-w-[92%]">
                    {m.error ? (
                      <div className="rounded-xl border border-red-400/25 bg-red-500/[0.06] px-4 py-3">
                        <p className="text-sm text-red-200/90">{m.content}</p>
                        <button
                          onClick={retry}
                          className="mt-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-accent hover:text-accent-bright"
                        >
                          Retry
                        </button>
                      </div>
                    ) : m.content ? (
                      <Markdown>{m.content}</Markdown>
                    ) : (
                      <div className="flex items-center gap-1.5 py-1" aria-hidden>
                        <span className="thinking-dot" style={{ animationDelay: "0ms" }} />
                        <span className="thinking-dot" style={{ animationDelay: "160ms" }} />
                        <span className="thinking-dot" style={{ animationDelay: "320ms" }} />
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {status}
      </span>

      {/* Prompt rail */}
      {promptRail.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-white/[0.06] px-4 py-3 sm:px-5">
          {promptRail.slice(0, started ? 3 : 10).map((q) => (
            <button
              key={q}
              onClick={() => send(q, "suggestion")}
              disabled={busy}
              className="rounded-full border border-white/[0.1] bg-white/[0.02] px-3 py-1.5 text-[0.8rem] text-paper-muted transition-colors hover:border-accent/40 hover:text-paper focus-visible:border-accent/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input, "input");
        }}
        className="flex items-center gap-2 border-t border-white/[0.06] p-2.5 pl-4"
      >
        <label htmlFor={INPUT_ID} className="sr-only">
          Ask a question about Shay
        </label>
        <input
          id={INPUT_ID}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          dir="auto"
          enterKeyHint="send"
          autoComplete="off"
          placeholder="Ask about Shay's experience, leadership, or AI work..."
          className="min-w-0 flex-1 bg-transparent py-2 text-[0.95rem] text-paper placeholder:text-paper-faint focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send question"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-ink transition-all duration-200 enabled:hover:bg-accent-bright enabled:hover:shadow-[0_0_26px_-6px] enabled:hover:shadow-accent disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
        >
          {busy ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/40 border-t-ink" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
