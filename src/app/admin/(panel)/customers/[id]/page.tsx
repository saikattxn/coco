import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/server/auth";
import { formatTime12, londonTime } from "@/lib/time";
import { Badge, Flash, PageHeader, Panel, smallBtn, td, th } from "@/components/admin/ui";
import { consentAction, eraseCustomerAction } from "../actions";

export default async function CustomerPage({ params, searchParams }: PageProps<"/admin/customers/[id]">) {
  const user = await requirePermission("customers.read");
  const { id } = await params;
  const sp = await searchParams;
  const c = await db.customer.findUnique({ where: { id }, include: { reservations: { orderBy: { startsAt: "desc" } } } });
  if (!c) notFound();
  const writable = can(user, "customers.write");
  const dt = (d: Date) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Europe/London" }).format(d);
  return (
    <>
      <PageHeader title={c.name} description={c.anonymisedAt ? "Personal data erased" : `${c.email} · ${c.phone}`} actions={<Link href="/admin/customers" className="btn btn-outline text-wine">All customers</Link>} />
      <Flash message={sp.erased ? "Personal data erased. Booking statistics are kept without identifying details." : null} />
      <Flash tone="error" message={sp.error === "upcoming" ? "This guest has upcoming bookings. Cancel them first, then erase." : sp.error === "confirm" ? "Type ERASE to confirm." : null} />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <Panel title={`Booking history (${c.reservations.length})`}>
          <table className="w-full text-sm">
            <thead className="border-b border-line"><tr><th className={th}>Date</th><th className={th}>Guests</th><th className={th}>Status</th><th className={th}>Ref</th></tr></thead>
            <tbody>
              {c.reservations.map((r) => (
                <tr key={r.id} className="border-b border-line/60 last:border-0">
                  <td className={td}>{dt(r.startsAt)} {formatTime12(londonTime(r.startsAt))}</td>
                  <td className={td}>{r.partySize}</td>
                  <td className={td}><Badge status={r.status} /></td>
                  <td className={td}><Link href={`/admin/reservations/${r.reference}`} className="font-mono text-xs underline">{r.reference}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
        <div className="space-y-6">
          <Panel title="Marketing consent">
            <p className="text-sm">{c.marketingConsent ? `Opted in ${c.marketingConsentAt ? dt(c.marketingConsentAt) : ""} via ${c.consentSource ?? "unknown"}.` : "Not opted in to marketing."}</p>
            {writable && !c.anonymisedAt && (
              <form action={consentAction} className="mt-3">
                <input type="hidden" name="id" value={c.id} />
                {c.marketingConsent ? <button name="grant" value="0" className={smallBtn}>Record withdrawal</button> : <button name="grant" value="1" className={smallBtn}>Record consent (guest asked)</button>}
              </form>
            )}
          </Panel>
          {c.notes && <Panel title="Guest notes"><p className="whitespace-pre-line text-sm">{c.notes}</p></Panel>}
          {writable && !c.anonymisedAt && (
            <Panel title="Data protection">
              <a href={`/api/v1/admin/customers/${c.id}/export`} className={smallBtn}>Download their data (JSON)</a>
              <form action={eraseCustomerAction} className="mt-5 space-y-2 border-t border-line pt-4">
                <input type="hidden" name="id" value={c.id} />
                <p className="text-sm font-semibold text-bad">Erase personal data</p>
                <p className="text-xs text-ink-soft">For erasure requests. Removes name, email, phone and notes from this guest and their bookings. Cannot be undone.</p>
                <label className="block text-sm">Type ERASE to confirm <input name="confirm" className="field mt-1 min-h-9 py-1.5" autoComplete="off" /></label>
                <button className={`${smallBtn} text-bad`}>Erase personal data</button>
              </form>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
