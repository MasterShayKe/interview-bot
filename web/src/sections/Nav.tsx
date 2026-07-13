import { useEffect, useState } from "react";
import { navItems, profile } from "../content/profile.js";
import { askTheAI, scrollToId } from "../lib/actions.js";
import { useActiveSection } from "../lib/hooks.js";

const ids = navItems.map((n) => n.id);

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useActiveSection(ids);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function jump(id: string) {
    setOpen(false);
    scrollToId(id);
  }

  return (
    <header
      className={
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300 " +
        (scrolled || open
          ? "border-b border-white/[0.07] bg-ink/85 backdrop-blur-xl"
          : "border-b border-transparent")
      }
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        {/* Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="group flex items-center gap-2.5"
          aria-label="Shay Kopilevich, back to top"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.12] bg-white/[0.02] font-display text-[1.05rem] leading-none text-paper">
            S<span className="text-accent">K</span>
          </span>
          <span className="hidden font-mono text-[0.66rem] uppercase tracking-[0.2em] text-paper-muted sm:block">
            Shay Kopilevich
          </span>
        </a>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 lg:flex">
          {navItems.map((n) => (
            <li key={n.id}>
              <a
                href={`#${n.id}`}
                aria-current={active === n.id ? "true" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  jump(n.id);
                }}
                className={
                  "rounded-md px-3 py-2 text-[0.82rem] transition-colors " +
                  (active === n.id
                    ? "text-paper"
                    : "text-paper-muted hover:text-paper")
                }
              >
                {n.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-lg p-2 text-paper-muted transition-colors hover:text-accent sm:inline-flex"
            aria-label="LinkedIn"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M4.98 3.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21H18.6v-5.4c0-1.3 0-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.86V21H10z" />
            </svg>
          </a>
          <button
            onClick={askTheAI}
            className="hidden rounded-lg bg-accent px-4 py-2 text-[0.82rem] font-medium text-ink transition-colors hover:bg-accent-bright sm:inline-flex"
          >
            Ask the AI
          </button>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.1] text-paper lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div id="mobile-menu" className="border-t border-white/[0.06] bg-ink/95 px-5 pb-5 pt-2 lg:hidden">
          <ul className="flex flex-col">
            {navItems.map((n) => (
              <li key={n.id}>
                <a
                  href={`#${n.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    jump(n.id);
                  }}
                  className={
                    "block border-b border-white/[0.05] py-3.5 text-[0.95rem] " +
                    (active === n.id ? "text-accent" : "text-paper-muted")
                  }
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <button
            onClick={() => {
              setOpen(false);
              askTheAI();
            }}
            className="mt-4 w-full rounded-xl bg-accent py-3 text-[0.9rem] font-medium text-ink"
          >
            Ask the AI
          </button>
        </div>
      )}
    </header>
  );
}
