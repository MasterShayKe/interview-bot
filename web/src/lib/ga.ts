// Google Analytics 4 loader.
//
// Paste your GA4 Measurement ID below (looks like "G-XXXXXXXXXX"). A GA4
// measurement id is NOT a secret - it is exposed client-side by design.
// When set, this loads gtag, auto-tracks page views (traffic), and every
// custom event fired via lib/analytics.ts (chats started, messages sent,
// chat completions/errors, resume + contact clicks) lands in GA4 automatically.
// Leave it empty to disable analytics entirely.
const MEASUREMENT_ID = "G-B399WQ1L8K";

export function initGA(): void {
  if (!MEASUREMENT_ID || typeof document === "undefined") return;

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(s);

  const w = window as unknown as {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  };
  w.dataLayer = w.dataLayer || [];
  w.gtag = w.gtag || ((...args: unknown[]) => w.dataLayer.push(args));
  w.gtag("js", new Date());
  w.gtag("config", MEASUREMENT_ID);
}
