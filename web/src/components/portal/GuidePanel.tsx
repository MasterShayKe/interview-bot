import ChatPanel from "../ChatPanel.js";
import Composer from "../Composer.js";
import type { ChatMessage, TokenUsage } from "../../lib/api.js";

interface Props {
  messages: ChatMessage[];
  busy: boolean;
  onSend: (text: string) => void;
  onClear: () => void;
  onFit: () => void;
  tokenUsage: Record<number, TokenUsage>;
  dynamicSuggestions: string[];
  /** Greeting suggestion chips shown before the conversation starts. */
  suggestions: string[];
  /** Render in full-height sticky mode (desktop) vs. fill-parent (mobile sheet). */
  variant?: "sticky" | "sheet";
  /** Optional close handler — renders an X (used by the mobile sheet). */
  onClose?: () => void;
}

function Chrome({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex h-9 items-center gap-2 border-b border-white/[0.08] bg-white/[0.025] px-3.5">
      <span className="h-[11px] w-[11px] rounded-full bg-[#ff5f56]" />
      <span className="h-[11px] w-[11px] rounded-full bg-[#ffbd2e]" />
      <span className="h-[11px] w-[11px] rounded-full bg-[#27c93f]" />
      <span className="ml-2 font-mono text-[0.68rem] font-semibold text-white/45">
        guide — ~/ask-about-shay
      </span>
      <span className="ml-auto flex items-center gap-1.5 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-live">
        <span className="h-1.5 w-1.5 rounded-full bg-live shadow-[0_0_8px_var(--tw-shadow-color)] shadow-live" />
        online
      </span>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close guide"
          className="ml-3 rounded-md p-1 text-white/40 transition-colors hover:text-accent"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

function Greeting({
  suggestions,
  onSend,
}: {
  suggestions: string[];
  onSend: (q: string) => void;
}) {
  return (
    <div className="font-mono text-[0.78rem] leading-relaxed text-white/70">
      <div className="text-white/35">$ ./guide --start</div>
      <div className="text-white/30">
        # grounded in Shay's real projects &amp; experience · powered by Claude
      </div>
      <div className="mt-3 rounded-xl border border-accent/25 bg-accent/[0.05] p-3.5 font-sans text-[0.9rem] leading-relaxed text-white/85">
        Welcome 👋 I'm Shay's guide. Ask me anything about what he's built or his
        career, or just poke around. What are you into?
      </div>
      {suggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.slice(0, 4).map((q) => (
            <button
              key={q}
              onClick={() => onSend(q)}
              className="rounded-lg border border-accent/40 bg-accent/[0.06] px-3 py-1.5 font-mono text-[0.7rem] font-semibold text-violet-200 transition-colors hover:bg-accent/[0.16]"
            >
              {q}
            </button>
          ))}
        </div>
      )}
      <div className="mt-5 italic text-white/25">
        # psst — this terminal hides a few commands. try `/help` ;)
      </div>
    </div>
  );
}

export default function GuidePanel({
  messages,
  busy,
  onSend,
  onClear,
  onFit,
  tokenUsage,
  dynamicSuggestions,
  suggestions,
  variant = "sticky",
  onClose,
}: Props) {
  const started = messages.length > 0;
  const shell =
    variant === "sticky"
      ? "sticky top-6 flex max-h-[calc(100vh-3rem)] min-h-[640px] flex-col"
      : "flex h-full flex-col";

  return (
    <div
      className={
        "overflow-hidden rounded-2xl border border-accent/25 bg-[#0c0913] shadow-[0_0_40px_-12px_rgba(168,85,247,0.35)] " +
        shell
      }
    >
      <Chrome onClose={onClose} />

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {started ? (
          <ChatPanel
            messages={messages}
            busy={busy}
            onSend={onSend}
            tokenUsage={tokenUsage}
            dynamicSuggestions={dynamicSuggestions}
          />
        ) : (
          <Greeting suggestions={suggestions} onSend={onSend} />
        )}
      </div>

      <div className="border-t border-white/[0.08] bg-[#0b0814] p-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-base font-bold text-accent">›</span>
          <div className="min-w-0 flex-1">
            <Composer busy={busy} onSend={onSend} onClear={onClear} onFit={onFit} />
          </div>
        </div>
      </div>
    </div>
  );
}
