"use client";

import { useActionState } from "react";
import { createStaffAction, updateStaffAction } from "./actions";
import { FormAlert, SelectField, TextField } from "@/components/ui/fields";
import { Flash, smallBtn } from "@/components/admin/ui";
import { Submit } from "@/components/admin/submit";

export function CreateStaffForm({ roles }: { roles: { id: string; name: string }[] }) {
  const [state, action] = useActionState(createStaffAction, null);
  const e = state && !state.ok ? state.errors ?? {} : {};
  return (
    <form action={action} className="space-y-3">
      <Flash message={state?.ok ? state.message : null} />
      <TextField label="Name" name="name" error={e.name} />
      <TextField label="Email" name="email" type="email" error={e.email} />
      <SelectField label="Role" name="roleId" defaultValue={roles.find((r) => r.name.startsWith("Reservation"))?.id}>
        {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
      </SelectField>
      <Submit variant="small">Create account</Submit>
    </form>
  );
}

export function StaffRowActions({ id, roleId, roles, active, mfaEnabled, self }: { id: string; roleId: string; roles: { id: string; name: string }[]; active: boolean; mfaEnabled: boolean; self: boolean }) {
  const [state, action] = useActionState(updateStaffAction, null);
  return (
    <div className="space-y-2">
      {state && <Flash message={state.ok ? state.message : state.errors?._form} tone={state.ok ? "ok" : "error"} />}
      <FormAlert />
      <form action={action} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={id} />
        {!self && (
          <>
            <select name="roleId" defaultValue={roleId} className="field min-h-9 w-auto py-1 text-sm" aria-label="Role">
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <button name="op" value="role" className={smallBtn}>Change role</button>
            <button name="op" value={active ? "deactivate" : "activate"} className={smallBtn}>{active ? "Deactivate" : "Reactivate"}</button>
          </>
        )}
        <button name="op" value="reset" className={smallBtn}>Reset password</button>
        {mfaEnabled && <button name="op" value="resetMfa" className={smallBtn}>Remove 2-step</button>}
      </form>
    </div>
  );
}
