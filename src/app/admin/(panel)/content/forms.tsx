"use client";

import { useActionState, useState } from "react";
import { saveBlockAction, savePageSeoAction, saveSiteSettingsAction, saveTestimonialsAction } from "./actions";
import { FormAlert, TextArea, TextField } from "@/components/ui/fields";
import { Flash } from "@/components/admin/ui";
import { Submit } from "@/components/admin/submit";

export function BlockForm({ blockKey, label, title, body, hint }: { blockKey: string; label: string; title: string; body: string; hint?: string }) {
  const [state, action] = useActionState(saveBlockAction, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="key" value={blockKey} />
      <h3 className="font-semibold">{label}</h3>
      {hint && <p className="text-xs text-ink-soft">{hint}</p>}
      <TextField label="Heading" name="title" defaultValue={title} />
      <TextArea label="Text" name="body" rows={5} defaultValue={body} hint="Leave a blank line between paragraphs." />
      {state?.ok && <p role="status" className="text-sm text-ok">{state.message}</p>}
      <Submit variant="small">Save</Submit>
    </form>
  );
}

export function TestimonialsForm({ items }: { items: { quote: string; author: string; source?: string }[] }) {
  const [state, action] = useActionState(saveTestimonialsAction, null);
  const [rows, setRows] = useState(items.length ? items : [{ quote: "", author: "", source: "" }]);
  return (
    <form action={action} className="space-y-4">
      <FormAlert error={state && !state.ok ? state.errors?._form : undefined} />
      <Flash message={state?.ok ? state.message : null} />
      {rows.map((r, i) => (
        <fieldset key={i} className="grid gap-3 rounded-lg border border-line p-3 md:grid-cols-[1fr_12rem_10rem]">
          <legend className="px-1 text-xs text-ink-soft">Quote {i + 1}</legend>
          <TextArea label="Quote" name="quote" rows={2} defaultValue={r.quote} />
          <TextField label="Guest name" name="author" defaultValue={r.author} />
          <TextField label="Source" name="source" defaultValue={r.source} placeholder="Tripadvisor" />
        </fieldset>
      ))}
      <button type="button" className="text-sm underline" onClick={() => setRows([...rows, { quote: "", author: "", source: "" }])}>Add another</button>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="confirmPermission" className="mt-0.5 size-4 accent-[#5a1724]" /> I confirm these are genuine guest comments and we have permission to publish them.</label>
      <Submit variant="small">Publish testimonials</Submit>
    </form>
  );
}

type Site = Record<string, string | boolean | number | null>;
export function SiteSettingsForm({ site }: { site: Site }) {
  const [state, action] = useActionState(saveSiteSettingsAction, null);
  const e = state && !state.ok ? state.errors ?? {} : {};
  const v = (k: string) => (site[k] === null || site[k] === undefined ? "" : String(site[k]));
  const f = (name: string, label: string, extra: Record<string, unknown> = {}) => <TextField key={name} label={label} name={name} defaultValue={v(name)} error={e[name]} {...extra} />;
  return (
    <form action={action} className="space-y-5">
      <Flash message={state?.ok ? state.message : null} />
      <FormAlert error={Object.keys(e).length ? "Please fix the highlighted fields." : undefined} />
      <div className="grid gap-4 md:grid-cols-2">
        {f("restaurantName", "Restaurant name")}
        {f("tagline", "Tagline")}
        {f("addressLine1", "Address line 1")}
        {f("addressLine2", "Address line 2")}
        {f("town", "Town")}
        {f("county", "County")}
        {f("postcode", "Postcode")}
        <div className="grid grid-cols-2 gap-3">{f("latitude", "Latitude", { hint: "For Google (optional)" })}{f("longitude", "Longitude")}</div>
        {f("phonePrimary", "Main phone")}
        {f("phoneSecondary", "Second phone")}
        {f("email", "Email", { type: "email" })}
        {f("orderingUrl", "Online ordering link", { hint: "Just Order Online — every Order button uses this." })}
        <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" name="orderingEnabled" defaultChecked={Boolean(site.orderingEnabled)} className="size-4 accent-[#5a1724]" /> Show &ldquo;Order online&rdquo; buttons</label>
        {f("tripadvisorUrl", "Tripadvisor link")}
        {f("googleReviewsUrl", "Google reviews link")}
        {f("facebookUrl", "Facebook link")}
        {f("instagramUrl", "Instagram link")}
        {f("parkingInfo", "Parking information")}
        {f("hoursNote", "Opening hours note", { hint: "e.g. Closed Christmas Day" })}
        {f("footerNote", "Footer note")}
        {f("seoTitle", "Homepage search title", { hint: "Shown in Google results. Under 60 characters is best." })}
        <TextArea label="Homepage search description" name="seoDescription" rows={2} defaultValue={v("seoDescription")} error={e.seoDescription} hint="Under 160 characters." className="md:col-span-2" />
      </div>
      <Submit>Save details</Submit>
    </form>
  );
}

export function PageSeoForm({ path, title, description }: { path: string; title: string; description: string }) {
  const [state, action] = useActionState(savePageSeoAction, null);
  const e = state && !state.ok ? state.errors ?? {} : {};
  return (
    <form action={action} className="grid gap-3 border-b border-line py-4 last:border-0 md:grid-cols-[8rem_1fr_1.5fr_auto] md:items-end">
      <input type="hidden" name="path" value={path} />
      <p className="font-mono text-sm">{path}</p>
      <TextField label="Title" name="title" defaultValue={title} error={e.title} placeholder="Default" />
      <TextField label="Description" name="description" defaultValue={description} error={e.description} placeholder="Default" />
      <div className="pb-0.5">{state?.ok ? <span className="text-sm text-ok">Saved</span> : <Submit variant="small">Save</Submit>}</div>
    </form>
  );
}
