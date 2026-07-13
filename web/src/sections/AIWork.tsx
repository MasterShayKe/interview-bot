import { aiSystems } from "../content/profile.js";
import { Reveal, SectionHeading } from "../components/ui.js";

const production = aiSystems.filter((s) => s.category === "production");
const personal = aiSystems.filter((s) => s.category === "personal");

export default function AIWork() {
  return (
    <section id="ai" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28">
      <SectionHeading
        eyebrow="AI in production"
        title="He has already put AI in the core of the operation"
        lead="Not a slide. Production systems, running inside an 11,000-person enterprise - designed, shipped, and owned. This is the capability most IT leaders are still promising."
      />

      {/* Production, enterprise-scale AI: the headline proof */}
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {production.map((s, i) => (
          <Reveal
            key={s.title}
            delay={i * 70}
            className="flex flex-col rounded-2xl border border-accent/15 bg-accent/[0.03] p-6 transition-colors hover:border-accent/30"
          >
            <span className="self-start rounded-md border border-accent/30 bg-accent/[0.06] px-2 py-1 font-mono text-[0.56rem] uppercase tracking-[0.14em] text-accent">
              {s.tag}
            </span>
            <h3 className="font-display mt-4 text-xl font-medium leading-tight text-paper">
              {s.title}
            </h3>
            <p className="mt-2 text-[0.9rem] leading-relaxed text-paper-muted">{s.summary}</p>
            <ul className="mt-3.5 space-y-1.5 border-t border-white/[0.06] pt-3.5">
              {s.points.map((p) => (
                <li key={p} className="flex items-start gap-2 text-[0.82rem] leading-snug text-paper/80">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent/70" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>

      {/* Personal builds: proof of hands-on shipping, deliberately secondary */}
      <Reveal delay={80}>
        <div className="mt-12 border-t border-white/[0.06] pt-8">
          <p className="max-w-2xl text-[0.92rem] leading-relaxed text-paper-muted">
            <span className="font-medium text-paper">And he builds it himself.</span> Outside
            work, Shay architects and ships production-grade agent systems solo - the proof that
            the enterprise AI above is his craft, not a vendor&rsquo;s.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {personal.map((s, i) => (
              <Reveal key={s.title} delay={i * 60} className="rounded-xl border border-white/[0.07] bg-ink-900/40 p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h4 className="font-display text-[1.05rem] font-medium text-paper">{s.title}</h4>
                </div>
                <p className="mt-1.5 text-[0.82rem] leading-snug text-paper-faint">{s.summary}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
