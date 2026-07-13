import { useState } from "react";
import { suggestedQuestions } from "../content/profile.js";
import { Reveal, SectionHeading } from "../components/ui.js";
import InterviewChat from "../components/InterviewChat.js";
import FitDialog from "../components/FitDialog.js";
import { track } from "../lib/analytics.js";

export default function Interview() {
  const [fitOpen, setFitOpen] = useState(false);

  function openFit() {
    track("fit_opened");
    setFitOpen(true);
  }

  return (
    <section id="interview" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8 lg:py-28">
      <SectionHeading
        eyebrow="Interview Shay"
        title="Ask the questions you would ask in a first interview"
        lead="This AI profile is grounded exclusively in verified information about Shay's experience, leadership, projects, and decisions. It distinguishes verified fact from reasonable interpretation - and tells you when it does not know."
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
        <div className="lg:pt-2">
          <Reveal>
            <p className="text-[0.98rem] leading-relaxed text-paper-muted">
              Start with a suggested question or ask your own. You can go deep on the Intune
              transformation, the M&amp;A playbook, how he leads global teams, or the hard
              questions - his biggest failure, why he left NiCE, and what he is targeting next.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <button
              onClick={openFit}
              className="group mt-6 flex w-full items-center justify-between gap-4 rounded-xl border border-white/[0.09] bg-white/[0.015] p-4 text-left transition-colors hover:border-accent/30"
            >
              <div>
                <div className="text-[0.92rem] font-medium text-paper">Hiring for a specific role?</div>
                <div className="mt-0.5 text-[0.8rem] text-paper-faint">
                  Paste a job description for an honest fit assessment.
                </div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-accent transition-transform group-hover:translate-x-0.5" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </Reveal>

          <Reveal delay={140}>
            <p className="mt-6 flex items-start gap-2 text-[0.76rem] leading-relaxed text-paper-faint">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0 text-brass/70" aria-hidden>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Answers are generated from a curated professional knowledge base and may be
              verified directly with Shay.
            </p>
          </Reveal>
        </div>

        <Reveal delay={100}>
          <InterviewChat suggestions={suggestedQuestions} onOpenFit={openFit} />
        </Reveal>
      </div>

      {fitOpen && <FitDialog onClose={() => setFitOpen(false)} />}
    </section>
  );
}
