import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, type CurrentUser } from "./auth";
import type { PermissionKey } from "./permissions";
import { appUrl } from "@/lib/env";

/**
 * Admin REST endpoints authenticate with the staff session cookie. Mutating requests must
 * also come from our own origin (CSRF protection on top of SameSite=Lax cookies).
 */
export async function apiAuth(req: NextRequest, permission: PermissionKey): Promise<{ user: CurrentUser } | { response: NextResponse }> {
  if (!["GET", "HEAD"].includes(req.method)) {
    const origin = req.headers.get("origin");
    const allowed = new Set([new URL(appUrl()).origin, req.nextUrl.origin]);
    if (!origin || !allowed.has(origin)) return { response: NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 }) };
  }
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  if (!user.permissions.has(permission)) return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { user };
}

export { toCsv } from "./csv";

export function csvResponse(filename: string, csv: string) {
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "no-store" },
  });
}
