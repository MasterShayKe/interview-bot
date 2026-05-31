import { useEffect, useState } from "react";
import { fetchSpec, type SpecResponse } from "../lib/api.js";

function FileTab({ name, inset }: { name: string; inset?: boolean }) {
  return (
    <div
      className={
        "flex items-center gap-2 " +
        (inset ? "border-b border-white/[0.07] bg-white/[0.02] px-4 py-2" : "")
      }
    >
      <span className="h-2 w-2 rounded-full bg-accent/60" />
      <span className="font-mono text-[0.72rem] text-white/55">{name}</span>
    </div>
  );
}

export default function SpecDialog({ onClose }: { onClose: () => void }) {
  const [spec, setSpec] = useState<SpecResponse | null>(null);

  useEffect(() => {
    fetchSpec()
      .then(setSpec)
      .catch(() => setSpec(null));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-fade-up sm:items-center sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-ink-800 shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between border-b border-white/[0.07] px-6 py-4">
          <div>
            <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-accent/70">
              Declarative source
            </div>
            <h2 className="mt-1 font-display text-2xl text-white">
              How this agent is defined
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="overflow-auto px-6 py-5">
          <p className="text-sm leading-relaxed text-white/50">
            Nothing here is hardcoded. The agent's persona and the only facts it
            may state live in a spec it loads at runtime. This is that spec,
            read-only.
          </p>

          {spec === null ? (
            <p className="mt-6 font-mono text-sm text-white/40">Loading spec...</p>
          ) : (
            <div className="mt-6 space-y-8">
              <section>
                <FileTab name="persona.yaml" />
                <div className="mt-3 space-y-3 rounded-xl border border-white/[0.07] bg-black/30 p-4">
                  {Object.entries(spec.persona).map(([k, v]) => (
                    <div key={k}>
                      <div className="font-mono text-[0.66rem] uppercase tracking-wider text-accent/70">
                        {k}
                      </div>
                      {Array.isArray(v) ? (
                        <ul className="mt-1 space-y-1">
                          {v.map((item, idx) => (
                            <li
                              key={idx}
                              className="flex gap-2 text-sm text-white/65"
                            >
                              <span className="text-accent/40">-</span>
                              <span>{String(item)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="mt-0.5 text-sm text-white/65">
                          {String(v)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div className="mb-3 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/35">
                  facts/ - the only claims it can make
                </div>
                <div className="space-y-4">
                  {spec.facts.map((f) => (
                    <div
                      key={f.path}
                      className="overflow-hidden rounded-xl border border-white/[0.07] bg-black/30"
                    >
                      <FileTab name={`facts/${f.path}`} inset />
                      <pre
                        dir="auto"
                        className="overflow-x-auto whitespace-pre-wrap px-4 py-3 font-mono text-[0.78rem] leading-relaxed text-white/60"
                      >
                        {f.content.trim()}
                      </pre>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
