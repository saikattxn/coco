"use server";

import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { hashPassword, newTotp, passwordProblems, requireUser, verifyTotp, SESSION_COOKIE } from "@/server/auth";
import { audit } from "@/server/audit";
import { sha256 } from "@/lib/tokens";
import type { FormState } from "@/app/(site)/actions";

export async function changePasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  const record = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await bcrypt.compare(current, record.passwordHash))) return { ok: false, errors: { current: "Your current password is incorrect." } };
  const problem = passwordProblems(next);
  if (problem) return { ok: false, errors: { next: problem } };
  if (next !== confirm) return { ok: false, errors: { confirm: "The passwords don't match." } };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next) } });
  // Sign out other devices, keep this session
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? "";
  await db.session.deleteMany({ where: { userId: user.id, NOT: { tokenHash: sha256(token) } } });
  await audit({ userId: user.id, action: "auth.password_changed", entityType: "User", entityId: user.id, summary: "Changed password" });
  return { ok: true, message: "Password changed. Other devices have been signed out." };
}

export async function startMfaAction(): Promise<{ secret: string; qr: string }> {
  const user = await requireUser();
  const { secret, uri } = newTotp(user.email);
  // store the pending secret; MFA is only enabled after a code is verified
  await db.user.update({ where: { id: user.id }, data: { mfaSecret: secret, mfaEnabled: false } });
  return { secret, qr: await QRCode.toDataURL(uri, { margin: 1, width: 220 }) };
}

export async function confirmMfaAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const record = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!record.mfaSecret || !verifyTotp(record.mfaSecret, String(fd.get("code") ?? ""))) return { ok: false, errors: { code: "That code didn't match. Try the newest code in your app." } };
  await db.user.update({ where: { id: user.id }, data: { mfaEnabled: true } });
  await audit({ userId: user.id, action: "auth.mfa_enabled", entityType: "User", entityId: user.id, summary: "Turned on two-step verification" });
  refresh();
  return { ok: true, message: "Two-step verification is on." };
}

export async function disableMfaAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const record = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!record.mfaSecret || !verifyTotp(record.mfaSecret, String(fd.get("code") ?? ""))) return { ok: false, errors: { code: "Enter a current code to turn this off." } };
  await db.user.update({ where: { id: user.id }, data: { mfaEnabled: false, mfaSecret: null } });
  await audit({ userId: user.id, action: "auth.mfa_disabled", entityType: "User", entityId: user.id, summary: "Turned off two-step verification" });
  refresh();
  return { ok: true, message: "Two-step verification is off." };
}
