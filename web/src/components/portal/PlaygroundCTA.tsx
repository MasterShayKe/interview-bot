interface Props {
  onOpen: () => void;
}

/**
 * Prominent CTA that opens the live Playground modal — replaces the
 * old standalone "Live Sandbox" tile in the grid.
 */
export default function PlaygroundCTA({ onOpen }: Props) {
  return (
    <button
      onClick={onOpen}
      className="group relative w-full overflow-hidden rounded-2xl border border-accent/30 bg-[linear-gradient(135deg,rgba(168,85,247,0.14),rgba(124,58,237,0.06)_60%,transparent)] p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-accent/55 hover:shadow-[0_18px_50px_-18px_rgba(168,85,247,0.7)] sm:p-7"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl transition-opacity duration-300 group-hover:opacity-80"
      />
      <div className="relative flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
        <div className="max-w-xl">
          <div className="mb-2 flex items-center gap-2 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-accent/80">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent" />
            Live sandbox
          </div>
          <div className="font-display text-2xl leading-tight text-white sm:text-[1.7rem]">
            🧪 Build a bot — run a mini-agent live
          </div>
          <p className="mt-2 text-[0.85rem] leading-relaxed text-white/60">
            Pick a persona, choose tools, give it a task — and watch a real agent
            loop run with visible tool calls and results.
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {["calculator", "word_count", "github_lookup"].map((tool) => (
              <span
                key={tool}
                className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 font-mono text-[0.62rem] text-white/40"
              >
                {tool}
              </span>
            ))}
            <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 font-mono text-[0.62rem] text-white/25">
              claude-haiku-4-5 · ≤4 iterations
            </span>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-2 rounded-full border border-accent/40 bg-accent/[0.12] px-5 py-2.5 font-mono text-[0.75rem] font-semibold text-accent transition-all duration-200 group-hover:bg-accent group-hover:text-white">
          Launch
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:translate-x-0.5">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </span>
      </div>
    </button>
  );
}
