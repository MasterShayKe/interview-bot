import { useState } from "react";

interface Props {
  busy: boolean;
  onSend: (text: string) => void;
}

export default function Composer({ busy, onSend }: Props) {
  const [input, setInput] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSend(input);
        setInput("");
      }}
      className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 pl-5 backdrop-blur-sm transition-colors focus-within:border-accent/40 focus-within:bg-white/[0.05]"
    >
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        dir="auto"
        placeholder="Ask anything about Shay..."
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
  );
}
