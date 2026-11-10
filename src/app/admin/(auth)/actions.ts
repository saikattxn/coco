"use server";

import { redirect } from "next/navigation";
import { attemptLogin, completeMfa, logout } from "@/server/auth";
import { fieldErrors, loginSchema } from "@/lib/validation";
import type { FormState } from "@/app/(site)/actions";

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const res = await attemptLogin(parsed.data.email, parsed.data.password);
  if (!res.ok) return { ok: false, errors: { _form: res.error } };
  redirect(res.mfaRequired ? "/admin/mfa" : safeNext(String(fd.get("next") ?? "")));
}

export async function mfaAction(_: FormState, fd: FormData): Promise<FormState> {
  const res = await completeMfa(String(fd.get("code") ?? ""));
  if (!res.ok) return { ok: false, errors: { _form: res.error } };
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

function safeNext(next: string) {
  return next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
}
