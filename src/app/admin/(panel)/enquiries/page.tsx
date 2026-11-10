import Link from "next/link";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/server/auth";
import { Badge, Empty, PageHeader, smallBtn } from "@/components/admin/ui";
import { EVENT_TYPES } from "@/lib/validation";
import { updateEnquiryAction } from "./actions";

const STATUSES = ["NEW", "IN_PROGRESS", "RESPONDED", "CLOSED", "SPAM"] as const;
const dt = (d: Date) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(d);

export default async function EnquiriesPage({ searchParams }: PageProps<"/admin/enquiries">) {
  const user = await requirePermission("enquiries.read");
  const sp = await searchParams;
  const tab = sp.tab === "contact" ? "contact" : "events";
  const status = typeof sp.status === "string" && (STATUSES as readonly string[]).includes(sp.status) ? (sp.status as (typeof STATUSES)[number]) : undefined;
  const openOnly = !status && sp.all !== "1";
  const where = status ? { status } : openOnly ? { status: { in: ["NEW", "IN_PROGRESS"] as ("NEW" | "IN_PROGRESS")[] } } : {};
  const [events, contacts, newEvents, newContacts] = await Promise.all([
    tab === "events" ? db.eventEnquiry.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }) : [],
    tab === "contact" ? db.contactEnquiry.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }) : [],
    db.eventEnquiry.count({ where: { status: "NEW" } }),
    db.contactEnquiry.count({ where: { status: "NEW" } }),
  ]);
  const writable = can(user, "enquiries.write");
  const tabCls = (t: string) => `rounded-full px-4 py-2 text-sm font-semibold ${tab === t ? "bg-wine text-ivory" : "bg-white border border-line"}`;
  const items = tab === "events" ? events : contacts;

  return (
    <>
      <PageHeader title="Enquiries" description="Celebration and event enquiries, and messages from the contact form." />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Link href="?tab=events" className={tabCls("events")}>Events {newEvents > 0 && `(${newEvents} new)`}</Link>
        <Link href="?tab=contact" className={tabCls("contact")}>Messages {newContacts > 0 && `(${newContacts} new)`}</Link>
        <span className="mx-2 h-6 w-px bg-line" />
        <Link href={`?tab=${tab}`} className={smallBtn}>Open</Link>
        <Link href={`?tab=${tab}&all=1`} className={smallBtn}>All</Link>
        <Link href={`?tab=${tab}&status=SPAM`} className={smallBtn}>Spam</Link>
      </div>
      {items.length === 0 ? (
        <Empty title={openOnly ? "No open enquiries" : "No enquiries"}>{openOnly && "You're all caught up."}</Empty>
      ) : (
        <ul className="space-y-4">
          {items.map((e) => {
            const ev = "eventType" in e ? e : null;
            return (
              <li key={e.id} id={e.id} className={`rounded-xl border bg-white p-5 ${sp.id === e.id ? "border-gold ring-2 ring-gold/40" : "border-line"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{e.name} <Badge status={e.status} /></p>
                    <p className="text-sm text-ink-soft"><a className="underline" href={`mailto:${e.email}`}>{e.email}</a>{e.phone && <> · <a className="underline" href={`tel:${e.phone}`}>{e.phone}</a></>} · received {dt(e.createdAt)}</p>
                  </div>
                  {ev && (
                    <p className="rounded-lg bg-[#fbf8f3] px-3 py-1.5 text-sm">
                      <strong>{EVENT_TYPES[ev.eventType]}</strong> · {ev.guests} guests · {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(ev.eventDate)} {ev.preferredTime}
                    </p>
                  )}
                </div>
                {"subject" in e && e.subject && <p className="mt-3 font-semibold">{e.subject}</p>}
                {e.message && <p className="mt-2 whitespace-pre-line text-sm">{e.message}</p>}
                {ev?.budgetNote && <p className="mt-2 text-sm text-ink-soft">Budget: {ev.budgetNote}</p>}
                {writable ? (
                  <form action={updateEnquiryAction} className="mt-4 grid gap-3 border-t border-line pt-4 md:grid-cols-[1fr_12rem_auto] md:items-end">
                    <input type="hidden" name="kind" value={ev ? "event" : "contact"} />
                    <input type="hidden" name="id" value={e.id} />
                    <label className="text-sm"><span className="mb-1 block text-xs font-semibold text-ink-soft">Internal notes</span><textarea name="internalNotes" rows={2} defaultValue={e.internalNotes ?? ""} className="field" /></label>
                    <label className="text-sm"><span className="mb-1 block text-xs font-semibold text-ink-soft">Status</span>
                      <select name="status" defaultValue={e.status} className="field">{STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ").toLowerCase()}</option>)}</select>
                    </label>
                    <button className={smallBtn}>Save</button>
                  </form>
                ) : e.internalNotes ? <p className="mt-3 text-sm text-ink-soft">Notes: {e.internalNotes}</p> : null}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
