"use client";

import { useActionState } from "react";
import { subscribeAction } from "@/app/(site)/actions";
import { trackEvent } from "@/lib/track";

export function NewsletterForm() {
  const [state, action, pending] = useActionState(async (prev: Awaited<ReturnType<typeof subscribeAction>> | null, fd: FormData) => {
    const res = await subscribeAction(prev, fd);
    if (res.ok) trackEvent("newsletter_signup");
    return res;
  }, null);

  if (state?.ok) return <p role="status" className="text-gold-light">Thank you — you&apos;re on the list. You can unsubscribe at any time.</p>;

  return (
    <form action={action} className="grid gap-3" noValidate>
      <div>
        <label htmlFor="nl-email" className="field-label text-ivory">Email address</label>
        <input id="nl-email" name="email" type="email" autoComplete="email" required className="field" aria-invalid={Boolean(state?.errors?.email)} aria-describedby={state?.errors?.email ? "nl-email-err" : undefined} />
        {state?.errors?.email && <p id="nl-email-err" className="field-error text-[#f3b4b4]">{state.errors.email}</p>}
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className="flex items-start gap-2.5 text-sm text-ivory/85">
        <input type="checkbox" name="consent" className="mt-1 size-4 accent-[#d8bd88]" />
        <span>Send me occasional news, seasonal menus and offers from Coco Tamarind.</span>
      </label>
      {state?.errors?.consent && <p className="field-error text-[#f3b4b4]">{state.errors.consent}</p>}
      {state?.errors?._form && <p className="field-error text-[#f3b4b4]">{state.errors._form}</p>}
      <button type="submit" className="btn btn-gold w-fit" disabled={pending}>{pending ? "Subscribing…" : "Subscribe"}</button>
    </form>
  );
}
