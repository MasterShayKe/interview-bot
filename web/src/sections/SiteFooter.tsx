import { profile } from "../content/profile.js";

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-ink-950/50">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-white/[0.1] font-display text-[0.9rem] text-paper">
            S<span className="text-accent">K</span>
          </span>
          <span className="text-[0.8rem] text-paper-muted">
            {profile.name} &middot; {profile.location}
          </span>
        </div>
        <div className="flex items-center gap-5">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-paper-faint">
            Grounded in verified experience
          </span>
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-paper-faint">
            Built with TypeScript &amp; Claude
          </span>
        </div>
      </div>
    </footer>
  );
}
