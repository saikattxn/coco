import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { renderTemplate, type TemplateKey, type TemplatePayload } from "./templates";
import { getTransport } from "./transport";

type Tx = Prisma.TransactionClient | typeof db;
const MAX_ATTEMPTS = 5;

/**
 * Queue an email. The idempotency key makes this safe to call more than once for the
 * same event (e.g. a retried request) — only one row, and so one email, results.
 */
export async function enqueueEmail(
  tx: Tx,
  n: { key: string; template: TemplateKey; to: string; payload: TemplatePayload; reservationId?: string },
) {
  const { subject } = renderTemplate(n.template, n.payload); // fail fast on bad payloads
  await tx.notification.createMany({
    data: [
      {
        idempotencyKey: n.key,
        template: n.template,
        recipient: n.to,
        subject,
        payload: n.payload as Prisma.InputJsonValue,
        reservationId: n.reservationId ?? null,
      },
    ],
    skipDuplicates: true,
  });
}

type ClaimedRow = { id: string; idempotencyKey: string; template: string; recipient: string; payload: TemplatePayload; attempts: number };

/** Send due notifications. Rows are claimed with SKIP LOCKED so parallel workers never double-send. */
export async function processOutbox(limit = 20) {
  const claimed = await db.$queryRaw<ClaimedRow[]>`
    UPDATE "Notification" SET "status" = 'SENDING', "attempts" = "attempts" + 1, "updatedAt" = now()
    WHERE "id" IN (
      SELECT "id" FROM "Notification"
      WHERE ("status" IN ('QUEUED', 'FAILED') AND "nextAttemptAt" <= now() AND "attempts" < ${MAX_ATTEMPTS})
         OR ("status" = 'SENDING' AND "updatedAt" < now() - interval '10 minutes' AND "attempts" < ${MAX_ATTEMPTS})
      ORDER BY "createdAt" LIMIT ${limit} FOR UPDATE SKIP LOCKED
    )
    RETURNING "id", "idempotencyKey", "template", "recipient", "payload", "attempts"`;

  const transport = getTransport();
  const results = { sent: 0, failed: 0, skipped: 0 };
  for (const row of claimed) {
    try {
      const msg = renderTemplate(row.template, row.payload);
      const res = await transport.send({ to: row.recipient, ...msg, idempotencyKey: row.idempotencyKey });
      if (res.status === "SENT") {
        await db.notification.update({ where: { id: row.id }, data: { status: "SENT", sentAt: new Date(), providerId: res.providerId, lastError: null } });
        results.sent++;
      } else {
        await db.notification.update({ where: { id: row.id }, data: { status: "SKIPPED", lastError: res.reason } });
        results.skipped++;
      }
    } catch (err) {
      const backoffMin = 2 ** row.attempts; // 2, 4, 8, 16 minutes
      await db.notification.update({
        where: { id: row.id },
        data: {
          status: "FAILED",
          lastError: String(err instanceof Error ? err.message : err).slice(0, 500),
          nextAttemptAt: new Date(Date.now() + backoffMin * 60_000),
        },
      });
      results.failed++;
    }
  }
  return results;
}
