import { NextResponse, type NextRequest } from "next/server";
import { runMaintenance } from "@/server/maintenance";
import { cronUnauthorized } from "@/server/cron";

/** GET /api/v1/cron/maintenance — data retention & housekeeping (daily). */
export async function GET(req: NextRequest) {
  const denied = cronUnauthorized(req);
  if (denied) return denied;
  return NextResponse.json(await runMaintenance());
}
