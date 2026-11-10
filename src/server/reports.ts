import "server-only";
import { db } from "@/lib/db";
import { addDaysIso, dateOnly, dateOnlyIso, londonParts, weekdayOf } from "@/lib/time";

export async function buildReport(from: string, to: string) {
  const range = { gte: dateOnly(from), lte: dateOnly(to) };
  const [reservations, events, contacts, analytics, offers] = await Promise.all([
    db.reservation.findMany({ where: { serviceDate: range }, select: { serviceDate: true, startsAt: true, createdAt: true, partySize: true, status: true, source: true } }),
    db.eventEnquiry.findMany({ where: { createdAt: { gte: dateOnly(from), lt: dateOnly(addDaysIso(to, 1)) } }, select: { eventType: true, createdAt: true, guests: true } }),
    db.contactEnquiry.count({ where: { createdAt: { gte: dateOnly(from), lt: dateOnly(addDaysIso(to, 1)) } } }),
    db.analyticsEvent.groupBy({ by: ["name"], where: { createdAt: { gte: dateOnly(from), lt: dateOnly(addDaysIso(to, 1)) } }, _count: true }),
    db.offer.findMany({ where: { deletedAt: null }, select: { title: true, startsAt: true, endsAt: true, active: true, type: true } }),
  ]);

  const kept = reservations.filter((r) => r.status !== "CANCELLED");
  // weekly trend (weeks starting Monday)
  const weeks = new Map<string, { bookings: number; covers: number }>();
  for (let d = addDaysIso(from, -((weekdayOf(from) + 6) % 7)); d <= to; d = addDaysIso(d, 7)) weeks.set(d, { bookings: 0, covers: 0 });
  for (const r of kept) {
    const iso = dateOnlyIso(r.serviceDate);
    const wk = addDaysIso(iso, -((weekdayOf(iso) + 6) % 7));
    const w = weeks.get(wk);
    if (w) { w.bookings++; w.covers += r.partySize; }
  }
  // peak times: bookings by starting hour (London), and by weekday
  const byHour = new Map<number, number>();
  const byDay = [0, 0, 0, 0, 0, 0, 0];
  for (const r of kept) {
    const p = londonParts(r.startsAt);
    byHour.set(p.hour, (byHour.get(p.hour) ?? 0) + 1);
    byDay[p.weekday]++;
  }
  // how far ahead people book
  const leadBuckets = { "Same day": 0, "1–2 days": 0, "3–7 days": 0, "1–4 weeks": 0, "Over 4 weeks": 0 };
  for (const r of kept) {
    const days = (r.startsAt.getTime() - r.createdAt.getTime()) / 86400_000;
    const k = days < 1 ? "Same day" : days < 3 ? "1–2 days" : days < 8 ? "3–7 days" : days < 29 ? "1–4 weeks" : "Over 4 weeks";
    leadBuckets[k]++;
  }
  const status = Object.fromEntries(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"].map((s) => [s, reservations.filter((r) => r.status === s).length]));
  const source = Object.fromEntries(["WEBSITE", "PHONE", "WALK_IN", "STAFF"].map((s) => [s, kept.filter((r) => r.source === s).length]));
  const ev = Object.fromEntries(analytics.map((a) => [a.name, a._count]));
  const eventTypes: Record<string, number> = {};
  for (const e of events) eventTypes[e.eventType] = (eventTypes[e.eventType] ?? 0) + 1;
  const parties = new Map<number, number>();
  for (const r of kept) parties.set(Math.min(r.partySize, 10), (parties.get(Math.min(r.partySize, 10)) ?? 0) + 1);

  return {
    from,
    to,
    totals: { bookings: kept.length, covers: kept.reduce((s, r) => s + r.partySize, 0), all: reservations.length, avgParty: kept.length ? kept.reduce((s, r) => s + r.partySize, 0) / kept.length : 0 },
    status,
    source,
    weekly: [...weeks.entries()].map(([wk, v]) => ({ week: wk, ...v })),
    byHour: [...Array(24).keys()].filter((h) => byHour.has(h) || (h >= 11 && h <= 22)).map((h) => ({ hour: h, bookings: byHour.get(h) ?? 0 })),
    byDay,
    leadBuckets,
    parties: [...Array(10).keys()].map((i) => ({ size: i + 1, bookings: parties.get(i + 1) ?? 0 })),
    enquiries: { events: events.length, contacts, eventTypes },
    website: ev,
    offers,
  };
}
