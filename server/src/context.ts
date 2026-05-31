import type { FastifyRequest } from "fastify";

export interface ClientContext {
  deviceType?: string;
  os?: string;
  browser?: string;
  screenWidth?: number;
  screenHeight?: number;
  pixelRatio?: number;
  touch?: boolean;
  timezone?: string;
  locale?: string;
  referrer?: string;
  viewportWidth?: number;
  returningVisitor?: boolean;
  visitCount?: number;
  localHour?: number;
  sessionDurationSeconds?: number;
  networkType?: string;
  headlessBrowser?: boolean;
  webdriver?: boolean;
}

const ISRAELI_ZONES = new Set([
  "Asia/Jerusalem",
  "Asia/Tel_Aviv",
  "Asia/Gaza",
  "Asia/Hebron",
]);

function parseReferrer(referer: string): string {
  if (!referer) return "direct";
  if (/linkedin\.com/.test(referer)) return "LinkedIn";
  if (/github\.com/.test(referer)) return "GitHub";
  if (/google\./.test(referer)) return "Google search";
  if (/bing\.com/.test(referer)) return "Bing search";
  return "external link";
}

function timeOfDay(hour: number): string {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night (late)";
}

function formatDuration(secs: number): string {
  if (secs < 60) return `${secs}s`;
  return `${Math.round(secs / 60)}m`;
}

export function buildVisitorContext(
  req: FastifyRequest,
  client?: ClientContext,
  sessionDurationSeconds?: number,
): string {
  const serverUA = req.headers["user-agent"] ?? "";
  const serverReferer =
    (req.headers["referer"] as string | undefined) ??
    (req.headers["referrer"] as string | undefined) ??
    "";
  const acceptLang = req.headers["accept-language"] ?? "";

  const ctx = client ?? {};

  const device = ctx.deviceType ?? "unknown";
  const os = ctx.os ?? "unknown";
  const browser = ctx.browser ?? "unknown";
  const tz = ctx.timezone ?? "unknown";
  const locale = ctx.locale ?? (acceptLang as string).split(",")[0] ?? "unknown";
  const refSrc = parseReferrer(
    String(ctx.referrer ?? serverReferer),
  );

  const isReturning = ctx.returningVisitor
    ? `Yes (visit #${ctx.visitCount ?? "?"})`
    : "First visit";

  const sameTimezone = ISRAELI_ZONES.has(tz);

  const tod =
    ctx.localHour != null ? timeOfDay(ctx.localHour) : null;

  const durSecs = sessionDurationSeconds ?? ctx.sessionDurationSeconds;
  const sessionDur = durSecs != null ? formatDuration(durSecs) : null;

  const secFlags: string[] = [];
  if (ctx.webdriver) secFlags.push("WebDriver detected (automated browser)");
  if (ctx.headlessBrowser) secFlags.push("Headless Chrome detected");

  // Server-side bot detection as a fallback
  if (!ctx.webdriver && /bot|crawler|spider|scraper/i.test(serverUA)) {
    secFlags.push("Bot/crawler user-agent detected");
  }

  const lines: string[] = [
    "--- VISITOR CONTEXT (real-time, not in the spec) ---",
    `Device: ${device} | OS: ${os} | Browser: ${browser} | Touch input: ${ctx.touch ? "yes" : "no"}`,
  ];

  if (ctx.screenWidth) {
    lines.push(
      `Screen: ${ctx.screenWidth}x${ctx.screenHeight} @ ${ctx.pixelRatio ?? 1}x pixel ratio (viewport: ${ctx.viewportWidth ?? "?"}px)`,
    );
  }

  lines.push(
    `Timezone: ${tz}${sameTimezone ? " (same timezone as Shay - you can mention this)" : ""}`,
    `Locale: ${locale}${tod ? ` | Local time of day: ${tod}` : ""}`,
    `Arrived from: ${refSrc}`,
    `Returning visitor: ${isReturning}`,
  );

  if (sessionDur) lines.push(`Time on page before this message: ${sessionDur}`);
  if (ctx.networkType) lines.push(`Network type: ${ctx.networkType}`);
  if (secFlags.length) lines.push(`Security flags: ${secFlags.join(", ")}`);

  lines.push(
    "",
    "Personalization guidance (apply naturally, never mechanically):",
    "- Mobile visitors: keep answers more concise and avoid wide tables.",
    "- Returning visitors: you may briefly acknowledge they are back.",
    "- Same timezone as Shay: a light nod to the shared geography is fine.",
    "- LinkedIn referrer: this is likely a recruiter who came from his profile; lean into his AI implementation story.",
    "- GitHub referrer: likely a technical reader; go deeper on architecture.",
    "- Session time > 5 minutes: they are engaged; you can go a bit deeper.",
    "- Evening or night: a brief acknowledgment of the late hour is warm but optional.",
    "- WebDriver/headless detected: acknowledge the technical sophistication with a knowing nod (e.g., 'I see you might be probing me programmatically - happy to be stress-tested.').",
    "--- END VISITOR CONTEXT ---",
  );

  return lines.join("\n");
}
