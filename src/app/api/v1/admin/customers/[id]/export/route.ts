import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiAuth } from "@/server/api";
import { audit } from "@/server/audit";

/** GET /api/v1/admin/customers/:id/export — subject access export (JSON). */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/v1/admin/customers/[id]/export">) {
  const auth = await apiAuth(req, "customers.write");
  if ("response" in auth) return auth.response;
  const { id } = await ctx.params;
  const customer = await db.customer.findUnique({
    where: { id },
    include: { reservations: { select: { reference: true, startsAt: true, partySize: true, status: true, occasion: true, specialRequests: true, createdAt: true, source: true } } },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [subscriber, contacts, events] = await Promise.all([
    db.newsletterSubscriber.findUnique({ where: { email: customer.email }, select: { email: true, consentAt: true, consentSource: true, unsubscribedAt: true } }),
    db.contactEnquiry.findMany({ where: { email: customer.email }, select: { createdAt: true, subject: true, message: true } }),
    db.eventEnquiry.findMany({ where: { email: customer.email }, select: { createdAt: true, eventType: true, eventDate: true, guests: true, message: true } }),
  ]);
  await audit({ userId: auth.user.id, action: "customer.export", entityType: "Customer", entityId: id, summary: "Exported personal data (subject access)" });
  return new NextResponse(JSON.stringify({ exportedAt: new Date(), customer: { ...customer, notes: customer.notes }, newsletter: subscriber, contactEnquiries: contacts, eventEnquiries: events }, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="customer-${id}.json"`, "Cache-Control": "no-store" },
  });
}
