import { profile } from "../content/profile.js";
import { Reveal, Eyebrow } from "../components/ui.js";
import { askTheAI, handleResume, resumeCtaLabel } from "../lib/actions.js";
import { track } from "../lib/analytics.js";

export default function Contact() {
  return (
    <section id="contact" className="relative scroll-mt-24 overflow-hidden border-t border-white/[0.06]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(50rem_20rem_at_50%_0%,rgba(138,160,255,0.1),transparent_70%)]" aria-hidden />
      <div className="relative mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 lg:py-28">
        <Reveal>
          <div className="flex justify-center">
            <Eyebrow>Let&rsquo;s talk</Eyebrow>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="font-display mx-auto mt-6 max-w-2xl text-balance text-3xl font-medium leading-[1.08] text-paper sm:text-4xl md:text-[3.1rem]">
            Ready to modernize your IT organization?
          </h2>
        </Reveal>
        <Reveal delay={140}>
          <p className="mx-auto mt-6 max-w-lg text-[1.05rem] leading-relaxed text-paper-muted">
            If you need enterprise leadership paired with hands-on AI implementation, let&rsquo;s talk.
          </p>
        </Reveal>

        <Reveal delay={200}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <a
              href={`mailto:${profile.email}`}
              onClick={() => track("email_click")}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-[0.9rem] font-medium text-ink transition-colors hover:bg-accent-bright"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 6h16v12H4z" /><path d="M4 7l8 6 8-6" />
              </svg>
              Email Shay
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("linkedin_click")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.14] px-5 py-3 text-[0.9rem] font-medium text-paper transition-colors hover:border-accent/50 hover:text-accent"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M4.98 3.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21H18.6v-5.4c0-1.3 0-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.86V21H10z" />
              </svg>
              LinkedIn
            </a>
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("github_click")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.14] px-5 py-3 text-[0.9rem] font-medium text-paper transition-colors hover:border-accent/50 hover:text-accent"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2a10 10 0 00-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 015 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0012 2z" />
              </svg>
              GitHub
            </a>
            <button
              onClick={handleResume}
              className="inline-flex items-center rounded-xl border border-white/[0.14] px-5 py-3 text-[0.9rem] font-medium text-paper transition-colors hover:border-accent/50 hover:text-accent"
            >
              {resumeCtaLabel}
            </button>
          </div>
        </Reveal>

        <Reveal delay={260}>
          <button
            onClick={askTheAI}
            className="mt-6 text-[0.86rem] text-paper-faint underline-offset-4 transition-colors hover:text-accent hover:underline"
          >
            Or ask the AI one more question
          </button>
        </Reveal>
      </div>
    </section>
  );
}
