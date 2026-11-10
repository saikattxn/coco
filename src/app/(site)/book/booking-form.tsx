"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { CalendarCheck, Loader2 } from "lucide-react";
import { reserveAction, type FormState } from "../actions";
import { OCCASIONS, reservationSchema, fieldErrors } from "@/lib/validation";
import { trackEvent } from "@/lib/track";
import { formatDateLong, formatTime12, addDaysIso } from "@/lib/time";
import { useToday } from "@/lib/use-today";

type Slot = { time: string; period: "LUNCH" | "DINNER"; available: boolean };
type Settings = { minPartySize: number; maxOnlinePartySize: number; maxDaysAhead: number; autoConfirmMaxParty: number };

export function BookingForm({ settings }: { settings: Settings }) {
  const [partySize, setPartySize] = useState(2);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [slotMessage, setSlotMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const started = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const id = useId();

  const today = useToday();
  const maxDate = today ? addDaysIso(today, settings.maxDaysAhead) : undefined;

  const abortRef = useRef<AbortController | null>(null);

  function loadSlots(nextDate: string, nextParty: number) {
    abortRef.current?.abort();
    if (!nextDate) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setSlotMessage(null);
    setTime("");
    fetch(`/api/v1/availability?date=${nextDate}&partySize=${nextParty}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data: { slots: Slot[]; message: string | null }) => {
        setSlots(data.slots);
        setSlotMessage(data.message ?? (data.slots.some((s) => s.available) ? null : "Sorry, we're fully booked on this date. Please try another day or call us."));
        setLoading(false);
      })
      .catch((e) => {
        if (e?.name === "AbortError") return;
        setSlots([]);
        setSlotMessage("We couldn't load times just now. Please try again, or call us.");
        setLoading(false);
      });
  }

  const [state, action, pending] = useActionState<FormState, FormData>(async (prev, fd) => {
    const res = await reserveAction(prev, fd);
    if (res?.ok) trackEvent("reservation_completed", { party_size: res.data?.partySize });
    // Someone else just took that time: refresh the list so the guest can pick another
    if (res && !res.ok && res.message === "UNAVAILABLE") loadSlots(date, partySize);
    return res;
  }, null);
  const errors = { ...clientErrors, ...(state && !state.ok ? state.errors : {}) };

  function markStarted() {
    if (!started.current) {
      started.current = true;
      trackEvent("booking_started");
    }
  }

  useEffect(() => {
    if (state?.ok) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state]);

  if (state?.ok && state.data) {
    const d = state.data;
    const pending = d.status === "PENDING";
    return (
      <div role="status" className="rounded-2xl border border-gold/60 bg-ivory p-8 md:p-10">
        <CalendarCheck aria-hidden className="size-10 text-gold" />
        <h2 className="mt-4 font-display text-4xl text-wine">{pending ? "Request received" : "Your table is booked"}</h2>
        <p className="mt-3 text-lg">
          {pending
            ? "For larger parties our team confirms each booking personally. We'll email you shortly."
            : "We've emailed your confirmation. We look forward to welcoming you."}
        </p>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2">
          <div><dt className="text-sm text-ink-soft">Reference</dt><dd className="font-display text-2xl tracking-wide">{d.reference}</dd></div>
          <div><dt className="text-sm text-ink-soft">Guests</dt><dd className="font-display text-2xl">{d.partySize}</dd></div>
          <div><dt className="text-sm text-ink-soft">Date</dt><dd className="font-display text-2xl">{formatDateLong(String(d.date))}</dd></div>
          <div><dt className="text-sm text-ink-soft">Time</dt><dd className="font-display text-2xl">{formatTime12(String(d.time))}</dd></div>
        </dl>
        <Link href={String(d.manageUrl)} className="btn btn-primary mt-8">View or manage this booking</Link>
      </div>
    );
  }

  const lunch = slots?.filter((s) => s.period === "LUNCH") ?? [];
  const dinner = slots?.filter((s) => s.period === "DINNER") ?? [];
  const selectedSlotOk = slots?.some((s) => s.time === time && s.available);

  function validateClient(e: React.FormEvent<HTMLFormElement>) {
    const fd = new FormData(e.currentTarget);
    const parsed = reservationSchema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      e.preventDefault();
      const errs = fieldErrors(parsed.error);
      setClientErrors(errs);
      const first = Object.keys(errs)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    } else {
      setClientErrors({});
    }
  }

  return (
    <form ref={formRef} action={action} onSubmit={validateClient} onChange={markStarted} noValidate className="space-y-10">
      {errors._form && (
        <div role="alert" className="rounded-xl border border-bad/40 bg-[#fbeceb] p-4 text-bad">{errors._form}</div>
      )}

      <fieldset>
        <legend className="font-display text-3xl text-wine">When would you like to come?</legend>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={`${id}-party`} className="field-label">Number of guests</label>
            <select id={`${id}-party`} name="partySize" value={partySize} onChange={(e) => { const n = Number(e.target.value); setPartySize(n); loadSlots(date, n); }} className="field">
              {Array.from({ length: settings.maxOnlinePartySize - settings.minPartySize + 1 }, (_, i) => i + settings.minPartySize).map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? "guest" : "guests"}</option>
              ))}
            </select>
            {partySize > settings.autoConfirmMaxParty && <p className="field-hint">Bookings for {settings.autoConfirmMaxParty + 1}+ are confirmed by our team.</p>}
          </div>
          <div>
            <label htmlFor={`${id}-date`} className="field-label">Date</label>
            <input id={`${id}-date`} name="date" type="date" required min={today || undefined} max={maxDate} value={date} onChange={(e) => { setDate(e.target.value); loadSlots(e.target.value, partySize); }} className="field" aria-invalid={Boolean(errors.date)} aria-describedby={errors.date ? `${id}-date-err` : undefined} />
            {errors.date && <p id={`${id}-date-err`} className="field-error">{errors.date}</p>}
          </div>
        </div>

        <div className="mt-6" aria-live="polite" aria-busy={loading}>
          {!date && <p className="text-ink-soft">Choose a date to see available times.</p>}
          {loading && <p className="flex items-center gap-2 text-ink-soft"><Loader2 aria-hidden className="size-4 animate-spin" /> Checking availability…</p>}
          {!loading && slotMessage && <p className="rounded-lg bg-ivory p-4 text-ink-soft">{slotMessage}</p>}
          {!loading && slots && slots.length > 0 && (
            <div role="radiogroup" aria-label="Available times" aria-describedby={errors.time ? `${id}-time-err` : undefined} className="space-y-5">
              {[{ label: "Lunch", list: lunch }, { label: "Dinner", list: dinner }].filter((g) => g.list.length).map((g) => (
                <div key={g.label}>
                  <p className="mb-2 text-sm font-semibold">{g.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {g.list.map((s) => (
                      <label key={s.time} className={`relative ${s.available ? "cursor-pointer" : "cursor-not-allowed"}`}>
                        <input type="radio" name="time" value={s.time} disabled={!s.available} checked={time === s.time} onChange={() => setTime(s.time)} className="peer sr-only" />
                        <span className="inline-flex min-h-11 min-w-[4.75rem] items-center justify-center rounded-full border border-line bg-ivory px-3 text-[0.95rem] tabular-nums transition-colors peer-checked:border-wine peer-checked:bg-wine peer-checked:text-ivory peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold peer-disabled:border-transparent peer-disabled:bg-transparent peer-disabled:text-ink-soft/50 peer-disabled:line-through">
                          {formatTime12(s.time)}
                          {!s.available && <span className="sr-only"> (fully booked)</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {errors.time && <p id={`${id}-time-err`} className="field-error">{errors.time}</p>}
        </div>
      </fieldset>

      <fieldset disabled={!selectedSlotOk} className="transition-opacity disabled:opacity-50">
        <legend className="font-display text-3xl text-wine">Your details</legend>
        {!selectedSlotOk && <p className="mt-2 text-sm text-ink-soft">Choose a time above to continue.</p>}
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field id={`${id}-name`} name="name" label="Full name" autoComplete="name" error={errors.name} />
          <Field id={`${id}-phone`} name="phone" label="Phone number" type="tel" autoComplete="tel" error={errors.phone} hint="We'll only call if we need to." />
          <div className="sm:col-span-2">
            <Field id={`${id}-email`} name="email" label="Email" type="email" autoComplete="email" error={errors.email} hint="Your confirmation is sent here." />
          </div>
          <div>
            <label htmlFor={`${id}-occasion`} className="field-label">Occasion <span className="font-normal text-ink-soft">(optional)</span></label>
            <select id={`${id}-occasion`} name="occasion" className="field" defaultValue="">
              <option value="">None</option>
              {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor={`${id}-req`} className="field-label">Special requests <span className="font-normal text-ink-soft">(optional)</span></label>
            <textarea id={`${id}-req`} name="specialRequests" rows={3} maxLength={500} className="field" placeholder="Allergies, high chair, accessible seating…" aria-invalid={Boolean(errors.specialRequests)} />
            {errors.specialRequests && <p className="field-error">{errors.specialRequests}</p>}
          </div>
        </div>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <label className="mt-6 flex items-start gap-3 text-[0.95rem]">
          <input type="checkbox" name="marketingConsent" className="mt-1 size-4 accent-[#5a1724]" />
          <span>Email me occasional news and offers from Coco Tamarind. You can unsubscribe at any time.</span>
        </label>
        <p className="mt-4 text-sm text-ink-soft">
          We use your details to manage your booking. See our <Link href="/privacy" className="underline">privacy policy</Link>.
        </p>
        <button type="submit" className="btn btn-primary mt-6 w-full sm:w-auto" disabled={pending || !selectedSlotOk}>
          {pending ? <><Loader2 aria-hidden className="size-4 animate-spin" /> Booking…</> : time ? `Book for ${partySize} at ${formatTime12(time)}` : "Book table"}
        </button>
      </fieldset>
    </form>
  );
}

function Field({ id, name, label, type = "text", autoComplete, error, hint }: { id: string; name: string; label: string; type?: string; autoComplete?: string; error?: string; hint?: string }) {
  const describedBy = [error ? `${id}-err` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <input id={id} name={name} type={type} autoComplete={autoComplete} required className="field" aria-invalid={Boolean(error)} aria-describedby={describedBy} />
      {error ? <p id={`${id}-err`} className="field-error">{error}</p> : hint ? <p id={`${id}-hint`} className="field-hint">{hint}</p> : null}
    </div>
  );
}
