"use client";

import { useEffect, useState, useTransition } from "react";
import { staffAvailabilityAction } from "@/app/admin/(panel)/reservations/actions";
import { formatTime12 } from "@/lib/time";

type Slot = { time: string; period: string; available: boolean };

/** Date + party size + time picker for staff. Shows every slot; unavailable ones are marked. */
export function SlotPicker({ defaults, excludeId, tables, errors = {} }: { defaults: { date: string; time?: string; partySize: number; tableId?: string | null }; excludeId?: string; tables: { id: string; label: string; area: string; maxCovers: number }[]; errors?: Record<string, string> }) {
  const [date, setDate] = useState(defaults.date);
  const [partySize, setPartySize] = useState(defaults.partySize);
  const [time, setTime] = useState(defaults.time ?? "");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    start(async () => {
      const res = await staffAvailabilityAction(date, partySize, excludeId);
      setSlots(res.slots);
      setMessage(res.message);
    });
  }, [date, partySize, excludeId]);

  const timeKnown = slots.some((s) => s.time === time);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label htmlFor="sp-date" className="field-label">Date</label>
        <input id="sp-date" name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field" required aria-invalid={Boolean(errors.date)} />
        {errors.date && <p className="field-error">{errors.date}</p>}
      </div>
      <div>
        <label htmlFor="sp-party" className="field-label">Guests</label>
        <input id="sp-party" name="partySize" type="number" min={1} max={60} value={partySize} onChange={(e) => setPartySize(Number(e.target.value) || 1)} className="field" required />
      </div>
      <div>
        <label htmlFor="sp-time" className="field-label">Time {pending && <span className="font-normal text-ink-soft">(checking…)</span>}</label>
        <select id="sp-time" name="time" value={time} onChange={(e) => setTime(e.target.value)} className="field" required aria-invalid={Boolean(errors.time)}>
          <option value="">Choose…</option>
          {!timeKnown && time && <option value={time}>{formatTime12(time)} (current)</option>}
          {slots.map((s) => (
            <option key={s.time} value={s.time}>
              {formatTime12(s.time)} {s.period === "LUNCH" ? "· lunch" : "· dinner"} {s.available ? "" : "— full"}
            </option>
          ))}
        </select>
        {message && <p className="field-hint">{message}</p>}
        {errors.time && <p className="field-error">{errors.time}</p>}
      </div>
      <div>
        <label htmlFor="sp-table" className="field-label">Table</label>
        <select id="sp-table" name="tableId" defaultValue={defaults.tableId ?? ""} className="field">
          <option value="">Assign automatically</option>
          {tables.map((t) => (
            <option key={t.id} value={t.id}>{t.label} · {t.area} · up to {t.maxCovers}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
