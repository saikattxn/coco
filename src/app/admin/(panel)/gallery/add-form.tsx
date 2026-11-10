"use client";

import { useActionState } from "react";
import { addImageAction } from "./actions";
import { SelectField, TextField } from "@/components/ui/fields";
import { Submit } from "@/components/admin/submit";
import { GALLERY_CATS } from "@/lib/gallery";


export function AddImageForm({ uploadsEnabled }: { uploadsEnabled: boolean }) {
  const [state, action] = useActionState(addImageAction, null);
  const e = state && !state.ok ? state.errors ?? {} : {};
  return (
    <form action={action} className="space-y-3">
      {uploadsEnabled ? (
        <div>
          <label htmlFor="g-file" className="field-label">Photo</label>
          <input id="g-file" type="file" name="file" accept="image/jpeg,image/png,image/webp,image/avif" className="block w-full text-sm" />
          {e.file && <p className="field-error">{e.file}</p>}
        </div>
      ) : (
        <p className="text-sm text-ink-soft">Uploads are awaiting Cloudinary configuration.</p>
      )}
      <TextField label="…or link" name="url" optional error={e.url} />
      <TextField label="Description" name="alt" error={e.alt} hint="What's in the photo, for screen readers and Google." />
      <TextField label="Caption" name="caption" optional />
      <SelectField label="Category" name="category" defaultValue="FOOD">
        {Object.entries(GALLERY_CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </SelectField>
      {state?.ok && <p role="status" className="text-sm text-ok">{state.message}</p>}
      <Submit variant="small" pendingLabel="Uploading…">Add photo</Submit>
    </form>
  );
}
