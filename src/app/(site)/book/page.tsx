import type { Metadata } from "next";
import Link from "next/link";
import { getPageSeo, getPublicBookingSettings, getSite } from "@/server/public-data";
import { PageHero } from "@/components/site/section";
import { telHref } from "@/lib/format";
import { BookingForm } from "./booking-form";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSeo("/book");
  return {
    title: seo?.title || "Book a table",
    description: seo?.description || "Reserve a table at Coco Tamarind, Askett, Princes Risborough. Instant confirmation by email.",
    alternates: { canonical: "/book" },
  };
}

export default async function BookPage() {
  const [settings, site] = await Promise.all([getPublicBookingSettings(), getSite()]);
  return (
    <>
      <PageHero title="Book a table" intro="Choose your party size and date to see available times. Most bookings are confirmed instantly by email." />
      <div className="wrap grid gap-12 py-12 md:py-16 lg:grid-cols-[1fr_20rem]">
        {settings.onlineBookingEnabled ? (
          <BookingForm settings={settings} />
        ) : (
          <div className="rounded-2xl border border-line bg-ivory p-8">
            <h2 className="font-display text-3xl text-wine">Online booking is paused</h2>
            <p className="mt-2 text-ink-soft">Please call us on <a className="underline" href={telHref(site.phonePrimary)}>{site.phonePrimary}</a> and we&apos;ll be happy to book a table for you.</p>
          </div>
        )}
        <aside className="space-y-6 text-[0.95rem] text-ink-soft">
          <div>
            <h2 className="font-display text-2xl text-wine">Larger groups</h2>
            <p className="mt-1">For more than {settings.maxOnlinePartySize} guests, or to plan a celebration, <Link href="/celebrations" className="underline underline-offset-4">send us an event enquiry</Link>.</p>
          </div>
          <div>
            <h2 className="font-display text-2xl text-wine">Prefer to call?</h2>
            <p className="mt-1">Ring <a href={telHref(site.phonePrimary)} className="underline underline-offset-4">{site.phonePrimary}</a> during opening hours.</p>
          </div>
          <div>
            <h2 className="font-display text-2xl text-wine">Allergies</h2>
            <p className="mt-1">Let us know in the special requests box, and please remind your server when you arrive.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
