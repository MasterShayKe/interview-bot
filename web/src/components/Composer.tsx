import { useEffect, useRef, useState } from "react";

interface Command {
  cmd: string;
  label: string;
  question: string | null;
}

const COMMANDS: Command[] = [
  { cmd: "/help", label: "What topics can you cover?", question: "What can you help me with? What topics are you able to cover?" },
  { cmd: "/cv", label: "Walk through Shay's career", question: "Walk me through Shay's work history and career progression." },
  { cmd: "/projects", label: "Show main AI projects", question: "What are Shay's main AI projects? Give me an overview." },
  { cmd: "/about", label: "Shay in a nutshell", question: "Give me a quick overview of who Shay is and what makes him stand out." },
  { cmd: "/clear", label: "Clear conversation", question: null },
];

interface Props {
  busy: boolean;
  onSend: (text: string) => void;
  onClear: () => void;
}

export default function Composer({ busy, onSend, onClear }: Props) {
  const [input, setInput] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isSlash = input.startsWith("/");
  const filter = input.slice(1).toLowerCase();
  const filtered = isSlash
    ? COMMANDS.filter((c) => c.cmd.slice(1).startsWith(filter))
    : [];
  const showPalette = isSlash && filtered.length > 0 && !busy;

  // Reset selection when filter changes
  useEffect(() => setSelectedIdx(0), [filter]);

  function runCommand(cmd: Command) {
    setInput("");
    if (cmd.question) {
      onSend(cmd.question);
    } else {
      onClear();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || busy) return;

    if (isSlash) {
      const exact = COMMANDS.find((c) => c.cmd === trimmed.toLowerCase());
      if (exact) { runCommand(exact); return; }
      if (filtered.length === 1) { runCommand(filtered[0]); return; }
    }

    onSend(trimmed);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showPalette) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Tab") {
      e.preventDefault();
      const target = filtered[selectedIdx];
      if (target) setInput(target.cmd);
    } else if (e.key === "Escape") {
      setInput("");
    }
  }

  return (
    <div className="relative">
      {showPalette && (
        <div className="absolute bottom-full mb-2 w-full overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0c0c] shadow-2xl">
          {filtered.map((cmd, i) => (
            <button
              key={cmd.cmd}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); runCommand(cmd); }}
              onMouseEnter={() => setSelectedIdx(i)}
              className={
                "flex w-full items-center gap-4 px-4 py-2.5 text-left transition-colors " +
                (i === selectedIdx ? "bg-accent/[0.06]" : "hover:bg-white/[0.02]")
              }
            >
              <span className="w-20 shrink-0 font-mono text-[0.78rem] text-accent">
                {cmd.cmd}
              </span>
              <span className="font-mono text-[0.72rem] text-white/40">{cmd.label}</span>
            </button>
          ))}
          <div className="border-t border-white/[0.05] px-4 py-1.5">
            <span className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-white/15">
              ↑↓ navigate · tab complete · enter run
            </span>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 pl-5 backdrop-blur-sm transition-colors focus-within:border-accent/40 focus-within:bg-white/[0.05]"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          dir="auto"
          placeholder="Ask anything about Shay... or type /"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-[0.95rem] text-white placeholder:text-white/30 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-ink transition-all duration-200 enabled:hover:shadow-[0_0_28px_-6px] enabled:hover:shadow-accent disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
        >
          {busy ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
