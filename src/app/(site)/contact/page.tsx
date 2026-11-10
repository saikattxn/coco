import type { Metadata } from "next";
import { getOpeningHours, getSite } from "@/server/public-data";
import { PageHero } from "@/components/site/section";
import { TrackedLink } from "@/components/site/tracked-link";
import { MapEmbed } from "@/components/site/map-embed";
import { DAY_NAMES, dayLine } from "@/lib/hours";
import { telHref } from "@/lib/format";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact & directions",
  description: "Find Coco Tamarind on Aylesbury Road, Askett, Princes Risborough HP27 9LY. Opening hours, phone, email and free parking.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const [site, { hours, closures }] = await Promise.all([getSite(), getOpeningHours()]);
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${site.restaurantName}, ${site.addressLine1}, ${site.postcode}`)}`;
  return (
    <>
      <PageHero title="Find us" intro={`${site.addressLine1}, ${site.addressLine2}, ${site.town} ${site.postcode}`} />
      <div className="wrap grid gap-12 py-14 md:py-20 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-10">
          <div>
            <h2 className="font-display text-3xl text-wine">Call or email</h2>
            <ul className="mt-3 space-y-1 text-lg">
              <li><TrackedLink href={telHref(site.phonePrimary)} event="phone_click" className="underline decoration-gold underline-offset-4">{site.phonePrimary}</TrackedLink></li>
              {site.phoneSecondary && <li><TrackedLink href={telHref(site.phoneSecondary)} event="phone_click" className="underline decoration-gold underline-offset-4">{site.phoneSecondary}</TrackedLink></li>}
              <li><a href={`mailto:${site.email}`} className="break-all underline decoration-gold underline-offset-4">{site.email}</a></li>
            </ul>
          </div>
          <div>
            <h2 className="font-display text-3xl text-wine">Opening hours</h2>
            <table className="mt-3 w-full max-w-sm text-left">
              <caption className="sr-only">Opening hours by day</caption>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                  <tr key={d} className="border-b border-line">
                    <th scope="row" className="py-2 pr-4 font-normal text-ink-soft">{DAY_NAMES[d]}</th>
                    <td className="py-2">{dayLine(hours, d)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {site.hoursNote && <p className="mt-3 text-sm text-ink-soft">{site.hoursNote}</p>}
            {closures.length > 0 && (
              <p className="mt-2 text-sm text-ink-soft">
                Closed: {closures.map((c) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(c.date)).join(", ")}.
              </p>
            )}
          </div>
          <div>
            <h2 className="font-display text-3xl text-wine">Getting here</h2>
            <p className="mt-2 text-ink-soft">On Aylesbury Road (A4010) in Askett, just outside Princes Risborough. {site.parkingInfo}</p>
            <TrackedLink href={mapsUrl} event="directions_click" target="_blank" rel="noopener" className="btn btn-primary mt-5">Get directions</TrackedLink>
          </div>
        </div>
        <div className="space-y-12">
          <MapEmbed query={`${site.restaurantName}, ${site.addressLine1}, ${site.postcode}`} />
          <div>
            <h2 className="font-display text-3xl text-wine">Send us a message</h2>
            <div className="mt-5"><ContactForm /></div>
          </div>
        </div>
      </div>
    </>
  );
}
