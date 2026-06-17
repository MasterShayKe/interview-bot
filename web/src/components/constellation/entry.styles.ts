/**
 * Tailwind class strings for the immersive entry centerpiece. (Previously
 * Panda CSS — moved to Tailwind, which the rest of the app already uses, after
 * Panda's static extractor produced no CSS in this toolchain.) Kept as named
 * exports so the components read `s.stage` etc.
 */

// The full-bleed first viewport that hosts the constellation + overlay.
export const stage =
  "relative min-h-[100svh] w-full overflow-hidden bg-[radial-gradient(120%_90%_at_50%_8%,rgba(60,28,104,0.55)_0%,rgba(18,10,32,0.85)_46%,#0a0810_80%)]";

// Holds the <Canvas> (or fallback) absolutely behind the text overlay.
export const canvasLayer = "absolute inset-0 z-0";

// Pointer-events-none text overlay so drag/orbit still hits the canvas.
export const overlay =
  "absolute inset-0 z-[2] flex flex-col justify-between pointer-events-none px-[clamp(1.25rem,5vw,4rem)] py-[clamp(1.5rem,4vh,3rem)]";

export const topRow =
  "flex items-center gap-2 font-mono text-[0.6rem] tracking-[0.22em] uppercase text-[rgba(236,232,246,0.45)]";

export const topDot =
  "h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_rgba(168,85,247,0.9)]";

export const heroBlock =
  "max-w-[46rem] self-start mb-auto mt-[clamp(3rem,14vh,9rem)]";

export const kicker =
  "inline-flex items-center gap-2.5 font-mono text-[0.64rem] tracking-[0.24em] uppercase text-[rgba(196,181,253,0.9)]";

export const kickerRule = "h-px w-7 bg-[rgba(168,85,247,0.55)]";

export const headline =
  "mt-4 font-display font-normal leading-[1.02] tracking-[-0.01em] text-[clamp(2.6rem,7vw,5.25rem)] text-[#fdfcff] [text-shadow:0_2px_40px_rgba(0,0,0,0.55)]";

export const headlineAccent =
  "italic text-transparent bg-clip-text bg-[linear-gradient(100deg,#c4b5fd_0%,#a855f7_45%,#f0abfc_100%)]";

export const subhead =
  "mt-5 max-w-[34rem] font-sans text-[clamp(0.95rem,1.4vw,1.08rem)] leading-[1.6] text-[rgba(236,232,246,0.66)]";

export const bottomRow =
  "flex items-end justify-between gap-4 flex-wrap";

// The "scroll to explore" / Enter cue — interactive, so re-enable pointers.
export const enterCue =
  "pointer-events-auto inline-flex flex-col items-center gap-2.5 cursor-pointer bg-transparent border-none font-mono text-[0.66rem] tracking-[0.2em] uppercase text-[rgba(236,232,246,0.6)] transition-colors duration-[250ms] hover:text-[#fdfcff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgba(168,85,247,0.7)] focus-visible:outline-offset-[6px] focus-visible:rounded-lg";

export const enterChevron = "text-[1.05rem] leading-none";

// Legend chip showing a cluster swatch + label.
export const legend =
  "pointer-events-auto flex gap-3.5 flex-wrap items-center";

export const legendItem =
  "inline-flex items-center gap-1.5 font-mono text-[0.58rem] tracking-[0.14em] uppercase text-[rgba(236,232,246,0.5)]";

export const legendSwatch = "h-[7px] w-[7px] rounded-full";

// Loading fallback inside Suspense while the 3D chunk streams in.
export const loadingWrap =
  "absolute inset-0 flex items-center justify-center z-[1]";

export const loadingPulse =
  "font-mono text-[0.66rem] tracking-[0.22em] uppercase text-[rgba(196,181,253,0.55)] animate-pulse";

// Wrapper for the 2D fallback grid so it sits centered in the stage.
export const fallbackWrap =
  "relative z-[2] max-w-[72rem] mx-auto px-[clamp(1.25rem,5vw,3rem)] pt-[clamp(7rem,16vh,11rem)] pb-16";
