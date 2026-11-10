import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient | typeof db;

export async function audit(
  entry: {
    userId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    summary: string;
    diff?: Prisma.InputJsonValue;
    ipAddress?: string | null;
  },
  tx: Tx = db,
) {
  await tx.auditLog.create({ data: { ...entry, userId: entry.userId ?? null } });
}
