import { aiSystems } from "../content/profile.js";
import { Reveal, SectionHeading } from "../components/ui.js";

export default function AIWork() {
  return (
    <section id="ai" className="relative scroll-mt-24 border-y border-white/[0.05] bg-ink-950/40">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28">
        <SectionHeading
          eyebrow="AI that solves operational problems"
          title="He builds the systems, not just the roadmap"
          lead="Most leaders buy AI. Shay ships it - production systems that remove real operational load, inside the enterprise and on his own."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {aiSystems.map((s, i) => (
            <Reveal
              key={s.title}
              delay={(i % 3) * 70}
              className="flex flex-col rounded-2xl border border-white/[0.07] bg-ink-900/40 p-6 transition-colors hover:border-accent/25"
            >
              <span
                className={
                  "self-start rounded-md border px-2 py-1 font-mono text-[0.56rem] uppercase tracking-[0.14em] " +
                  (s.tag === "You are using it"
                    ? "border-accent/30 bg-accent/[0.06] text-accent"
                    : s.tag.includes("NiCE")
                      ? "border-brass/25 bg-brass/[0.05] text-brass/90"
                      : "border-white/[0.1] bg-white/[0.02] text-paper-faint")
                }
              >
                {s.tag}
              </span>
              <h3 className="font-display mt-4 text-lg font-medium leading-tight text-paper">
                {s.title}
              </h3>
              <p className="mt-2 text-[0.87rem] leading-relaxed text-paper-muted">{s.summary}</p>
              <ul className="mt-3.5 space-y-1.5 border-t border-white/[0.06] pt-3.5">
                {s.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-[0.8rem] leading-snug text-paper/75">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent/60" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
