import type { Project } from "../../lib/api.js";

interface Props {
  project: Project;
  onOpen: (p: Project) => void;
}

const STRIPE: Record<Project["cluster"], string> = {
  ai: "bg-cluster-ai",
  trading: "bg-cluster-trading",
  community: "bg-cluster-community",
  web: "bg-cluster-web",
};

export default function ProjectTile({ project, onOpen }: Props) {
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
      className="group relative cursor-pointer rounded-2xl border border-white/[0.08] bg-white/[0.025] py-3.5 pl-5 pr-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
    >
      <span
        aria-hidden
        className={
          "absolute left-0 top-3.5 bottom-3.5 w-[3px] rounded-full " +
          STRIPE[project.cluster]
        }
      />

      {isLive && (
        <span className="absolute right-3.5 top-3.5 flex items-center gap-1.5 font-mono text-[0.58rem] uppercase tracking-[0.12em] text-live">
          <span className="h-[5px] w-[5px] rounded-full bg-live shadow-[0_0_7px_var(--tw-shadow-color)] shadow-live" />
          live
        </span>
      )}

      <div className="pr-10 font-mono text-[0.84rem] font-semibold text-white">
        {project.name}
      </div>
      <p className="mt-1 text-[0.78rem] leading-snug text-white/55">
        {project.tagline}
      </p>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
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
