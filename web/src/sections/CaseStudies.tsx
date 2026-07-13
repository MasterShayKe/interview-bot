import { caseStudies, type CaseStudy } from "../content/profile.js";
import { Reveal, SectionHeading } from "../components/ui.js";

function Transformation({ c }: { c: CaseStudy }) {
  return (
    <Reveal className="rounded-2xl border border-white/[0.07] bg-ink-900/30 p-6 sm:p-9">
      {/* Header: title + headline metric */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[0.7rem] tracking-[0.14em] text-brass">{c.index}</span>
            <span className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-paper-faint">
              {c.domain}
            </span>
          </div>
          <h3 className="font-display mt-2 text-2xl font-medium text-paper sm:text-[1.7rem]">
            {c.title}
          </h3>
        </div>
        <div className="text-right">
          <div className="font-display tabular text-3xl font-medium leading-none text-accent sm:text-4xl">
            {c.headline.value}
          </div>
          <div className="mt-1.5 text-[0.68rem] uppercase tracking-[0.08em] text-paper-faint">
            {c.headline.label}
          </div>
        </div>
      </div>

      {/* Before -> After */}
      <div className="mt-7 grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-stretch md:gap-0">
        <div className="md:pr-8">
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-paper-faint">
            Before
          </span>
          <ul className="mt-3 space-y-2">
            {c.before.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-[0.88rem] leading-snug text-paper-faint">
                <span className="mt-2 h-px w-2.5 shrink-0 bg-paper-faint/60" aria-hidden />
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Divider + arrow */}
        <div className="relative flex items-center justify-center" aria-hidden>
          <span className="absolute hidden h-full w-px bg-gradient-to-b from-transparent via-white/10 to-transparent md:block" />
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-accent/25 bg-ink text-accent">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="rotate-90 md:rotate-0">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </div>

        <div className="md:pl-8">
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-accent/80">
            After
          </span>
          <ul className="mt-3 space-y-2">
            {c.after.map((a) => (
              <li key={a} className="flex items-start gap-2.5 text-[0.88rem] leading-snug text-paper/90">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-accent" aria-hidden>
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Reveal>
  );
}

export default function CaseStudies() {
  return (
    <section id="transformation" className="mx-auto max-w-5xl scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28">
      <SectionHeading
        eyebrow="Operational transformation"
        title="Before, and after Shay ran the operation"
        lead="Six programs he owned end to end. Each one moved a real operational number."
      />

      <div className="mt-12 space-y-5">
        {caseStudies.map((c) => (
          <Transformation key={c.index} c={c} />
        ))}
      </div>
    </section>
  );
}
