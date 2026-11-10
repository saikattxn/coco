import { NextResponse, type NextRequest } from "next/server";
import { processOutbox } from "@/server/notifications/outbox";
import { cronUnauthorized } from "@/server/cron";

/** GET /api/v1/cron/notifications — send queued emails (every few minutes). */
export async function GET(req: NextRequest) {
  const denied = cronUnauthorized(req);
  if (denied) return denied;
  return NextResponse.json(await processOutbox(50));
}
