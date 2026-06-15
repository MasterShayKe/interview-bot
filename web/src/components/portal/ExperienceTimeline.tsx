import type { Job } from "../../lib/api.js";

interface Props {
  experience: Job[];
}

export default function ExperienceTimeline({ experience }: Props) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
      <h3 className="mb-5 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-accent/80">
        Experience
      </h3>
      <div className="relative pl-6">
        <span
          aria-hidden
          className="absolute left-[5px] top-1.5 bottom-1.5 w-[2px] bg-[linear-gradient(to_bottom,#a855f7,#2c2340)]"
        />
        <ol className="space-y-5">
          {experience.map((job, i) => (
            <li key={i} className="relative">
              <span
                aria-hidden
                className="absolute -left-[1.45rem] top-1.5 h-[9px] w-[9px] rounded-full bg-accent shadow-[0_0_8px_var(--tw-shadow-color)] shadow-accent"
              />
              <div className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-white/45">
                {job.period}
              </div>
              <div className="mt-0.5 text-[0.92rem] font-semibold text-white">
                {job.role}
              </div>
              <div className="text-[0.8rem] leading-snug text-white/55">
                {job.org}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
