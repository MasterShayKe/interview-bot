import { useEffect, useRef, useState } from "react";
import { PortalScene } from "./scene.js";
import { projects, clusterLabel } from "./projects.js";
import type { SurfaceFact } from "./surface.js";
import { navigate } from "../lib/router.js";

export default function Portal() {
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const labelLayerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<PortalScene | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [fact, setFact] = useState<SurfaceFact | null>(null);

  useEffect(() => {
    const host = canvasHostRef.current;
    const labels = labelLayerRef.current;
    if (!host || !labels) return;

    const scene = new PortalScene(host, labels, projects, {
      onHover: () => {},
      onSelect: (i) => setSelected(i),
      onSurfaceFact: (f) => setFact(f),
    });
    sceneRef.current = scene;
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Enter/leave the star surface from the selection.
  useEffect(() => {
    sceneRef.current?.focus(selected);
    if (selected === null) setFact(null);
  }, [selected]);

  // Esc leaves the surface.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const project = selected !== null ? projects[selected] : null;

  return (
    <div className="fixed inset-0 overflow-hidden bg-ink text-white">
      {/* WebGL canvas mounts here */}
      <div ref={canvasHostRef} className="absolute inset-0" />
      {/* HTML labels positioned by the scene each frame */}
      <div
        ref={labelLayerRef}
        className="pointer-events-none absolute inset-0 z-10"
        aria-hidden
      />

      {/* Top bar */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between p-5 sm:p-7">
        <div className="leading-tight">
          {project ? (
            <>
              <div className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-accent/90">
                {clusterLabel[project.cluster]} · on the surface
              </div>
              <div className="mt-1 font-display text-2xl leading-none text-white">
                {project.title}
              </div>
            </>
          ) : (
            <>
              <div className="font-mono text-[0.62rem] uppercase tracking-[0.26em] text-accent/90">
                Projects Portal
              </div>
              <div className="mt-1 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-white/35">
                Drift the system · {projects.length} worlds · WebGL
              </div>
            </>
          )}
        </div>
        <button
          onClick={() => (project ? setSelected(null) : navigate("/"))}
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-white/60 backdrop-blur transition-colors hover:border-accent/40 hover:text-accent"
        >
          <span className="text-accent/60">←</span>
          {project ? "Leave star" : "Back to chat"}
        </button>
      </header>

      {/* Hint */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center">
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-white/30">
          {project
            ? "Drag to walk · reach a marker to learn · Esc to leave"
            : "Tap a planet to land and explore"}
        </span>
      </div>

      {/* Surface fact caption — what the astronaut has walked up to */}
      {project && (
        <div className="pointer-events-none absolute inset-x-0 bottom-12 z-30 flex justify-center px-4 sm:bottom-16">
          <div
            className={
              "w-[min(92vw,40rem)] rounded-2xl border border-white/10 bg-ink-800/80 p-4 backdrop-blur-xl transition-all duration-300 sm:p-5 " +
              (fact ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0")
            }
          >
            {fact && (
              <div className="pointer-events-auto">
                <div className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-accent/90">
                  {fact.tag}
                </div>
                <p className="mt-1.5 text-[0.9rem] leading-relaxed text-white/80">
                  {fact.text}
                </p>
                {fact.url && (
                  <a
                    href={fact.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/[0.06] px-3 py-1.5 text-[0.78rem] text-white transition-colors hover:border-accent/60 hover:bg-accent/[0.1]"
                  >
                    Open {fact.text}
                    <span className="font-mono text-accent/70">↗</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ask-the-agent hand-off, always available on the surface */}
      {project && (
        <button
          onClick={() => navigate("/", { ask: `Tell me more about ${project.title}.` })}
          className="group absolute bottom-12 right-4 z-30 hidden items-center gap-1.5 rounded-full border border-accent/25 bg-accent/[0.06] px-4 py-2 text-[0.78rem] font-medium text-white transition-all hover:border-accent/50 hover:bg-accent/[0.1] sm:bottom-16 sm:flex"
        >
          Ask the agent
          <span className="font-mono text-accent/60 transition-colors group-hover:text-accent">→</span>
        </button>
      )}
    </div>
  );
}
