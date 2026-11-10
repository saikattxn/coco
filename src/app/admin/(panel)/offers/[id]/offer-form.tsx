"use client";

import { useActionState } from "react";
import { saveOfferAction } from "../actions";
import { FormAlert, SelectField, TextArea, TextField } from "@/components/ui/fields";
import { Flash, Panel } from "@/components/admin/ui";
import { Submit } from "@/components/admin/submit";

const TYPES = { COLLECTION_DISCOUNT: "Collection discount", SEASONAL: "Seasonal offer", SPECIAL_MENU: "Special menu", CELEBRATION: "Celebration package", MIDWEEK: "Midweek promotion", LIMITED_TIME: "Limited-time offer" };
type Offer = { id: string; title: string; description: string; type: string; terms: string; active: boolean; startsAt: string; endsAt: string; imageUrl: string; imageAlt: string; ctaLabel: string; ctaUrl: string };

export function OfferForm({ offer, uploadsEnabled }: { offer: Offer | null; uploadsEnabled: boolean }) {
  const [state, action] = useActionState(saveOfferAction, null);
  const e = state && !state.ok ? state.errors ?? {} : {};
  return (
    <form action={action} className="max-w-3xl space-y-6" noValidate>
      {offer && <input type="hidden" name="id" value={offer.id} />}
      <FormAlert error={e._form} />
      <Flash message={state?.ok ? state.message : null} />
      <Panel>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Title" name="title" defaultValue={offer?.title} error={e.title} className="md:col-span-2" />
          <SelectField label="Type" name="type" defaultValue={offer?.type ?? "SEASONAL"}>
            {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </SelectField>
          <label className="flex items-center gap-2 self-end pb-3 text-sm"><input type="checkbox" name="active" defaultChecked={offer?.active ?? true} className="size-4 accent-[#5a1724]" /> Active</label>
          <TextField label="Start date" name="startsAt" type="date" optional defaultValue={offer?.startsAt} error={e.startsAt} hint="Leave empty to start now." />
          <TextField label="End date" name="endsAt" type="date" optional defaultValue={offer?.endsAt} error={e.endsAt} hint="Leave empty to run until paused." />
          <TextArea label="Description" name="description" rows={3} defaultValue={offer?.description} error={e.description} className="md:col-span-2" />
          <TextArea label="Terms and conditions" name="terms" rows={4} defaultValue={offer?.terms} error={e.terms} className="md:col-span-2" />
          <TextField label="Button label" name="ctaLabel" optional defaultValue={offer?.ctaLabel} placeholder="e.g. Order for collection" />
          <TextField label="Button link" name="ctaUrl" optional defaultValue={offer?.ctaUrl} error={e.ctaUrl} placeholder="https://… or /book" />
        </div>
      </Panel>
      <Panel title="Image (optional)">
        {uploadsEnabled && (
          <div>
            <label htmlFor="imageFile" className="field-label">Upload</label>
            <input id="imageFile" name="imageFile" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="block text-sm" />
            {e.imageFile && <p className="field-error">{e.imageFile}</p>}
          </div>
        )}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextField label="…or image link" name="imageUrl" optional defaultValue={offer?.imageUrl} error={e.imageUrl} />
          <TextField label="Image description" name="imageAlt" optional defaultValue={offer?.imageAlt} />
        </div>
      </Panel>
      <Submit>{offer ? "Save offer" : "Create offer"}</Submit>
    </form>
  );
}
