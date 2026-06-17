import { css } from "../../styled-system/css";
import type { Project } from "../../lib/api.js";
import ProjectGrid from "../portal/ProjectGrid.js";

interface Props {
  projects: Project[];
  onOpen: (p: Project) => void;
  /** Shown when the 3D view was unavailable vs. simply not used. */
  reason?: "reduced-motion" | "no-webgl" | "error" | "loading";
}

const heading = css({
  fontFamily: "mono",
  fontSize: "0.62rem",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "rgba(196,181,253,0.8)",
  display: "flex",
  alignItems: "center",
  gap: "2.5",
  mb: "2",
});

const rule = css({ height: "1px", width: "1.5rem", bg: "rgba(168,85,247,0.5)" });

const title = css({
  fontFamily: "display",
  fontSize: "clamp(2rem, 5vw, 2.6rem)",
  lineHeight: "1.05",
  color: "#fdfcff",
  mb: "2",
});

const note = css({
  fontFamily: "sans",
  fontSize: "0.82rem",
  color: "rgba(236,232,246,0.5)",
  maxW: "36rem",
  mb: "8",
});

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
      <div className={heading}>
        <span className={rule} />
        The work
      </div>
      <h2 className={title}>Project map</h2>
      <p className={note}>{REASON_NOTE[reason]}</p>
      <ProjectGrid projects={projects} onOpen={onOpen} />
    </div>
  );
}
