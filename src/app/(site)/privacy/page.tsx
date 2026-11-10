import type { Metadata } from "next";
import { getSite } from "@/server/public-data";
import { LegalPage } from "@/components/site/legal";

export const metadata: Metadata = { title: "Privacy policy", alternates: { canonical: "/privacy" } };

// DRAFT — must be reviewed by the business (and ideally a legal adviser) before launch.
export default async function PrivacyPage() {
  const site = await getSite();
  return (
    <LegalPage title="Privacy policy" updated="10 November 2026">
      <p>This policy explains how {site.restaurantName} (&ldquo;we&rdquo;) collects and uses personal information through this website. We are the data controller. Contact us at <a className="underline" href={`mailto:${site.email}`}>{site.email}</a> or {site.phonePrimary}, or write to us at {site.addressLine1}, {site.addressLine2}, {site.town} {site.postcode}.</p>
      <h2>What we collect and why</h2>
      <ul>
        <li><strong>Table bookings:</strong> name, email, phone, party size, date and time, occasion and any requests you share (which may include allergy information). We use this to manage your booking and contact you about it. Lawful basis: performance of a contract (your booking).</li>
        <li><strong>Enquiries:</strong> the details you send through our contact and celebrations forms, to reply to you. Lawful basis: legitimate interests.</li>
        <li><strong>Marketing emails:</strong> only if you opt in. You can unsubscribe at any time. Lawful basis: consent.</li>
        <li><strong>Website analytics:</strong> only with your consent via our cookie banner (Google Analytics). See our <a className="underline" href="/cookies">cookie policy</a>.</li>
      </ul>
      <p>Online takeaway orders are processed by our ordering provider, Just Order Online, under their own privacy policy.</p>
      <h2>Who we share it with</h2>
      <p>Service providers who help us run the website and send emails (our hosting, database and email delivery providers), acting on our instructions. We do not sell your data.</p>
      <h2>How long we keep it</h2>
      <p>Booking records are kept for up to 24 months after your visit and enquiries for up to 12 months, after which they are anonymised. Marketing consent records are kept for as long as you remain subscribed.</p>
      <h2>Your rights</h2>
      <p>You can ask for a copy of your data, ask us to correct or delete it, object to its use, or withdraw consent at any time by contacting us. You also have the right to complain to the Information Commissioner&apos;s Office (ico.org.uk).</p>
    </LegalPage>
  );
}
