import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiAuth, csvResponse, toCsv } from "@/server/api";
import { audit } from "@/server/audit";

/** GET /api/v1/admin/customers/export[?consent=1] — customer list CSV (marketing opt-ins only with consent=1). */
export async function GET(req: NextRequest) {
  const auth = await apiAuth(req, "customers.write");
  if ("response" in auth) return auth.response;
  const consentOnly = req.nextUrl.searchParams.get("consent") === "1";
  const rows = await db.customer.findMany({
    where: { anonymisedAt: null, email: { not: { endsWith: "invalid" } }, ...(consentOnly ? { marketingConsent: true } : {}) },
    include: { _count: { select: { reservations: true } } },
    orderBy: { name: "asc" },
  });
  await audit({ userId: auth.user.id, action: "customer.export_list", entityType: "Customer", summary: `Exported ${rows.length} customers${consentOnly ? " (marketing opt-ins)" : ""}` });
  return csvResponse(
    consentOnly ? "marketing-opt-ins.csv" : "customers.csv",
    toCsv([["Name", "Email", "Phone", "Bookings", "Marketing consent", "Consent date", "Consent source"], ...rows.map((c) => [c.name, c.email, c.phone, c._count.reservations, c.marketingConsent ? "yes" : "no", c.marketingConsentAt?.toISOString() ?? "", c.consentSource ?? ""])]),
  );
}
