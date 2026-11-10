"use client";

import { useActionState } from "react";
import { mfaAction } from "../actions";
import { FormAlert, TextField } from "@/components/ui/fields";

export default function MfaPage() {
  const [state, action, pending] = useActionState(mfaAction, null);
  return (
    <main className="grid min-h-dvh place-items-center bg-wine-deep p-5">
      <div className="w-full max-w-sm rounded-2xl bg-ivory p-7 shadow-xl">
        <h1 className="font-display text-3xl text-wine">Two-step verification</h1>
        <p className="mt-2 text-sm text-ink-soft">Enter the 6-digit code from your authenticator app.</p>
        <form action={action} className="mt-5 space-y-4">
          <FormAlert error={state && !state.ok ? state.errors?._form : undefined} />
          <TextField label="Code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]*" maxLength={7} required autoFocus />
          <button className="btn btn-primary w-full" disabled={pending}>{pending ? "Checking…" : "Verify"}</button>
        </form>
      </div>
    </main>
  );
}
