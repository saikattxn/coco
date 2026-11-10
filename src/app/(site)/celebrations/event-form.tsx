"use client";

import { useActionState, useEffect } from "react";
import { eventEnquiryAction, type FormState } from "../actions";
import { EVENT_TYPES } from "@/lib/validation";
import { FormAlert, Honeypot, SelectField, TextArea, TextField } from "@/components/ui/fields";
import { trackEvent } from "@/lib/track";
import { useToday } from "@/lib/use-today";

export function EventEnquiryForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(eventEnquiryAction, null);
  const today = useToday() || undefined;
  useEffect(() => {
    if (state?.ok) trackEvent("event_enquiry_submitted");
  }, [state]);
  const e = state && !state.ok ? state.errors ?? {} : {};

  if (state?.ok) {
    return (
      <div role="status" className="rounded-2xl border border-gold/60 bg-ivory p-8">
        <h2 className="font-display text-3xl text-wine">Enquiry sent</h2>
        <p className="mt-2">{state.message}</p>
      </div>
    );
  }
  return (
    <form action={action} noValidate className="space-y-5 rounded-2xl border border-line bg-ivory p-6 md:p-8">
      <h2 className="font-display text-3xl text-wine">Tell us about your occasion</h2>
      <FormAlert error={e._form} />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField label="Occasion" name="eventType" error={e.eventType} defaultValue="BIRTHDAY">
          {Object.entries(EVENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </SelectField>
        <TextField label="Number of guests" name="guests" type="number" min={2} max={300} inputMode="numeric" error={e.guests} />
        <TextField label="Date" name="eventDate" type="date" min={today} error={e.eventDate} />
        <TextField label="Preferred time" name="preferredTime" optional placeholder="e.g. around 7pm" error={e.preferredTime} />
        <TextField label="Your name" name="name" autoComplete="name" error={e.name} />
        <TextField label="Phone" name="phone" type="tel" autoComplete="tel" error={e.phone} />
        <TextField label="Email" name="email" type="email" autoComplete="email" error={e.email} className="sm:col-span-2" />
        <TextField label="Budget per head" name="budgetNote" optional error={e.budgetNote} className="sm:col-span-2" />
        <TextArea label="Anything else we should know?" name="message" optional placeholder="Dietary needs, a cake, decorations, set menu…" error={e.message} className="sm:col-span-2" />
      </div>
      <Honeypot />
      <p className="text-sm text-ink-soft">We&apos;ll use these details only to respond to your enquiry.</p>
      <button className="btn btn-primary" disabled={pending}>{pending ? "Sending…" : "Send enquiry"}</button>
    </form>
  );
}
