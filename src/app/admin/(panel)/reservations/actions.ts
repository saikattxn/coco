"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z } from "zod";
import { requirePermission } from "@/server/auth";
import { BookingError, changeStatus, createReservation, updateReservation, getAvailability } from "@/server/booking/service";
import { kickOutbox } from "@/server/notifications/kick";
import { fieldErrors, formToObject, staffReservationSchema } from "@/lib/validation";
import type { FormState } from "@/app/(site)/actions";
import { db } from "@/lib/db";
import { audit } from "@/server/audit";

export async function staffCreateAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requirePermission("reservations.write");
  const raw = formToObject(fd);
  if (raw.sendEmail === undefined) raw.sendEmail = "false";
  const parsed = staffReservationSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const d = parsed.data;
  let reference: string;
  try {
    const { reservation } = await createReservation(
      { ...d, email: d.email ?? "" },
      { source: d.source, staffUserId: user.id, tableId: d.tableId, status: d.status, staffNotes: d.staffNotes, sendEmail: d.sendEmail },
    );
    reference = reservation.reference;
  } catch (e) {
    if (e instanceof BookingError) return { ok: false, errors: { _form: e.message } };
    throw e;
  }
  kickOutbox();
  redirect(`/admin/reservations/${reference}?created=1`);
}

const statusSchema = z.object({ id: z.string(), to: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]), reason: z.string().max(300).optional(), notify: z.string().optional() });

export async function changeStatusAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requirePermission("reservations.write");
  const p = statusSchema.safeParse(formToObject(fd));
  if (!p.success) return { ok: false, errors: { _form: "Invalid request." } };
  try {
    await changeStatus(p.data.id, p.data.to, { userId: user.id, reason: p.data.reason || undefined, notify: p.data.notify !== "false" });
  } catch (e) {
    if (e instanceof BookingError) return { ok: false, errors: { _form: e.message } };
    throw e;
  }
  kickOutbox();
  refresh();
  return { ok: true, message: `Booking marked ${p.data.to.toLowerCase().replace("_", "-")}.` };
}

const editSchema = z.object({
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Choose a time."),
  partySize: z.coerce.number().int().min(1).max(60),
  tableId: z.string().optional(),
  occasion: z.string().max(60).optional(),
  specialRequests: z.string().max(500).optional(),
  staffNotes: z.string().max(1000).optional(),
  clearChangeRequest: z.string().optional(),
  notify: z.string().optional(),
});

export async function editReservationAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requirePermission("reservations.write");
  const p = editSchema.safeParse(formToObject(fd));
  if (!p.success) return { ok: false, errors: fieldErrors(p.error) };
  try {
    await updateReservation(
      p.data.id,
      {
        date: p.data.date,
        time: p.data.time,
        partySize: p.data.partySize,
        tableId: p.data.tableId || undefined,
        occasion: p.data.occasion || undefined,
        specialRequests: p.data.specialRequests || undefined,
        staffNotes: p.data.staffNotes || undefined,
        clearChangeRequest: p.data.clearChangeRequest === "on",
        notify: p.data.notify === "on",
      },
      user.id,
    );
  } catch (e) {
    if (e instanceof BookingError) return { ok: false, errors: { _form: e.message } };
    throw e;
  }
  kickOutbox();
  refresh();
  return { ok: true, message: "Booking updated." };
}

export async function staffAvailabilityAction(date: string, partySize: number, excludeId?: string) {
  await requirePermission("reservations.read");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !(partySize > 0)) return { slots: [], message: "Choose a date and party size." };
  const res = await getAvailability(date, partySize, { staff: true, excludeId });
  return { slots: res.slots.map((s) => ({ time: s.time, period: s.period, available: s.available })), message: res.message ?? null };
}

export async function saveCustomerNoteAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requirePermission("customers.write");
  const id = String(fd.get("customerId"));
  const notes = String(fd.get("notes") ?? "").slice(0, 2000);
  await db.customer.update({ where: { id }, data: { notes: notes || null } });
  await audit({ userId: user.id, action: "customer.notes", entityType: "Customer", entityId: id, summary: "Updated guest notes" });
  refresh();
  return { ok: true, message: "Guest notes saved." };
}
