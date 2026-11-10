"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePermission } from "@/server/auth";
import { audit } from "@/server/audit";

const schema = z.object({ kind: z.enum(["contact", "event"]), id: z.string(), status: z.enum(["NEW", "IN_PROGRESS", "RESPONDED", "CLOSED", "SPAM"]), internalNotes: z.string().max(3000).optional() });

export async function updateEnquiryAction(fd: FormData) {
  const user = await requirePermission("enquiries.write");
  const p = schema.parse({ kind: fd.get("kind"), id: fd.get("id"), status: fd.get("status"), internalNotes: fd.get("internalNotes") ?? undefined });
  const data = { status: p.status, internalNotes: p.internalNotes || null };
  if (p.kind === "contact") await db.contactEnquiry.update({ where: { id: p.id }, data });
  else await db.eventEnquiry.update({ where: { id: p.id }, data });
  await audit({ userId: user.id, action: "enquiry.update", entityType: p.kind === "contact" ? "ContactEnquiry" : "EventEnquiry", entityId: p.id, summary: `Enquiry marked ${p.status.toLowerCase().replace("_", " ")}` });
  refresh();
}
