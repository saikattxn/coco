"use client";

import { useActionState, useState } from "react";
import { cancelBookingAction, requestChangeAction, type FormState } from "../../../actions";

export function ManageActions({ reference, token }: { reference: string; token: string }) {
  const [mode, setMode] = useState<"none" | "change" | "cancel">("none");
  const [cancelState, cancel, cancelling] = useActionState<FormState, FormData>(cancelBookingAction, null);
  const [changeState, change, changing] = useActionState<FormState, FormData>(requestChangeAction, null);

  if (cancelState?.ok) return <p role="status" className="mt-8 rounded-xl bg-ivory p-5">{cancelState.message}</p>;
  if (changeState?.ok) return <p role="status" className="mt-8 rounded-xl bg-ivory p-5">{changeState.message}</p>;

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" aria-expanded={mode === "change"} onClick={() => setMode(mode === "change" ? "none" : "change")}>Request a change</button>
        <button type="button" className="btn btn-outline text-wine" aria-expanded={mode === "cancel"} onClick={() => setMode(mode === "cancel" ? "none" : "cancel")}>Cancel booking</button>
      </div>

      {mode === "change" && (
        <form action={change} className="rounded-2xl border border-line bg-ivory p-6">
          <input type="hidden" name="reference" value={reference} />
          <input type="hidden" name="token" value={token} />
          <label htmlFor="change-msg" className="field-label">What would you like to change?</label>
          <textarea id="change-msg" name="message" rows={3} className="field" placeholder="e.g. Could we make it 6 guests at 8pm instead?" aria-invalid={Boolean(changeState?.errors?.message)} />
          {changeState?.errors?.message && <p className="field-error">{changeState.errors.message}</p>}
          {changeState?.errors?._form && <p className="field-error" role="alert">{changeState.errors._form}</p>}
          <p className="field-hint">Your current booking stays in place until our team confirms the change.</p>
          <button type="submit" className="btn btn-primary mt-4" disabled={changing}>{changing ? "Sending…" : "Send request"}</button>
        </form>
      )}

      {mode === "cancel" && (
        <form action={cancel} className="rounded-2xl border border-bad/30 bg-[#fbeceb] p-6">
          <input type="hidden" name="reference" value={reference} />
          <input type="hidden" name="token" value={token} />
          <p className="font-semibold">Cancel this booking?</p>
          <p className="mt-1 text-ink-soft">Your table will be released for other guests. This can&apos;t be undone online.</p>
          {cancelState?.errors?._form && <p className="field-error" role="alert">{cancelState.errors._form}</p>}
          <button type="submit" className="btn mt-4 bg-bad text-ivory hover:bg-[#7f1f1f]" disabled={cancelling}>{cancelling ? "Cancelling…" : "Yes, cancel my booking"}</button>
        </form>
      )}
    </div>
  );
}
