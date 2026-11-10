import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getActiveOffers } from "@/server/public-data";
import { PageHero } from "@/components/site/section";
import { TrackedLink } from "@/components/site/tracked-link";
import { paragraphs } from "@/lib/format";

export const metadata: Metadata = {
  title: "Offers",
  description: "Current offers at Coco Tamarind, Princes Risborough — collection discounts, seasonal menus and celebration packages.",
  alternates: { canonical: "/offers" },
};

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/London" });

export default async function OffersPage() {
  const offers = await getActiveOffers();
  return (
    <>
      <PageHero title="Offers" intro="Our current offers. Each has its own terms, shown below." />
      <div className="wrap py-14 md:py-20">
        {offers.length === 0 ? (
          <div className="rounded-2xl border border-line bg-ivory p-8">
            <h2 className="font-display text-3xl text-wine">No offers running right now</h2>
            <p className="mt-2 text-ink-soft">Sign up to our emails at the bottom of the page to hear about the next one first.</p>
            <Link href="/book" className="btn btn-primary mt-6">Book a table</Link>
          </div>
        ) : (
          <ul className="grid gap-8 md:grid-cols-2">
            {offers.map((o) => (
              <li key={o.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-ivory">
                {o.imageUrl && (
                  <div className="relative aspect-[16/9] bg-wine/10">
                    <Image src={o.imageUrl} alt={o.imageAlt ?? ""} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-7">
                  <h2 className="font-display text-3xl text-wine">{o.title}</h2>
                  {(o.startsAt || o.endsAt) && (
                    <p className="mt-1 text-sm text-ink-soft">
                      {o.startsAt && `From ${dateFmt.format(o.startsAt)}`} {o.endsAt && `until ${dateFmt.format(o.endsAt)}`}
                    </p>
                  )}
                  <div className="mt-3 space-y-3">{paragraphs(o.description).map((p, i) => <p key={i}>{p}</p>)}</div>
                  <details className="mt-5 text-sm text-ink-soft">
                    <summary className="cursor-pointer font-semibold text-ink">Terms and conditions</summary>
                    <div className="mt-2 space-y-2">{paragraphs(o.terms).map((p, i) => <p key={i}>{p}</p>)}</div>
                  </details>
                  {o.ctaUrl && (
                    <div className="mt-auto pt-6">
                      <TrackedLink href={o.ctaUrl} event="order_click" className="btn btn-primary">{o.ctaLabel || "Find out more"}</TrackedLink>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
