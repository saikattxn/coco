import { db } from "@/lib/db";
import { addDaysIso, londonDateIso, weekdayOf } from "@/lib/time";
import type { ReservationInput } from "@/lib/validation";

/** A London date at least `days` ahead that falls on a Tuesday (all sessions open). */
export function futureTuesday(days = 10) {
  let d = addDaysIso(londonDateIso(new Date()), days);
  while (weekdayOf(d) !== 2) d = addDaysIso(d, 1);
  return d;
}

export async function resetBookingData() {
  await db.notification.deleteMany();
  await db.reservation.deleteMany();
  await db.customer.deleteMany();
  await db.auditLog.deleteMany();
  await db.closureDate.deleteMany({ where: { reason: "Test closure" } });
  await db.bookingSettings.update({
    where: { id: "default" },
    data: { onlineBookingEnabled: true, slotIntervalMinutes: 15, durationSmallMinutes: 90, durationMediumMinutes: 105, durationLargeMinutes: 120, minPartySize: 1, maxOnlinePartySize: 10, autoConfirmMaxParty: 6, maxCoversPerSlot: 30, leadTimeMinutes: 60, maxDaysAhead: 60, lastSeatingMinutesBeforeClose: 30, reminderHoursBefore: 24 },
  });
}

/** Replace the seating plan with a small known one. */
export async function useSeating(tables: { label: string; max: number; min?: number; group?: string }[]) {
  await db.reservation.deleteMany();
  await db.table.deleteMany();
  await db.seatingArea.deleteMany();
  const area = await db.seatingArea.create({ data: { name: "Test area" } });
  await db.table.createMany({ data: tables.map((t, i) => ({ label: t.label, areaId: area.id, minCovers: t.min ?? 1, maxCovers: t.max, combinable: Boolean(t.group), joinGroup: t.group ?? null, sortOrder: i })) });
  return db.table.findMany({ orderBy: { sortOrder: "asc" } });
}

export const guest = (n: number, extra: Partial<ReservationInput> = {}): ReservationInput => ({
  name: `Guest ${n}`,
  email: `guest${n}@example.com`,
  phone: "07700 900000",
  partySize: 2,
  date: futureTuesday(),
  time: "19:00",
  marketingConsent: false,
  specialRequests: undefined,
  ...extra,
});
