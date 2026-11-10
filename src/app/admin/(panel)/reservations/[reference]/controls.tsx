"use client";

import { useActionState, useState } from "react";
import { changeStatusAction, editReservationAction, saveCustomerNoteAction } from "../actions";
import { SlotPicker } from "@/components/admin/slot-picker";
import { Submit } from "@/components/admin/submit";
import { Flash } from "@/components/admin/ui";
import { OCCASIONS } from "@/lib/validation";
import { SelectField, TextArea } from "@/components/ui/fields";

const LABELS: Record<string, string> = { CONFIRMED: "Confirm", CANCELLED: "Cancel booking", COMPLETED: "Mark completed", NO_SHOW: "Mark no-show", PENDING: "Move back to pending" };

export function StatusControls({ id, current, allowed }: { id: string; current: string; allowed: string[] }) {
  const [state, action] = useActionState(changeStatusAction, null);
  const [cancelling, setCancelling] = useState(false);
  return (
    <div>
      <Flash message={state?.ok ? state.message : state?.errors?._form} tone={state?.ok ? "ok" : "error"} />
      <form action={action} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="id" value={id} />
        {allowed.filter((s) => s !== "CANCELLED").map((s) => (
          <Submit key={s} variant={s === "CONFIRMED" ? "primary" : "small"} name="to" value={s} pendingLabel="Updating…">{LABELS[s]}</Submit>
        ))}
        {allowed.includes("CANCELLED") && !cancelling && (
          <button type="button" className="inline-flex min-h-9 items-center rounded-lg border border-bad/40 px-3 text-sm font-semibold text-bad" onClick={() => setCancelling(true)}>Cancel booking…</button>
        )}
      </form>
      {cancelling && (
        <form action={action} className="mt-4 space-y-3 rounded-lg border border-bad/30 bg-[#fbeceb] p-4">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="to" value="CANCELLED" />
          <label className="field-label" htmlFor="reason">Reason (included in the guest&apos;s email)</label>
          <input id="reason" name="reason" className="field" placeholder="e.g. Cancelled at guest's request by phone." />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="notify" value="false" className="size-4" /> Don&apos;t email the guest</label>
          <div className="flex gap-2">
            <Submit variant="danger" pendingLabel="Cancelling…">Cancel this booking</Submit>
            <button type="button" className="text-sm underline" onClick={() => setCancelling(false)}>Keep booking</button>
          </div>
        </form>
      )}
      {current === "CANCELLED" && <p className="mt-3 text-sm text-ink-soft">Reinstating checks that a table is still free.</p>}
    </div>
  );
}

export function EditReservation({ id, defaults, tables, hasChangeRequest, canEmail }: { id: string; defaults: { date: string; time: string; partySize: number; tableId: string | null; occasion: string; specialRequests: string; staffNotes: string }; tables: { id: string; label: string; area: string; maxCovers: number }[]; hasChangeRequest: boolean; canEmail: boolean }) {
  const [state, action] = useActionState(editReservationAction, null);
  const e = state && !state.ok ? state.errors ?? {} : {};
  return (
    <form action={action} className="space-y-4">
      <Flash message={state?.ok ? state.message : e._form} tone={state?.ok ? "ok" : "error"} />
      <input type="hidden" name="id" value={id} />
      <SlotPicker defaults={defaults} excludeId={id} tables={tables} errors={e} />
      <div className="grid gap-4 md:grid-cols-3">
        <SelectField label="Occasion" name="occasion" defaultValue={defaults.occasion}>
          <option value="">None</option>
          {OCCASIONS.map((o) => <option key={o}>{o}</option>)}
        </SelectField>
        <TextArea label="Guest requests" name="specialRequests" rows={2} defaultValue={defaults.specialRequests} />
        <TextArea label="Staff notes" name="staffNotes" rows={2} defaultValue={defaults.staffNotes} />
      </div>
      <div className="space-y-1.5 text-sm">
        {canEmail && <label className="flex items-center gap-2"><input type="checkbox" name="notify" defaultChecked className="size-4 accent-[#5a1724]" /> Email the guest if the date, time or party size changes</label>}
        {hasChangeRequest && <label className="flex items-center gap-2"><input type="checkbox" name="clearChangeRequest" className="size-4 accent-[#5a1724]" /> Mark change request handled</label>}
      </div>
      <Submit>Save changes</Submit>
    </form>
  );
}

export function GuestNotes({ customerId, notes }: { customerId: string; notes: string }) {
  const [state, action] = useActionState(saveCustomerNoteAction, null);
  return (
    <form action={action} className="mt-4 space-y-2 border-t border-line pt-4">
      <input type="hidden" name="customerId" value={customerId} />
      <label htmlFor="guest-notes" className="field-label">Guest notes <span className="font-normal text-ink-soft">(kept for future visits)</span></label>
      <textarea id="guest-notes" name="notes" rows={3} defaultValue={notes} className="field" placeholder="Preferences, regular table…" />
      {state?.ok && <p className="text-xs text-ok" role="status">{state.message}</p>}
      <Submit variant="small">Save notes</Submit>
    </form>
  );
}
