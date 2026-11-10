/** Conversion events. Sent to our own counter (no personal data) and to GA4 via the dataLayer if consented. */
export const TRACKED_EVENTS = [
  "booking_started",
  "reservation_completed",
  "order_click",
  "phone_click",
  "directions_click",
  "contact_submitted",
  "event_enquiry_submitted",
  "newsletter_signup",
] as const;
export type TrackedEvent = (typeof TRACKED_EVENTS)[number];

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function trackEvent(name: TrackedEvent, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ...params });
    const body = JSON.stringify({ name, path: window.location.pathname });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/v1/events", new Blob([body], { type: "application/json" }));
    else void fetch("/api/v1/events", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true });
  } catch {
    /* tracking must never break the page */
  }
}
