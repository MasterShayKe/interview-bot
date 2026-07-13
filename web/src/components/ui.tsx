import { createElement, type CSSProperties, type ReactNode } from "react";
import { useReveal } from "../lib/hooks.js";

/** Wraps content in a scroll-reveal container with an optional stagger delay. */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const ref = useReveal<HTMLElement>();
  const style = { ["--reveal-delay" as string]: `${delay}ms` } as CSSProperties;
  return createElement(
    Tag,
    { ref, className: `reveal ${className}`, style } as Record<string, unknown>,
    children,
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px w-8 bg-brass/60" aria-hidden />
      <span className="eyebrow">{children}</span>
    </div>
  );
}

/** Standard section header: eyebrow label + serif display title + optional lead. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      <Reveal>
        <Eyebrow>{eyebrow}</Eyebrow>
      </Reveal>
      <Reveal delay={80}>
        <h2 className="font-display mt-5 text-balance text-3xl font-medium leading-[1.08] text-paper sm:text-4xl md:text-[2.9rem]">
          {title}
        </h2>
      </Reveal>
      {lead && (
        <Reveal delay={140}>
          <p className="mt-5 text-[1.02rem] leading-relaxed text-paper-muted">
            {lead}
          </p>
        </Reveal>
      )}
    </div>
  );
}
