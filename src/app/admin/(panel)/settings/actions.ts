"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/server/auth";
import { audit } from "@/server/audit";
import { TAGS } from "@/server/public-data";
import { fieldErrors, formToObject } from "@/lib/validation";
import type { FormState } from "@/app/(site)/actions";

const int = (min: number, max: number) => z.coerce.number().int().min(min).max(max);
const rulesSchema = z.object({
  onlineBookingEnabled: z.string().optional(),
  slotIntervalMinutes: z.coerce.number().refine((v) => [10, 15, 20, 30, 60].includes(v), "Choose 10, 15, 20, 30 or 60."),
  durationSmallMinutes: int(30, 300),
  durationMediumMinutes: int(30, 300),
  durationLargeMinutes: int(30, 360),
  minPartySize: int(1, 10),
  maxOnlinePartySize: int(1, 40),
  autoConfirmMaxParty: int(1, 40),
  maxCoversPerSlot: int(1, 500),
  leadTimeMinutes: int(0, 2880),
  maxDaysAhead: int(1, 365),
  lastSeatingMinutesBeforeClose: int(0, 240),
  reminderHoursBefore: int(0, 72),
});

export async function saveRulesAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requirePermission("settings.write");
  const p = rulesSchema.safeParse(formToObject(fd));
  if (!p.success) return { ok: false, errors: fieldErrors(p.error) };
  if (p.data.minPartySize > p.data.maxOnlinePartySize) return { ok: false, errors: { maxOnlinePartySize: "Must be at least the minimum party size." } };
  await db.bookingSettings.update({ where: { id: "default" }, data: { ...p.data, onlineBookingEnabled: p.data.onlineBookingEnabled === "on" } });
  await audit({ userId: user.id, action: "settings.booking", entityType: "BookingSettings", summary: "Updated booking rules", diff: p.data });
  updateTag(TAGS.booking);
  refresh();
  return { ok: true, message: "Booking rules saved. They apply to new bookings straight away." };
}

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export async function saveHoursAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requirePermission("settings.write");
  const rows = await db.openingHours.findMany();
  for (const r of rows) {
    const opensAt = String(fd.get(`${r.id}.opensAt`) ?? "");
    const closesAt = String(fd.get(`${r.id}.closesAt`) ?? "");
    const isClosed = fd.get(`${r.id}.closed`) === "on";
    if (!isClosed && (!time.safeParse(opensAt).success || !time.safeParse(closesAt).success || opensAt >= closesAt)) {
      return { ok: false, errors: { _form: "Each open session needs an opening time before its closing time (24-hour, e.g. 17:30)." } };
    }
    await db.openingHours.update({ where: { id: r.id }, data: { opensAt, closesAt, isClosed } });
  }
  await audit({ userId: user.id, action: "settings.hours", entityType: "OpeningHours", summary: "Updated opening hours" });
  updateTag(TAGS.hours);
  refresh();
  return { ok: true, message: "Opening hours saved and published." };
}

export async function closureAction(fd: FormData) {
  const user = await requirePermission("settings.write");
  if (fd.get("op") === "delete") {
    const id = String(fd.get("id"));
    await db.closureDate.delete({ where: { id } });
    await audit({ userId: user.id, action: "settings.closure_removed", entityType: "ClosureDate", entityId: id, summary: "Removed closure date" });
  } else {
    const date = String(fd.get("date") ?? "");
    const reason = String(fd.get("reason") ?? "").trim().slice(0, 100) || "Closed";
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      await db.closureDate.upsert({ where: { date: new Date(`${date}T00:00:00Z`) }, update: { reason }, create: { date: new Date(`${date}T00:00:00Z`), reason } });
      await audit({ userId: user.id, action: "settings.closure_added", entityType: "ClosureDate", summary: `Closed on ${date}: ${reason}` });
    }
  }
  updateTag(TAGS.hours);
  refresh();
}

const tableSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().min(1).max(12),
  areaId: z.string().min(1),
  minCovers: int(1, 40),
  maxCovers: int(1, 40),
  joinGroup: z.string().trim().max(30).optional(),
  combinable: z.string().optional(),
  active: z.string().optional(),
});

export async function saveTableAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requirePermission("settings.write");
  const p = tableSchema.safeParse(formToObject(fd));
  if (!p.success) return { ok: false, errors: fieldErrors(p.error) };
  if (p.data.minCovers > p.data.maxCovers) return { ok: false, errors: { maxCovers: "Max must be at least min." } };
  const data = { label: p.data.label, areaId: p.data.areaId, minCovers: p.data.minCovers, maxCovers: p.data.maxCovers, joinGroup: p.data.joinGroup || null, combinable: p.data.combinable === "on", active: p.data.active === "on" };
  const clash = await db.table.findFirst({ where: { areaId: data.areaId, label: data.label, NOT: p.data.id ? { id: p.data.id } : undefined } });
  if (clash) return { ok: false, errors: { label: "That label is already used in this area." } };
  if (p.data.id) await db.table.update({ where: { id: p.data.id }, data });
  else await db.table.create({ data: { ...data, sortOrder: await db.table.count() } });
  await audit({ userId: user.id, action: p.data.id ? "settings.table_update" : "settings.table_add", entityType: "Table", entityId: p.data.id, summary: `${p.data.id ? "Updated" : "Added"} table ${data.label} (${data.minCovers}–${data.maxCovers})` });
  refresh();
  return { ok: true, message: "Table saved." };
}

export async function saveAreaAction(fd: FormData) {
  const user = await requirePermission("settings.write");
  const id = String(fd.get("id") || "");
  const name = String(fd.get("name") ?? "").trim().slice(0, 60);
  const active = fd.get("active") === "on";
  if (!name) return;
  if (id) await db.seatingArea.update({ where: { id }, data: { name, active } });
  else await db.seatingArea.create({ data: { name, sortOrder: await db.seatingArea.count() } });
  await audit({ userId: user.id, action: "settings.area", entityType: "SeatingArea", entityId: id || undefined, summary: `Saved seating area ${name}` });
  refresh();
}

export async function retryEmailAction(fd: FormData) {
  await requirePermission("settings.write");
  await db.notification.update({ where: { id: String(fd.get("id")) }, data: { status: "QUEUED", nextAttemptAt: new Date(), attempts: 0 } });
  refresh();
}
