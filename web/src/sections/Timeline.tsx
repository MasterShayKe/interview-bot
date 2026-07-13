import { timeline } from "../content/profile.js";
import { Reveal, SectionHeading } from "../components/ui.js";

export default function Timeline() {
  return (
    <section id="experience" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 sm:px-8 lg:py-24">
      <SectionHeading
        eyebrow="Career"
        title="A decade of increasing operational scope"
        lead="Progression from front-line leadership to owning global IT operations, endpoint engineering, and enterprise transformation."
      />

      <ol className="mt-12 border-l border-white/[0.08] pl-6 sm:pl-8">
        {timeline.map((p, i) => (
          <Reveal as="li" key={p.company} delay={i * 70} className="relative pb-12 last:pb-0">
            <span
              className="absolute -left-[calc(1.5rem+5px)] top-1.5 h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_0_4px] shadow-ink ring-1 ring-accent/40 sm:-left-[calc(2rem+5px)]"
              aria-hidden
            />
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="font-display text-2xl font-medium text-paper">{p.company}</h3>
              <span className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-brass/90">
                {p.period}
              </span>
            </div>
            <div className="mt-0.5 text-[0.92rem] font-medium text-accent">{p.role}</div>
            <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-paper-muted">
              {p.summary}
            </p>
            <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
              {p.points.map((pt) => (
                <li key={pt} className="flex items-start gap-2 text-[0.85rem] text-paper/80">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brass/70" aria-hidden />
                  {pt}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}

        {/* Foundation */}
        <Reveal as="li" delay={40} className="relative">
          <span className="absolute -left-[calc(1.5rem+4px)] top-2 h-2 w-2 rounded-full bg-white/25 ring-1 ring-white/10 sm:-left-[calc(2rem+4px)]" aria-hidden />
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <h3 className="text-[0.95rem] font-medium text-paper-muted">
              Israel Defense Forces &middot; Infantry Platoon Commander
            </h3>
            <span className="font-mono text-[0.66rem] uppercase tracking-[0.12em] text-paper-faint">
              Foundation
            </span>
          </div>
          <p className="mt-1 text-[0.85rem] text-paper-faint">
            Led ~40 soldiers through training and operations. Graduated Officer Course with
            outstanding performance; discharged as Lieutenant.
          </p>
        </Reveal>
      </ol>
    </section>
  );
}
