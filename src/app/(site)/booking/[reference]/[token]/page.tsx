import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { findByManageToken } from "@/server/booking/service";
import { formatDateLong, formatTime12, londonDateIso, londonTime } from "@/lib/time";
import { getSite } from "@/server/public-data";
import { telHref } from "@/lib/format";
import { ManageActions } from "./manage-actions";

export const metadata: Metadata = { title: "Your booking", robots: { index: false, follow: false } };

const STATUS_COPY: Record<string, { title: string; body: string }> = {
  CONFIRMED: { title: "Your table is confirmed", body: "We look forward to welcoming you." },
  PENDING: { title: "Awaiting confirmation", body: "Our team will confirm your booking by email shortly." },
  CANCELLED: { title: "This booking is cancelled", body: "We hope to see you another time." },
  COMPLETED: { title: "Thank you for dining with us", body: "We hope you enjoyed your visit." },
  NO_SHOW: { title: "We missed you", body: "This booking was marked as not attended. Please call us if this is a mistake." },
};

export default function ManageBookingPage({ params }: PageProps<"/booking/[reference]/[token]">) {
  return (
    <section className="wrap max-w-3xl py-14 md:py-20">
      <Suspense fallback={<p className="text-ink-soft">Loading your booking…</p>}>
        <Booking params={params} />
      </Suspense>
    </section>
  );
}

async function Booking({ params }: { params: PageProps<"/booking/[reference]/[token]">["params"] }) {
  const { reference, token } = await params;
  const [booking, site] = await Promise.all([findByManageToken(decodeURIComponent(reference), decodeURIComponent(token)), getSite()]);
  if (!booking) {
    return (
      <div>
        <h1 className="text-title text-wine">We couldn&apos;t find that booking</h1>
        <p className="mt-3 text-ink-soft">The link may be incomplete. Please use the link in your confirmation email, or call us on <a className="underline" href={telHref(site.phonePrimary)}>{site.phonePrimary}</a>.</p>
        <Link href="/book" className="btn btn-primary mt-6">Make a booking</Link>
      </div>
    );
  }
  const copy = STATUS_COPY[booking.status];
  const editable = ["PENDING", "CONFIRMED"].includes(booking.status) && booking.startsAt > new Date();
  return (
    <div>
      <p className="text-ink-soft">Booking {booking.reference}</p>
      <h1 className="mt-1 text-title text-wine">{copy.title}</h1>
      <p className="mt-3 text-lg">{copy.body}</p>
      <dl className="mt-8 grid gap-5 rounded-2xl border border-line bg-ivory p-6 sm:grid-cols-2">
        <div><dt className="text-sm text-ink-soft">Name</dt><dd className="text-lg">{booking.customer.name}</dd></div>
        <div><dt className="text-sm text-ink-soft">Guests</dt><dd className="text-lg">{booking.partySize}</dd></div>
        <div><dt className="text-sm text-ink-soft">Date</dt><dd className="text-lg">{formatDateLong(londonDateIso(booking.startsAt))}</dd></div>
        <div><dt className="text-sm text-ink-soft">Time</dt><dd className="text-lg">{formatTime12(londonTime(booking.startsAt))}</dd></div>
        {booking.occasion && <div><dt className="text-sm text-ink-soft">Occasion</dt><dd className="text-lg">{booking.occasion}</dd></div>}
        {booking.specialRequests && <div className="sm:col-span-2"><dt className="text-sm text-ink-soft">Special requests</dt><dd>{booking.specialRequests}</dd></div>}
        {booking.changeRequest && <div className="sm:col-span-2"><dt className="text-sm text-ink-soft">Change requested</dt><dd>{booking.changeRequest} <span className="text-ink-soft">(our team will confirm)</span></dd></div>}
      </dl>
      {editable ? (
        <ManageActions reference={booking.reference} token={decodeURIComponent((await params).token)} />
      ) : (
        <Link href="/book" className="btn btn-primary mt-8">Make a new booking</Link>
      )}
      <p className="mt-10 text-sm text-ink-soft">Questions? Call <a className="underline" href={telHref(site.phonePrimary)}>{site.phonePrimary}</a>.</p>
    </div>
  );
}
