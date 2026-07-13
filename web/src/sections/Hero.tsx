import { profile, targetRoles } from "../content/profile.js";
import { askTheAI, handleResume, resumeCtaLabel, scrollToId } from "../lib/actions.js";

const dossier = [
  { k: "Scale", v: "11,000 employees · 12,000 endpoints" },
  { k: "Team", v: "67-person global IT organization" },
  { k: "Delivery", v: "8 M&A integrations, zero downtime" },
  { k: "Budget", v: "$8M annual technology ownership" },
];

export default function Hero() {
  return (
    <section id="top" className="relative mx-auto max-w-6xl px-5 pb-16 pt-28 sm:px-8 sm:pt-32 lg:pb-24 lg:pt-40">
      <div className="grid items-center gap-12 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
        {/* Main */}
        <div>
          <div className="animate-fade-up flex flex-wrap items-center gap-x-3 gap-y-2" style={{ animationDelay: "40ms" }}>
            <span className="flex items-center gap-2 eyebrow text-paper-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_1px] shadow-accent/60" aria-hidden />
              {profile.location}
            </span>
            <span className="hidden h-3 w-px bg-white/15 sm:block" aria-hidden />
            <span className="eyebrow text-paper-faint">Available for leadership roles</span>
          </div>

          <h1 className="mt-6">
            <span className="font-display block text-[3.1rem] font-medium leading-[0.98] tracking-tight text-paper animate-fade-up sm:text-6xl lg:text-[4.6rem]" style={{ animationDelay: "120ms" }}>
              {profile.name}
            </span>
            <span className="font-display mt-3 block text-balance text-[1.55rem] font-normal leading-tight text-paper/80 animate-fade-up sm:text-3xl lg:text-[2.35rem]" style={{ animationDelay: "220ms" }}>
              Global IT Operations <span className="text-brass">&amp;</span> AI Transformation Leader
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-paper-muted animate-fade-up" style={{ animationDelay: "320ms" }}>
            {profile.tagline}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3 animate-fade-up" style={{ animationDelay: "420ms" }}>
            <button
              onClick={askTheAI}
              className="group inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-[0.92rem] font-medium text-ink transition-all hover:bg-accent-bright hover:shadow-[0_10px_40px_-12px] hover:shadow-accent/60"
            >
              Interview My AI
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
            <button
              onClick={() => scrollToId("impact")}
              className="inline-flex items-center rounded-xl border border-white/[0.14] px-5 py-3 text-[0.92rem] font-medium text-paper transition-colors hover:border-accent/50 hover:text-accent"
            >
              View My Impact
            </button>
            <button
              onClick={handleResume}
              className="inline-flex items-center gap-1.5 px-2 py-3 text-[0.86rem] text-paper-faint underline-offset-4 transition-colors hover:text-paper hover:underline"
            >
              {resumeCtaLabel}
            </button>
          </div>

          <p className="mt-8 max-w-md border-l border-brass/30 pl-4 text-[0.82rem] leading-relaxed text-paper-faint animate-fade-up" style={{ animationDelay: "520ms" }}>
            An interactive executive profile. The AI interview is grounded exclusively in
            verified professional experience.
          </p>
        </div>

        {/* Dossier panel */}
        <div className="animate-fade-up lg:justify-self-end" style={{ animationDelay: "360ms" }}>
          <div className="relative w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-900/60 p-6 backdrop-blur-sm sm:p-7">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-accent/10 blur-3xl" aria-hidden />
            <div className="flex items-center justify-between">
              <span className="eyebrow text-paper-faint">At a glance</span>
              <span className="font-display text-lg text-white/15">SK</span>
            </div>
            <dl className="mt-5 divide-y divide-white/[0.06]">
              {dossier.map((d) => (
                <div key={d.k} className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-paper-faint">{d.k}</dt>
                  <dd className="text-right text-[0.86rem] text-paper/85">{d.v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 border-t border-white/[0.06] pt-4">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-paper-faint">Targeting</span>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {targetRoles.slice(0, 4).map((r) => (
                  <span key={r} className="rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-1 text-[0.7rem] text-paper-muted">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
