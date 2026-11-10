import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { TRACKED_EVENTS } from "@/lib/track";
import { rateLimit } from "@/server/rate-limit";

const schema = z.object({ name: z.enum(TRACKED_EVENTS), path: z.string().max(200).optional() });

/** POST /api/v1/events — first-party conversion counter (no personal data, no cookies). */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await rateLimit(`events:${ip}`, 60, 300))) return new NextResponse(null, { status: 204 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  await db.analyticsEvent.create({ data: { name: parsed.data.name, path: parsed.data.path?.split("?")[0] } });
  return new NextResponse(null, { status: 204 });
}
