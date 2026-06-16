import { useCallback, useEffect, useState } from "react";

/**
 * Reveals an element when it scrolls into view (once). Respects
 * prefers-reduced-motion by starting visible. Returns a callback `ref` +
 * `className`/`style` helpers: spread them onto the element.
 *
 * Uses a callback ref (not useRef) so the IntersectionObserver attaches when
 * the node actually mounts — important when the element is rendered behind a
 * gate (e.g. a boot sequence) that mounts it after the first effect pass.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(delayMs = 0) {
  const reduced =
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [visible, setVisible] = useState<boolean>(reduced);
  const [node, setNode] = useState<T | null>(null);
  const ref = useCallback((el: T | null) => setNode(el), []);

  useEffect(() => {
    if (visible || !node) return;
    // Safety: if IntersectionObserver is unavailable, just show the content.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [node, visible]);

  return {
    ref,
    className: "reveal" + (visible ? " is-visible" : ""),
    style: { "--reveal-delay": `${delayMs}ms` } as React.CSSProperties,
  };
}
