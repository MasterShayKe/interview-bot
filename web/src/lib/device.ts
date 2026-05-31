export interface ClientContext {
  deviceType: "mobile" | "tablet" | "desktop";
  os: string;
  browser: string;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  touch: boolean;
  timezone: string;
  locale: string;
  referrer: string;
  viewportWidth: number;
  returningVisitor: boolean;
  visitCount: number;
  localHour: number;
  sessionStartedAt: number;
  networkType?: string;
  headlessBrowser: boolean;
  webdriver: boolean;
}

const VISIT_KEY = "ib_vc";

export function collectClientContext(): ClientContext {
  const ua = navigator.userAgent;

  const touch = navigator.maxTouchPoints > 0;
  const vw = window.innerWidth;
  const deviceType: "mobile" | "tablet" | "desktop" =
    vw < 768 ? "mobile" : vw < 1024 && touch ? "tablet" : "desktop";

  let os = "Unknown";
  if (/iPhone/.test(ua)) os = "iOS (iPhone)";
  else if (/iPad/.test(ua)) os = "iPadOS";
  else if (/Android/.test(ua)) {
    const model = ua.match(/Android [^;]+; ([^)]+)/)?.[1];
    os = model ? `Android (${model.trim()})` : "Android";
  } else if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Windows NT 10/.test(ua)) os = "Windows 10/11";
  else if (/Windows NT/.test(ua)) os = "Windows";
  else if (/Linux/.test(ua)) os = "Linux";

  let browser = "Unknown";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/.test(ua)) browser = "Opera";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua)) browser = "Safari";

  const visitCount = parseInt(localStorage.getItem(VISIT_KEY) ?? "0") + 1;
  localStorage.setItem(VISIT_KEY, String(visitCount));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conn = (navigator as any).connection ?? (navigator as any).mozConnection ?? (navigator as any).webkitConnection;
  const networkType: string | undefined = conn?.effectiveType ?? conn?.type;

  const headlessBrowser =
    navigator.plugins.length === 0 && !touch && /HeadlessChrome/.test(ua);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const webdriver = Boolean((navigator as any).webdriver);

  return {
    deviceType,
    os,
    browser,
    screenWidth: screen.width,
    screenHeight: screen.height,
    pixelRatio: window.devicePixelRatio ?? 1,
    touch,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: navigator.language,
    referrer: document.referrer,
    viewportWidth: vw,
    returningVisitor: visitCount > 1,
    visitCount,
    localHour: new Date().getHours(),
    sessionStartedAt: Date.now(),
    networkType,
    headlessBrowser,
    webdriver,
  };
}

export function getSessionDuration(startedAt: number): number {
  return Math.round((Date.now() - startedAt) / 1000);
}
