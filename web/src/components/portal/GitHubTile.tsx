/**
 * Static placeholder for this plan. Plan 4 replaces this with live GitHub data
 * (contributions, stars, languages) fetched from the API.
 */
export default function GitHubTile() {
  // Decorative contribution-heatmap motif (static).
  const cells = Array.from({ length: 24 }, (_, i) => {
    const m = i % 4;
    return m === 1 ? "bg-accent/40" : m === 2 ? "bg-accent" : "bg-white/[0.06]";
  });

  return (
    <a
      href="https://github.com/MasterShayKe"
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block rounded-2xl border border-accent/30 bg-white/[0.025] py-3.5 pl-5 pr-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/50 hover:bg-white/[0.04]"
    >
      <span
        aria-hidden
        className="absolute left-0 top-3.5 bottom-3.5 w-[3px] rounded-full bg-accent"
      />
      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-[0.84rem] font-semibold text-white">
          Live from GitHub
          <span className="ml-1 text-accent transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </div>
        <div
          aria-hidden
          className="grid shrink-0 grid-cols-8 gap-[2px]"
        >
          {cells.map((c, i) => (
            <span key={i} className={"h-[3px] w-[3px] rounded-[1px] " + c} />
          ))}
        </div>
      </div>
      <p className="mt-1 text-[0.78rem] leading-snug text-white/55">
        10 repos · contributions, stars &amp; languages
      </p>
      <div className="mt-2.5">
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-white/30">
          (wired up in a later step)
        </span>
      </div>
    </a>
  );
}
