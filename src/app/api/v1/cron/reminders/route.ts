import { NextResponse, type NextRequest } from "next/server";
import { queueReminders } from "@/server/booking/service";
import { processOutbox } from "@/server/notifications/outbox";
import { cronUnauthorized } from "@/server/cron";

/** GET /api/v1/cron/reminders — queue booking reminders, then send (hourly). */
export async function GET(req: NextRequest) {
  const denied = cronUnauthorized(req);
  if (denied) return denied;
  const queued = await queueReminders();
  const sent = await processOutbox(50);
  return NextResponse.json({ queued, ...sent });
}
