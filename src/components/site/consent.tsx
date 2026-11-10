"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState, useSyncExternalStore } from "react";

type Consent = { analytics: boolean; marketing: boolean };
const COOKIE = "ct_consent";
const OPEN_EVENT = "ct:open-consent";

const CHANGE_EVENT = "ct:consent-changed";

function cookieValue(): string {
  return document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE}=`))?.split("=")[1] ?? "";
}

function subscribe(cb: () => void) {
  window.addEventListener(CHANGE_EVENT, cb);
  return () => window.removeEventListener(CHANGE_EVENT, cb);
}

function parseConsent(raw: string | null): Consent | null {
  try {
    if (!raw) return null;
    const v = JSON.parse(decodeURIComponent(raw));
    return { analytics: Boolean(v.a), marketing: Boolean(v.m) };
  } catch {
    return null;
  }
}

function readConsent(): Consent | null {
  return parseConsent(cookieValue());
}

function writeConsent(c: Consent) {
  const value = encodeURIComponent(JSON.stringify({ a: c.analytics ? 1 : 0, m: c.marketing ? 1 : 0, t: Date.now() }));
  document.cookie = `${COOKIE}=${value}; Max-Age=${180 * 86400}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function openConsentSettings() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/**
 * Cookie consent (PECR / UK GDPR): nothing non-essential loads until the visitor opts in.
 * Google Consent Mode defaults to "denied"; GTM is only injected after analytics consent.
 */
export function ConsentManager({ gtmId }: { gtmId?: string }) {
  // null on the server, "" when no choice has been made yet, otherwise the stored cookie
  const raw = useSyncExternalStore(subscribe, cookieValue, () => null);
  const consent = parseConsent(raw);
  const [reopened, setReopened] = useState(false);
  const [custom, setCustom] = useState<Consent>({ analytics: false, marketing: false });
  const [showDetails, setShowDetails] = useState(false);
  const open = raw !== null && (raw === "" || reopened);

  useEffect(() => {
    const reopen = () => {
      setCustom(readConsent() ?? { analytics: false, marketing: false });
      setShowDetails(true);
      setReopened(true);
    };
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, []);

  function save(c: Consent) {
    writeConsent(c);
    setReopened(false);
    window.dataLayer = window.dataLayer || [];
    // gtag() must push the arguments object itself
    const gtag = function (...args: unknown[]) { void args; window.dataLayer!.push(arguments as unknown as Record<string, unknown>); }; // eslint-disable-line prefer-rest-params
    gtag("consent", "update", {
      analytics_storage: c.analytics ? "granted" : "denied",
      ad_storage: c.marketing ? "granted" : "denied",
      ad_user_data: c.marketing ? "granted" : "denied",
      ad_personalization: c.marketing ? "granted" : "denied",
    });
  }

  return (
    <>
      {gtmId && consent?.analytics && (
        <>
          <Script id="consent-default" strategy="afterInteractive">{`
            window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
            gtag('consent','default',{analytics_storage:'granted',ad_storage:'${consent.marketing ? "granted" : "denied"}',ad_user_data:'${consent.marketing ? "granted" : "denied"}',ad_personalization:'${consent.marketing ? "granted" : "denied"}'});
          `}</Script>
          <Script id="gtm" strategy="afterInteractive" src={`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`} />
        </>
      )}
      {open && (
        <div role="dialog" aria-modal="false" aria-labelledby="consent-title" className="fixed inset-x-3 bottom-20 z-[60] mx-auto max-w-xl rounded-2xl border border-line bg-ivory p-5 text-ink shadow-[0_18px_50px_-20px_rgba(58,14,23,.45)] lg:bottom-6">
          <h2 id="consent-title" className="font-display text-2xl text-wine">Cookies on this site</h2>
          <p className="mt-2 text-sm text-ink-soft">
            We use essential cookies to make the site work. With your permission we&apos;d also like to use analytics cookies to understand how the site is used. See our{" "}
            <Link href="/cookies" className="underline">cookie policy</Link>.
          </p>
          {showDetails && (
            <fieldset className="mt-4 space-y-3 text-sm">
              <legend className="sr-only">Choose cookies</legend>
              <label className="flex items-start gap-3">
                <input type="checkbox" checked disabled className="mt-1 size-4" />
                <span><strong>Essential</strong> — booking, security and remembering this choice. Always on.</span>
              </label>
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 size-4 accent-[#5a1724]" checked={custom.analytics} onChange={(e) => setCustom({ ...custom, analytics: e.target.checked })} />
                <span><strong>Analytics</strong> — Google Analytics, to see which pages help guests book.</span>
              </label>
              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 size-4 accent-[#5a1724]" checked={custom.marketing} onChange={(e) => setCustom({ ...custom, marketing: e.target.checked })} />
                <span><strong>Marketing</strong> — measuring advertising campaigns.</span>
              </label>
            </fieldset>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" onClick={() => save({ analytics: true, marketing: true })}>Accept all</button>
            <button type="button" className="btn btn-outline text-wine" onClick={() => save({ analytics: false, marketing: false })}>Reject non-essential</button>
            {showDetails ? (
              <button type="button" className="btn text-wine underline" onClick={() => save(custom)}>Save choices</button>
            ) : (
              <button type="button" className="btn text-wine underline" onClick={() => setShowDetails(true)}>Choose</button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function CookieSettingsButton() {
  return (
    <button type="button" className="btn btn-outline text-wine" onClick={openConsentSettings}>
      Change cookie settings
    </button>
  );
}
