import type { Project } from "../../lib/api.js";
import ProjectGrid from "../portal/ProjectGrid.js";

interface Props {
  projects: Project[];
  onOpen: (p: Project) => void;
  /** Shown when the 3D view was unavailable vs. simply not used. */
  reason?: "reduced-motion" | "no-webgl" | "error" | "loading";
}

const REASON_NOTE: Record<NonNullable<Props["reason"]>, string> = {
  "reduced-motion":
    "Showing the static project map (you have reduced motion enabled). Every project is here — open any to dive in.",
  "no-webgl":
    "Your browser couldn't start the 3D view, so here's the full project map instead. Open any to dive in.",
  error:
    "The 3D view hit a snag, so here's the full project map. Open any to dive in.",
  loading: "Click any project to dive in, or ask the guide to walk you through one.",
};

/**
 * Non-3D fallback: a clean 2D project map reusing the Tailwind ProjectGrid.
 * Rendered whenever WebGL/R3F is unavailable, reduced-motion is preferred, or
 * the canvas errors — projects are ALWAYS reachable here.
 */
export default function ConstellationFallback({
  projects,
  onOpen,
  reason = "loading",
}: Props) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2.5 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[rgba(196,181,253,0.8)]">
        <span className="h-px w-6 bg-[rgba(168,85,247,0.5)]" />
        The work
      </div>
      <h2 className="mb-2 font-display text-[clamp(2rem,5vw,2.6rem)] leading-[1.05] text-[#fdfcff]">
        Project map
      </h2>
      <p className="mb-8 max-w-[36rem] font-sans text-[0.82rem] text-[rgba(236,232,246,0.5)]">
        {REASON_NOTE[reason]}
      </p>
      <ProjectGrid projects={projects} onOpen={onOpen} />
    </div>
  );
}
