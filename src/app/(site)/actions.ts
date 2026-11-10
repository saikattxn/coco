"use server";

import { db } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { formatDateLong } from "@/lib/time";
import { randomToken, sha256 } from "@/lib/tokens";
import {
  changeRequestSchema,
  contactSchema,
  eventEnquirySchema,
  EVENT_TYPES,
  fieldErrors,
  formToObject,
  newsletterSchema,
  reservationSchema,
  type FieldErrors,
} from "@/lib/validation";
import { BookingError, cancelByGuest, createReservation, requestChangeByGuest } from "@/server/booking/service";
import { enqueueEmail } from "@/server/notifications/outbox";
import { kickOutbox } from "@/server/notifications/kick";
import { clientIp, rateLimit } from "@/server/rate-limit";

export type FormState = { ok: boolean; errors?: FieldErrors; message?: string; data?: Record<string, string | number> } | null;

const TOO_MANY: FormState = { ok: false, errors: { _form: "Too many attempts from your connection. Please wait a few minutes or call us." } };

async function limited(name: string, limit: number, windowSec: number) {
  return !(await rateLimit(`${name}:${await clientIp()}`, limit, windowSec));
}

// ───────────────────────────── Reservations ─────────────────────────────

export async function reserveAction(_: FormState, fd: FormData): Promise<FormState> {
  if (await limited("reserve", 10, 3600)) return TOO_MANY;
  const parsed = reservationSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  try {
    const { reservation, manageToken } = await createReservation(parsed.data);
    kickOutbox();
    return {
      ok: true,
      data: {
        reference: reservation.reference,
        status: reservation.status,
        manageUrl: `/booking/${reservation.reference}/${manageToken}`,
        partySize: reservation.partySize,
        date: parsed.data.date,
        time: parsed.data.time,
      },
    };
  } catch (e) {
    if (e instanceof BookingError) return { ok: false, errors: { _form: e.message }, message: e.code };
    console.error("reserveAction failed", e);
    return { ok: false, errors: { _form: "Something went wrong saving your booking. Please try again or call us." } };
  }
}

export async function cancelBookingAction(_: FormState, fd: FormData): Promise<FormState> {
  if (await limited("manage", 20, 3600)) return TOO_MANY;
  try {
    await cancelByGuest(String(fd.get("reference")), String(fd.get("token")));
    kickOutbox();
    return { ok: true, message: "Your booking has been cancelled. We've emailed you a confirmation." };
  } catch (e) {
    if (e instanceof BookingError) return { ok: false, errors: { _form: e.message } };
    throw e;
  }
}

export async function requestChangeAction(_: FormState, fd: FormData): Promise<FormState> {
  if (await limited("manage", 20, 3600)) return TOO_MANY;
  const parsed = changeRequestSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  try {
    await requestChangeByGuest(String(fd.get("reference")), String(fd.get("token")), parsed.data.message);
    kickOutbox();
    return { ok: true, message: "Thank you — we've passed your request to our team and will be in touch to confirm." };
  } catch (e) {
    if (e instanceof BookingError) return { ok: false, errors: { _form: e.message } };
    throw e;
  }
}

// ───────────────────────────── Enquiries ─────────────────────────────

export async function contactAction(_: FormState, fd: FormData): Promise<FormState> {
  if (await limited("contact", 5, 3600)) return TOO_MANY;
  const parsed = contactSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { website: _hp, ...data } = parsed.data;
  await db.$transaction(async (tx) => {
    const enquiry = await tx.contactEnquiry.create({ data });
    const site = await tx.siteSettings.findUniqueOrThrow({ where: { id: "default" } });
    await enqueueEmail(tx, {
      key: `contact:${enquiry.id}:admin`,
      template: "admin.contact",
      to: process.env.ADMIN_NOTIFY_EMAIL || site.email,
      payload: { name: data.name, email: data.email, phoneNumber: data.phone ?? "", subject: data.subject ?? "", message: data.message, adminUrl: appUrl(`/admin/enquiries?tab=contact&id=${enquiry.id}`), restaurantName: site.restaurantName, address: `${site.addressLine1}, ${site.town} ${site.postcode}`, phone: site.phonePrimary },
    });
  });
  kickOutbox();
  return { ok: true, message: "Thank you — your message has been sent. We'll reply as soon as we can." };
}

export async function eventEnquiryAction(_: FormState, fd: FormData): Promise<FormState> {
  if (await limited("event", 5, 3600)) return TOO_MANY;
  const parsed = eventEnquirySchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { website: _hp, ...data } = parsed.data;
  const today = new Date().toISOString().slice(0, 10);
  if (data.eventDate < today) return { ok: false, errors: { eventDate: "Please choose a date in the future." } };
  await db.$transaction(async (tx) => {
    const e = await tx.eventEnquiry.create({ data: { ...data, eventDate: new Date(`${data.eventDate}T00:00:00Z`) } });
    const site = await tx.siteSettings.findUniqueOrThrow({ where: { id: "default" } });
    const payload = {
      name: data.name,
      email: data.email,
      phoneNumber: data.phone,
      eventTypeLabel: EVENT_TYPES[data.eventType],
      guests: data.guests,
      dateLabel: formatDateLong(data.eventDate),
      preferredTime: data.preferredTime ?? "",
      message: [data.message, data.budgetNote ? `Budget: ${data.budgetNote}` : ""].filter(Boolean).join("\n\n"),
      adminUrl: appUrl(`/admin/enquiries?tab=events&id=${e.id}`),
      restaurantName: site.restaurantName,
      address: `${site.addressLine1}, ${site.town} ${site.postcode}`,
      phone: site.phonePrimary,
    };
    await enqueueEmail(tx, { key: `event:${e.id}:admin`, template: "admin.event", to: process.env.ADMIN_NOTIFY_EMAIL || site.email, payload });
    await enqueueEmail(tx, { key: `event:${e.id}:guest`, template: "event.received", to: data.email, payload });
  });
  kickOutbox();
  return { ok: true, message: "Thank you — we've received your enquiry and will be in touch shortly." };
}

export async function subscribeAction(_: FormState, fd: FormData): Promise<NonNullable<FormState>> {
  if (await limited("newsletter", 5, 3600)) return TOO_MANY!;
  const parsed = newsletterSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const existing = await db.newsletterSubscriber.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    if (existing.unsubscribedAt) {
      await db.newsletterSubscriber.update({ where: { id: existing.id }, data: { unsubscribedAt: null, consentAt: new Date(), consentSource: "website-footer" } });
    }
  } else {
    await db.newsletterSubscriber.create({
      data: { email: parsed.data.email, name: parsed.data.name, consentSource: "website-footer", unsubscribeTokenHash: sha256(randomToken()) },
    });
  }
  // Same response either way, so the form can't be used to discover who is subscribed.
  return { ok: true };
}
