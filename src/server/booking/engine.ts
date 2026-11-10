/**
 * Booking engine — pure functions, no I/O. The service layer loads data, calls these
 * inside a locked transaction, then writes. Everything here is unit tested.
 */
import { londonToUtc, minutesOf, timeOf, weekdayOf } from "@/lib/time";

export type EngineSettings = {
  onlineBookingEnabled: boolean;
  slotIntervalMinutes: number;
  durationSmallMinutes: number;
  durationMediumMinutes: number;
  durationLargeMinutes: number;
  minPartySize: number;
  maxOnlinePartySize: number;
  autoConfirmMaxParty: number;
  maxCoversPerSlot: number;
  leadTimeMinutes: number;
  maxDaysAhead: number;
  lastSeatingMinutesBeforeClose: number;
};

export type EngineHours = { weekday: number; period: "LUNCH" | "DINNER"; opensAt: string; closesAt: string; isClosed: boolean };

export type EngineTable = {
  id: string;
  label: string;
  areaId: string;
  minCovers: number;
  maxCovers: number;
  combinable: boolean;
  joinGroup: string | null;
  active: boolean;
  sortOrder: number;
};

export type EngineBooking = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  partySize: number;
  tableId: string | null;
  joinedTableIds: string[];
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
  customerId?: string;
};

export type Slot = { time: string; period: "LUNCH" | "DINNER"; startsAt: Date; endsAt: Date };

export type Allocation = { tableId: string; joinedTableIds: string[]; capacity: number };

/** Statuses that hold a table. */
export const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "COMPLETED"] as const;

export function isActive(b: Pick<EngineBooking, "status">) {
  return (ACTIVE_STATUSES as readonly string[]).includes(b.status);
}

export function durationFor(s: EngineSettings, partySize: number): number {
  if (partySize <= 2) return s.durationSmallMinutes;
  if (partySize <= 4) return s.durationMediumMinutes;
  return s.durationLargeMinutes;
}

