import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiAuth } from "@/server/api";
import { BookingError, changeStatus, updateReservation } from "@/server/booking/service";

const patchSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]).optional(),
  reason: z.string().max(300).optional(),
  notify: z.boolean().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  partySize: z.number().int().min(1).max(60).optional(),
  tableId: z.string().optional(),
});

/** PATCH /api/v1/admin/reservations/:id — change status and/or date, time, party size, table. */
export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/v1/admin/reservations/[id]">) {
  const auth = await apiAuth(req, "reservations.write");
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;
  const p = patchSchema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Validation failed", issues: p.error.issues }, { status: 400 });
  try {
    let result;
    if (p.data.date && p.data.time && p.data.partySize) {
      result = await updateReservation(id, { date: p.data.date, time: p.data.time, partySize: p.data.partySize, tableId: p.data.tableId, notify: p.data.notify }, auth.user.id);
    }
    if (p.data.status) result = await changeStatus(id, p.data.status, { userId: auth.user.id, reason: p.data.reason, notify: p.data.notify });
    if (!result) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    return NextResponse.json({ id: result.id, reference: result.reference, status: result.status, startsAt: result.startsAt, partySize: result.partySize });
  } catch (e) {
    if (e instanceof BookingError) return NextResponse.json({ error: e.message, code: e.code }, { status: e.code === "NOT_FOUND" ? 404 : 409 });
    throw e;
  }
}
