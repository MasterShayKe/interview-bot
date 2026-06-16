import { useEffect, useRef, useState } from "react";

/**
 * Reveals an element when it scrolls into view (once). Respects
 * prefers-reduced-motion by starting visible. Returns a ref + className
 * helper: spread `{...reveal()}` onto the element.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  delayMs = 0,
) {
  const ref = useRef<T>(null);
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const [visible, setVisible] = useState(reduced ?? false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
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
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible]);

  return {
    ref,
    className: "reveal" + (visible ? " is-visible" : ""),
    style: { "--reveal-delay": `${delayMs}ms` } as React.CSSProperties,
  };
}
