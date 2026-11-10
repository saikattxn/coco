"use client";

import { useActionState } from "react";
import { saveCategoryAction } from "./actions";
import { TextArea, TextField } from "@/components/ui/fields";
import { Submit } from "@/components/admin/submit";

export function CategoryForm({ category }: { category?: { id: string; name: string; description: string; visible: boolean } }) {
  const [state, action] = useActionState(saveCategoryAction, null);
  const e = state && !state.ok ? state.errors ?? {} : {};
  return (
    <form action={action} className="space-y-3">
      {category && <input type="hidden" name="id" value={category.id} />}
      <TextField label="Name" name="name" defaultValue={category?.name} error={e.name} />
      <TextArea label="Description" name="description" rows={2} optional defaultValue={category?.description} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="visible" defaultChecked={category?.visible ?? true} className="size-4 accent-[#5a1724]" /> Show on website</label>
      {state?.ok && <p className="text-sm text-ok" role="status">{state.message}</p>}
      <Submit variant="small">{category ? "Save category" : "Add category"}</Submit>
    </form>
  );
}
