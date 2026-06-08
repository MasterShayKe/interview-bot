interface Props {
  suggestions: string[];
  onPick: (q: string) => void;
  onOpenFit: () => void;
}

export default function IntroCard({ suggestions, onPick, onOpenFit }: Props) {
  return (
    <div className="flex flex-1 flex-col justify-center py-10">
      <div className="animate-fade-up [animation-delay:40ms]">
        <div className="font-mono text-[0.72rem] uppercase tracking-[0.26em] text-accent/90">
          AI Implementation Lead
        </div>
        <div className="mt-1.5 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-white/35">
          Enterprise IT · Agents · Automation
        </div>
      </div>

      <h1 className="mt-6 font-display text-[2.9rem] leading-[0.96] text-white sm:text-6xl animate-fade-up [animation-delay:120ms]">
        Ask me anything about
        <br />
        <span className="italic text-accent">Shay Kopilevich</span>.
      </h1>

      <p className="mt-6 max-w-md text-[0.98rem] leading-relaxed text-white/55 animate-fade-up [animation-delay:230ms]">
        I'm an AI agent Shay engineered to represent him. I answer strictly from
        his verified background - his experience, the things he has built, and
        how he works. Ask away:
      </p>

      <div className="mt-8 flex flex-wrap gap-2.5 animate-fade-up [animation-delay:340ms]">
        {suggestions.map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="group rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-white/70 transition-all duration-200 hover:border-accent/40 hover:bg-accent/[0.06] hover:text-white"
          >
            <span className="mr-1.5 font-mono text-accent/45 transition-colors group-hover:text-accent">
              →
            </span>
            {q}
          </button>
        ))}
      </div>

      <button
        onClick={onOpenFit}
        className="group mt-5 flex items-center gap-3 self-start rounded-2xl border border-accent/25 bg-accent/[0.06] px-5 py-3 text-left transition-all duration-200 hover:border-accent/50 hover:bg-accent/[0.1] animate-fade-up [animation-delay:440ms]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/[0.08] font-mono text-accent">
          ⌕
        </span>
        <span className="leading-tight">
          <span className="block text-sm font-medium text-white">
            Hiring for a role? Paste the job description
          </span>
          <span className="block font-mono text-[0.66rem] uppercase tracking-[0.14em] text-white/40">
            Get a grounded fit report in seconds
          </span>
        </span>
        <span className="ml-1 font-mono text-accent/50 transition-colors group-hover:text-accent">
          →
        </span>
      </button>
    </div>
  );
}