/** All candidate start times for a date (ignores capacity), honouring hours, lead time and horizon. */
export function generateSlots(args: {
  dateIso: string;
  partySize: number;
  settings: EngineSettings;
  hours: EngineHours[];
  isClosureDate: boolean;
  now: Date;
  /** Staff bookings skip lead-time and horizon rules. */
  staff?: boolean;
}): Slot[] {
  const { dateIso, partySize, settings, hours, isClosureDate, now, staff } = args;
  if (isClosureDate) return [];
  const weekday = weekdayOf(dateIso);
  const duration = durationFor(settings, partySize);
  const earliest = staff ? -Infinity : now.getTime() + settings.leadTimeMinutes * 60_000;
  const latest = staff ? Infinity : now.getTime() + settings.maxDaysAhead * 86_400_000;

  const slots: Slot[] = [];
  for (const h of hours.filter((x) => x.weekday === weekday && !x.isClosed)) {
    const open = minutesOf(h.opensAt);
    const lastStart = minutesOf(h.closesAt) - settings.lastSeatingMinutesBeforeClose;
    for (let m = open; m <= lastStart; m += settings.slotIntervalMinutes) {
      const time = timeOf(m);
      const startsAt = londonToUtc(dateIso, time);
      if (startsAt.getTime() < earliest || startsAt.getTime() > latest) continue;
      slots.push({ time, period: h.period, startsAt, endsAt: new Date(startsAt.getTime() + duration * 60_000) });
    }
  }
  return slots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

/** Table ids occupied during [start, end). */
export function occupiedTables(bookings: EngineBooking[], start: Date, end: Date, excludeId?: string): Set<string> {
  const busy = new Set<string>();
  for (const b of bookings) {
    if (b.id === excludeId || !isActive(b)) continue;
    if (!overlaps(start, end, b.startsAt, b.endsAt)) continue;
    if (b.tableId) busy.add(b.tableId);
    for (const t of b.joinedTableIds) busy.add(t);
  }
  return busy;
}

/**
 * Choose seating: the smallest single table that fits; failing that, the smallest
 * combination (2–3 tables) of combinable tables sharing a join group.
 */
export function allocateTables(
  tables: EngineTable[],
  partySize: number,
  start: Date,
  end: Date,
  bookings: EngineBooking[],
  excludeId?: string,
): Allocation | null {
  const busy = occupiedTables(bookings, start, end, excludeId);
  const free = tables.filter((t) => t.active && !busy.has(t.id));

  const singles = free
    .filter((t) => t.maxCovers >= partySize && t.minCovers <= partySize)
    .sort((a, b) => a.maxCovers - b.maxCovers || a.sortOrder - b.sortOrder);
  if (singles.length) return { tableId: singles[0].id, joinedTableIds: [], capacity: singles[0].maxCovers };

  const groups = new Map<string, EngineTable[]>();
  for (const t of free.filter((t) => t.combinable && t.joinGroup)) {
    const key = `${t.areaId}:${t.joinGroup}`;
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }
  let best: EngineTable[] | null = null;
  const capacity = (set: EngineTable[]) => set.reduce((s, t) => s + t.maxCovers, 0);
  for (const group of groups.values()) {
    const sorted = [...group].sort((a, b) => a.maxCovers - b.maxCovers || a.sortOrder - b.sortOrder);
    for (let i = 0; i < sorted.length; i++)
      for (let j = i + 1; j < sorted.length; j++) {
        const pair = [sorted[i], sorted[j]];
        if (capacity(pair) >= partySize && (!best || capacity(pair) < capacity(best) || (capacity(pair) === capacity(best) && pair.length < best.length))) best = pair;
        for (let k = j + 1; k < sorted.length; k++) {
          const trio = [sorted[i], sorted[j], sorted[k]];
          if (capacity(trio) >= partySize && (!best || capacity(trio) < capacity(best))) best = trio;
        }
      }
  }
  if (!best) return null;
  const sortedBest = [...best].sort((a, b) => b.maxCovers - a.maxCovers);
  return { tableId: sortedBest[0].id, joinedTableIds: sortedBest.slice(1).map((t) => t.id), capacity: capacity(best) };
}

/** Covers already starting within the same slot window (kitchen pacing). */
export function coversStartingInSlot(bookings: EngineBooking[], slotStart: Date, intervalMinutes: number, excludeId?: string) {
  const windowEnd = slotStart.getTime() + intervalMinutes * 60_000;
  return bookings
    .filter((b) => b.id !== excludeId && isActive(b) && b.startsAt.getTime() >= slotStart.getTime() && b.startsAt.getTime() < windowEnd)
    .reduce((sum, b) => sum + b.partySize, 0);
}

export type SlotAvailability = Slot & { available: boolean; reason?: "no_table" | "pacing" };

export function availabilityForDate(args: {
  dateIso: string;
  partySize: number;
  settings: EngineSettings;
  hours: EngineHours[];
  isClosureDate: boolean;
  tables: EngineTable[];
  bookings: EngineBooking[];
  now: Date;
  staff?: boolean;
  excludeId?: string;
}): SlotAvailability[] {
  return generateSlots(args).map((slot) => {
    const pacing = coversStartingInSlot(args.bookings, slot.startsAt, args.settings.slotIntervalMinutes, args.excludeId);
    if (pacing + args.partySize > args.settings.maxCoversPerSlot) return { ...slot, available: false, reason: "pacing" as const };
    const alloc = allocateTables(args.tables, args.partySize, slot.startsAt, slot.endsAt, args.bookings, args.excludeId);
    return alloc ? { ...slot, available: true } : { ...slot, available: false, reason: "no_table" as const };
  });
}

/** Allowed staff status transitions. */
export const STATUS_TRANSITIONS: Record<EngineBooking["status"], EngineBooking["status"][]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "NO_SHOW", "CANCELLED", "PENDING"],
  CANCELLED: ["PENDING", "CONFIRMED"],
  COMPLETED: ["CONFIRMED"],
  NO_SHOW: ["CONFIRMED", "COMPLETED"],
};

export function canTransition(from: EngineBooking["status"], to: EngineBooking["status"]) {
  return from === to || STATUS_TRANSITIONS[from].includes(to);
}
