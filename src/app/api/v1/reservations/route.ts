import { NextResponse, type NextRequest } from "next/server";
import { reservationSchema, fieldErrors } from "@/lib/validation";
import { BookingError, createReservation } from "@/server/booking/service";
import { rateLimit } from "@/server/rate-limit";
import { processOutbox } from "@/server/notifications/outbox";
import { after } from "next/server";

/**
 * POST /api/v1/reservations — create a guest booking (JSON). Same rules as the booking page.
 * 201 { reference, status, manageUrl } · 400 validation · 409 unavailable/duplicate · 429 rate limited
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await rateLimit(`reserve:${ip}`, 10, 3600))) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const body = await req.json().catch(() => null);
  const parsed = reservationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", fields: fieldErrors(parsed.error) }, { status: 400 });
  try {
    const { reservation, manageToken } = await createReservation(parsed.data);
    after(() => processOutbox(10).catch(() => {}));
    return NextResponse.json(
      { reference: reservation.reference, status: reservation.status, startsAt: reservation.startsAt, partySize: reservation.partySize, manageUrl: `/booking/${reservation.reference}/${manageToken}` },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof BookingError) {
      const status = e.code === "PARTY_SIZE" ? 400 : e.code === "DISABLED" ? 503 : 409;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    throw e;
  }
}
