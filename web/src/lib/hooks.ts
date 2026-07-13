import { useEffect, useRef, useState } from "react";

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Adds the `.is-in` class once the element scrolls into view (one-shot).
 * Falls back to visible immediately when reduced motion is requested or
 * IntersectionObserver is unavailable.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      el.classList.add("is-in");
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            obs.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/**
 * Counts a numeric string up to its final value when it enters view.
 * Non-numeric values (e.g. "65 → 80") are returned unchanged. Respects
 * reduced-motion by showing the final value immediately.
 */
export function useCountUp(value: string, durationMs = 1100) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(() => {
    return /^[\d,]+$/.test(value.replace(/\s/g, "")) ? "0" : value;
  });

  useEffect(() => {
    const el = ref.current;
    const clean = value.replace(/,/g, "");
    const target = Number(clean);
    if (!el || !Number.isFinite(target) || !/^[\d,]+$/.test(value.replace(/\s/g, ""))) {
      setDisplay(value);
      return;
    }
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      setDisplay(value);
      return;
    }
    const format = (n: number) => Math.round(n).toLocaleString("en-US");
    let raf = 0;
    let start = 0;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        obs.disconnect();
        const step = (t: number) => {
          if (!start) start = t;
          const p = Math.min((t - start) / durationMs, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setDisplay(format(target * eased));
          if (p < 1) raf = requestAnimationFrame(step);
          else setDisplay(value);
        };
        raf = requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, durationMs]);

  return { ref, display };
}

/** Tracks which section id is currently in view, for nav highlighting. */
export function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState(ids[0] ?? "");
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [ids.join(",")]);
  return active;
}
