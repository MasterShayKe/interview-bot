import type { Partner } from "../../lib/api.js";

interface Props {
  partners: Partner[];
  about: string[];
  onOpenSpec: () => void;
  onOpenFit: () => void;
}

/**
 * Slim footer band — absorbs the former Partners + About tiles plus the
 * spec / fit / powered-by controls into a compact strip.
 */
export default function FooterBand({
  partners,
  about,
  onOpenSpec,
  onOpenFit,
}: Props) {
  return (
    <footer className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 sm:p-7">
      <div className="grid grid-cols-1 gap-7 md:grid-cols-[1.3fr_1fr]">
        {/* Brands */}
        <div>
          <h3 className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-accent/80">
            Brands I've built for
          </h3>
          {partners.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {partners.map((p) => {
                const cls =
                  "rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 font-mono text-[0.66rem] text-white/75 transition-all duration-200";
                return p.url ? (
                  <a
                    key={p.name}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={p.blurb}
                    className={
                      cls +
                      " hover:-translate-y-0.5 hover:border-accent/45 hover:text-accent"
                    }
                  >
                    {p.name}
                  </a>
                ) : (
                  <span key={p.name} title={p.blurb} className={cls}>
                    {p.name}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Outside of work */}
        <div>
          <h3 className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-accent/80">
            Outside of work
          </h3>
          {about.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {about.map((line, i) => (
                <li
                  key={i}
                  className="text-[0.8rem] leading-relaxed text-white/60"
                >
                  {line}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] pt-5">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenSpec}
            className="group flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.15em] text-white/45 transition-colors hover:text-accent"
          >
            <span className="text-accent/60 transition-colors group-hover:text-accent">
              {"</>"}
            </span>
            View the spec
          </button>
          <span className="text-white/15">·</span>
          <button
            onClick={onOpenFit}
            className="group flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-[0.15em] text-white/45 transition-colors hover:text-accent"
          >
            <span className="text-accent/60 transition-colors group-hover:text-accent">
              ✓
            </span>
            Does Shay fit?
          </button>
        </div>
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-white/25">
          Powered by Claude
        </span>
      </div>
    </footer>
  );
}
