import { thesis } from "../content/profile.js";
import { Reveal } from "../components/ui.js";

export default function Thesis() {
  return (
    <section className="border-y border-white/[0.05] bg-ink-950/40">
      <div className="mx-auto max-w-4xl px-5 py-20 sm:px-8 lg:py-24">
        <Reveal>
          <p className="flex items-center gap-3">
            <span className="h-px w-8 bg-brass/60" aria-hidden />
            <span className="eyebrow">The difference</span>
          </p>
        </Reveal>
        <Reveal delay={80}>
          <p className="font-display mt-6 text-balance text-2xl font-normal leading-snug text-paper sm:text-[2rem] lg:text-[2.4rem]">
            {thesis}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
