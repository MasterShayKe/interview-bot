interface Props {
  onOpen: () => void;
  /** Hidden while the guide is open. */
  hidden: boolean;
  /** Pulses subtly when there's unseen guide activity. */
  active: boolean;
}

/**
 * Persistent floating launcher for the guide — shown on ALL breakpoints.
 * Opens the GuidePanel as a side-rail (desktop) / full-screen sheet (mobile).
 */
export default function GuideDock({ onOpen, hidden, active }: Props) {
  if (hidden) return null;
  return (
    <button
      onClick={onOpen}
      aria-label="Ask the guide"
      className="group fixed bottom-5 right-5 z-30 flex items-center gap-2.5 rounded-full border border-accent/40 bg-[linear-gradient(135deg,#a855f7,#7c3aed)] px-5 py-3 font-mono text-[0.75rem] font-semibold text-white shadow-[0_8px_30px_-6px_rgba(168,85,247,0.7)] animate-dock-in transition-all duration-200 hover:scale-[1.04] hover:shadow-[0_10px_40px_-6px_rgba(168,85,247,0.9)] active:scale-95 sm:bottom-7 sm:right-7"
    >
      <span className="relative flex h-2.5 w-2.5">
        {active && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80 opacity-75" />
        )}
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
      </span>
      Ask the guide
      <span className="hidden font-sans text-[0.66rem] font-normal text-white/70 sm:inline">
        · about Shay
      </span>
    </button>
  );
}
