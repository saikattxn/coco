import "server-only";
import { db } from "@/lib/db";
import type { Prisma, ReservationStatus } from "@/generated/prisma/client";
import { appUrl } from "@/lib/env";
import { dateOnly, dateOnlyIso, formatDateLong, formatTime12, londonDateIso, londonTime } from "@/lib/time";
import { bookingReference, manageTokenFor, randomToken, sha256 } from "@/lib/tokens";
import { getAppSecret } from "../secret";
import type { ReservationInput } from "@/lib/validation";
import { enqueueEmail } from "../notifications/outbox";
import { audit } from "../audit";
import {
  allocateTables,
  availabilityForDate,
  canTransition,
  coversStartingInSlot,
  durationFor,
  generateSlots,
  isActive,
  type EngineBooking,
  type EngineSettings,
} from "./engine";

type Tx = Prisma.TransactionClient;

export class BookingError extends Error {
  constructor(
    public code: "UNAVAILABLE" | "CLOSED" | "DUPLICATE" | "PARTY_SIZE" | "DISABLED" | "NOT_FOUND" | "INVALID_STATUS" | "NO_TABLE",
    message: string,
  ) {
    super(message);
  }
}

export async function getBookingSettings(tx: Tx | typeof db = db): Promise<EngineSettings> {
  const s = await tx.bookingSettings.findUnique({ where: { id: "default" } });
  if (!s) throw new Error("Booking settings missing — run the seed script.");
  return s;
}

/** Load everything the engine needs for one date. */
async function loadDay(tx: Tx | typeof db, dateIso: string) {
  // Sequential on purpose: queries inside an interactive transaction share one connection.
  const settings = await getBookingSettings(tx);
  const hours = await tx.openingHours.findMany();
  const closure = await tx.closureDate.findUnique({ where: { date: dateOnly(dateIso) } });
  const tables = await tx.table.findMany({ where: { active: true, area: { active: true } } });
  // include neighbouring days so bookings that cross midnight are respected
  const bookings = await tx.reservation.findMany({
    where: {
      serviceDate: { gte: dateOnly(addDays(dateIso, -1)), lte: dateOnly(addDays(dateIso, 1)) },
      status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
    },
    select: { id: true, startsAt: true, endsAt: true, partySize: true, tableId: true, joinedTableIds: true, status: true, customerId: true, serviceDate: true },
  });
  return { settings, hours, isClosureDate: Boolean(closure), closureReason: closure?.reason, tables, bookings: bookings as (EngineBooking & { serviceDate: Date })[] };
}

function addDays(dateIso: string, n: number) {
  const d = dateOnly(dateIso);
  d.setUTCDate(d.getUTCDate() + n);
  return dateOnlyIso(d);
}

export async function getAvailability(dateIso: string, partySize: number, opts: { staff?: boolean; excludeId?: string } = {}) {
  const day = await loadDay(db, dateIso);
  if (!opts.staff) {
    if (!day.settings.onlineBookingEnabled) return { slots: [], closed: true, message: "Online booking is paused — please call us." };
    if (partySize > day.settings.maxOnlinePartySize) {
      return { slots: [], closed: false, message: `For ${partySize} or more guests, please send us an event enquiry or call us.` };
    }
  }
  if (day.isClosureDate) return { slots: [], closed: true, message: day.closureReason ? `We're closed: ${day.closureReason}.` : "We're closed on this date." };
  const slots = availabilityForDate({ ...day, dateIso, partySize, now: new Date(), staff: opts.staff, excludeId: opts.excludeId });
  return { slots, closed: slots.length === 0, message: slots.length === 0 ? "No times are available on this date." : undefined };
}

