"use server";

import { refresh } from "next/cache";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, requirePermission } from "@/server/auth";
import { audit } from "@/server/audit";
import { fieldErrors } from "@/lib/validation";
import type { FormState } from "@/app/(site)/actions";

const tempPassword = () => randomBytes(12).toString("base64url");

const createSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email.")), roleId: z.string().min(1) });

export async function createStaffAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requirePermission("staff.manage");
  const p = createSchema.safeParse({ name: fd.get("name"), email: fd.get("email"), roleId: fd.get("roleId") });
  if (!p.success) return { ok: false, errors: fieldErrors(p.error) };
  if (await db.user.findUnique({ where: { email: p.data.email } })) return { ok: false, errors: { email: "There's already an account with this email." } };
  const password = tempPassword();
  const created = await db.user.create({ data: { ...p.data, passwordHash: await hashPassword(password) } });
  await audit({ userId: user.id, action: "staff.create", entityType: "User", entityId: created.id, summary: `Created account for ${created.email}` });
  refresh();
  return { ok: true, message: `Account created. Give ${p.data.name} this temporary password in person (it won't be shown again): ${password}` };
}

export async function updateStaffAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requirePermission("staff.manage");
  const id = String(fd.get("id"));
  const op = String(fd.get("op"));
  if (id === user.id && ["deactivate", "role"].includes(op)) return { ok: false, errors: { _form: "You can't change your own role or deactivate yourself." } };
  const target = await db.user.findUniqueOrThrow({ where: { id }, include: { role: true } });
  let message = "";
  if (op === "role") {
    const roleId = String(fd.get("roleId"));
    if (target.role.key === "SUPER_ADMIN") {
      const admins = await db.user.count({ where: { role: { key: "SUPER_ADMIN" }, active: true } });
      if (admins <= 1) return { ok: false, errors: { _form: "There must always be at least one active Super Admin." } };
    }
    await db.user.update({ where: { id }, data: { roleId } });
    await db.session.deleteMany({ where: { userId: id } });
    message = "Role updated. They'll need to sign in again.";
  }
  if (op === "deactivate" || op === "activate") {
    await db.user.update({ where: { id }, data: { active: op === "activate" } });
    if (op === "deactivate") await db.session.deleteMany({ where: { userId: id } });
    message = op === "activate" ? "Account reactivated." : "Account deactivated and signed out everywhere.";
  }
  if (op === "reset") {
    const password = tempPassword();
    await db.user.update({ where: { id }, data: { passwordHash: await hashPassword(password), failedLogins: 0, lockedUntil: null } });
    await db.session.deleteMany({ where: { userId: id } });
    message = `Password reset. Temporary password (shown once): ${password}`;
  }
  if (op === "resetMfa") {
    await db.user.update({ where: { id }, data: { mfaEnabled: false, mfaSecret: null } });
    message = "Two-step verification removed. They can set it up again from My account.";
  }
  await audit({ userId: user.id, action: `staff.${op}`, entityType: "User", entityId: id, summary: `${op} for ${target.email}` });
  refresh();
  return { ok: true, message };
}
