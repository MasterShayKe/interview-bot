import type { Partner } from "../../lib/api.js";

interface Props {
  partners: Partner[];
}

export default function PartnersTile({ partners }: Props) {
  return (
    <div className="rounded-2xl border border-accent/30 bg-[linear-gradient(150deg,#241241,#160e26)] p-6">
      <h3 className="mb-2 font-mono text-[0.66rem] uppercase tracking-[0.18em] text-accent/80">
        Brands I've built for
      </h3>
      <p className="text-[0.8rem] text-white/55">
        Real products shipped for real teams.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {partners.map((p) => {
          const cls =
            "rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 font-mono text-[0.66rem] text-white/75 transition-colors";
          return p.url ? (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              title={p.blurb}
              className={cls + " hover:border-accent/40 hover:text-accent"}
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
    </div>
  );
}