function emailPayload(r: { reference: string; partySize: number; startsAt: Date; occasion: string | null; specialRequests: string | null; customer: { name: string; email: string; phone: string } }, site: { restaurantName: string; addressLine1: string; town: string; postcode: string; phonePrimary: string }, secret: string) {
  const manageToken = manageTokenFor(r.reference, secret);
  return {
    name: r.customer.name,
    email: r.customer.email,
    phoneNumber: r.customer.phone,
    reference: r.reference,
    partySize: r.partySize,
    dateLabel: formatDateLong(londonDateIso(r.startsAt)),
    timeLabel: formatTime12(londonTime(r.startsAt)),
    occasion: r.occasion,
    specialRequests: r.specialRequests,
    manageUrl: appUrl(`/booking/${r.reference}/${manageToken}`),
    bookUrl: appUrl("/book"),
    adminUrl: appUrl(`/admin/reservations/${r.reference}`),
    restaurantName: site.restaurantName,
    address: `${site.addressLine1}, ${site.town} ${site.postcode}`,
    phone: site.phonePrimary,
  };
}

async function siteInfo(tx: Tx | typeof db) {
  const s = await tx.siteSettings.findUnique({ where: { id: "default" } });
  if (!s) throw new Error("Site settings missing — run the seed script.");
  return s;
}

const adminRecipient = (site: { email: string }) => process.env.ADMIN_NOTIFY_EMAIL || site.email;

/**
 * Create a reservation. Runs in a transaction holding an advisory lock for the date so
 * concurrent requests are serialised: availability is re-checked under the lock, so two
 * guests can never be given the same table.
 */
