// Privacy-conscious analytics abstraction.
//
// No PII is collected here. Events are forwarded to whichever provider is
// present on the page (Plausible or a gtag-style global), and logged in dev.
// To wire a provider, add its script tag to index.html - no code change needed.
// To capture events yourself, define window.__onAnalytics = (name, props) => {}.

export type AnalyticsEvent =
  | "page_view"
  | "resume_download"
  | "resume_request"
  | "contact_click"
  | "linkedin_click"
  | "github_click"
  | "email_click"
  | "suggested_question_click"
  | "chat_started"
  | "message_sent"
  | "chat_error"
  | "chat_completed"
  | "fit_opened"
  | "fit_analyzed";

type Props = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Props }) => void;
    gtag?: (command: string, event: string, params?: Props) => void;
    __onAnalytics?: (event: string, props?: Props) => void;
  }
}

const isDev = Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV);

export function track(event: AnalyticsEvent, props?: Props): void {
  try {
    window.__onAnalytics?.(event, props);
    window.plausible?.(event, props ? { props } : undefined);
    window.gtag?.("event", event, props);
    if (isDev) {
      // eslint-disable-next-line no-console
      console.debug("[analytics]", event, props ?? {});
    }
  } catch {
    // Analytics must never break the app.
  }
}
