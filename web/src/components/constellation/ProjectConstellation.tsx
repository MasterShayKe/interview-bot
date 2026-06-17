import { Suspense, lazy, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Project } from "../../lib/api.js";
import { CLUSTER_HEX } from "../../lib/constellation.js";
import { CLUSTER_LABEL } from "../../lib/clusters.js";
import CanvasErrorBoundary from "./CanvasErrorBoundary.js";
import ConstellationFallback from "./ConstellationFallback.js";
import * as s from "./entry.styles.js";

// 3D scene is code-split: three.js + drei stay out of the main bundle, and a
// chunk-load failure surfaces to the error boundary as the 2D fallback.
const ConstellationScene = lazy(() => import("./ConstellationScene.js"));

interface Props {
  projects: Project[];
  focusedId: string | null;
  onSelect: (p: Project) => void;
  onEnter: () => void;
}

/** Detects usable WebGL once at module scope. */
function detectWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}
const HAS_WEBGL = detectWebGL();

const CLUSTERS = ["ai", "trading", "community", "web"] as const;

export default function ProjectConstellation({
  projects,
  focusedId,
  onSelect,
  onEnter,
}: Props) {
  const prefersReduced = useReducedMotion() ?? false;
  // If the canvas ever throws, this latches true and we permanently switch to
  // the 2D map for this mount — never showing both at once.
  const [sceneFailed, setSceneFailed] = useState(false);
  // Render the 3D scene only when projects are loaded, WebGL is present, the
  // user hasn't asked for reduced motion, and the canvas hasn't failed.
  // Otherwise the 2D map. `use3D` also gates the hero copy below, so when the
  // scene fails the overlay headline disappears with it (no overlap).
  const use3D =
    HAS_WEBGL && !prefersReduced && projects.length > 0 && !sceneFailed;

  const fadeIn = useMemo(
    () =>
      prefersReduced
        ? {}
        : {
            initial: { opacity: 0, y: 18 },
            animate: { opacity: 1, y: 0 },
          },
    [prefersReduced],
  );

  return (
    <section className={s.stage} aria-label="Project constellation">
      {/* 3D layer (or static fallback grid) sits behind the overlay. */}
      <div className={s.canvasLayer}>
        {use3D ? (
          // On error the boundary flips `sceneFailed`, which re-renders this
          // branch into the 2D fallback below — so the boundary itself renders
          // nothing and the hero overlay and fallback can never coexist.
          <CanvasErrorBoundary
            fallback={null}
            onError={() => setSceneFailed(true)}
          >
            <Suspense
              fallback={
                <div className={s.loadingWrap}>
                  <span className={s.loadingPulse}>Charting the work…</span>
                </div>
              }
            >
              <ConstellationScene
                projects={projects}
                focusedId={focusedId}
                onSelect={onSelect}
                reducedMotion={prefersReduced}
              />
            </Suspense>
          </CanvasErrorBoundary>
        ) : (
          <div className={s.fallbackWrap}>
            <ConstellationFallback
              projects={projects}
              onOpen={onSelect}
              reason={
                sceneFailed
                  ? "error"
                  : projects.length === 0
                    ? "loading"
                    : prefersReduced
                      ? "reduced-motion"
                      : "no-webgl"
              }
            />
          </div>
        )}
      </div>

      {/* Text overlay — only meaningful over the 3D scene. With the 2D
          fallback the grid already carries its own heading, so we hide the
          big hero copy to avoid overlap and only keep the bottom cue. */}
      <div className={s.overlay}>
        <div>
          <div className={s.topRow}>
            <span className={s.topDot} />
            Shay Kopilevich · Projects Portal
          </div>

          {use3D && (
            <motion.div
              className={s.heroBlock}
              {...fadeIn}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className={s.kicker}>
                <span className={s.kickerRule} />
                Builder of AI agents &amp; systems
              </span>
              <h1 className={s.headline}>
                I build <span className={s.headlineAccent}>AI agents</span>
                <br />&amp; the systems around them
              </h1>
              <p className={s.subhead}>
                Seven systems I&apos;ve designed, built, and shipped — drifting in
                depth, grouped by what they do. Move your cursor to look around,
                drag to orbit, click a node to dive in, or ask the guide.
              </p>
            </motion.div>
          )}
        </div>

        <motion.div
          className={s.bottomRow}
          {...fadeIn}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className={s.legend}>
            {CLUSTERS.map((c) => (
              <span key={c} className={s.legendItem}>
                <span
                  className={s.legendSwatch}
                  style={{
                    background: CLUSTER_HEX[c],
                    boxShadow: `0 0 8px ${CLUSTER_HEX[c]}aa`,
                  }}
                />
                {CLUSTER_LABEL[c]}
              </span>
            ))}
          </div>

          <button
            type="button"
            className={s.enterCue}
            onClick={onEnter}
            aria-label="Scroll to explore the rest of the page"
          >
            Scroll to explore
            <motion.span
              className={s.enterChevron}
              aria-hidden
              animate={prefersReduced ? undefined : { y: [0, 5, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              ↓
            </motion.span>
          </button>
        </motion.div>
      </div>
    </section>
  );
}
