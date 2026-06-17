import { css } from "../../styled-system/css";

/**
 * Panda CSS styles for the immersive entry centerpiece. These coexist with the
 * Tailwind-styled rest of the app — Panda owns only this overlay + the entry
 * chrome, scoped via the `pd-` prefix declared in panda.config.ts.
 */

// The full-bleed first viewport that hosts the constellation + overlay.
export const stage = css({
  position: "relative",
  minH: "100svh",
  width: "100%",
  overflow: "hidden",
  bg: "radial-gradient(120% 90% at 50% 8%, rgba(60,28,104,0.55) 0%, rgba(18,10,32,0.85) 46%, #0a0810 80%)",
});

// Holds the <Canvas> (or fallback) absolutely behind the text overlay.
export const canvasLayer = css({
  position: "absolute",
  inset: "0",
  zIndex: "0",
});

// Pointer-events-none text overlay so drag/orbit still hits the canvas.
export const overlay = css({
  position: "absolute",
  inset: "0",
  zIndex: "2",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  pointerEvents: "none",
  px: "clamp(1.25rem, 5vw, 4rem)",
  py: "clamp(1.5rem, 4vh, 3rem)",
});

export const topRow = css({
  display: "flex",
  alignItems: "center",
  gap: "2",
  fontFamily: "mono",
  fontSize: "0.6rem",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "rgba(236,232,246,0.45)",
});

export const topDot = css({
  height: "6px",
  width: "6px",
  borderRadius: "9999px",
  bg: "accent",
  boxShadow: "0 0 10px rgba(168,85,247,0.9)",
});

export const heroBlock = css({
  maxW: "46rem",
  alignSelf: "flex-start",
  mb: "auto",
  mt: "clamp(3rem, 14vh, 9rem)",
});

export const kicker = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "2.5",
  fontFamily: "mono",
  fontSize: "0.64rem",
  letterSpacing: "0.24em",
  textTransform: "uppercase",
  color: "rgba(196,181,253,0.9)",
});

export const kickerRule = css({
  height: "1px",
  width: "1.75rem",
  bg: "rgba(168,85,247,0.55)",
});

export const headline = css({
  mt: "4",
  fontFamily: "display",
  fontWeight: "400",
  lineHeight: "1.02",
  letterSpacing: "-0.01em",
  fontSize: "clamp(2.6rem, 7vw, 5.25rem)",
  color: "#fdfcff",
  textShadow: "0 2px 40px rgba(0,0,0,0.55)",
});

export const headlineAccent = css({
  fontStyle: "italic",
  color: "transparent",
  backgroundClip: "text",
  backgroundImage:
    "linear-gradient(100deg, #c4b5fd 0%, #a855f7 45%, #f0abfc 100%)",
});

export const subhead = css({
  mt: "5",
  maxW: "34rem",
  fontFamily: "sans",
  fontSize: "clamp(0.95rem, 1.4vw, 1.08rem)",
  lineHeight: "1.6",
  color: "rgba(236,232,246,0.66)",
});

export const bottomRow = css({
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: "4",
  flexWrap: "wrap",
});

export const hint = css({
  fontFamily: "mono",
  fontSize: "0.62rem",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "rgba(236,232,246,0.4)",
  maxW: "16rem",
  lineHeight: "1.7",
});

// The "scroll to explore" / Enter cue — interactive, so re-enable pointers.
export const enterCue = css({
  pointerEvents: "auto",
  display: "inline-flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "2.5",
  cursor: "pointer",
  background: "transparent",
  border: "none",
  fontFamily: "mono",
  fontSize: "0.66rem",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "rgba(236,232,246,0.6)",
  transition: "color 0.25s ease",
  _hover: { color: "#fdfcff" },
  _focusVisible: {
    outline: "2px solid rgba(168,85,247,0.7)",
    outlineOffset: "6px",
    borderRadius: "8px",
  },
});

export const enterChevron = css({
  fontSize: "1.05rem",
  lineHeight: "1",
});

// Legend chip showing a cluster swatch + label.
export const legend = css({
  pointerEvents: "auto",
  display: "flex",
  gap: "3.5",
  flexWrap: "wrap",
  alignItems: "center",
});

export const legendItem = css({
  display: "inline-flex",
  alignItems: "center",
  gap: "1.5",
  fontFamily: "mono",
  fontSize: "0.58rem",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "rgba(236,232,246,0.5)",
});

export const legendSwatch = css({
  height: "7px",
  width: "7px",
  borderRadius: "9999px",
});

// Loading fallback inside Suspense while the 3D chunk streams in.
export const loadingWrap = css({
  position: "absolute",
  inset: "0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: "1",
});

export const loadingPulse = css({
  fontFamily: "mono",
  fontSize: "0.66rem",
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "rgba(196,181,253,0.55)",
  animation: "pulse 1.6s ease-in-out infinite",
});

// Wrapper for the 2D fallback grid so it sits centered in the stage.
export const fallbackWrap = css({
  position: "relative",
  zIndex: "2",
  maxW: "72rem",
  mx: "auto",
  px: "clamp(1.25rem, 5vw, 3rem)",
  pt: "clamp(7rem, 16vh, 11rem)",
  pb: "4rem",
});
