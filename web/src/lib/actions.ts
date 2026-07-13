import { profile, resume } from "../content/profile.js";
import { track } from "./analytics.js";

export function scrollToId(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Scroll to the interview section and move focus into the chat input. */
export function askTheAI(): void {
  scrollToId("interview");
  window.setTimeout(() => {
    const input = document.getElementById("interview-input") as HTMLInputElement | null;
    input?.focus({ preventScroll: true });
  }, 620);
}

/**
 * Download the resume if a real asset is configured, otherwise fall back to an
 * email request so we never ship a broken link.
 */
export function handleResume(): void {
  if (resume.available) {
    track("resume_download");
    window.open(resume.path, "_blank", "noopener");
  } else {
    track("resume_request");
    window.location.href = `mailto:${profile.email}?subject=${encodeURIComponent(
      "Resume request - Shay Kopilevich",
    )}&body=${encodeURIComponent(
      "Hi Shay,\n\nCould you share your latest resume? I came across your interactive profile.\n\nThanks,",
    )}`;
  }
}

export const resumeCtaLabel = resume.available ? "Download Resume" : "Request Resume";
