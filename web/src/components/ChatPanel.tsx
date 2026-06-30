import { useEffect, useRef } from "react";
import type { ChatMessage, TokenUsage } from "../lib/api.js";
import Markdown from "./Markdown.js";

interface Props {
  subjectName: string;
  messages: ChatMessage[];
  busy: boolean;
  onSend: (text: string) => void;
  tokenUsage?: Record<number, TokenUsage>;
  dynamicSuggestions?: string[];
}

function staticFollowups(name: string): { label: string; q: string }[] {
  return [
    { label: "Show projects", q: `Show me ${name}'s projects.` },
    { label: "Experience highlights", q: `What are ${name}'s experience highlights?` },
    { label: `Why hire ${name}?`, q: `Why should we hire ${name}?` },
  ];
}

function Avatar() {
  return (
    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent/25 bg-accent/[0.08]">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#C6F24E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" />
      </svg>
    </div>
  );
}

function Thinking() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      <span className="thinking-dot" />
      <span className="thinking-dot" style={{ animationDelay: "0.16s" }} />
      <span className="thinking-dot" style={{ animationDelay: "0.32s" }} />
    </div>
  );
}

function TokenBadge({ usage }: { usage: TokenUsage }) {
  const cacheHit = usage.cacheReadTokens > 0;
  const totalTokens =
    usage.inputTokens +
    usage.outputTokens +
    usage.cacheCreationTokens +
    usage.cacheReadTokens;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 pl-[2.875rem]">
      <span
        className={
          "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.12em] " +
          (cacheHit
            ? "border-accent/25 bg-accent/[0.06] text-accent/70"
            : "border-white/10 bg-white/[0.02] text-white/35")
        }
      >
        <span
          className={
            "h-1.5 w-1.5 rounded-full " +
            (cacheHit ? "bg-accent/70" : "bg-white/25")
          }
        />
        {cacheHit ? "cache hit" : "cache miss"}
      </span>

      {cacheHit && (
        <span className="font-mono text-[0.6rem] text-white/25">
          {usage.cacheReadTokens.toLocaleString()} tokens from cache
        </span>
      )}

      <span className="font-mono text-[0.6rem] text-white/20">
        {totalTokens.toLocaleString()} total
      </span>
    </div>
  );
}

function FollowUps({
  onSend,
  items,
}: {
  onSend: (q: string) => void;
  items: { label: string; q: string }[];
}) {
  return (
    <div className="mt-1 flex flex-wrap gap-2 pl-[2.875rem] animate-fade-up">
      {items.map((f) => (
        <button
          key={f.label}
          onClick={() => onSend(f.q)}
          className="rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-1.5 text-[0.8rem] text-white/60 transition-all duration-200 hover:border-accent/40 hover:bg-accent/[0.06] hover:text-white"
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

export default function ChatPanel({
  subjectName,
  messages,
  busy,
  onSend,
  tokenUsage = {},
  dynamicSuggestions = [],
}: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const last = messages[messages.length - 1];
  const showFollowups =
    !busy && last?.role === "assistant" && last.content.length > 0;

  const followupItems =
    dynamicSuggestions.length > 0
      ? dynamicSuggestions.map((q) => ({ label: q, q }))
      : staticFollowups(subjectName);

  return (
    <div className="flex flex-col gap-7 py-4">
      {messages.map((m, i) => {
        const isLast = i === messages.length - 1;
        const streaming = isLast && m.role === "assistant" && busy;
        const usage = tokenUsage[i];

        if (m.role === "user") {
          return (
            <div key={i} className="flex justify-end animate-fade-up">
              <div
                dir="auto"
                className="max-w-[82%] rounded-2xl rounded-br-md border border-accent/20 bg-accent/[0.08] px-4 py-2.5 text-[0.95rem] leading-relaxed text-white"
              >
                {m.content}
              </div>
            </div>
          );
        }

        return (
          <div key={i} className="flex flex-col animate-fade-up">
            <div className="flex gap-3.5">
              <Avatar />
              <div dir="auto" className="min-w-0 flex-1 pt-0.5">
                {m.content ? <Markdown>{m.content}</Markdown> : <Thinking />}
                {streaming && m.content && (
                  <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.18em] animate-blink bg-accent align-middle" />
                )}
              </div>
            </div>
            {usage && !streaming && <TokenBadge usage={usage} />}
          </div>
        );
      })}

      {showFollowups && <FollowUps onSend={onSend} items={followupItems} />}

      <div ref={endRef} />
    </div>
  );
}
