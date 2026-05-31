import { useEffect, useMemo, useState } from "react";
import type { ClientContext } from "../lib/device.js";

interface BootLine {
  tag: string;
  text: string;
  color: "ok" | "info" | "dim" | "warn";
}

function parseReferrer(ref: string): string {
  if (!ref) return "";
  if (ref.includes("linkedin")) return "LinkedIn";
  if (ref.includes("github")) return "GitHub";
  if (ref.includes("google")) return "Google";
  if (ref.includes("twitter") || ref.includes("x.com")) return "X / Twitter";
  return "external link";
}

function buildLines(ctx: ClientContext): BootLine[] {
  const lines: BootLine[] = [
    { tag: " sys ", text: "Shay Kopilevich · Interview Agent", color: "info" },
    { tag: " sys ", text: "Model: Claude Sonnet 4.6 · Anthropic SDK · Prompt caching enabled", color: "dim" },
  ];

  const deviceParts = [ctx.deviceType, ctx.os, ctx.browser].filter(Boolean);
  lines.push({ tag: "  OK  ", text: `Visitor: ${deviceParts.join(" · ")}`, color: "ok" });

  if (ctx.timezone || ctx.locale) {
    const parts = [ctx.locale, ctx.timezone].filter(Boolean);
    lines.push({ tag: "  OK  ", text: `Locale: ${parts.join(" · ")}`, color: "ok" });
  }

  if (ctx.screenWidth) {
    lines.push({
      tag: "  OK  ",
      text: `Display: ${ctx.screenWidth}×${ctx.screenHeight} @ ${ctx.pixelRatio}x pixel ratio`,
      color: "ok",
    });
  }

  const refSrc = parseReferrer(ctx.referrer);
  if (refSrc) {
    lines.push({ tag: "  OK  ", text: `Arrived from: ${refSrc}`, color: "ok" });
  }

  if (ctx.networkType) {
    lines.push({ tag: "  OK  ", text: `Network: ${ctx.networkType}`, color: "ok" });
  }

  lines.push({
    tag: "  OK  ",
    text: ctx.returningVisitor
      ? `Session: Returning visitor (visit #${ctx.visitCount})`
      : "Session: First visit",
    color: "ok",
  });

  if (ctx.webdriver || ctx.headlessBrowser) {
    lines.push({ tag: " warn ", text: "Automated browser detected", color: "warn" });
  }

  lines.push({ tag: " sys ", text: "System ready. Type / for commands.", color: "info" });

  return lines;
}

const LINE_MS = 170;
const HOLD_MS = 550;

interface Props {
  clientContext: ClientContext;
  onDone: () => void;
}

const tagClass: Record<BootLine["color"], string> = {
  ok: "text-accent",
  info: "text-white/60",
  dim: "text-white/25",
  warn: "text-yellow-400/70",
};

const textClass: Record<BootLine["color"], string> = {
  ok: "text-white/70",
  info: "text-white/50",
  dim: "text-white/25",
  warn: "text-yellow-300/60",
};

export default function BootSequence({ clientContext, onDone }: Props) {
  const lines = useMemo(() => buildLines(clientContext), []);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    lines.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCount(i + 1), 250 + i * LINE_MS));
    });

    timers.push(setTimeout(onDone, 250 + lines.length * LINE_MS + HOLD_MS));

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      className="flex flex-1 flex-col justify-center py-10 cursor-default select-none"
      onClick={onDone}
      role="status"
      aria-label="Loading"
    >
      <div className="space-y-1.5 font-mono text-[0.78rem] leading-relaxed">
        {lines.slice(0, visibleCount).map((line, i) => (
          <div key={i} className="flex items-baseline gap-3 animate-fade-up">
            <span className={`shrink-0 ${tagClass[line.color]}`}>
              [{line.tag}]
            </span>
            <span className={textClass[line.color]}>{line.text}</span>
          </div>
        ))}

        {visibleCount < lines.length && (
          <div className="flex items-baseline gap-3">
            <span className="shrink-0 text-white/15">[ ... ]</span>
            <span className="inline-block h-[0.85em] w-[6px] translate-y-[0.1em] animate-blink bg-accent/50 align-middle" />
          </div>
        )}
      </div>

      {visibleCount > 0 && visibleCount < lines.length && (
        <p className="mt-8 font-mono text-[0.6rem] uppercase tracking-[0.15em] text-white/15">
          Click to skip
        </p>
      )}
    </div>
  );
}
