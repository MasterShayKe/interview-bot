import type { GitHubSummary } from "../../lib/api.js";

const GITHUB_URL = "https://github.com/MasterShayKe";

interface Props {
  data: GitHubSummary | null;
  /** "chip" = pill for the topbar/hero; identical content, compact. */
  className?: string;
}

function GitHubGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.09.66-.22.66-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.16.58.67.48A10 10 0 0 0 22 12c0-5.52-4.48-10-10-10z" />
    </svg>
  );
}

/**
 * Compact, live GitHub stat — fed by fetchGitHub(). Renders a single
 * pill linking to the profile. Graceful fallback when unavailable / loading.
 */
export default function GitHubStat({ data, className = "" }: Props) {
  const base =
    "group inline-flex items-center gap-2.5 rounded-full border border-accent/25 bg-accent/[0.05] px-3.5 py-1.5 font-mono text-[0.7rem] text-white/70 transition-all duration-200 hover:border-accent/50 hover:bg-accent/[0.1] hover:text-accent " +
    className;

  const dot = (
    <span className="flex items-center text-accent/70 transition-colors group-hover:text-accent">
      <GitHubGlyph />
    </span>
  );

  // Loading
  if (data === null) {
    return (
      <span className={base + " animate-pulse"}>
        {dot}
        <span className="h-2.5 w-24 rounded bg-white/[0.08]" />
      </span>
    );
  }

  if (!data.available) {
    return (
      <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={base}>
        {dot}
        <span>github.com/MasterShayKe</span>
        <span className="text-accent/60 transition-transform group-hover:translate-x-0.5">↗</span>
      </a>
    );
  }

  const topLang = data.languages[0]?.name;

  return (
    <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={base}>
      {dot}
      <span className="font-semibold text-white/85 group-hover:text-accent">
        {data.publicRepos} repos
      </span>
      <span className="text-white/30">·</span>
      <span className="text-white/70">{data.totalStars}★</span>
      {topLang && (
        <>
          <span className="text-white/30">·</span>
          <span className="text-white/55 group-hover:text-accent/90">{topLang}</span>
        </>
      )}
      <span className="text-accent/60 transition-transform group-hover:translate-x-0.5">↗</span>
    </a>
  );
}
