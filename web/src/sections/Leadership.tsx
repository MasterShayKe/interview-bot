import { leadership } from "../content/profile.js";
import { Reveal, SectionHeading } from "../components/ui.js";

export default function Leadership() {
  return (
    <section id="leadership" className="relative scroll-mt-24 border-y border-white/[0.05] bg-ink-950/40">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <SectionHeading eyebrow="Leadership" title="Leading at global scale" lead={leadership.intro} />

        {/* Numbers band */}
        <Reveal delay={60}>
          <div className="mt-10 grid grid-cols-2 gap-y-8 border-y border-white/[0.07] py-8 sm:grid-cols-3 lg:grid-cols-5">
            {leadership.stats.map((s) => (
              <div key={s.label}>
                <div className="font-display tabular text-3xl font-medium text-paper sm:text-4xl">
                  {s.value}
                </div>
                <div className="mt-1.5 text-[0.78rem] text-paper-faint">{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Philosophy */}
        <Reveal delay={80}>
          <blockquote className="relative mt-14 max-w-3xl">
            <span className="font-display absolute -left-1 -top-7 text-6xl leading-none text-brass/30" aria-hidden>
              &ldquo;
            </span>
            <p className="font-display text-balance text-xl font-normal leading-snug text-paper/90 sm:text-2xl">
              {leadership.philosophy}
            </p>
          </blockquote>
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Org */}
          <Reveal>
            <span className="eyebrow text-paper-faint">The organization</span>
            <ul className="mt-4">
              {leadership.org.map((o) => (
                <li
                  key={o.tier}
                  className="flex items-center justify-between gap-4 border-b border-white/[0.06] py-3.5"
                >
                  <div>
                    <div className="text-[0.92rem] font-medium text-paper">{o.tier}</div>
                    <div className="text-[0.78rem] text-paper-faint">{o.detail}</div>
                  </div>
                  <div className="font-display tabular shrink-0 text-2xl font-medium text-accent">
                    {o.count}
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Rhythm + style */}
          <div className="space-y-9">
            <Reveal delay={80}>
              <span className="eyebrow text-paper-faint">Operating rhythm</span>
              <ul className="mt-4 grid gap-2">
                {leadership.rhythm.map((r) => (
                  <li key={r} className="flex items-start gap-2.5 text-[0.9rem] text-paper-muted">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-accent/70" aria-hidden>
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {r}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={140}>
              <span className="eyebrow text-paper-faint">How he leads</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {leadership.style.map((s) => (
                  <span key={s} className="rounded-full border border-white/[0.09] bg-white/[0.02] px-3 py-1.5 text-[0.78rem] text-paper-muted">
                    {s}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </div>

        {/* Recognition */}
        <Reveal delay={100}>
          <div className="mt-14 flex flex-col gap-4 rounded-2xl border border-brass/20 bg-brass/[0.04] p-6 sm:flex-row sm:items-center sm:gap-8">
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-brass/80">
              Senior leadership called him
            </span>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {leadership.recognition.map((r) => (
                <span key={r} className="font-display text-lg italic text-paper/90">
                  &ldquo;{r}&rdquo;
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
