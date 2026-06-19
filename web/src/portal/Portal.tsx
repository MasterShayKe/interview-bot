import { useEffect, useRef, useState } from "react";
import { PortalScene } from "./scene.js";
import { projects, clusterLabel } from "./projects.js";
import { navigate } from "../lib/router.js";

export default function Portal() {
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const labelLayerRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<PortalScene | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    const host = canvasHostRef.current;
    const labels = labelLayerRef.current;
    if (!host || !labels) return;

    const scene = new PortalScene(host, labels, projects, {
      onHover: () => {},
      onSelect: (i) => setSelected(i),
    });
    scene.setDetailEl(detailRef.current);
    sceneRef.current = scene;
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Drive the scene's camera focus + planet emphasis from the selection.
  useEffect(() => {
    sceneRef.current?.focus(selected);
  }, [selected]);

  // Close the detail card on Escape.
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
          <div className="font-mono text-[0.62rem] uppercase tracking-[0.26em] text-accent/90">
            Projects Portal
          </div>
          <div className="mt-1 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-white/35">
            Drift the system · {projects.length} worlds · WebGL
          </div>
        </div>
        <button
          onClick={() => navigate("/")}
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 font-mono text-[0.62rem] uppercase tracking-[0.16em] text-white/60 backdrop-blur transition-colors hover:border-accent/40 hover:text-accent"
        >
          <span className="text-accent/60">←</span> Back to chat
        </button>
      </header>

      {/* Hint */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center">
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-white/30">
          {project ? "Esc / tap away to close" : "Tap a planet to explore a project"}
        </span>
      </div>

      {/* Tap-away backdrop while a planet is focused */}
      {project && (
        <button
          aria-label="Close project details"
          onClick={() => setSelected(null)}
          className="absolute inset-0 z-20 cursor-default"
        />
      )}

      {/* Detail card — positioned on the focused planet by the scene each frame */}
      <div
        ref={detailRef}
        className="portal-detail z-30 w-[min(86vw,22rem)]"
        style={{ opacity: 0, pointerEvents: "none" }}
      >
        {project && (
          <div className="portal-detail__caret animate-fade-up rounded-2xl border border-white/10 bg-ink-800/85 p-5 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[0.56rem] uppercase tracking-[0.2em] text-accent/90">
                  {clusterLabel[project.cluster]}
                </div>
                <h2 className="mt-1.5 font-display text-2xl leading-tight text-white">
                  {project.title}
                </h2>
                <div className="mt-0.5 text-[0.8rem] text-white/45">
                  {project.tagline}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="shrink-0 rounded-lg border border-white/10 px-2 py-0.5 font-mono text-xs text-white/50 transition-colors hover:border-accent/40 hover:text-accent"
                aria-label="Close project details"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-[0.85rem] leading-relaxed text-white/65">
              {project.summary}
            </p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {project.stack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 font-mono text-[0.62rem] tracking-wide text-white/55"
                >
                  {tech}
                </span>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2">
              {project.link.url ? (
                <a
                  href={project.link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.03] px-3 py-1.5 text-[0.78rem] text-white/70 transition-colors hover:border-accent/40 hover:text-accent"
                >
                  {project.link.label}
                  <span className="font-mono text-accent/60">↗</span>
                </a>
              ) : (
                <span className="rounded-lg border border-white/10 px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-white/35">
                  {project.link.label}
                </span>
              )}
              <button
                onClick={() =>
                  navigate("/", { ask: `Tell me more about ${project.title}.` })
                }
                className="group ml-auto flex items-center gap-1.5 rounded-lg border border-accent/25 bg-accent/[0.06] px-3 py-1.5 text-[0.78rem] font-medium text-white transition-all hover:border-accent/50 hover:bg-accent/[0.1]"
              >
                Ask the agent
                <span className="font-mono text-accent/60 transition-colors group-hover:text-accent">
                  →
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
