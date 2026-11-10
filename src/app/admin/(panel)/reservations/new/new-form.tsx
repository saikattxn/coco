"use client";

import { useActionState } from "react";
import { staffCreateAction } from "../actions";
import { SlotPicker } from "@/components/admin/slot-picker";
import { FormAlert, SelectField, TextArea, TextField } from "@/components/ui/fields";
import { OCCASIONS } from "@/lib/validation";
import { Panel } from "@/components/admin/ui";
import { Submit } from "@/components/admin/submit";

export function NewReservationForm({ today, tables }: { today: string; tables: { id: string; label: string; area: string; maxCovers: number }[] }) {
  const [state, action] = useActionState(staffCreateAction, null);
  const e = state && !state.ok ? state.errors ?? {} : {};
  return (
    <form action={action} className="space-y-6" noValidate>
      <FormAlert error={e._form} />
      <Panel title="When">
        <SlotPicker defaults={{ date: today, partySize: 2 }} tables={tables} errors={e} />
      </Panel>
      <Panel title="Guest">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TextField label="Name" name="name" error={e.name} required />
          <TextField label="Phone" name="phone" type="tel" error={e.phone} required />
          <TextField label="Email" name="email" type="email" optional error={e.email} hint="Needed for a confirmation email." />
          <SelectField label="Booked by" name="source" defaultValue="PHONE">
            <option value="PHONE">Phone</option>
            <option value="WALK_IN">Walk-in</option>
            <option value="STAFF">Staff / other</option>
          </SelectField>
          <SelectField label="Status" name="status" defaultValue="CONFIRMED">
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending (tentative)</option>
          </SelectField>
          <SelectField label="Occasion" name="occasion" optional defaultValue="">
            <option value="">None</option>
            {OCCASIONS.map((o) => <option key={o}>{o}</option>)}
          </SelectField>
          <TextArea label="Guest requests" name="specialRequests" optional rows={2} className="sm:col-span-2 lg:col-span-3" />
          <TextArea label="Staff notes" name="staffNotes" optional rows={2} hint="Only visible to staff." className="sm:col-span-2 lg:col-span-3" />
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="sendEmail" defaultChecked className="size-4 accent-[#5a1724]" /> Email a confirmation to the guest (if an email is given)</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="marketingConsent" className="size-4 accent-[#5a1724]" /> Guest agreed to receive marketing emails</label>
        </div>
      </Panel>
      <Submit pendingLabel="Saving booking…">Create booking</Submit>
    </form>
  );
}
