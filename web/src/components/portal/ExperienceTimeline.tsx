import type { Job } from "../../lib/api.js";

interface Props {
  experience: Job[];
}

export default function ExperienceTimeline({ experience }: Props) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.8fr_1.4fr] lg:gap-12">
        {/* Intro column — keeps the right half from stranding whitespace */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <h3 className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-accent/80">
            Experience
          </h3>
          <p className="mt-3 font-display text-2xl leading-tight text-white sm:text-[1.7rem]">
            A track record of shipping real systems.
          </p>
          <p className="mt-3 max-w-sm text-[0.85rem] leading-relaxed text-white/55">
            From AI agents and trading bots to community platforms — built,
            deployed, and maintained in production.
          </p>
        </div>

        {/* Timeline column */}
        <div className="relative pl-6">
          <span
            aria-hidden
            className="absolute left-[5px] top-1.5 bottom-1.5 w-[2px] bg-[linear-gradient(to_bottom,#a855f7,#2c2340)]"
          />
          <ol className="space-y-6">
            {experience.map((job, i) => (
              <li
                key={i}
                className="group relative animate-fade-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span
                  aria-hidden
                  className="absolute -left-[1.45rem] top-1.5 h-[9px] w-[9px] rounded-full bg-accent shadow-[0_0_8px_var(--tw-shadow-color)] shadow-accent transition-transform duration-300 group-hover:scale-150"
                />
                <div className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-white/45">
                  {job.period}
                </div>
                <div className="mt-0.5 text-[0.95rem] font-semibold text-white transition-colors group-hover:text-accent">
                  {job.role}
                </div>
                <div className="text-[0.82rem] leading-snug text-white/55">
                  {job.org}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
