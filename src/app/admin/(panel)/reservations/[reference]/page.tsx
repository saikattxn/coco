import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { can, requirePermission } from "@/server/auth";
import { dateOnlyIso, formatDateLong, formatTime12, londonTime } from "@/lib/time";
import { STATUS_TRANSITIONS } from "@/server/booking/engine";
import { Badge, Flash, PageHeader, Panel } from "@/components/admin/ui";
import { StatusControls, EditReservation, GuestNotes } from "./controls";

export default async function ReservationDetail({ params, searchParams }: PageProps<"/admin/reservations/[reference]">) {
  const user = await requirePermission("reservations.read");
  const { reference } = await params;
  const sp = await searchParams;
  const r = await db.reservation.findUnique({
    where: { reference: decodeURIComponent(reference) },
    include: { customer: { include: { _count: { select: { reservations: true } } } }, table: { include: { area: true } }, notifications: { orderBy: { createdAt: "asc" } } },
  });
  if (!r) notFound();
  const [joined, tables, history] = await Promise.all([
    db.table.findMany({ where: { id: { in: r.joinedTableIds } } }),
    db.table.findMany({ where: { active: true }, include: { area: true }, orderBy: [{ area: { sortOrder: "asc" } }, { sortOrder: "asc" }] }),
    db.auditLog.findMany({ where: { entityType: "Reservation", entityId: r.id }, include: { user: true }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  const writable = can(user, "reservations.write");
  const placeholderEmail = r.customer.email.endsWith("@placeholder.invalid") || r.customer.email.endsWith("@invalid");

  return (
    <>
      <PageHeader
        title={r.customer.name}
        description={<>{formatDateLong(dateOnlyIso(r.serviceDate))} at {formatTime12(londonTime(r.startsAt))} · {r.partySize} guests · <span className="font-mono">{r.reference}</span></>}
        actions={<Link href={`/admin/reservations?date=${dateOnlyIso(r.serviceDate)}`} className="btn btn-outline text-wine">Back to day</Link>}
      />
      <Flash message={sp.created ? "Booking created." : null} />
      {r.changeRequest && (
        <div className="mb-5 rounded-lg border border-[#b8cbe3] bg-[#eef4fb] p-4 text-sm">
          <strong>Guest requested a change:</strong> {r.changeRequest}
          <span className="block text-ink-soft">Edit the booking below, then tick &ldquo;Mark change request handled&rdquo;.</span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Panel title="Status" actions={<Badge status={r.status} />}>
            {writable ? <StatusControls id={r.id} current={r.status} allowed={STATUS_TRANSITIONS[r.status]} /> : <p className="text-sm text-ink-soft">You can view this booking but not change it.</p>}
          </Panel>
          {writable && (
            <Panel title="Edit booking">
              <EditReservation
                id={r.id}
                defaults={{ date: dateOnlyIso(r.serviceDate), time: londonTime(r.startsAt), partySize: r.partySize, tableId: r.tableId, occasion: r.occasion ?? "", specialRequests: r.specialRequests ?? "", staffNotes: r.staffNotes ?? "" }}
                tables={tables.map((t) => ({ id: t.id, label: t.label, area: t.area.name, maxCovers: t.maxCovers }))}
                hasChangeRequest={Boolean(r.changeRequest)}
                canEmail={!placeholderEmail}
              />
            </Panel>
          )}
          <Panel title="Emails">
            {r.notifications.length === 0 ? (
              <p className="text-sm text-ink-soft">No emails for this booking.</p>
            ) : (
              <ul className="divide-y divide-line text-sm">
                {r.notifications.map((n) => (
                  <li key={n.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span>{n.subject} <span className="text-ink-soft">→ {n.recipient}</span></span>
                    <span className="flex items-center gap-2"><Badge status={n.status} />{n.lastError && <span className="text-xs text-ink-soft">{n.lastError}</span>}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="History">
            <ul className="space-y-2 text-sm">
              {history.map((h) => (
                <li key={h.id}><span className="text-ink-soft">{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(h.createdAt)}</span> — {h.summary} <span className="text-ink-soft">({h.user?.name ?? "guest / system"})</span></li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Guest">
            <dl className="space-y-2 text-sm">
              <div><dt className="text-ink-soft">Phone</dt><dd><a className="underline" href={`tel:${r.customer.phone}`}>{r.customer.phone}</a></dd></div>
              <div><dt className="text-ink-soft">Email</dt><dd className="break-all">{placeholderEmail ? "—" : <a className="underline" href={`mailto:${r.customer.email}`}>{r.customer.email}</a>}</dd></div>
              <div><dt className="text-ink-soft">Visits booked</dt><dd>{r.customer._count.reservations}</dd></div>
              <div><dt className="text-ink-soft">Marketing</dt><dd>{r.customer.marketingConsent ? "Opted in" : "Not opted in"}</dd></div>
            </dl>
            {can(user, "customers.read") && <Link href={`/admin/customers/${r.customer.id}`} className="mt-3 inline-block text-sm underline">Guest record</Link>}
            {can(user, "customers.write") && <GuestNotes customerId={r.customer.id} notes={r.customer.notes ?? ""} />}
          </Panel>
          <Panel title="Details">
            <dl className="space-y-2 text-sm">
              <div><dt className="text-ink-soft">Table</dt><dd>{[r.table?.label, ...joined.map((t) => t.label)].filter(Boolean).join(" + ") || "Unassigned"}{r.table && ` · ${r.table.area.name}`}</dd></div>
              <div><dt className="text-ink-soft">Seated until</dt><dd>{formatTime12(londonTime(r.endsAt))}</dd></div>
              <div><dt className="text-ink-soft">Occasion</dt><dd>{r.occasion ?? "—"}</dd></div>
              <div><dt className="text-ink-soft">Guest requests</dt><dd className="whitespace-pre-line">{r.specialRequests ?? "—"}</dd></div>
              <div><dt className="text-ink-soft">Staff notes</dt><dd className="whitespace-pre-line">{r.staffNotes ?? "—"}</dd></div>
              <div><dt className="text-ink-soft">Source</dt><dd>{r.source.toLowerCase().replace("_", "-")}</dd></div>
              <div><dt className="text-ink-soft">Created</dt><dd>{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(r.createdAt)}</dd></div>
              {r.cancelReason && <div><dt className="text-ink-soft">Cancellation</dt><dd>{r.cancelReason}</dd></div>}
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}
