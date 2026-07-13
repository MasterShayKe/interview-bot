import { overview } from "../content/profile.js";
import { Reveal, SectionHeading } from "../components/ui.js";

export default function Overview() {
  return (
    <section id="overview" className="relative scroll-mt-24 border-y border-white/[0.05] bg-ink-950/40">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
        <SectionHeading eyebrow="Executive overview" title="A leader built to run global operations" />

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div className="space-y-5 text-[1.05rem] leading-relaxed text-paper-muted">
            <Reveal>
              <p>{overview.lead}</p>
            </Reveal>
            <Reveal delay={80}>
              <p>{overview.body}</p>
            </Reveal>
            <Reveal delay={160}>
              <p className="border-l-2 border-brass/50 pl-5 text-paper">
                {overview.differentiator}
              </p>
            </Reveal>
          </div>

          <Reveal delay={120}>
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.015] p-6">
              <span className="eyebrow text-paper-faint">Global footprint at NiCE</span>
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5">
                {overview.geography.map((g) => (
                  <li key={g} className="flex items-center gap-2 text-[0.9rem] text-paper/85">
                    <span className="h-1 w-1 rounded-full bg-accent/70" aria-hidden />
                    {g}
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-white/[0.06] pt-4">
                <p className="text-[0.82rem] leading-relaxed text-paper-faint">
                  Tier 1 Service Desk, Tier 2 regional teams, Tier 3 endpoint architects,
                  team leaders, and project managers - one operating model across eight
                  countries.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
