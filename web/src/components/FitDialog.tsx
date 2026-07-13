import { useEffect, useRef, useState } from "react";
import { streamFit } from "../lib/api.js";
import { collectClientContext, getSessionDuration } from "../lib/device.js";
import { track } from "../lib/analytics.js";
import Markdown from "./Markdown.js";

const MIN_CHARS = 40;
const MAX_CHARS = 8000;
const clientContext = collectClientContext();

export default function FitDialog({ onClose }: { onClose: () => void }) {
  const [jd, setJd] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    taRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  async function analyze() {
    const text = jd.trim();
    if (text.length < MIN_CHARS || busy) return;
    setBusy(true);
    setError("");
    setResult("");
    track("fit_analyzed", { length: text.length });
    try {
      await streamFit({
        jobDescription: text,
        clientContext,
        sessionDurationSeconds: getSessionDuration(clientContext.sessionStartedAt),
        onDelta: (d) => setResult((r) => r + d),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong analyzing the role.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fit-title"
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-white/[0.1] bg-ink-900 shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div>
            <h2 id="fit-title" className="font-display text-xl font-medium text-paper">
              Match Shay to your role
            </h2>
            <p className="mt-0.5 text-[0.8rem] text-paper-faint">
              Paste a job description for an honest, grounded fit assessment.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="rounded-lg p-2 text-paper-muted transition-colors hover:text-paper disabled:opacity-40"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <label htmlFor="jd" className="sr-only">Job description</label>
          <textarea
            id="jd"
            ref={taRef}
            value={jd}
            onChange={(e) => setJd(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Paste the job description here..."
            rows={6}
            disabled={busy}
            className="w-full resize-y rounded-xl border border-white/[0.1] bg-white/[0.02] p-3.5 text-[0.9rem] leading-relaxed text-paper placeholder:text-paper-faint focus:border-accent/40 focus:outline-none disabled:opacity-60"
          />
          <div className="mt-1 text-right font-mono text-[0.6rem] text-paper-faint">
            {jd.trim().length}/{MAX_CHARS}
          </div>

          {error && (
            <p className="mt-2 rounded-lg border border-red-400/25 bg-red-500/[0.06] px-3 py-2 text-[0.82rem] text-red-200/90">
              {error}
            </p>
          )}

          {(result || busy) && (
            <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.015] p-4">
              {result ? (
                <Markdown>{result}</Markdown>
              ) : (
                <div className="flex items-center gap-1.5" aria-hidden>
                  <span className="thinking-dot" />
                  <span className="thinking-dot" style={{ animationDelay: "160ms" }} />
                  <span className="thinking-dot" style={{ animationDelay: "320ms" }} />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] px-5 py-4">
          <span className="text-[0.72rem] text-paper-faint">
            Names real gaps, not just strengths.
          </span>
          <button
            onClick={analyze}
            disabled={busy || jd.trim().length < MIN_CHARS}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-[0.86rem] font-medium text-ink transition-colors hover:bg-accent-bright disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
          >
            {busy ? "Analyzing..." : "Analyze fit"}
          </button>
        </div>
      </div>
    </div>
  );
}
