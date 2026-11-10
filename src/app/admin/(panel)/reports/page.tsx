import Link from "next/link";
import { requirePermission } from "@/server/auth";
import { buildReport } from "@/server/reports";
import { addDaysIso, formatTime12, londonDateIso } from "@/lib/time";
import { PageHeader, Panel, Stat, smallBtn } from "@/components/admin/ui";
import { BarChart } from "@/components/admin/bar-chart";
import { EVENT_TYPES } from "@/lib/validation";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const iso = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

export default async function ReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  await requirePermission("reports.view");
  const sp = await searchParams;
  const today = londonDateIso(new Date());
  const from = iso(sp.from) ?? addDaysIso(today, -89);
  const to = iso(sp.to) ?? today;
  const r = await buildReport(from, to);
  const started = r.website.booking_started ?? 0;
  const completed = r.website.reservation_completed ?? 0;
  const cancelRate = r.totals.all ? Math.round((r.status.CANCELLED / r.totals.all) * 100) : 0;
  const settled = r.status.COMPLETED + r.status.NO_SHOW;
  const noShowRate = settled ? Math.round((r.status.NO_SHOW / settled) * 100) : 0;
  const fmtShort = (d: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));

  return (
    <>
      <PageHeader
        title="Reports"
        description={`${fmtShort(from)} – ${fmtShort(to)}, by visit date`}
        actions={<a href={`/api/v1/admin/reports?from=${from}&to=${to}`} className={smallBtn}>Export CSV</a>}
      />
      <Panel className="mb-6">
        <form className="flex flex-wrap items-end gap-3 text-sm">
          <label><span className="mb-1 block text-xs font-semibold text-ink-soft">From</span><input type="date" name="from" defaultValue={from} className="field min-h-10 py-1.5" /></label>
          <label><span className="mb-1 block text-xs font-semibold text-ink-soft">To</span><input type="date" name="to" defaultValue={to} className="field min-h-10 py-1.5" /></label>
          <button className="btn btn-primary min-h-10">Update</button>
          {[["Last 30 days", -29], ["Last 90 days", -89], ["Last 12 months", -364]].map(([l, n]) => (
            <Link key={l} className={smallBtn} href={`?from=${addDaysIso(today, Number(n))}&to=${today}`}>{l}</Link>
          ))}
        </form>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Bookings" value={r.totals.bookings} hint={`${r.totals.covers} covers · avg party ${r.totals.avgParty.toFixed(1)}`} />
        <Stat label="Cancellation rate" value={`${cancelRate}%`} hint={`${r.status.CANCELLED} cancelled`} />
        <Stat label="No-show rate" value={`${noShowRate}%`} hint={`${r.status.NO_SHOW} of ${settled} completed visits`} />
        <Stat label="Online booking conversion" value={started ? `${Math.round((completed / started) * 100)}%` : "—"} hint={`${completed} completed of ${started} started`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Bookings per week">
          <BarChart title="Bookings per week" data={r.weekly.map((w) => ({ label: fmtShort(w.week), value: w.bookings, sub: `Week of ${fmtShort(w.week)} (${w.covers} covers)` }))} />
        </Panel>
        <Panel title="Peak booking times (start hour)">
          <BarChart title="Bookings by start time" data={r.byHour.map((h) => ({ label: formatTime12(`${String(h.hour).padStart(2, "0")}:00`), value: h.bookings }))} />
        </Panel>
        <Panel title="Busiest days">
          <BarChart title="Bookings by day of week" data={[1, 2, 3, 4, 5, 6, 0].map((d) => ({ label: DAYS[d], value: r.byDay[d] }))} />
        </Panel>
        <Panel title="Party sizes">
          <BarChart title="Bookings by party size" data={r.parties.map((p) => ({ label: p.size === 10 ? "10+" : String(p.size), value: p.bookings, sub: `${p.size === 10 ? "10+" : p.size} guests` }))} />
        </Panel>
        <Panel title="How far ahead guests book">
          <BarChart title="Booking lead time" data={Object.entries(r.leadBuckets).map(([k, v]) => ({ label: k, value: v }))} />
        </Panel>
        <Panel title="Where bookings come from">
          <BarChart title="Bookings by source" data={Object.entries(r.source).map(([k, v]) => ({ label: k === "WALK_IN" ? "Walk-in" : k[0] + k.slice(1).toLowerCase(), value: v }))} />
        </Panel>
        <Panel title="Enquiries">
          <p className="mb-3 text-sm text-ink-soft">{r.enquiries.events} event enquiries · {r.enquiries.contacts} contact messages</p>
          <BarChart title="Event enquiries by type" data={Object.entries(EVENT_TYPES).map(([k, v]) => ({ label: v.split(" ")[0], value: r.enquiries.eventTypes[k] ?? 0, sub: v }))} />
        </Panel>
        <Panel title="Website actions">
          <BarChart
            title="Website conversion actions"
            data={[["booking_started", "Booking started"], ["reservation_completed", "Booked"], ["order_click", "Order clicks"], ["phone_click", "Phone taps"], ["directions_click", "Directions"], ["contact_submitted", "Messages"], ["newsletter_signup", "Sign-ups"]].map(([k, l]) => ({ label: l.split(" ")[0], value: r.website[k] ?? 0, sub: l }))}
          />
          <p className="mt-3 text-xs text-ink-soft">Counted on our own server without cookies, so these include visitors who declined analytics. Detailed traffic is in Google Analytics once configured.</p>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Offer performance">
          <p className="text-sm text-ink-soft">
            Takeaway orders are taken by Just Order Online, so order counts and revenue per offer live in your JOO account. Here you can see &ldquo;Order online&rdquo; clicks for the period ({r.website.order_click ?? 0}) and which offers were running:
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {r.offers.filter((o) => o.active).map((o) => <li key={o.title}>• {o.title}</li>)}
          </ul>
        </Panel>
        <Panel title="Popular dishes">
          <p className="text-sm text-ink-soft">Not available: dish-level sales data comes from orders, which are handled by Just Order Online. If a native ordering system is added later, this report will use it.</p>
        </Panel>
      </div>
    </>
  );
}
