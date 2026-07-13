import { recommendations } from "../content/profile.js";
import { Reveal, SectionHeading } from "../components/ui.js";

// Renders only when real, attributed recommendations are supplied in profile.ts.
// Nothing is fabricated - the section is absent until populated.
export default function Recommendations() {
  if (recommendations.length === 0) return null;

  return (
    <section id="recommendations" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28">
      <SectionHeading eyebrow="Endorsements" title="What senior leaders say" />
      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        {recommendations.map((r, i) => (
          <Reveal key={r.name + i} delay={(i % 2) * 80} className="rounded-2xl border border-white/[0.08] bg-ink-900/40 p-7">
            <span className="font-display text-4xl leading-none text-brass/30" aria-hidden>
              &ldquo;
            </span>
            <blockquote className="mt-2 text-[1.02rem] leading-relaxed text-paper/90">
              {r.quote}
            </blockquote>
            <div className="mt-5 border-t border-white/[0.06] pt-4">
              <div className="text-[0.9rem] font-medium text-paper">{r.name}</div>
              <div className="text-[0.8rem] text-paper-faint">
                {r.title}, {r.company}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
