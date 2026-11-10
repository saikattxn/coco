import type { Metadata } from "next";
import { getSite } from "@/server/public-data";
import { LegalPage } from "@/components/site/legal";

export const metadata: Metadata = { title: "Terms and conditions", alternates: { canonical: "/terms" } };

// DRAFT — booking policies must be confirmed by management before launch.
export default async function TermsPage() {
  const site = await getSite();
  return (
    <LegalPage title="Terms and conditions" updated="10 November 2026">
      <p>These terms apply to table bookings made through this website with {site.restaurantName}.</p>
      <h2>Bookings</h2>
      <ul>
        <li>Your booking is confirmed when you receive a confirmation email. Bookings for larger parties are confirmed by our team.</li>
        <li>Please let us know as early as possible if you need to cancel or change your booking — use the link in your confirmation email or call {site.phonePrimary}.</li>
        <li>Tables are held for a reasonable time after the booked time; please call if you are running late.</li>
      </ul>
      <h2>Allergies</h2>
      <p>Please tell us about any allergy before ordering. Our kitchen handles all 14 major allergens, and while we take care, we cannot guarantee any dish is free from traces.</p>
      <h2>Offers</h2>
      <p>Each offer has its own terms, shown on our offers page. Offers cannot be combined unless stated.</p>
      <h2>Online ordering</h2>
      <p>Takeaway orders are placed through our ordering provider and are subject to its terms at the point of ordering.</p>
    </LegalPage>
  );
}
