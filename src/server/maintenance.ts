import "server-only";
import { db } from "@/lib/db";
import { audit } from "./audit";

export const RETENTION = { reservationMonths: 24, enquiryMonths: 12 };

const monthsAgo = (m: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - m);
  return d;
};

/**
 * Data retention: anonymise customers whose last visit is older than the retention period,
 * and enquiries older than theirs. Also clears expired sessions and stale rate-limit rows.
 */
export async function runMaintenance() {
  const resCutoff = monthsAgo(RETENTION.reservationMonths);
  const stale = await db.customer.findMany({
    where: { anonymisedAt: null, marketingConsent: false, reservations: { every: { startsAt: { lt: resCutoff } } }, createdAt: { lt: resCutoff } },
    select: { id: true },
    take: 500,
  });
  for (const c of stale) await anonymiseCustomer(c.id, null, "retention");

  const enqCutoff = monthsAgo(RETENTION.enquiryMonths);
  const contacts = await db.contactEnquiry.updateMany({
    where: { anonymisedAt: null, createdAt: { lt: enqCutoff } },
    data: { name: "Anonymised", email: "anonymised@invalid", phone: null, message: "[removed]", anonymisedAt: new Date() },
  });
  const events = await db.eventEnquiry.updateMany({
    where: { anonymisedAt: null, createdAt: { lt: enqCutoff } },
    data: { name: "Anonymised", email: "anonymised@invalid", phone: "", message: null, budgetNote: null, anonymisedAt: new Date() },
  });
  const sessions = await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  const limits = await db.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } });
  return { customersAnonymised: stale.length, contactsAnonymised: contacts.count, eventsAnonymised: events.count, sessionsCleared: sessions.count, rateLimitsCleared: limits.count };
}

/** Right to erasure: remove personal data but keep anonymous booking statistics. */
export async function anonymiseCustomer(customerId: string, userId: string | null, reason: string) {
  await db.$transaction(async (tx) => {
    await tx.customer.update({
      where: { id: customerId },
      data: { name: "Anonymised guest", email: `anonymised+${customerId}@invalid`, phone: "", notes: null, marketingConsent: false, marketingConsentAt: null, consentSource: null, anonymisedAt: new Date() },
    });
    await tx.reservation.updateMany({ where: { customerId }, data: { specialRequests: null, staffNotes: null, changeRequest: null, occasion: null } });
    await tx.notification.updateMany({ where: { reservation: { customerId } }, data: { recipient: "anonymised@invalid", payload: {} } });
    await audit({ userId, action: "customer.anonymise", entityType: "Customer", entityId: customerId, summary: `Personal data erased (${reason})` }, tx);
  });
}
