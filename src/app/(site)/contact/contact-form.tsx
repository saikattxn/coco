"use client";

import { useActionState, useEffect } from "react";
import { contactAction, type FormState } from "../actions";
import { FormAlert, Honeypot, TextArea, TextField } from "@/components/ui/fields";
import { trackEvent } from "@/lib/track";

export function ContactForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(contactAction, null);
  useEffect(() => {
    if (state?.ok) trackEvent("contact_submitted");
  }, [state]);
  const e = state && !state.ok ? state.errors ?? {} : {};
  if (state?.ok) return <p role="status" className="rounded-2xl border border-gold/60 bg-ivory p-6">{state.message}</p>;
  return (
    <form action={action} noValidate className="space-y-5">
      <FormAlert error={e._form} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Name" name="name" autoComplete="name" error={e.name} />
        <TextField label="Email" name="email" type="email" autoComplete="email" error={e.email} />
        <TextField label="Phone" name="phone" type="tel" optional autoComplete="tel" error={e.phone} />
        <TextField label="Subject" name="subject" optional error={e.subject} />
        <TextArea label="Message" name="message" rows={5} error={e.message} className="sm:col-span-2" />
      </div>
      <Honeypot />
      <p className="text-sm text-ink-soft">To book a table, please use our <a href="/book" className="underline">booking page</a> — messages aren&apos;t monitored in real time.</p>
      <button className="btn btn-primary" disabled={pending}>{pending ? "Sending…" : "Send message"}</button>
    </form>
  );
}
