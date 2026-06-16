import type { GitHubSummary } from "../../lib/api.js";

// Decorative activity strip — static motif, hoisted to avoid rebuilding on each render.
const cells = Array.from({ length: 24 }, (_, i) => {
  const m = i % 4;
  return m === 1 ? "bg-accent/40" : m === 2 ? "bg-accent" : "bg-white/[0.06]";
});

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface Props {
  data: GitHubSummary | null;
}

export default function GitHubTile({ data }: Props) {
  const base =
    "group relative block rounded-2xl border border-accent/30 bg-white/[0.025] py-3.5 pl-5 pr-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/50 hover:bg-white/[0.04]";

  const accent = (
    <span
      aria-hidden
      className="absolute left-0 top-3.5 bottom-3.5 w-[3px] rounded-full bg-accent"
    />
  );

  const strip = (
    <div aria-hidden className="grid shrink-0 grid-cols-8 gap-[2px]">
      {cells.map((c, i) => (
        <span key={i} className={"h-[3px] w-[3px] rounded-[1px] " + c} />
      ))}
    </div>
  );

  // Loading skeleton
  if (data === null) {
    return (
      <div className={base + " pointer-events-none animate-pulse"}>
        {accent}
        <div className="flex items-center justify-between gap-3">
          <div className="h-3.5 w-32 rounded bg-white/[0.08]" />
          {strip}
        </div>
        <div className="mt-1.5 h-2.5 w-48 rounded bg-white/[0.05]" />
        <div className="mt-2.5 flex gap-2">
          <div className="h-2 w-12 rounded bg-white/[0.04]" />
          <div className="h-2 w-10 rounded bg-white/[0.04]" />
          <div className="h-2 w-14 rounded bg-white/[0.04]" />
        </div>
      </div>
    );
  }

  // Unavailable fallback
  if (!data.available) {
    return (
      <a
        href="https://github.com/MasterShayKe"
        target="_blank"
        rel="noopener noreferrer"
        className={base}
      >
        {accent}
        <div className="flex items-center justify-between gap-3">
          <div className="font-mono text-[0.84rem] font-semibold text-white">
            GitHub
            <span className="ml-1 text-accent transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </div>
          {strip}
        </div>
        <p className="mt-1 text-[0.78rem] leading-snug text-white/55">
          github.com/MasterShayKe
        </p>
        <div className="mt-2.5">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-white/30">
            stats temporarily unavailable
          </span>
        </div>
      </a>
    );
  }

  // Live data
  const topLang = data.languages[0]?.name ?? null;
  const mostRecent = data.recent[0];

  return (
    <a
      href="https://github.com/MasterShayKe"
      target="_blank"
      rel="noopener noreferrer"
      className={base}
    >
      {accent}
      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-[0.84rem] font-semibold text-white">
          {data.publicRepos} public repos &middot; {data.totalStars}★
          <span className="ml-1 text-accent transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </div>
        {strip}
      </div>
      <p className="mt-1 text-[0.78rem] leading-snug text-white/55">
        {topLang ? `Top language: ${topLang}` : "github.com/MasterShayKe"}
      </p>
      {mostRecent && (
        <div className="mt-2.5 flex items-center gap-1.5">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-white/30">
            latest:
          </span>
          <span className="font-mono text-[0.62rem] text-accent/70">
            {mostRecent.name}
          </span>
          <span className="font-mono text-[0.6rem] text-white/20">
            {fmt(mostRecent.pushedAt)}
          </span>
        </div>
      )}
    </a>
  );
}
