import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiAuth, csvResponse, toCsv } from "@/server/api";
import { audit } from "@/server/audit";
import { dateOnly, dateOnlyIso, londonTime } from "@/lib/time";

/** GET /api/v1/admin/reservations/export?from=YYYY-MM-DD&to=YYYY-MM-DD[&status=] — CSV download. */
export async function GET(req: NextRequest) {
  const auth = await apiAuth(req, "reservations.export");
  if ("response" in auth) return auth.response;
  const sp = req.nextUrl.searchParams;
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return new Response("from and to dates are required", { status: 400 });
  const status = sp.get("status");
  const rows = await db.reservation.findMany({
    where: { serviceDate: { gte: dateOnly(from), lte: dateOnly(to) }, ...(status ? { status: status as never } : {}) },
    include: { customer: true, table: true },
    orderBy: { startsAt: "asc" },
  });
  const canSeeContact = auth.user.permissions.has("customers.read");
  const csv = toCsv([
    ["Reference", "Date", "Time", "Guests", "Status", "Source", "Name", ...(canSeeContact ? ["Phone", "Email"] : []), "Table", "Occasion", "Requests", "Created"],
    ...rows.map((r) => [
      r.reference,
      dateOnlyIso(r.serviceDate),
      londonTime(r.startsAt),
      r.partySize,
      r.status,
      r.source,
      r.customer.name,
      ...(canSeeContact ? [r.customer.phone, r.customer.email.endsWith("invalid") ? "" : r.customer.email] : []),
      r.table?.label ?? "",
      r.occasion ?? "",
      r.specialRequests ?? "",
      r.createdAt.toISOString(),
    ]),
  ]);
  await audit({ userId: auth.user.id, action: "reservation.export", entityType: "Reservation", summary: `Exported ${rows.length} reservations (${from} to ${to})` });
  return csvResponse(`reservations-${from}-to-${to}.csv`, csv);
}
