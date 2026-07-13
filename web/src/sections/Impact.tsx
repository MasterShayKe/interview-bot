import { metrics, type Metric } from "../content/profile.js";
import { Reveal, SectionHeading } from "../components/ui.js";
import { useCountUp } from "../lib/hooks.js";

function MetricFigure({ m, big }: { m: Metric; big: boolean }) {
  const { ref, display } = useCountUp(m.value);
  return (
    <span
      ref={ref}
      className={
        "font-display tabular block font-medium text-paper " +
        (big ? "text-4xl sm:text-5xl" : "text-3xl sm:text-[2.15rem]")
      }
    >
      {m.prefix && <span className="text-brass">{m.prefix}</span>}
      {display}
      {m.suffix && <span className="text-brass">{m.suffix}</span>}
    </span>
  );
}

function Card({ m, big, i }: { m: Metric; big: boolean; i: number }) {
  return (
    <Reveal
      delay={i * 60}
      className={
        "flex flex-col justify-between rounded-xl border border-white/[0.07] bg-white/[0.015] p-5 transition-colors hover:border-white/[0.14] " +
        (big ? "sm:p-6" : "")
      }
    >
      <MetricFigure m={m} big={big} />
      <div className="mt-3">
        <div className={"font-medium text-paper/90 " + (big ? "text-[0.92rem]" : "text-[0.84rem]")}>
          {m.label}
        </div>
        {m.note && <div className="mt-0.5 text-[0.75rem] text-paper-faint">{m.note}</div>}
      </div>
    </Reveal>
  );
}

export default function Impact() {
  const primary = metrics.filter((m) => m.primary);
  const secondary = metrics.filter((m) => !m.primary);

  return (
    <section id="impact" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 sm:px-8 lg:py-24">
      <SectionHeading
        eyebrow="Executive impact"
        title="Transformation you can measure"
        lead="A decade of enterprise operations, quantified. Every figure below is drawn from real programs Shay owned and delivered."
      />

      <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {primary.map((m, i) => (
          <Card key={m.label} m={m} big i={i} />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {secondary.map((m, i) => (
          <Card key={m.label} m={m} big={false} i={i} />
        ))}
      </div>
    </section>
  );
}
