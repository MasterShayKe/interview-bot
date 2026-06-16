import type { Project } from "../../lib/api.js";
import { CLUSTER_STRIPE } from "../../lib/clusters.js";

interface Props {
  project: Project;
  onOpen: (p: Project) => void;
  /** Stagger index for the entrance animation. */
  index?: number;
}

export default function ProjectTile({ project, onOpen, index = 0 }: Props) {
  const isLive = project.status === "live";
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(project)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(project);
        }
      }}
      style={{ animationDelay: `${index * 70}ms` }}
      className="group relative animate-fade-up cursor-pointer rounded-2xl border border-white/[0.08] bg-white/[0.025] py-4 pl-5 pr-4 transition-all duration-300 hover:-translate-y-1 hover:border-accent/45 hover:bg-white/[0.05] hover:shadow-[0_14px_40px_-18px_rgba(168,85,247,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(120%_80%_at_0%_0%,rgba(168,85,247,0.1),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <span
        aria-hidden
        className={
          "absolute left-0 top-3.5 bottom-3.5 w-[3px] rounded-full " +
          CLUSTER_STRIPE[project.cluster]
        }
      />

      {isLive && (
        <span className="absolute right-3.5 top-3.5 flex items-center gap-1.5 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-live">
          <span className="h-[5px] w-[5px] rounded-full bg-live shadow-[0_0_7px_var(--tw-shadow-color)] shadow-live" />
          live
        </span>
      )}

      <div className="relative flex items-center gap-2 pr-10 font-mono text-[0.84rem] font-semibold text-white">
        {project.name}
        <span
          aria-hidden
          className="text-accent opacity-0 -translate-x-1 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
        >
          →
        </span>
      </div>
      <p className="relative mt-1 text-[0.78rem] leading-snug text-white/55">
        {project.tagline}
      </p>

      <div className="relative mt-2.5 flex flex-wrap gap-1.5">
        {project.stack.slice(0, 4).map((s) => (
          <span
            key={s}
            className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 font-mono text-[0.6rem] text-white/55"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
