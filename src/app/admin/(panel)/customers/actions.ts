"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/server/auth";
import { audit } from "@/server/audit";
import { anonymiseCustomer } from "@/server/maintenance";

export async function consentAction(fd: FormData) {
  const user = await requirePermission("customers.write");
  const id = String(fd.get("id"));
  const grant = fd.get("grant") === "1";
  await db.customer.update({ where: { id }, data: grant ? { marketingConsent: true, marketingConsentAt: new Date(), consentSource: "staff-recorded" } : { marketingConsent: false, marketingConsentAt: null, consentSource: "withdrawn" } });
  await audit({ userId: user.id, action: grant ? "customer.consent_granted" : "customer.consent_withdrawn", entityType: "Customer", entityId: id, summary: grant ? "Recorded marketing consent" : "Withdrew marketing consent" });
  refresh();
}

export async function eraseCustomerAction(fd: FormData) {
  const user = await requirePermission("customers.write");
  const id = String(fd.get("id"));
  if (fd.get("confirm") !== "ERASE") redirect(`/admin/customers/${id}?error=confirm`);
  const upcoming = await db.reservation.count({ where: { customerId: id, startsAt: { gte: new Date() }, status: { in: ["PENDING", "CONFIRMED"] } } });
  if (upcoming > 0) redirect(`/admin/customers/${id}?error=upcoming`);
  await anonymiseCustomer(id, user.id, "erasure request");
  redirect(`/admin/customers/${id}?erased=1`);
}
