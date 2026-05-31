import { useEffect, useRef } from "react";
import type { ChatMessage } from "../lib/api.js";
import Markdown from "./Markdown.js";

interface Props {
  messages: ChatMessage[];
  busy: boolean;
  onSend: (text: string) => void;
}

const FOLLOWUPS: { label: string; q: string }[] = [
  { label: "Show AI projects", q: "Show me Shay's AI projects." },
  { label: "Explain NiCE impact", q: "Explain Shay's impact at NiCE." },
  { label: "Why hire Shay?", q: "Why should we hire Shay?" },
];

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

const BOOKING_URL = "https://calendly.com/shaykopi/1st-interview-with-shay";

function FollowUps({ onSend }: { onSend: (q: string) => void }) {
  return (
    <div className="mt-1 flex flex-wrap gap-2 pl-[2.875rem] animate-fade-up">
      {FOLLOWUPS.map((f) => (
        <button
          key={f.label}
          onClick={() => onSend(f.q)}
          className="rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-1.5 text-[0.8rem] text-white/60 transition-all duration-200 hover:border-accent/40 hover:bg-accent/[0.06] hover:text-white"
        >
          {f.label}
        </button>
      ))}
      <a
        href={BOOKING_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-[0.8rem] font-medium text-accent transition-all duration-200 hover:bg-accent/20"
      >
        Book an interview →
      </a>
    </div>
  );
}

export default function ChatPanel({ messages, busy, onSend }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const last = messages[messages.length - 1];
  const showFollowups =
    !busy && last?.role === "assistant" && last.content.length > 0;

  return (
    <div className="flex flex-col gap-7 py-4">
      {messages.map((m, i) => {
        const isLast = i === messages.length - 1;
        const streaming = isLast && m.role === "assistant" && busy;

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
          <div key={i} className="flex gap-3.5 animate-fade-up">
            <Avatar />
            <div dir="auto" className="min-w-0 flex-1 pt-0.5">
              {m.content ? <Markdown>{m.content}</Markdown> : <Thinking />}
              {streaming && m.content && (
                <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.18em] animate-blink bg-accent align-middle" />
              )}
            </div>
          </div>
        );
      })}

      {showFollowups && <FollowUps onSend={onSend} />}

      <div ref={endRef} />
    </div>
  );
}
