import { NextResponse, type NextRequest } from "next/server";
import { availabilityQuerySchema } from "@/lib/validation";
import { getAvailability } from "@/server/booking/service";
import { rateLimit } from "@/server/rate-limit";

/**
 * GET /api/v1/availability?date=YYYY-MM-DD&partySize=N
 * Public. Returns bookable start times for the date (London time).
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await rateLimit(`availability:${ip}`, 120, 300))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const parsed = availabilityQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid query", issues: parsed.error.issues }, { status: 400 });

  const result = await getAvailability(parsed.data.date, parsed.data.partySize);
  return NextResponse.json(
    {
      date: parsed.data.date,
      partySize: parsed.data.partySize,
      closed: result.closed,
      message: result.message ?? null,
      slots: result.slots.map((s) => ({ time: s.time, period: s.period, available: s.available })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
