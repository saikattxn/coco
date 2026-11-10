"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";
import { FormAlert, TextField } from "@/components/ui/fields";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  const e = state && !state.ok ? state.errors ?? {} : {};
  return (
    <form action={action} className="mt-6 space-y-4" noValidate>
      <FormAlert error={e._form} />
      <TextField label="Email" name="email" type="email" autoComplete="username" required error={e.email} />
      <TextField label="Password" name="password" type="password" autoComplete="current-password" required error={e.password} />
      <button className="btn btn-primary w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      <p className="text-xs text-ink-soft">Forgotten your password? Ask a Super Admin to reset it.</p>
    </form>
  );
}
