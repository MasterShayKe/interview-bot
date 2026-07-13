import { caseStudies, type CaseStudy } from "../content/profile.js";
import { Reveal, SectionHeading } from "../components/ui.js";

function Row({ label, children }: { label: string; children: string | string[] }) {
  return (
    <div className="mt-3.5">
      <span className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-paper-faint">
        {label}
      </span>
      {Array.isArray(children) ? (
        <ul className="mt-1 space-y-1">
          {children.map((c) => (
            <li key={c} className="flex gap-2 text-[0.86rem] leading-snug text-paper-muted">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent/60" aria-hidden />
              {c}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-[0.88rem] leading-snug text-paper/85">{children}</p>
      )}
    </div>
  );
}

function Card({ c, i }: { c: CaseStudy; i: number }) {
  return (
    <Reveal
      delay={(i % 2) * 90}
      className="group flex flex-col rounded-2xl border border-white/[0.07] bg-ink-900/40 p-6 transition-colors hover:border-accent/25 sm:p-7"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="font-mono text-[0.7rem] tracking-[0.14em] text-brass">{c.index}</span>
          <span className="ml-3 font-mono text-[0.58rem] uppercase tracking-[0.16em] text-paper-faint">
            {c.domain}
          </span>
        </div>
        <div className="text-right">
          <div className="font-display tabular text-2xl font-medium leading-none text-accent">
            {c.headline.value}
          </div>
          <div className="mt-1 text-[0.66rem] uppercase tracking-[0.08em] text-paper-faint">
            {c.headline.label}
          </div>
        </div>
      </div>

      <h3 className="font-display mt-4 text-xl font-medium leading-tight text-paper">
        {c.title}
      </h3>

      <Row label="Challenge">{c.challenge}</Row>
      <Row label="Action">{c.action}</Row>
      <Row label="Outcome">{c.outcomes}</Row>
    </Reveal>
  );
}

export default function CaseStudies() {
  return (
    <section id="transformation" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 sm:px-8 lg:py-24">
      <SectionHeading
        eyebrow="Operational transformation at scale"
        title="Programs that changed how the operation runs"
        lead="Not initiatives on a slide - shipped systems with measured outcomes across endpoint engineering, production AI, service delivery, and security."
      />

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        {caseStudies.map((c, i) => (
          <Card key={c.index} c={c} i={i} />
        ))}
      </div>
    </section>
  );
}
