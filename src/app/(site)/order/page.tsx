import type { Metadata } from "next";
import Link from "next/link";
import { getActiveOffers, getOpeningHours, getSite } from "@/server/public-data";
import { PageHero } from "@/components/site/section";
import { TrackedLink } from "@/components/site/tracked-link";
import { summariseHours } from "@/lib/hours";
import { telHref } from "@/lib/format";

export const metadata: Metadata = {
  title: "Order online — Indian takeaway in Princes Risborough",
  description: "Order Coco Tamarind for collection or delivery. Pay by card, cash or Apple Pay.",
  alternates: { canonical: "/order" },
};

export default async function OrderPage() {
  const [site, offers, { hours }] = await Promise.all([getSite(), getActiveOffers(), getOpeningHours()]);
  const collectionOffer = offers.find((o) => o.type === "COLLECTION_DISCOUNT");
  return (
    <>
      <PageHero title="Takeaway, collection & delivery" intro="Our full menu is available to order online for collection or delivery. You'll be taken to our secure ordering service to choose dishes and pay.">
        <div className="mt-8 flex flex-wrap gap-3">
          {site.orderingEnabled ? (
            <TrackedLink href={site.orderingUrl} event="order_click" className="btn btn-gold">Start your order</TrackedLink>
          ) : (
            <p className="text-ivory/85">Online ordering is currently unavailable — please call us to order.</p>
          )}
          <TrackedLink href={telHref(site.phonePrimary)} event="phone_click" className="btn btn-outline text-ivory">Order by phone</TrackedLink>
        </div>
      </PageHero>
      <div className="wrap grid gap-10 py-16 md:grid-cols-3">
        {collectionOffer && (
          <div className="rounded-2xl border border-gold/60 bg-ivory p-7">
            <h2 className="font-display text-3xl text-wine">{collectionOffer.title}</h2>
            <p className="mt-2 text-ink-soft">{collectionOffer.description}</p>
            <Link href="/offers" className="mt-4 inline-block text-sm underline">Terms</Link>
          </div>
        )}
        <div>
          <h2 className="font-display text-3xl text-wine">Takeaway hours</h2>
          <dl className="mt-3 space-y-2">
            {summariseHours(hours).map((h) => (
              <div key={h.label}><dt className="text-sm text-ink-soft">{h.label}</dt><dd>{h.value}</dd></div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-ink-soft">Pre-orders open from 10am.</p>
        </div>
        <div>
          <h2 className="font-display text-3xl text-wine">Good to know</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-soft">
            <li>Pay by card, cash or Apple Pay.</li>
            <li>Delivery charges depend on distance and are shown at checkout.</li>
            <li>Allergies? Please call us before ordering.</li>
            <li><Link href="/menu" className="underline">Browse the menu</Link> with spice levels and allergen guidance.</li>
          </ul>
        </div>
      </div>
    </>
  );
}
