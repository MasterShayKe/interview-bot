import { profile } from "../content/profile.js";
import { askTheAI, handleResume, resumeCtaLabel, scrollToId } from "../lib/actions.js";

export default function Hero() {
  return (
    <section
      id="top"
      className="mx-auto flex min-h-[92svh] max-w-6xl flex-col justify-center px-5 pb-20 pt-28 sm:px-8"
    >
      <div className="max-w-4xl">
        <div
          className="animate-fade-up flex items-center gap-2.5"
          style={{ animationDelay: "40ms" }}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent shadow-[0_0_8px_1px] shadow-accent/60" aria-hidden />
          <span className="eyebrow">Available for leadership roles</span>
        </div>

        <h1 className="mt-7 text-balance">
          <span
            className="font-display block text-[2.5rem] font-medium leading-[1] tracking-tight text-paper animate-fade-up sm:text-6xl lg:text-[6.4rem]"
            style={{ animationDelay: "120ms" }}
          >
            {profile.name}
          </span>
          <span
            className="font-display mt-3 block text-[1.35rem] font-normal leading-tight text-paper/70 animate-fade-up sm:text-4xl lg:text-[3rem]"
            style={{ animationDelay: "220ms" }}
          >
            {profile.role}
          </span>
        </h1>

        <p
          className="mt-7 max-w-xl text-balance text-[1.05rem] leading-relaxed text-paper-muted animate-fade-up sm:text-[1.35rem]"
          style={{ animationDelay: "320ms" }}
        >
          {profile.tagline}
        </p>

        <div
          className="mt-11 flex flex-wrap items-center gap-3 animate-fade-up"
          style={{ animationDelay: "420ms" }}
        >
          <button
            onClick={askTheAI}
            className="group inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-[0.95rem] font-medium text-ink transition-all hover:bg-accent-bright hover:shadow-[0_12px_44px_-12px] hover:shadow-accent/60"
          >
            Interview the AI
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
          <button
            onClick={handleResume}
            className="inline-flex items-center rounded-full border border-white/[0.16] px-6 py-3.5 text-[0.95rem] font-medium text-paper transition-colors hover:border-accent/50 hover:text-accent"
          >
            {resumeCtaLabel}
          </button>
          <button
            onClick={() => scrollToId("contact")}
            className="inline-flex items-center rounded-full px-4 py-3.5 text-[0.95rem] font-medium text-paper-muted transition-colors hover:text-paper"
          >
            Contact
          </button>
        </div>
      </div>
    </section>
  );
}
