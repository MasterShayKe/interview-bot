import { useEffect, useState } from "react";

// Minimal path-based router for a two-view app (chat + /portal). Avoids pulling
// in a full routing library. Works with the server's SPA fallback and Vite dev.

interface NavOptions {
  /** Seed a question to auto-send on the chat view after navigating. */
  ask?: string;
}

const ASK_KEY = "portal:ask";
let pendingAsk: string | null = null;

export function navigate(path: string, opts?: NavOptions) {
  if (opts?.ask) {
    pendingAsk = opts.ask;
    try {
      sessionStorage.setItem(ASK_KEY, opts.ask);
    } catch {
      // sessionStorage may be unavailable (private mode) — in-memory is enough.
    }
  }
  if (path !== window.location.pathname) {
    window.history.pushState({}, "", path);
  }
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/** Consume a one-shot question requested from the portal, if any. */
export function takePendingAsk(): string | null {
  if (pendingAsk) {
    const v = pendingAsk;
    pendingAsk = null;
    return v;
  }
  try {
    const v = sessionStorage.getItem(ASK_KEY);
    if (v) {
      sessionStorage.removeItem(ASK_KEY);
      return v;
    }
  } catch {
    // ignore
  }
  return null;
}

export function useRoute(): string {
  const [path, setPath] = useState(
    typeof window === "undefined" ? "/" : window.location.pathname,
  );
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return path;
}
