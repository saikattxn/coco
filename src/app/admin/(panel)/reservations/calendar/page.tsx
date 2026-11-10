import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/server/auth";
import { addDaysIso, dateOnly, dateOnlyIso, londonDateIso, weekdayOf } from "@/lib/time";
import { PageHeader, smallBtn } from "@/components/admin/ui";

export default async function CalendarPage({ searchParams }: PageProps<"/admin/reservations/calendar">) {
  await requirePermission("reservations.read");
  const sp = await searchParams;
  const today = londonDateIso(new Date());
  const month = typeof sp.month === "string" && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : today.slice(0, 7);
  const first = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const prevMonth = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
  const gridStart = addDaysIso(first, -((weekdayOf(first) + 6) % 7));

  const rows = await db.reservation.groupBy({
    by: ["serviceDate", "status"],
    where: { serviceDate: { gte: dateOnly(gridStart), lt: dateOnly(addDaysIso(gridStart, 42)) } },
    _count: true,
    _sum: { partySize: true },
  });
  const byDay = new Map<string, { bookings: number; covers: number; pending: number }>();
  for (const r of rows) {
    const k = dateOnlyIso(r.serviceDate);
    const v = byDay.get(k) ?? { bookings: 0, covers: 0, pending: 0 };
    if (r.status !== "CANCELLED" && r.status !== "NO_SHOW") {
      v.bookings += r._count;
      v.covers += r._sum.partySize ?? 0;
    }
    if (r.status === "PENDING") v.pending += r._count;
    byDay.set(k, v);
  }
  const days = Array.from({ length: 42 }, (_, i) => addDaysIso(gridStart, i));
  const monthLabel = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(dateOnly(first));

  return (
    <>
      <PageHeader
        title="Booking calendar"
        description={monthLabel}
        actions={
          <>
            <Link className={smallBtn} href={`?month=${prevMonth}`}>‹ {prevMonth}</Link>
            <Link className={smallBtn} href="?">This month</Link>
            <Link className={smallBtn} href={`?month=${nextMonth}`}>{nextMonth} ›</Link>
            <Link className={smallBtn} href="/admin/reservations">List view</Link>
          </>
        }
      />
      <div className="overflow-x-auto">
        <div className="grid min-w-[44rem] grid-cols-7 gap-px overflow-hidden rounded-xl border border-line bg-line">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="bg-[#fbf8f3] px-3 py-2 text-xs font-semibold text-ink-soft">{d}</div>
          ))}
          {days.map((d) => {
            const v = byDay.get(d);
            const inMonth = d.startsWith(month);
            return (
              <Link key={d} href={`/admin/reservations?date=${d}`} className={`min-h-24 bg-white p-2.5 text-sm hover:bg-[#fbf8f3] ${inMonth ? "" : "opacity-45"} ${d === today ? "ring-2 ring-inset ring-gold" : ""}`}>
                <span className="font-semibold">{Number(d.slice(8))}</span>
                {v && v.bookings > 0 && (
                  <span className="mt-1 block text-ink">
                    {v.bookings} booking{v.bookings === 1 ? "" : "s"}
                    <span className="block text-xs text-ink-soft">{v.covers} covers</span>
                  </span>
                )}
                {v && v.pending > 0 && <span className="mt-1 inline-block rounded-full bg-[#fff3d6] px-2 text-xs font-semibold text-[#7a5300]">{v.pending} pending</span>}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
