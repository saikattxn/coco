import Link from "next/link";
import { getOpeningHours, getSite } from "@/server/public-data";
import { summariseHours } from "@/lib/hours";
import { telHref } from "@/lib/format";
import { Wordmark } from "./logo";
import { NewsletterForm } from "./newsletter-form";
import { TrackedLink } from "./tracked-link";
import { Year } from "./year";

export async function SiteFooter() {
  const [site, { hours }] = await Promise.all([getSite(), getOpeningHours()]);
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${site.restaurantName}, ${site.addressLine1}, ${site.postcode}`)}`;
  return (
    <footer className="bg-wine-deep pb-24 text-ivory/85 lg:pb-0">
      <div className="wrap grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1.3fr]">
        <div className="space-y-4">
          <Wordmark />
          <address className="not-italic leading-relaxed">
            {site.addressLine1}
            {site.addressLine2 && <>, {site.addressLine2}</>}
            <br />
            {site.town}, {site.postcode}
          </address>
          <TrackedLink href={mapsUrl} event="directions_click" className="inline-block underline decoration-gold underline-offset-4 hover:text-ivory" target="_blank" rel="noopener">
            Get directions
          </TrackedLink>
          {site.parkingInfo && <p className="text-sm">{site.parkingInfo}</p>}
        </div>

        <div>
          <h2 className="mb-3 font-display text-2xl text-ivory">Opening hours</h2>
          <dl className="space-y-2">
            {summariseHours(hours).map((h) => (
              <div key={h.label}>
                <dt className="text-sm text-gold-light">{h.label}</dt>
                <dd>{h.value}</dd>
              </div>
            ))}
          </dl>
          {site.hoursNote && <p className="mt-3 text-sm">{site.hoursNote}</p>}
        </div>

        <div>
          <h2 className="mb-3 font-display text-2xl text-ivory">Get in touch</h2>
          <ul className="space-y-2">
            <li>
              <TrackedLink href={telHref(site.phonePrimary)} event="phone_click" className="hover:text-ivory">{site.phonePrimary}</TrackedLink>
            </li>
            {site.phoneSecondary && (
              <li>
                <TrackedLink href={telHref(site.phoneSecondary)} event="phone_click" className="hover:text-ivory">{site.phoneSecondary}</TrackedLink>
              </li>
            )}
            <li>
              <a href={`mailto:${site.email}`} className="break-all hover:text-ivory">{site.email}</a>
            </li>
          </ul>
          <ul className="mt-5 flex gap-5 text-sm" aria-label="Social media">
            {site.instagramUrl && (
              <li>
                <a href={site.instagramUrl} className="underline decoration-gold underline-offset-4 hover:text-ivory" target="_blank" rel="noopener">Instagram</a>
              </li>
            )}
            {site.facebookUrl && (
              <li>
                <a href={site.facebookUrl} className="underline decoration-gold underline-offset-4 hover:text-ivory" target="_blank" rel="noopener">Facebook</a>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h2 className="mb-3 font-display text-2xl text-ivory">Seasonal menus & offers</h2>
          <NewsletterForm />
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="wrap flex flex-col gap-3 py-6 text-sm text-ivory/60 md:flex-row md:items-center md:justify-between">
          <p>
            © <Year /> {site.restaurantName}. {site.footerNote}
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            <li><Link href="/privacy" className="hover:text-ivory">Privacy</Link></li>
            <li><Link href="/terms" className="hover:text-ivory">Terms</Link></li>
            <li><Link href="/cookies" className="hover:text-ivory">Cookies</Link></li>
            <li><Link href="/admin" className="hover:text-ivory">Staff</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
