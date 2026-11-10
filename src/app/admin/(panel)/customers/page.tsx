import Link from "next/link";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/server/auth";
import { Badge, Empty, PageHeader, Panel, smallBtn, td, th } from "@/components/admin/ui";

export default async function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const user = await requirePermission("customers.read");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const consent = sp.consent === "1";
  const customers = await db.customer.findMany({
    where: {
      anonymisedAt: null,
      email: { not: { endsWith: "@placeholder.invalid" } },
      ...(consent ? { marketingConsent: true } : {}),
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q.toLowerCase() } }, { phone: { contains: q.replace(/\s/g, "") } }] } : {}),
    },
    include: { _count: { select: { reservations: true } }, reservations: { orderBy: { startsAt: "desc" }, take: 1, select: { startsAt: true } } },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  return (
    <>
      <PageHeader
        title="Customers"
        description="Guests who have booked. Phone-only guests appear on their bookings."
        actions={can(user, "customers.write") ? <a className={smallBtn} href={`/api/v1/admin/customers/export${consent ? "?consent=1" : ""}`}>Export CSV</a> : undefined}
      />
      <Panel className="mb-5">
        <form className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1"><label htmlFor="q" className="mb-1 block text-xs font-semibold text-ink-soft">Search</label><input id="q" name="q" defaultValue={q} className="field min-h-10 py-1.5" /></div>
          <label className="flex items-center gap-2 pb-2.5 text-sm"><input type="checkbox" name="consent" value="1" defaultChecked={consent} className="size-4" /> Marketing opt-ins only</label>
          <button className="btn btn-primary min-h-10">Search</button>
        </form>
      </Panel>
      {customers.length === 0 ? <Empty title="No customers found" /> : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[44rem] text-sm">
            <thead className="border-b border-line bg-[#fbf8f3]"><tr><th className={th}>Name</th><th className={th}>Contact</th><th className={th}>Bookings</th><th className={th}>Last visit</th><th className={th}>Marketing</th></tr></thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-line/60 last:border-0">
                  <td className={td}><Link href={`/admin/customers/${c.id}`} className="font-semibold hover:underline">{c.name}</Link></td>
                  <td className={td}>{c.email}<span className="block text-xs text-ink-soft">{c.phone}</span></td>
                  <td className={td}>{c._count.reservations}</td>
                  <td className={td}>{c.reservations[0] ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Europe/London" }).format(c.reservations[0].startsAt) : "—"}</td>
                  <td className={td}>{c.marketingConsent ? <Badge status="CONFIRMED" label="Opted in" /> : <Badge status="CLOSED" label="No" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
