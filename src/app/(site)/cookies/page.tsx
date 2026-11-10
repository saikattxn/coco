import type { Metadata } from "next";
import { LegalPage } from "@/components/site/legal";
import { CookieSettingsButton } from "@/components/site/consent";

export const metadata: Metadata = { title: "Cookie policy", alternates: { canonical: "/cookies" } };

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie policy" updated="10 November 2026">
      <p>We use a small number of cookies. Non-essential cookies are only set if you agree to them.</p>
      <h2>Essential</h2>
      <ul>
        <li><strong>ct_consent</strong> — remembers your cookie choices (6 months).</li>
        <li><strong>ct_admin</strong> — keeps staff signed in to the dashboard (staff only).</li>
      </ul>
      <h2>Analytics (optional)</h2>
      <p>With your consent we use Google Analytics, loaded through Google Tag Manager, to understand how visitors use the site. These cookies (named _ga and _ga_*) last up to 2 years.</p>
      <h2>Maps</h2>
      <p>Our maps are provided by Google and only load when you choose to show them. Google may set its own cookies when they load.</p>
      <h2>Change your choices</h2>
      <CookieSettingsButton />
    </LegalPage>
  );
}
