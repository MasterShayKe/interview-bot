import type { ProfileResponse, Stat } from "../../lib/api.js";

interface Props {
  hero: ProfileResponse["hero"];
  stats: Stat[];
}

export default function HeroTile({ hero, stats }: Props) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-[linear-gradient(150deg,#2a1247_0%,#160e26_65%)] p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl"
      />
      <div className="relative">
        {hero.kicker && (
          <div className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-violet-300">
            {hero.kicker}
          </div>
        )}
        <h1 className="mt-3 font-display text-[2.4rem] leading-[1.04] text-white sm:text-5xl">
          {hero.headline}
        </h1>
        <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-white/65">
          {hero.subhead}
        </p>

        {stats.length > 0 && (
          <div className="mt-7 flex flex-wrap gap-x-9 gap-y-4">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="font-display text-2xl text-white">{s.value}</div>
                <div className="mt-0.5 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-white/45">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
