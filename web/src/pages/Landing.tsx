import { useEffect, useState } from "react";
import { fetchMe, startLinkedInLogin } from "../lib/api.js";
import { navigate } from "../lib/router.js";

const ERRORS: Record<string, string> = {
  denied: "LinkedIn sign-in was cancelled.",
  state: "Sign-in could not be verified. Please try again.",
  auth: "Something went wrong signing in. Please try again.",
};

function LinkedInButton() {
  return (
    <button
      onClick={startLinkedInLogin}
      className="inline-flex items-center gap-3 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-ink transition-all hover:shadow-[0_0_28px_-6px] hover:shadow-accent"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded bg-ink text-[0.7rem] font-bold text-accent">
        in
      </span>
      Sign in with LinkedIn
    </button>
  );
}

export default function Landing() {
  const [loggedIn, setLoggedIn] = useState(false);
  const error =
    new URLSearchParams(window.location.search).get("error") ?? null;

  useEffect(() => {
    fetchMe()
      .then((me) => setLoggedIn(Boolean(me)))
      .catch(() => setLoggedIn(false));
  }, []);

  return (
    <>
      <div className="bg-atmosphere" aria-hidden />
      <div className="bg-grid" aria-hidden />
      <div className="bg-grain" aria-hidden />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 sm:px-8">
        <header className="flex items-center justify-between py-6">
          <div className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-white/80">
            Interview<span className="text-accent">Bot</span>
          </div>
          {loggedIn ? (
            <button
              onClick={() => navigate("/dashboard")}
              className="font-mono text-[0.66rem] uppercase tracking-[0.15em] text-white/50 transition-colors hover:text-accent"
            >
              Dashboard →
            </button>
          ) : null}
        </header>

        <main className="flex flex-1 flex-col justify-center py-10">
          <div className="font-mono text-[0.72rem] uppercase tracking-[0.26em] text-accent/90 animate-fade-up">
            Grounded interview agents
          </div>
          <h1 className="mt-5 max-w-2xl font-display text-[2.9rem] leading-[0.98] text-white sm:text-6xl animate-fade-up [animation-delay:120ms]">
            Your career, as a chatbot that{" "}
            <span className="italic text-accent">cannot make things up</span>.
          </h1>
          <p className="mt-6 max-w-lg text-[1rem] leading-relaxed text-white/55 animate-fade-up [animation-delay:230ms]">
            Build a personal AI agent that represents you to recruiters and
            interviewers. It answers strictly from the experience and projects
            you give it - no hallucinations, no overclaiming. Sign in, build
            your knowledge base, and share a link.
          </p>

          {error && (
            <div className="mt-6 max-w-md rounded-xl border border-yellow-400/30 bg-yellow-400/[0.06] px-4 py-3 text-sm text-yellow-200/80 animate-fade-up">
              {ERRORS[error] ?? "Something went wrong. Please try again."}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4 animate-fade-up [animation-delay:340ms]">
            {loggedIn ? (
              <button
                onClick={() => navigate("/dashboard")}
                className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-ink transition-all hover:shadow-[0_0_28px_-6px] hover:shadow-accent"
              >
                Go to your dashboard →
              </button>
            ) : (
              <LinkedInButton />
            )}
            <button
              onClick={() => navigate("/u/shay")}
              className="rounded-xl border border-white/12 bg-white/[0.03] px-6 py-3 text-sm text-white/70 transition-colors hover:border-accent/40 hover:text-white"
            >
              See a live demo
            </button>
          </div>
        </main>

        <footer className="border-t border-white/[0.06] py-5">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-white/25">
            Powered by Claude
          </span>
        </footer>
      </div>
    </>
  );
}
