import { db } from "@/lib/db";
import { requirePermission } from "@/server/auth";
import { Badge, PageHeader, Panel } from "@/components/admin/ui";
import { CreateStaffForm, StaffRowActions } from "./forms";

export default async function StaffPage() {
  const me = await requirePermission("staff.manage");
  const [users, roles] = await Promise.all([
    db.user.findMany({ include: { role: true }, orderBy: [{ active: "desc" }, { name: "asc" }] }),
    db.role.findMany({ include: { permissions: { include: { permission: true } } }, orderBy: { name: "asc" } }),
  ]);
  const roleOpts = roles.map((r) => ({ id: r.id, name: r.name }));
  return (
    <>
      <PageHeader title="Staff" description="Each person has their own sign-in. Their role decides what they can see and do." />
      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          {users.map((u) => (
            <Panel key={u.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{u.name} {u.id === me.id && <span className="text-sm font-normal text-ink-soft">(you)</span>}</p>
                  <p className="text-sm text-ink-soft">{u.email} · {u.role.name}</p>
                  <p className="text-xs text-ink-soft">Last sign-in: {u.lastLoginAt ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(u.lastLoginAt) : "never"}</p>
                </div>
                <div className="flex gap-1.5">
                  <Badge status={u.active ? "ACTIVE" : "INACTIVE"} label={u.active ? "Active" : "Deactivated"} />
                  {u.mfaEnabled && <Badge status="CONFIRMED" label="2-step on" />}
                </div>
              </div>
              <div className="mt-3"><StaffRowActions id={u.id} roleId={u.roleId} roles={roleOpts} active={u.active} mfaEnabled={u.mfaEnabled} self={u.id === me.id} /></div>
            </Panel>
          ))}
        </div>
        <div className="space-y-6">
          <Panel title="Add a staff member"><CreateStaffForm roles={roleOpts} /></Panel>
          <Panel title="What each role can do">
            <dl className="space-y-3 text-sm">
              {roles.map((r) => (
                <div key={r.id}><dt className="font-semibold">{r.name}</dt><dd className="text-ink-soft">{r.description}</dd></div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}
