import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/server/auth";
import { addDaysIso, dateOnly, formatDateLong, formatTime12, londonDateIso, londonTime } from "@/lib/time";
import { Badge, Empty, PageHeader, Panel, smallBtn, td, th } from "@/components/admin/ui";

const STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"] as const;

export default async function ReservationsPage({ searchParams }: PageProps<"/admin/reservations">) {
  const user = await requirePermission("reservations.read");
  const sp = await searchParams;
  const today = londonDateIso(new Date());
  const range = typeof sp.range === "string" ? sp.range : "day";
  const date = typeof sp.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today;
  const status = typeof sp.status === "string" && (STATUSES as readonly string[]).includes(sp.status) ? sp.status : "";
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";

  const where: Prisma.ReservationWhereInput = {};
  if (q) {
    where.OR = [
      { reference: { contains: q.toUpperCase() } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
      { customer: { email: { contains: q.toLowerCase() } } },
      { customer: { phone: { contains: q.replace(/\s/g, "") } } },
    ];
  } else if (range === "day") {
    where.serviceDate = dateOnly(date);
  } else if (range === "week") {
    where.serviceDate = { gte: dateOnly(date), lt: dateOnly(addDaysIso(date, 7)) };
  } else if (range === "upcoming") {
    where.startsAt = { gte: new Date() };
  }
  if (status) where.status = status as (typeof STATUSES)[number];

  const rows = await db.reservation.findMany({
    where,
    include: { customer: true, table: true },
    orderBy: range === "upcoming" || range === "day" || range === "week" ? { startsAt: "asc" } : { startsAt: "desc" },
    take: 300,
  });
  const tables = await db.table.findMany({ select: { id: true, label: true } });
  const tableLabel = Object.fromEntries(tables.map((t) => [t.id, t.label]));
  const active = rows.filter((r) => ["PENDING", "CONFIRMED", "COMPLETED"].includes(r.status));
  const covers = active.reduce((s, r) => s + r.partySize, 0);

  const qs = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ range, date, ...(status ? { status } : {}), ...(q ? { q } : {}), ...patch });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    return `/admin/reservations?${p.toString()}`;
  };
  const exportHref = `/api/v1/admin/reservations/export?${new URLSearchParams({ from: range === "week" ? date : range === "day" ? date : addDaysIso(today, -90), to: range === "week" ? addDaysIso(date, 6) : range === "day" ? date : addDaysIso(today, 90), ...(status ? { status } : {}) })}`;

  return (
    <>
      <PageHeader
        title="Reservations"
        description={q ? `Search results for “${q}”` : range === "day" ? formatDateLong(date) : range === "week" ? `Week from ${formatDateLong(date)}` : range === "upcoming" ? "All upcoming bookings" : "All bookings"}
        actions={
          <>
            <Link href="/admin/reservations/calendar" className={smallBtn}>Calendar</Link>
            {can(user, "reservations.export") && <a href={exportHref} className={smallBtn}>Export CSV</a>}
            {can(user, "reservations.write") && <Link href="/admin/reservations/new" className="btn btn-primary">New booking</Link>}
          </>
        }
      />

      <Panel className="mb-5">
        <form className="flex flex-wrap items-end gap-3" action="/admin/reservations">
          <div>
            <label htmlFor="range" className="mb-1 block text-xs font-semibold text-ink-soft">Show</label>
            <select id="range" name="range" defaultValue={range} className="field min-h-10 py-1.5">
              <option value="day">One day</option>
              <option value="week">7 days from</option>
              <option value="upcoming">All upcoming</option>
              <option value="all">All (newest first)</option>
            </select>
          </div>
          <div>
            <label htmlFor="date" className="mb-1 block text-xs font-semibold text-ink-soft">Date</label>
            <input id="date" name="date" type="date" defaultValue={date} className="field min-h-10 py-1.5" />
          </div>
          <div>
            <label htmlFor="status" className="mb-1 block text-xs font-semibold text-ink-soft">Status</label>
            <select id="status" name="status" defaultValue={status} className="field min-h-10 py-1.5">
              <option value="">Any</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ").toLowerCase()}</option>)}
            </select>
          </div>
          <div className="min-w-48 flex-1">
            <label htmlFor="q" className="mb-1 block text-xs font-semibold text-ink-soft">Search name, email, phone or reference</label>
            <input id="q" name="q" type="search" defaultValue={q} className="field min-h-10 py-1.5" />
          </div>
          <button className="btn btn-primary min-h-10">Apply</button>
          {range === "day" && !q && (
            <div className="flex gap-2">
              <Link className={smallBtn} href={qs({ date: addDaysIso(date, -1) })} aria-label="Previous day">‹ Prev</Link>
              <Link className={smallBtn} href={qs({ date: today })}>Today</Link>
              <Link className={smallBtn} href={qs({ date: addDaysIso(date, 1) })} aria-label="Next day">Next ›</Link>
            </div>
          )}
        </form>
      </Panel>

      <p className="mb-3 text-sm text-ink-soft">{rows.length} booking{rows.length === 1 ? "" : "s"} · {covers} covers (excluding cancellations and no-shows)</p>

      {rows.length === 0 ? (
        <Empty title="No bookings match">Try another date or clear the filters.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="border-b border-line bg-[#fbf8f3]">
              <tr><th className={th}>When</th><th className={th}>Guest</th><th className={th}>Covers</th><th className={th}>Table</th><th className={th}>Source</th><th className={th}>Status</th><th className={th}>Ref</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line/60 last:border-0 hover:bg-[#fbf8f3]">
                  <td className={`${td} whitespace-nowrap tabular-nums`}>
                    {range !== "day" && <span className="block text-xs text-ink-soft">{new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/London" }).format(r.startsAt)}</span>}
                    <span className="font-semibold">{formatTime12(londonTime(r.startsAt))}</span>
                  </td>
                  <td className={td}>
                    <Link href={`/admin/reservations/${r.reference}`} className="font-semibold hover:underline">{r.customer.name}</Link>
                    <span className="block text-xs text-ink-soft">{r.customer.phone}</span>
                    {(r.specialRequests || r.occasion) && <span className="mt-0.5 block max-w-xs truncate text-xs text-[#7a5300]">{[r.occasion, r.specialRequests].filter(Boolean).join(" · ")}</span>}
                    {r.changeRequest && <span className="mt-0.5 block text-xs font-semibold text-[#2b4f7a]">Change requested</span>}
                  </td>
                  <td className={td}>{r.partySize}</td>
                  <td className={td}>{[r.table?.label, ...r.joinedTableIds.map((id) => tableLabel[id])].filter(Boolean).join(" + ") || "—"}</td>
                  <td className={`${td} text-xs text-ink-soft`}>{r.source.toLowerCase().replace("_", "-")}</td>
                  <td className={td}><Badge status={r.status} /></td>
                  <td className={`${td} font-mono text-xs`}>{r.reference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
