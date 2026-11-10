"use client";

import { useActionState } from "react";
import { saveHoursAction, saveRulesAction, saveTableAction } from "./actions";
import { FormAlert, TextField } from "@/components/ui/fields";
import { Flash, smallBtn } from "@/components/admin/ui";
import { Submit } from "@/components/admin/submit";

type Rules = Record<string, number | boolean>;
export function RulesForm({ rules }: { rules: Rules }) {
  const [state, action] = useActionState(saveRulesAction, null);
  const e = state && !state.ok ? state.errors ?? {} : {};
  const n = (name: string, label: string, hint?: string) => <TextField key={name} label={label} name={name} type="number" defaultValue={String(rules[name])} error={e[name]} hint={hint} />;
  return (
    <form action={action} className="space-y-4">
      <Flash message={state?.ok ? state.message : null} />
      <label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="onlineBookingEnabled" defaultChecked={Boolean(rules.onlineBookingEnabled)} className="size-4 accent-[#5a1724]" /> Accept online bookings</label>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {n("slotIntervalMinutes", "Time slot every (minutes)", "10, 15, 20, 30 or 60")}
        {n("lastSeatingMinutesBeforeClose", "Last booking (minutes before close)")}
        {n("leadTimeMinutes", "Minimum notice (minutes)")}
        {n("maxDaysAhead", "Book up to (days ahead)")}
        {n("durationSmallMinutes", "Table time, 1–2 guests (min)")}
        {n("durationMediumMinutes", "Table time, 3–4 guests (min)")}
        {n("durationLargeMinutes", "Table time, 5+ guests (min)")}
        {n("minPartySize", "Smallest online party")}
        {n("maxOnlinePartySize", "Largest online party", "Bigger groups are sent to the events enquiry")}
        {n("autoConfirmMaxParty", "Confirm instantly up to (guests)", "Larger online bookings wait for staff approval")}
        {n("maxCoversPerSlot", "Kitchen pacing: max covers starting per slot")}
        {n("reminderHoursBefore", "Reminder email (hours before)", "0 turns reminders off")}
      </div>
      <Submit>Save booking rules</Submit>
    </form>
  );
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export function HoursForm({ hours }: { hours: { id: string; weekday: number; period: string; opensAt: string; closesAt: string; isClosed: boolean }[] }) {
  const [state, action] = useActionState(saveHoursAction, null);
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <form action={action} className="space-y-3">
      <Flash message={state?.ok ? state.message : null} />
      <FormAlert error={state && !state.ok ? state.errors?._form : undefined} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-sm">
          <thead><tr className="text-left text-xs text-ink-soft"><th className="py-2">Day</th><th>Lunch</th><th>Dinner</th></tr></thead>
          <tbody>
            {order.map((d) => (
              <tr key={d} className="border-t border-line">
                <th scope="row" className="py-2 pr-4 text-left font-semibold">{DAYS[d]}</th>
                {["LUNCH", "DINNER"].map((p) => {
                  const h = hours.find((x) => x.weekday === d && x.period === p);
                  if (!h) return <td key={p} />;
                  return (
                    <td key={p} className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <input aria-label={`${DAYS[d]} ${p.toLowerCase()} opens`} name={`${h.id}.opensAt`} defaultValue={h.opensAt} className="field min-h-9 w-20 py-1" />
                        <span>–</span>
                        <input aria-label={`${DAYS[d]} ${p.toLowerCase()} closes`} name={`${h.id}.closesAt`} defaultValue={h.closesAt} className="field min-h-9 w-20 py-1" />
                        <label className="flex items-center gap-1 text-xs"><input type="checkbox" name={`${h.id}.closed`} defaultChecked={h.isClosed} className="size-3.5" /> closed</label>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Submit>Save hours</Submit>
    </form>
  );
}

export function TableForm({ table, areas }: { table?: { id: string; label: string; areaId: string; minCovers: number; maxCovers: number; joinGroup: string | null; combinable: boolean; active: boolean }; areas: { id: string; name: string }[] }) {
  const [state, action] = useActionState(saveTableAction, null);
  const e = state && !state.ok ? state.errors ?? {} : {};
  return (
    <form action={action} className="flex flex-wrap items-end gap-2 text-sm">
      {table && <input type="hidden" name="id" value={table.id} />}
      <label><span className="block text-xs text-ink-soft">Table</span><input name="label" defaultValue={table?.label} className="field min-h-9 w-20 py-1" aria-invalid={Boolean(e.label)} /></label>
      <label><span className="block text-xs text-ink-soft">Area</span>
        <select name="areaId" defaultValue={table?.areaId ?? areas[0]?.id} className="field min-h-9 w-40 py-1">{areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
      </label>
      <label><span className="block text-xs text-ink-soft">Min</span><input name="minCovers" type="number" min={1} defaultValue={table?.minCovers ?? 1} className="field min-h-9 w-16 py-1" /></label>
      <label><span className="block text-xs text-ink-soft">Max</span><input name="maxCovers" type="number" min={1} defaultValue={table?.maxCovers ?? 4} className="field min-h-9 w-16 py-1" aria-invalid={Boolean(e.maxCovers)} /></label>
      <label><span className="block text-xs text-ink-soft">Join group</span><input name="joinGroup" defaultValue={table?.joinGroup ?? ""} className="field min-h-9 w-24 py-1" /></label>
      <label className="flex items-center gap-1 pb-2"><input type="checkbox" name="combinable" defaultChecked={table?.combinable} className="size-3.5" /> joinable</label>
      <label className="flex items-center gap-1 pb-2"><input type="checkbox" name="active" defaultChecked={table?.active ?? true} className="size-3.5" /> in use</label>
      <button className={smallBtn}>{table ? "Save" : "Add table"}</button>
      {state && <span className={`pb-2 text-xs ${state.ok ? "text-ok" : "text-bad"}`}>{state.ok ? state.message : Object.values(e)[0]}</span>}
    </form>
  );
}
