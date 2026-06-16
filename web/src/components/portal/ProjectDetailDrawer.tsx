import { useEffect, useRef } from "react";
import type { Project, ProjectLink } from "../../lib/api.js";
import { CLUSTER_DOT, CLUSTER_LABEL, CLUSTER_TEXT } from "../../lib/clusters.js";

interface Props {
  project: Project | null;
  onClose: () => void;
}

function LinkRow({ link }: { link: ProjectLink }) {
  const isAnchor = (link.kind === "live" || link.kind === "repo") && link.url;
  const base =
    "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 font-mono text-[0.72rem]";

  if (isAnchor) {
    return (
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className={
          base +
          " border-accent/30 bg-accent/[0.08] text-accent transition-colors hover:bg-accent/[0.16]"
        }
      >
        <span aria-hidden>{link.kind === "live" ? "↗" : "{ }"}</span>
        {link.label}
      </a>
    );
  }

  return (
    <span className={base + " border-white/[0.08] bg-white/[0.03] text-white/45"}>
      <span aria-hidden>{link.kind === "private" ? "🔒" : "◆"}</span>
      {link.label}
    </span>
  );
}

export default function ProjectDetailDrawer({ project, onClose }: Props) {
  const asideRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!project) return;
    asideRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [project, onClose]);

  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside
        ref={asideRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`${project.name} details`}
        className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-accent/20 bg-[#0c0913] shadow-2xl animate-slide-in focus:outline-none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] p-6">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={"h-2 w-2 rounded-full " + CLUSTER_DOT[project.cluster]}
                aria-hidden
              />
              <span
                className={
                  "font-mono text-[0.6rem] uppercase tracking-[0.18em] " +
                  CLUSTER_TEXT[project.cluster]
                }
              >
                {CLUSTER_LABEL[project.cluster]}
              </span>
              {project.status === "live" && (
                <span className="ml-1 flex items-center gap-1 font-mono text-[0.55rem] uppercase tracking-[0.14em] text-live">
                  <span className="h-1.5 w-1.5 rounded-full bg-live shadow-[0_0_6px_var(--tw-shadow-color)] shadow-live" />
                  live
                </span>
              )}
            </div>
            <h2 className="mt-2 font-display text-3xl leading-tight text-white">
              {project.name}
            </h2>
            <p className="mt-1 text-sm text-white/55">{project.tagline}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg border border-white/10 p-1.5 text-white/40 transition-colors hover:border-accent/40 hover:text-accent"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-6 p-6">
          <p className="text-[0.9rem] leading-relaxed text-white/70">
            {project.detail}
          </p>

          <div>
            <div className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-accent/80">
              Stack
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {project.stack.map((s) => (
                <span
                  key={s}
                  className="rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[0.66rem] text-white/65"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {project.links.length > 0 && (
            <div>
              <div className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-accent/80">
                Links
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {project.links.map((l, i) => (
                  <LinkRow key={i} link={l} />
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
