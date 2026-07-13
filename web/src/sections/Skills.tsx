import { skills } from "../content/profile.js";
import { Reveal, SectionHeading } from "../components/ui.js";

export default function Skills() {
  return (
    <section id="skills" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28">
      <SectionHeading
        eyebrow="Capabilities"
        title="Depth across the operating stack"
        lead="From ITSM and endpoint engineering to identity, security, and hands-on AI. Engineering is a differentiating execution capability, not a job title."
      />

      <div className="mt-10 divide-y divide-white/[0.06] border-t border-white/[0.06]">
        {skills.map((g, i) => (
          <Reveal
            key={g.group}
            delay={i * 50}
            className="grid gap-4 py-6 sm:grid-cols-[minmax(0,15rem)_1fr] sm:gap-8"
          >
            <h3 className="font-display text-lg font-medium text-paper sm:pt-1">{g.group}</h3>
            <ul className="flex flex-wrap gap-2">
              {g.items.map((s) => (
                <li
                  key={s}
                  className="rounded-md border border-white/[0.08] bg-white/[0.015] px-2.5 py-1.5 text-[0.8rem] text-paper-muted transition-colors hover:border-accent/30 hover:text-paper"
                >
                  {s}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