export async function createReservation(
  input: ReservationInput & { email?: string },
  opts: { source?: "WEBSITE" | "PHONE" | "WALK_IN" | "STAFF"; staffUserId?: string; tableId?: string; status?: "PENDING" | "CONFIRMED"; staffNotes?: string; sendEmail?: boolean } = {},
) {
  const secret = await getAppSecret();
  const staff = Boolean(opts.staffUserId);
  const email = (input.email || `no-email+${randomToken(6)}@placeholder.invalid`).toLowerCase();

  const result = await db.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${"booking:" + input.date}))::text`;
      const day = await loadDay(tx, input.date);
      const s = day.settings;

      if (!staff) {
        if (!s.onlineBookingEnabled) throw new BookingError("DISABLED", "Online booking is currently paused. Please call us to book.");
        if (input.partySize < s.minPartySize || input.partySize > s.maxOnlinePartySize)
          throw new BookingError("PARTY_SIZE", `Online bookings are for ${s.minPartySize}–${s.maxOnlinePartySize} guests. For larger groups please send an event enquiry or call us.`);
      }
      if (day.isClosureDate) throw new BookingError("CLOSED", "We're closed on that date.");

      const slot = generateSlots({ ...day, dateIso: input.date, partySize: input.partySize, now: new Date(), staff }).find((x) => x.time === input.time);
      if (!slot) throw new BookingError("UNAVAILABLE", "That time isn't available. Please choose another time.");

      if (!staff && coversStartingInSlot(day.bookings, slot.startsAt, s.slotIntervalMinutes) + input.partySize > s.maxCoversPerSlot)
        throw new BookingError("UNAVAILABLE", "Sorry, that time has just been fully booked. Please choose another time.");

      let allocation;
      if (opts.tableId) {
        const table = day.tables.find((t) => t.id === opts.tableId);
        const busy = allocateTables(table ? [table] : [], input.partySize, slot.startsAt, slot.endsAt, day.bookings);
        if (!table || !busy) throw new BookingError("NO_TABLE", "That table is not free (or too small) at this time.");
        allocation = busy;
      } else {
        allocation = allocateTables(day.tables, input.partySize, slot.startsAt, slot.endsAt, day.bookings);
      }
      if (!allocation) throw new BookingError("UNAVAILABLE", "Sorry, that time has just been fully booked. Please choose another time.");

      // Customer record (consent is only ever granted here, never silently withdrawn)
      const existing = input.email ? await tx.customer.findUnique({ where: { email } }) : null;
      const customer = existing
        ? await tx.customer.update({
            where: { id: existing.id },
            data: {
              name: input.name,
              phone: input.phone,
              ...(input.marketingConsent && !existing.marketingConsent ? { marketingConsent: true, marketingConsentAt: new Date(), consentSource: staff ? "staff-booking" : "booking-form" } : {}),
            },
          })
        : await tx.customer.create({
            data: {
              email,
              name: input.name,
              phone: input.phone,
              marketingConsent: Boolean(input.marketingConsent),
              marketingConsentAt: input.marketingConsent ? new Date() : null,
              consentSource: input.marketingConsent ? (staff ? "staff-booking" : "booking-form") : null,
            },
          });

      // Duplicate prevention: one active booking per guest per service period
      const dup = day.bookings.find(
        (b) => b.customerId === customer.id && dateOnlyIso(b.serviceDate) === input.date && isActive(b) && sameService(b.startsAt, slot.startsAt),
      );
      if (dup && input.email) throw new BookingError("DUPLICATE", "You already have a booking for this service. Please use the link in your confirmation email to change it.");

      const status: ReservationStatus = staff ? (opts.status ?? "CONFIRMED") : input.partySize > s.autoConfirmMaxParty ? "PENDING" : "CONFIRMED";

      let reference = bookingReference();
      while (await tx.reservation.findUnique({ where: { reference } })) reference = bookingReference();
      const manageToken = manageTokenFor(reference, secret);

      const reservation = await tx.reservation.create({
        data: {
          reference,
          manageTokenHash: sha256(manageToken),
          customerId: customer.id,
          partySize: input.partySize,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          serviceDate: dateOnly(input.date),
          status,
          source: opts.source ?? "WEBSITE",
          occasion: input.occasion ?? null,
          specialRequests: input.specialRequests ?? null,
          staffNotes: opts.staffNotes ?? null,
          tableId: allocation.tableId,
          joinedTableIds: allocation.joinedTableIds,
          confirmedAt: status === "CONFIRMED" ? new Date() : null,
          createdById: opts.staffUserId ?? null,
        },
        include: { customer: true },
      });

      const site = await siteInfo(tx);
      const payload = emailPayload(reservation, site, secret);
      const sendGuestEmail = Boolean(input.email) && (staff ? opts.sendEmail !== false : true);
      if (sendGuestEmail) {
        await enqueueEmail(tx, {
          key: `reservation:${reservation.id}:created`,
          template: status === "CONFIRMED" ? "reservation.confirmed" : "reservation.pending",
          to: customer.email,
          payload,
          reservationId: reservation.id,
        });
      }
      if (!staff) {
        await enqueueEmail(tx, {
          key: `reservation:${reservation.id}:admin-created`,
          template: "admin.reservation",
          to: adminRecipient(site),
          payload: { ...payload, headline: status === "PENDING" ? "Booking awaiting approval" : "New online booking" },
          reservationId: reservation.id,
        });
      }
      await audit(
        { userId: opts.staffUserId, action: "reservation.create", entityType: "Reservation", entityId: reservation.id, summary: `${reference} created (${status}) for ${input.partySize} on ${input.date} ${input.time}` },
        tx,
      );
      return reservation;
    },
    { timeout: 15_000 },
  );

  return { reservation: result, manageToken: manageTokenFor(result.reference, secret) };
}

/** Same lunch/dinner service: starts within 4 hours of each other on the same day. */
function sameService(a: Date, b: Date) {
  return Math.abs(a.getTime() - b.getTime()) < 4 * 3600_000;
}

export async function findByManageToken(reference: string, token: string) {
  const r = await db.reservation.findUnique({ where: { reference }, include: { customer: true } });
  if (!r || r.manageTokenHash !== sha256(token)) return null;
  return r;
}

export async function cancelByGuest(reference: string, token: string) {
  const r = await findByManageToken(reference, token);
  if (!r) throw new BookingError("NOT_FOUND", "We couldn't find that booking.");
  if (!["PENDING", "CONFIRMED"].includes(r.status)) throw new BookingError("INVALID_STATUS", "This booking can no longer be cancelled online.");
  if (r.startsAt < new Date()) throw new BookingError("INVALID_STATUS", "This booking has already started. Please call us.");
  return changeStatus(r.id, "CANCELLED", { reason: "Cancelled by guest online.", guest: true });
}

export async function requestChangeByGuest(reference: string, token: string, message: string) {
  const secret = await getAppSecret();
  const r = await findByManageToken(reference, token);
  if (!r) throw new BookingError("NOT_FOUND", "We couldn't find that booking.");
  if (!["PENDING", "CONFIRMED"].includes(r.status)) throw new BookingError("INVALID_STATUS", "This booking can't be changed online.");
  await db.$transaction(async (tx) => {
    await tx.reservation.update({ where: { id: r.id }, data: { changeRequest: message } });
    const site = await siteInfo(tx);
    await enqueueEmail(tx, {
      key: `reservation:${r.id}:change-request:${sha256(message).slice(0, 12)}`,
      template: "admin.reservation",
      to: adminRecipient(site),
      payload: { ...emailPayload(r, site, secret), headline: "Guest requested a change", specialRequests: message },
      reservationId: r.id,
    });
    await audit({ action: "reservation.change_request", entityType: "Reservation", entityId: r.id, summary: `${r.reference}: guest requested a change` }, tx);
  });
}

/** Staff or guest status change. Re-checks capacity when a cancelled booking is reinstated. */
export async function changeStatus(
  id: string,
  to: ReservationStatus,
  opts: { userId?: string; reason?: string; guest?: boolean; notify?: boolean } = {},
) {
  const secret = await getAppSecret();
  return db.$transaction(async (tx) => {
    const r = await tx.reservation.findUnique({ where: { id }, include: { customer: true } });
    if (!r) throw new BookingError("NOT_FOUND", "Reservation not found.");
    if (!canTransition(r.status, to)) throw new BookingError("INVALID_STATUS", `Can't change a ${r.status.toLowerCase()} booking to ${to.toLowerCase()}.`);
    if (r.status === to) return r;

    const dateIso = dateOnlyIso(r.serviceDate);
    let tableData = {};
    if (!isActive(r) && isActive({ status: to })) {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${"booking:" + dateIso}))::text`;
      const day = await loadDay(tx, dateIso);
      const keepSame = allocateTables(day.tables.filter((t) => t.id === r.tableId || r.joinedTableIds.includes(t.id)), r.partySize, r.startsAt, r.endsAt, day.bookings, r.id);
      const alloc = keepSame ?? allocateTables(day.tables, r.partySize, r.startsAt, r.endsAt, day.bookings, r.id);
      if (!alloc) throw new BookingError("NO_TABLE", "No table is free for this booking any more, so it can't be reinstated.");
      tableData = { tableId: alloc.tableId, joinedTableIds: alloc.joinedTableIds };
    }

    const updated = await tx.reservation.update({
      where: { id },
      data: {
        status: to,
        ...tableData,
        ...(to === "CONFIRMED" ? { confirmedAt: new Date() } : {}),
        ...(to === "CANCELLED" ? { cancelledAt: new Date(), cancelReason: opts.reason ?? null } : {}),
      },
      include: { customer: true },
    });

    const site = await siteInfo(tx);
    const payload = { ...emailPayload(updated, site, secret), cancelReason: opts.reason ?? null };
    const hasEmail = !updated.customer.email.endsWith("@placeholder.invalid");
    if (hasEmail && opts.notify !== false) {
      if (to === "CANCELLED")
        await enqueueEmail(tx, { key: `reservation:${id}:cancelled:${updated.updatedAt.getTime()}`, template: "reservation.cancelled", to: updated.customer.email, payload, reservationId: id });
      if (to === "CONFIRMED" && r.status === "PENDING")
        await enqueueEmail(tx, {
          key: `reservation:${id}:confirmed:${updated.updatedAt.getTime()}`,
          template: "reservation.confirmed",
          to: updated.customer.email,
          payload,
          reservationId: id,
        });
    }
    if (opts.guest) {
      await enqueueEmail(tx, { key: `reservation:${id}:admin-cancelled`, template: "admin.reservation", to: adminRecipient(site), payload: { ...payload, headline: "Guest cancelled online" }, reservationId: id });
    }
    await audit({ userId: opts.userId, action: `reservation.${to.toLowerCase()}`, entityType: "Reservation", entityId: id, summary: `${r.reference}: ${r.status} → ${to}${opts.reason ? ` (${opts.reason})` : ""}` }, tx);
    return updated;
  });
}

/** Staff edit: date/time/party/table/notes. Re-runs allocation under the date lock(s). */
export async function updateReservation(
  id: string,
  input: { date: string; time: string; partySize: number; tableId?: string; occasion?: string; specialRequests?: string; staffNotes?: string; clearChangeRequest?: boolean; notify?: boolean },
  userId: string,
) {
  const secret = await getAppSecret();
  return db.$transaction(async (tx) => {
    const r = await tx.reservation.findUnique({ where: { id }, include: { customer: true } });
    if (!r) throw new BookingError("NOT_FOUND", "Reservation not found.");
    const oldDate = dateOnlyIso(r.serviceDate);
    for (const d of [...new Set([oldDate, input.date])].sort()) {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${"booking:" + d}))::text`;
    }
    const day = await loadDay(tx, input.date);
    const slot = generateSlots({ ...day, dateIso: input.date, partySize: input.partySize, now: new Date(), staff: true }).find((s) => s.time === input.time);
    if (!slot) throw new BookingError("UNAVAILABLE", "That time is outside opening hours.");

    let alloc;
    if (isActive(r)) {
      const pool = input.tableId ? day.tables.filter((t) => t.id === input.tableId) : day.tables;
      alloc = allocateTables(pool, input.partySize, slot.startsAt, slot.endsAt, day.bookings, r.id);
      if (!alloc) throw new BookingError("NO_TABLE", input.tableId ? "That table isn't free or is too small for this party." : "No table is free for that time and party size.");
    }

    const timingChanged = r.startsAt.getTime() !== slot.startsAt.getTime() || r.partySize !== input.partySize;
    const updated = await tx.reservation.update({
      where: { id },
      data: {
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        serviceDate: dateOnly(input.date),
        partySize: input.partySize,
        occasion: input.occasion ?? null,
        specialRequests: input.specialRequests ?? null,
        staffNotes: input.staffNotes ?? null,
        ...(alloc ? { tableId: alloc.tableId, joinedTableIds: alloc.joinedTableIds } : {}),
        ...(input.clearChangeRequest ? { changeRequest: null } : {}),
        ...(timingChanged ? { reminderSentAt: null } : {}),
      },
      include: { customer: true },
    });
    const hasEmail = !updated.customer.email.endsWith("@placeholder.invalid");
    if (timingChanged && hasEmail && input.notify !== false) {
      const site = await siteInfo(tx);
      await enqueueEmail(tx, { key: `reservation:${id}:modified:${updated.updatedAt.getTime()}`, template: "reservation.modified", to: updated.customer.email, payload: emailPayload(updated, site, secret), reservationId: id });
    }
    await audit({ userId, action: "reservation.update", entityType: "Reservation", entityId: id, summary: `${r.reference} updated: ${input.date} ${input.time}, ${input.partySize} guests` }, tx);
    return updated;
  });
}

/** Queue reminders for confirmed bookings starting within the reminder window. Idempotent. */
export async function queueReminders() {
  const secret = await getAppSecret();
  const s = await db.bookingSettings.findUnique({ where: { id: "default" } });
  if (!s || s.reminderHoursBefore <= 0) return 0;
  const now = new Date();
  const due = await db.reservation.findMany({
    where: { status: "CONFIRMED", reminderSentAt: null, startsAt: { gt: new Date(now.getTime() + 2 * 3600_000), lte: new Date(now.getTime() + s.reminderHoursBefore * 3600_000) } },
    include: { customer: true },
  });
  const site = await siteInfo(db);
  let count = 0;
  for (const r of due) {
    if (r.customer.email.endsWith("@placeholder.invalid")) continue;
    await db.$transaction(async (tx) => {
      await enqueueEmail(tx, { key: `reservation:${r.id}:reminder:${r.startsAt.getTime()}`, template: "reservation.reminder", to: r.customer.email, payload: emailPayload(r, site, secret), reservationId: r.id });
      await tx.reservation.update({ where: { id: r.id }, data: { reminderSentAt: now } });
    });
    count++;
  }
  return count;
}

export { durationFor };
