import { metrics, type Metric } from "../content/profile.js";
import { Reveal, Eyebrow } from "../components/ui.js";
import { useCountUp } from "../lib/hooks.js";

function Cell({ m, i }: { m: Metric; i: number }) {
  const { ref, display } = useCountUp(m.value);
  return (
    <Reveal
      delay={i * 55}
      className="flex flex-col justify-between gap-6 border-b border-r border-white/[0.07] px-4 py-7 sm:px-7 sm:py-9"
    >
      <span
        ref={ref}
        className="font-display tabular block text-[2.7rem] font-medium leading-none text-paper sm:text-[3.4rem]"
      >
        {m.prefix && <span className="text-brass">{m.prefix}</span>}
        {display}
        {m.suffix && <span className="text-brass">{m.suffix}</span>}
      </span>
      <div>
        <div className="text-[0.9rem] font-medium text-paper/90">{m.label}</div>
        {m.note && <div className="mt-1 text-[0.76rem] text-paper-faint">{m.note}</div>}
      </div>
    </Reveal>
  );
}

export default function Impact() {
  return (
    <section id="impact" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28">
      <Reveal className="flex items-center justify-between">
        <Eyebrow>By the numbers</Eyebrow>
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-paper-faint">
          At NiCE
        </span>
      </Reveal>

      <div className="mt-8 grid grid-cols-2 border-l border-t border-white/[0.07] lg:grid-cols-4">
        {metrics.map((m, i) => (
          <Cell key={m.label} m={m} i={i} />
        ))}
      </div>
    </section>
  );
}
