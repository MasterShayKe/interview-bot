import { useEffect, useState, type ReactNode } from "react";
import { fetchSpec, type SpecResponse } from "../lib/api.js";

const STACK: { label: string; value: string }[] = [
  {
    label: "Model",
    value: "Claude (Anthropic), streamed over SSE with prompt caching",
  },
  { label: "Backend", value: "Fastify + TypeScript" },
  { label: "Frontend", value: "React + Vite + Tailwind CSS" },
  {
    label: "Grounding",
    value: "Declarative spec - answers only from declared facts",
  },
  { label: "Guardrails", value: "Per-IP rate limiting + daily token budget" },
  { label: "Infra", value: "Deployed on Render" },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="mb-3 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-accent/70">
      {children}
    </div>
  );
}

function FileBlock({ name, children }: { name: string; children: ReactNode }) {
  return (
    <details className="group overflow-hidden rounded-xl border border-white/[0.07] bg-black/30">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 transition-colors hover:bg-white/[0.02]">
        <span className="h-2 w-2 rounded-full bg-accent/60" />
        <span className="font-mono text-[0.72rem] text-white/60">{name}</span>
        <span className="ml-auto font-mono text-[0.6rem] uppercase tracking-wider text-white/30">
          <span className="group-open:hidden">view</span>
          <span className="hidden group-open:inline">hide</span>
        </span>
      </summary>
      <div className="border-t border-white/[0.07] px-4 py-3">{children}</div>
    </details>
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
              Under the hood
            </div>
            <h2 className="mt-1 font-display text-2xl text-white">
              How this agent is built
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

        <div className="space-y-8 overflow-auto px-6 py-5">
          <p className="text-sm leading-relaxed text-white/50">
            This is not a scripted bot. It is a small, grounded AI system that
            Shay built - here is how it works and why it cannot make things up
            about him.
          </p>

          <section>
            <SectionLabel>Architecture</SectionLabel>
            <div className="grid gap-px overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.05] sm:grid-cols-2">
              {STACK.map((s) => (
                <div key={s.label} className="bg-ink-800 p-3.5">
                  <div className="font-mono text-[0.6rem] uppercase tracking-wider text-white/40">
                    {s.label}
                  </div>
                  <div className="mt-1 text-[0.82rem] leading-snug text-white/75">
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {spec === null ? (
            <p className="font-mono text-sm text-white/40">Loading spec...</p>
          ) : (
            <>
              <section>
                <SectionLabel>The grounding contract</SectionLabel>
                <p className="mb-3 text-sm leading-relaxed text-white/50">
                  The agent speaks about Shay in the third person and follows
                  these rules, loaded from{" "}
                  <span className="font-mono text-white/70">persona.yaml</span>:
                </p>
                <ul className="space-y-2">
                  {(spec.persona.rules ?? []).map((r, i) => (
                    <li
                      key={i}
                      className="flex gap-2.5 text-[0.84rem] leading-relaxed text-white/65"
                    >
                      <span className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-accent/70" />
                      <span>{r}</span>
                    </li>
                  ))}
                  <li className="flex gap-2.5 text-[0.84rem] leading-relaxed text-white/65">
                    <span className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-accent/70" />
                    <span>
                      It answers only from the declared facts. If something is
                      not in the knowledge base, it says so instead of guessing.
                    </span>
                  </li>
                </ul>
              </section>

              <section>
                <SectionLabel>Knowledge base - the only claims it can make</SectionLabel>
                <div className="space-y-3">
                  <FileBlock name="persona.yaml">
                    <div className="space-y-2.5">
                      {Object.entries(spec.persona).map(([k, v]) => (
                        <div key={k}>
                          <div className="font-mono text-[0.64rem] uppercase tracking-wider text-accent/70">
                            {k}
                          </div>
                          {Array.isArray(v) ? (
                            <ul className="mt-1 space-y-1">
                              {v.map((item, idx) => (
                                <li
                                  key={idx}
                                  className="flex gap-2 text-[0.82rem] text-white/60"
                                >
                                  <span className="text-accent/40">-</span>
                                  <span>{String(item)}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="mt-0.5 text-[0.82rem] text-white/60">
                              {String(v)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </FileBlock>

                  {spec.facts.map((f) => (
                    <FileBlock key={f.path} name={`facts/${f.path}`}>
                      <pre
                        dir="auto"
                        className="overflow-x-auto whitespace-pre-wrap font-mono text-[0.76rem] leading-relaxed text-white/55"
                      >
                        {f.content.trim()}
                      </pre>
                    </FileBlock>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
