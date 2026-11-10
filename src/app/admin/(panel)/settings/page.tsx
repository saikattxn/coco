import { db } from "@/lib/db";
import { requirePermission } from "@/server/auth";
import { Badge, PageHeader, Panel, smallBtn } from "@/components/admin/ui";
import { emailConfigured } from "@/server/notifications/transport";
import { storageMode } from "@/server/storage";
import { closureAction, retryEmailAction, saveAreaAction } from "./actions";
import { HoursForm, RulesForm, TableForm } from "./forms";

export default async function SettingsPage() {
  await requirePermission("settings.write");
  const [rules, hours, closures, areas, tables, emails] = await Promise.all([
    db.bookingSettings.findUniqueOrThrow({ where: { id: "default" } }),
    db.openingHours.findMany(),
    db.closureDate.findMany({ where: { date: { gte: new Date(new Date().toISOString().slice(0, 10)) } }, orderBy: { date: "asc" } }),
    db.seatingArea.findMany({ orderBy: { sortOrder: "asc" } }),
    db.table.findMany({ orderBy: [{ area: { sortOrder: "asc" } }, { sortOrder: "asc" }] }),
    db.notification.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  const ruleValues = Object.fromEntries(Object.entries(rules).filter(([k]) => k !== "id" && k !== "updatedAt")) as Record<string, number | boolean>;
  const capacity = tables.filter((t) => t.active).reduce((s, t) => s + t.maxCovers, 0);
  const integrations = [
    ["Email (Resend)", emailConfigured() ? "Configured" : "Awaiting configuration"],
    ["Image storage (Cloudinary)", storageMode() === "cloudinary" ? "Configured" : storageMode() === "local" ? "Local files (development only)" : "Awaiting configuration"],
    ["Google Tag Manager", process.env.NEXT_PUBLIC_GTM_ID ? `Configured (${process.env.NEXT_PUBLIC_GTM_ID})` : "Awaiting configuration"],
    ["Scheduled jobs", process.env.CRON_SECRET ? "Configured" : "Awaiting configuration (CRON_SECRET)"],
  ];
  return (
    <>
      <PageHeader title="Booking settings" description="Rules for online bookings, opening hours and your seating plan." />
      <div className="space-y-6">
        <Panel title="Booking rules"><RulesForm rules={ruleValues} /></Panel>
        <Panel title="Opening hours"><HoursForm hours={hours} /></Panel>
        <Panel title="Closed dates">
          <ul className="mb-4 divide-y divide-line text-sm">
            {closures.length === 0 && <li className="py-2 text-ink-soft">No upcoming closures.</li>}
            {closures.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2">
                <span>{new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeZone: "UTC" }).format(c.date)} — {c.reason}</span>
                <form action={closureAction}><input type="hidden" name="id" value={c.id} /><button name="op" value="delete" className={smallBtn}>Remove</button></form>
              </li>
            ))}
          </ul>
          <form action={closureAction} className="flex flex-wrap items-end gap-2 text-sm">
            <label><span className="block text-xs text-ink-soft">Date</span><input type="date" name="date" required className="field min-h-9 py-1" /></label>
            <label className="flex-1"><span className="block text-xs text-ink-soft">Reason</span><input name="reason" placeholder="e.g. Private event" className="field min-h-9 py-1" /></label>
            <button name="op" value="add" className={smallBtn}>Add closure</button>
          </form>
        </Panel>
        <Panel title={`Seating plan (${tables.filter((t) => t.active).length} tables, ${capacity} seats)`}>
          <p className="mb-4 rounded-lg bg-[#fff7e3] p-3 text-sm text-[#6b4b00]">The seating plan set up at installation is a <strong>sample</strong>. Replace it with your real tables before going live — online availability is calculated from it. Tables in the same join group with &ldquo;joinable&rdquo; ticked can be pushed together for larger parties.</p>
          <div className="mb-5 flex flex-wrap gap-3">
            {areas.map((a) => (
              <form key={a.id} action={saveAreaAction} className="flex items-end gap-2 rounded-lg border border-line p-2 text-sm">
                <input type="hidden" name="id" value={a.id} />
                <label><span className="block text-xs text-ink-soft">Area</span><input name="name" defaultValue={a.name} className="field min-h-9 w-44 py-1" /></label>
                <label className="flex items-center gap-1 pb-2"><input type="checkbox" name="active" defaultChecked={a.active} className="size-3.5" /> open</label>
                <button className={smallBtn}>Save</button>
              </form>
            ))}
            <form action={saveAreaAction} className="flex items-end gap-2 rounded-lg border border-dashed border-line p-2 text-sm">
              <label><span className="block text-xs text-ink-soft">New area</span><input name="name" className="field min-h-9 w-44 py-1" /></label>
              <button className={smallBtn}>Add area</button>
            </form>
          </div>
          <div className="space-y-2">
            {tables.map((t) => <TableForm key={t.id} table={t} areas={areas} />)}
            <div className="border-t border-line pt-3"><TableForm areas={areas} /></div>
          </div>
        </Panel>
        <Panel title="Integrations">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {integrations.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 rounded-lg border border-line p-3"><dt>{k}</dt><dd><Badge status={v.startsWith("Configured") ? "CONFIRMED" : "PENDING"} label={v} /></dd></div>
            ))}
          </dl>
        </Panel>
        <Panel title="Recent emails" className="scroll-mt-6">
          <div id="emails" className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <tbody>
                {emails.map((n) => (
                  <tr key={n.id} className="border-b border-line/60 last:border-0">
                    <td className="py-2 pr-3 text-ink-soft">{new Intl.DateTimeFormat("en-GB", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/London" }).format(n.createdAt)}</td>
                    <td className="py-2 pr-3">{n.subject}<span className="block text-xs text-ink-soft">{n.recipient}{n.lastError && ` · ${n.lastError}`}</span></td>
                    <td className="py-2 pr-3"><Badge status={n.status} /></td>
                    <td className="py-2 text-right">{(n.status === "FAILED" || n.status === "SKIPPED") && <form action={retryEmailAction}><input type="hidden" name="id" value={n.id} /><button className={smallBtn}>Retry</button></form>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}
