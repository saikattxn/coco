import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/server/api";
import { dateOnly } from "@/lib/time";
import { BookingError, createReservation } from "@/server/booking/service";
import { fieldErrors, staffReservationSchema } from "@/lib/validation";

/** GET /api/v1/admin/reservations?date=YYYY-MM-DD — bookings for a day (staff). */
export async function GET(req: NextRequest) {
  const auth = await apiAuth(req, "reservations.read");
  if ("response" in auth) return auth.response;
  const date = req.nextUrl.searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "date is required (YYYY-MM-DD)" }, { status: 400 });
  const rows = await db.reservation.findMany({ where: { serviceDate: dateOnly(date) }, include: { customer: true, table: true }, orderBy: { startsAt: "asc" } });
  return NextResponse.json({
    date,
    reservations: rows.map((r) => ({
      id: r.id,
      reference: r.reference,
      status: r.status,
      source: r.source,
      startsAt: r.startsAt,
      endsAt: r.endsAt,
      partySize: r.partySize,
      table: r.table?.label ?? null,
      joinedTableIds: r.joinedTableIds,
      occasion: r.occasion,
      specialRequests: r.specialRequests,
      customer: { id: r.customer.id, name: r.customer.name, phone: r.customer.phone, email: r.customer.email.endsWith("invalid") ? null : r.customer.email },
    })),
  });
}

/** POST /api/v1/admin/reservations — staff booking (phone / walk-in). */
export async function POST(req: NextRequest) {
  const auth = await apiAuth(req, "reservations.write");
  if ("response" in auth) return auth.response;
  const parsed = staffReservationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", fields: fieldErrors(parsed.error) }, { status: 400 });
  const d = parsed.data;
  try {
    const { reservation } = await createReservation({ ...d, email: d.email ?? "" }, { source: d.source, staffUserId: auth.user.id, tableId: d.tableId, status: d.status, staffNotes: d.staffNotes, sendEmail: d.sendEmail });
    return NextResponse.json({ id: reservation.id, reference: reservation.reference, status: reservation.status }, { status: 201 });
  } catch (e) {
    if (e instanceof BookingError) return NextResponse.json({ error: e.message, code: e.code }, { status: 409 });
    throw e;
  }
}
