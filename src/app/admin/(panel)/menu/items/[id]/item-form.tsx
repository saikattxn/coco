"use client";

import { useActionState } from "react";
import { saveMenuItemAction } from "../../actions";
import { FormAlert, SelectField, TextArea, TextField } from "@/components/ui/fields";
import { Flash, Panel } from "@/components/admin/ui";
import { Submit } from "@/components/admin/submit";
import { SPICE_LABELS } from "@/lib/format";

type Item = {
  id: string; name: string; description: string; price: string; categoryId: string; spiceLevel: number; isVegetarian: boolean; available: boolean; featured: boolean; bestseller: boolean;
  allergenInfoVerified: boolean; allergenNote: string; imageUrl: string; imageAlt: string; allergens: string[]; dietaryTags: string[];
};

export function MenuItemForm({ item, categories, allergens, tags, uploadsEnabled }: { item: Item | null; categories: { id: string; name: string }[]; allergens: { id: string; name: string }[]; tags: { id: string; name: string; key: string }[]; uploadsEnabled: boolean }) {
  const [state, action] = useActionState(saveMenuItemAction, null);
  const e = state && !state.ok ? state.errors ?? {} : {};
  const check = (name: string, label: string, checked: boolean | undefined, hint?: string) => (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={checked} className="mt-0.5 size-4 accent-[#5a1724]" />
      <span>{label}{hint && <span className="block text-xs text-ink-soft">{hint}</span>}</span>
    </label>
  );
  return (
    <form action={action} className="space-y-6" noValidate>
      {item && <input type="hidden" name="id" value={item.id} />}
      <FormAlert error={e._form} />
      <Flash message={state?.ok ? state.message : null} />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Panel title="Dish">
            <div className="grid gap-4 md:grid-cols-[1fr_10rem]">
              <TextField label="Name" name="name" defaultValue={item?.name} error={e.name} required />
              <TextField label="Price (£)" name="price" inputMode="decimal" defaultValue={item?.price} error={e.price} required />
              <TextArea label="Description" name="description" rows={3} optional defaultValue={item?.description} error={e.description} className="md:col-span-2" />
              <SelectField label="Category" name="categoryId" defaultValue={item?.categoryId ?? categories[0]?.id} error={e.categoryId}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </SelectField>
              <SelectField label="Spice level" name="spiceLevel" defaultValue={String(item?.spiceLevel ?? 0)}>
                {SPICE_LABELS.map((l, i) => <option key={l} value={i}>{l}</option>)}
              </SelectField>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {check("available", "Available to order", item?.available ?? true, "Untick to show as unavailable today")}
              {check("isVegetarian", "Vegetarian", item?.isVegetarian)}
              {check("featured", "Signature dish (homepage)", item?.featured)}
              {check("bestseller", "Bestseller", item?.bestseller)}
            </div>
          </Panel>

          <Panel title="Allergens & diet">
            <p className="mb-3 text-sm text-ink-soft">Tick every one of the 14 allergens this dish contains as an ingredient.</p>
            <fieldset className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <legend className="sr-only">Allergens</legend>
              {allergens.map((a) => (
                <label key={a.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="allergens" value={a.id} defaultChecked={item?.allergens.includes(a.id)} className="size-4 accent-[#5a1724]" /> {a.name}
                </label>
              ))}
            </fieldset>
            <TextField label="Allergen note" name="allergenNote" optional defaultValue={item?.allergenNote} className="mt-4" hint="Free text as supplied by the kitchen (shown to staff only)." />
            <fieldset className="mt-4 flex flex-wrap gap-4">
              <legend className="mb-1 text-sm font-semibold">Dietary tags</legend>
              {tags.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="dietaryTags" value={t.id} defaultChecked={item?.dietaryTags.includes(t.id)} className="size-4 accent-[#5a1724]" /> {t.name}
                </label>
              ))}
            </fieldset>
            <div className="mt-5 rounded-lg border border-[#e8cf91] bg-[#fff7e3] p-3">
              {check("allergenInfoVerified", "Allergen information verified by the kitchen", item?.allergenInfoVerified, "Only tick this when the head chef has confirmed the allergens above. Until then the website asks guests to check with staff.")}
              {e.allergenInfoVerified && <p className="field-error">{e.allergenInfoVerified}</p>}
            </div>
          </Panel>
        </div>

        <Panel title="Photo">
          {item?.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt={item.imageAlt} className="mb-4 aspect-[4/3] w-full rounded-lg object-cover" />
          )}
          {uploadsEnabled ? (
            <div>
              <label htmlFor="imageFile" className="field-label">Upload a photo</label>
              <input id="imageFile" name="imageFile" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="block w-full text-sm" aria-invalid={Boolean(e.imageFile)} />
              {e.imageFile && <p className="field-error">{e.imageFile}</p>}
              <p className="field-hint">JPEG, PNG, WebP or AVIF, up to 8 MB.</p>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">Uploads are awaiting Cloudinary configuration — paste an image link instead.</p>
          )}
          <TextField label="…or image link" name="imageUrl" optional defaultValue={item?.imageUrl} error={e.imageUrl} className="mt-4" />
          <TextField label="Photo description" name="imageAlt" optional defaultValue={item?.imageAlt} error={e.imageAlt} hint="For screen readers, e.g. “Lamb chops on a sizzling platter”." className="mt-4" />
        </Panel>
      </div>
      <Submit>{item ? "Save dish" : "Add dish"}</Submit>
    </form>
  );
}
