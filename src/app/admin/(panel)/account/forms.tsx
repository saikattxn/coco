"use client";

import { useActionState, useState, useTransition } from "react";
import { changePasswordAction, confirmMfaAction, disableMfaAction, startMfaAction } from "./actions";
import { TextField } from "@/components/ui/fields";
import { Flash, smallBtn } from "@/components/admin/ui";
import { Submit } from "@/components/admin/submit";

export function PasswordForm() {
  const [state, action] = useActionState(changePasswordAction, null);
  const e = state && !state.ok ? state.errors ?? {} : {};
  return (
    <form action={action} className="max-w-sm space-y-3">
      <Flash message={state?.ok ? state.message : null} />
      <TextField label="Current password" name="current" type="password" autoComplete="current-password" error={e.current} />
      <TextField label="New password" name="next" type="password" autoComplete="new-password" error={e.next} hint="At least 12 characters, with letters and numbers." />
      <TextField label="Confirm new password" name="confirm" type="password" autoComplete="new-password" error={e.confirm} />
      <Submit variant="small">Change password</Submit>
    </form>
  );
}

export function MfaSetup({ enabled }: { enabled: boolean }) {
  const [setup, setSetup] = useState<{ secret: string; qr: string } | null>(null);
  const [pending, start] = useTransition();
  const [confirmState, confirm] = useActionState(confirmMfaAction, null);
  const [disableState, disable] = useActionState(disableMfaAction, null);

  if (enabled || confirmState?.ok) {
    return (
      <form action={disable} className="max-w-sm space-y-3">
        <Flash message={confirmState?.ok ? confirmState.message : disableState?.ok ? disableState.message : null} />
        <p className="text-sm">Two-step verification is <strong>on</strong>. You&apos;ll be asked for a code from your authenticator app when you sign in.</p>
        <TextField label="Current code (to turn it off)" name="code" inputMode="numeric" autoComplete="one-time-code" error={disableState && !disableState.ok ? disableState.errors?.code : undefined} />
        <Submit variant="small">Turn off</Submit>
      </form>
    );
  }
  if (!setup) {
    return (
      <div className="max-w-md space-y-3 text-sm">
        <Flash message={disableState?.ok ? disableState.message : null} />
        <p>Add a second step to signing in using an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password…). Recommended for managers and admins.</p>
        <button type="button" className={smallBtn} disabled={pending} onClick={() => start(async () => setSetup(await startMfaAction()))}>{pending ? "Preparing…" : "Set up two-step verification"}</button>
      </div>
    );
  }
  return (
    <form action={confirm} className="max-w-md space-y-3 text-sm">
      <p>1. Scan this code with your authenticator app.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={setup.qr} alt="QR code for your authenticator app" width={220} height={220} className="rounded-lg border border-line" />
      <p className="text-ink-soft">Can&apos;t scan? Enter this key: <code className="break-all font-mono">{setup.secret}</code></p>
      <p>2. Enter the 6-digit code it shows.</p>
      <TextField label="Code" name="code" inputMode="numeric" autoComplete="one-time-code" error={confirmState && !confirmState.ok ? confirmState.errors?.code : undefined} />
      <Submit variant="small">Turn on</Submit>
    </form>
  );
}
