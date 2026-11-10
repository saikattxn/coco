import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission, can } from "@/server/auth";
import { addDaysIso, dateOnly, formatTime12, londonDateIso, londonParts, londonTime, weekdayOf } from "@/lib/time";
import { Badge, Empty, PageHeader, Panel, Stat, td, th } from "@/components/admin/ui";
import { emailConfigured } from "@/server/notifications/transport";

const daysAgo = (n: number) => new Date(Date.now() - n * 86400_000);

export default async function AdminOverview() {
  const user = await requirePermission("dashboard.view");
  const today = londonDateIso(new Date());
  const weekStart = addDaysIso(today, -((weekdayOf(today) + 6) % 7)); // Monday
  const monthStart = `${today.slice(0, 8)}01`;
  const [y, m] = [Number(today.slice(0, 4)), Number(today.slice(5, 7))];
  const nextMonthStart = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const hour = londonParts(new Date()).hour;
  const d30 = daysAgo(30);
  const canRes = can(user, "reservations.read");

  const [todays, upcoming7, weekCount, monthCount, created30, cancelled30, pending, newContact, newEvents, activeOffers, events30, failedEmails] = await Promise.all([
    canRes ? db.reservation.findMany({ where: { serviceDate: dateOnly(today), status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] } }, include: { customer: true, table: true }, orderBy: { startsAt: "asc" } }) : [],
    canRes ? db.reservation.count({ where: { serviceDate: { gt: dateOnly(today), lte: dateOnly(addDaysIso(today, 7)) }, status: { in: ["PENDING", "CONFIRMED"] } } }) : 0,
    canRes ? db.reservation.count({ where: { serviceDate: { gte: dateOnly(weekStart), lt: dateOnly(addDaysIso(weekStart, 7)) }, status: { not: "CANCELLED" } } }) : 0,
    canRes ? db.reservation.count({ where: { serviceDate: { gte: dateOnly(monthStart), lt: dateOnly(nextMonthStart) }, status: { not: "CANCELLED" } } }) : 0,
    canRes ? db.reservation.count({ where: { createdAt: { gte: d30 } } }) : 0,
    canRes ? db.reservation.count({ where: { createdAt: { gte: d30 }, status: "CANCELLED" } }) : 0,
    canRes ? db.reservation.findMany({ where: { startsAt: { gte: new Date() }, OR: [{ status: "PENDING" }, { changeRequest: { not: null }, status: "CONFIRMED" }] }, include: { customer: true }, orderBy: { startsAt: "asc" }, take: 8 }) : [],
    can(user, "enquiries.read") ? db.contactEnquiry.count({ where: { status: "NEW" } }) : 0,
    can(user, "enquiries.read") ? db.eventEnquiry.count({ where: { status: "NEW" } }) : 0,
    db.offer.count({ where: { active: true, deletedAt: null, OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] } }),
    can(user, "reports.view") ? db.analyticsEvent.groupBy({ by: ["name"], where: { createdAt: { gte: d30 } }, _count: true }) : [],
    can(user, "settings.write") ? db.notification.count({ where: { status: "FAILED" } }) : 0,
  ]);
  const covers = todays.reduce((s, r) => s + r.partySize, 0);
  const ev = Object.fromEntries(events30.map((e) => [e.name, e._count]));
  const cancelRate = created30 ? Math.round((cancelled30 / created30) * 100) : 0;

  return (
    <>
      <PageHeader
        title={`Good ${hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"}, ${user.name.split(" ")[0]}`}
        description={new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/London" }).format(new Date())}
        actions={can(user, "reservations.write") ? <Link href="/admin/reservations/new" className="btn btn-primary">New booking</Link> : undefined}
      />

      {!emailConfigured() && can(user, "settings.write") && (
        <div className="mb-6 rounded-lg border border-[#e8cf91] bg-[#fff7e3] p-4 text-sm text-[#6b4b00]">
          <strong>Email is awaiting configuration.</strong> Bookings are saved, but confirmation emails won&apos;t be sent until RESEND_API_KEY and EMAIL_FROM are set. See the deployment guide.
        </div>
      )}
      {failedEmails > 0 && (
        <div className="mb-6 rounded-lg border border-bad/30 bg-[#fbeceb] p-4 text-sm text-bad">
          {failedEmails} email{failedEmails === 1 ? "" : "s"} failed to send and will be retried automatically. <Link href="/admin/settings#emails" className="underline">View email log</Link>
        </div>
      )}

      {canRes && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Today" value={todays.length} hint={`${covers} covers`} href={`/admin/reservations?date=${today}`} />
          <Stat label="Next 7 days" value={upcoming7} hint="upcoming bookings" href="/admin/reservations?range=week" />
          <Stat label="This week / month" value={`${weekCount} / ${monthCount}`} hint="excluding cancellations" />
          <Stat label="Cancellation rate" value={`${cancelRate}%`} hint={`${cancelled30} of ${created30} made in 30 days`} />
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {canRes && (
          <Panel title="Today's bookings" actions={<Link href={`/admin/reservations?date=${today}`} className="text-sm underline">Open day view</Link>}>
            {todays.length === 0 ? (
              <Empty title="No bookings today yet" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-line"><th className={th}>Time</th><th className={th}>Guest</th><th className={th}>Covers</th><th className={th}>Table</th><th className={th}>Status</th></tr></thead>
                  <tbody>
                    {todays.map((r) => (
                      <tr key={r.id} className="border-b border-line/60 last:border-0">
                        <td className={`${td} font-semibold tabular-nums`}>{formatTime12(londonTime(r.startsAt))}</td>
                        <td className={td}><Link className="underline-offset-4 hover:underline" href={`/admin/reservations/${r.reference}`}>{r.customer.name}</Link>{r.occasion && <span className="block text-xs text-ink-soft">{r.occasion}</span>}</td>
                        <td className={td}>{r.partySize}</td>
                        <td className={td}>{r.table?.label ?? "—"}{r.joinedTableIds.length ? ` +${r.joinedTableIds.length}` : ""}</td>
                        <td className={td}><Badge status={r.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        )}

        <div className="space-y-6">
          {canRes && (
            <Panel title="Needs attention">
              {pending.length === 0 ? (
                <p className="text-sm text-ink-soft">Nothing waiting — all bookings are confirmed.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {pending.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <Link href={`/admin/reservations/${r.reference}`} className="hover:underline">
                        <span className="font-semibold">{r.customer.name}</span> · {r.partySize} · {new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Europe/London" }).format(r.startsAt)} {formatTime12(londonTime(r.startsAt))}
                      </Link>
                      {r.status === "PENDING" ? <Badge status="PENDING" label="Approve" /> : <Badge status="IN_PROGRESS" label="Change request" />}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}
          <div className="grid grid-cols-2 gap-4">
            {can(user, "enquiries.read") && <Stat label="New enquiries" value={newContact + newEvents} hint={`${newEvents} event · ${newContact} contact`} href="/admin/enquiries" />}
            <Stat label="Active offers" value={activeOffers} href={can(user, "offers.write") ? "/admin/offers" : undefined} />
          </div>
          {can(user, "reports.view") && (
            <Panel title="Website actions (30 days)" actions={<Link href="/admin/reports" className="text-sm underline">Reports</Link>}>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {[["booking_started", "Booking started"], ["reservation_completed", "Booking completed"], ["order_click", "Order online clicks"], ["phone_click", "Phone taps"], ["directions_click", "Directions"], ["event_enquiry_submitted", "Event enquiries"]].map(([k, l]) => (
                  <div key={k}><dt className="text-ink-soft">{l}</dt><dd className="text-xl font-semibold tabular-nums">{ev[k] ?? 0}</dd></div>
                ))}
              </dl>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
