import { useEffect, useRef } from "react";
import type { ChatMessage } from "../lib/api.js";
import Markdown from "./Markdown.js";

interface Props {
  messages: ChatMessage[];
  busy: boolean;
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

export default function ChatPanel({ messages, busy }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

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
      <div ref={endRef} />
    </div>
  );
}
