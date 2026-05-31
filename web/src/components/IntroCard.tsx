interface Props {
  suggestions: string[];
  onPick: (q: string) => void;
}

export default function IntroCard({ suggestions, onPick }: Props) {
  return (
    <div className="flex flex-1 flex-col justify-center py-10">
      <span className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-accent/80 animate-fade-up [animation-delay:40ms]">
        AI Representative
      </span>

      <h1 className="mt-5 font-display text-[2.9rem] leading-[0.96] text-white sm:text-6xl animate-fade-up [animation-delay:120ms]">
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
    </div>
  );
}
