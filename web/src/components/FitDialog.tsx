import { useEffect, useRef, useState } from "react";

const MIN_CHARS = 40;
const MAX_CHARS = 8000;

interface Props {
  subjectName: string;
  onClose: () => void;
  onAnalyze: (jobDescription: string) => void;
}

export default function FitDialog({ subjectName, onClose, onAnalyze }: Props) {
  const [jd, setJd] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jd]);

  const trimmed = jd.trim();
  const ready = trimmed.length >= MIN_CHARS;

  function submit() {
    if (!ready) return;
    onAnalyze(trimmed.slice(0, MAX_CHARS));
    onClose();
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 sm:items-center sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-ink-800 shadow-2xl animate-fade-up sm:rounded-2xl"
      >
        <div className="flex items-start justify-between border-b border-white/[0.07] px-6 py-4">
          <div>
            <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-accent/70">
              Fit analysis
            </div>
            <h2 className="mt-1 font-display text-2xl text-white">
              Paste a job description
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-auto px-6 py-5">
          <p className="text-sm leading-relaxed text-white/50">
            Drop in the role you are hiring for. The agent returns an honest,
            grounded read on {subjectName}'s fit - where they match, where they
            stretch, and the real gaps. It only credits what is evidenced in
            their background.
          </p>

          <textarea
            ref={ref}
            value={jd}
            onChange={(e) => setJd(e.target.value.slice(0, MAX_CHARS))}
            dir="auto"
            rows={10}
            placeholder="Paste the full job description here..."
            className="w-full resize-none rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-[0.82rem] leading-relaxed text-white/85 placeholder:text-white/25 focus:border-accent/40 focus:outline-none"
          />

          <div className="flex items-center justify-between gap-4">
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-white/25">
              {ready
                ? `${trimmed.length.toLocaleString()} chars · ⌘/Ctrl + Enter to run`
                : `Add at least ${MIN_CHARS} characters`}
            </span>
            <button
              onClick={submit}
              disabled={!ready}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-ink transition-all duration-200 enabled:hover:shadow-[0_0_28px_-6px] enabled:hover:shadow-accent disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
            >
              Analyze fit →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
