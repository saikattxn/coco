import { describe, expect, it } from "vitest";
import { allocateTables, availabilityForDate, canTransition, coversStartingInSlot, durationFor, generateSlots, type EngineBooking, type EngineHours, type EngineSettings, type EngineTable } from "@/server/booking/engine";
import { londonToUtc } from "@/lib/time";

const settings: EngineSettings = {
  onlineBookingEnabled: true, slotIntervalMinutes: 15, durationSmallMinutes: 90, durationMediumMinutes: 105, durationLargeMinutes: 120,
  minPartySize: 1, maxOnlinePartySize: 10, autoConfirmMaxParty: 6, maxCoversPerSlot: 30, leadTimeMinutes: 60, maxDaysAhead: 60, lastSeatingMinutesBeforeClose: 30,
};
const hours: EngineHours[] = [0, 1, 2, 3, 4, 5, 6].flatMap((weekday) => [
  { weekday, period: "LUNCH" as const, opensAt: "12:00", closesAt: "14:00", isClosed: false },
  { weekday, period: "DINNER" as const, opensAt: "17:30", closesAt: "23:00", isClosed: false },
]);
const t = (id: string, max: number, extra: Partial<EngineTable> = {}): EngineTable => ({ id, label: id, areaId: "main", minCovers: 1, maxCovers: max, combinable: false, joinGroup: null, active: true, sortOrder: 0, ...extra });
const booking = (id: string, tableId: string, time: string, party = 2, extra: Partial<EngineBooking> = {}): EngineBooking => {
  const s = londonToUtc("2026-12-01", time);
  return { id, startsAt: s, endsAt: new Date(s.getTime() + 90 * 60000), partySize: party, tableId, joinedTableIds: [], status: "CONFIRMED", ...extra };
};
const now = new Date("2026-11-20T09:00:00Z");

describe("slot generation", () => {
  it("creates lunch and dinner slots up to last seating", () => {
    const slots = generateSlots({ dateIso: "2026-12-01", partySize: 2, settings, hours, isClosureDate: false, now });
    expect(slots[0].time).toBe("12:00");
    expect(slots.filter((s) => s.period === "LUNCH").at(-1)?.time).toBe("13:30");
    expect(slots.at(-1)?.time).toBe("22:30");
    expect(slots.every((s) => s.endsAt.getTime() - s.startsAt.getTime() === 90 * 60000)).toBe(true);
  });
  it("returns nothing on closure dates or closed sessions", () => {
    expect(generateSlots({ dateIso: "2026-12-25", partySize: 2, settings, hours, isClosureDate: true, now })).toEqual([]);
    const lunchClosed = hours.map((h) => (h.period === "LUNCH" ? { ...h, isClosed: true } : h));
    expect(generateSlots({ dateIso: "2026-12-01", partySize: 2, settings, hours: lunchClosed, isClosureDate: false, now }).some((s) => s.period === "LUNCH")).toBe(false);
  });
  it("respects lead time and booking horizon for guests but not staff", () => {
    const soon = londonToUtc("2026-12-01", "12:20");
    const guest = generateSlots({ dateIso: "2026-12-01", partySize: 2, settings, hours, isClosureDate: false, now: soon });
    expect(guest[0].time).toBe("13:30"); // 60 min notice, 12:00–13:15 excluded
    const staff = generateSlots({ dateIso: "2026-12-01", partySize: 2, settings, hours, isClosureDate: false, now: soon, staff: true });
    expect(staff[0].time).toBe("12:00");
    expect(generateSlots({ dateIso: "2027-06-01", partySize: 2, settings, hours, isClosureDate: false, now })).toEqual([]);
  });
  it("uses party-size durations", () => {
    expect(durationFor(settings, 2)).toBe(90);
    expect(durationFor(settings, 4)).toBe(105);
    expect(durationFor(settings, 8)).toBe(120);
  });
});

describe("table allocation", () => {
  const start = londonToUtc("2026-12-01", "19:00");
  const end = new Date(start.getTime() + 90 * 60000);

  it("picks the smallest table that fits", () => {
    expect(allocateTables([t("big", 8), t("two", 2), t("four", 4)], 2, start, end, [])?.tableId).toBe("two");
    expect(allocateTables([t("big", 8), t("two", 2), t("four", 4)], 3, start, end, [])?.tableId).toBe("four");
  });
  it("skips occupied and overlapping tables", () => {
    const existing = [booking("b1", "two", "18:00")]; // 18:00–19:30 overlaps 19:00
    expect(allocateTables([t("two", 2), t("four", 4)], 2, start, end, existing)?.tableId).toBe("four");
  });
  it("does not treat back-to-back bookings as overlapping", () => {
    const existing = [booking("b1", "two", "17:30")]; // ends 19:00 exactly
    expect(allocateTables([t("two", 2)], 2, start, end, existing)?.tableId).toBe("two");
  });
  it("ignores cancelled and no-show bookings", () => {
    const existing = [booking("b1", "two", "19:00", 2, { status: "CANCELLED" }), booking("b2", "two", "19:00", 2, { status: "NO_SHOW" })];
    expect(allocateTables([t("two", 2)], 2, start, end, existing)?.tableId).toBe("two");
  });
  it("respects a table's minimum covers", () => {
    expect(allocateTables([t("six", 6, { minCovers: 4 })], 2, start, end, [])).toBeNull();
  });
  it("combines joinable tables in the same group when no single table fits", () => {
    const tables = [t("a", 4, { combinable: true, joinGroup: "g" }), t("b", 4, { combinable: true, joinGroup: "g" }), t("c", 2, { combinable: true, joinGroup: "g" }), t("x", 4, { combinable: true, joinGroup: "other" })];
    const alloc = allocateTables(tables, 6, start, end, []);
    expect(alloc?.capacity).toBe(6);
    expect([alloc?.tableId, ...(alloc?.joinedTableIds ?? [])].sort()).toEqual(["a", "c"]);
  });
  it("returns null when everything is taken", () => {
    const existing = [booking("b1", "two", "19:00"), booking("b2", "four", "19:15")];
    expect(allocateTables([t("two", 2), t("four", 4)], 2, start, end, existing)).toBeNull();
  });
  it("excludes a booking being edited from its own conflict check", () => {
    const existing = [booking("self", "two", "19:00")];
    expect(allocateTables([t("two", 2)], 2, start, end, existing, "self")?.tableId).toBe("two");
  });
});

describe("kitchen pacing and availability", () => {
  it("counts covers starting in the same slot window", () => {
    const b = [booking("1", "a", "19:00", 4), booking("2", "b", "19:10", 6), booking("3", "c", "19:15", 8)];
    expect(coversStartingInSlot(b, londonToUtc("2026-12-01", "19:00"), 15)).toBe(10);
  });
  it("marks slots unavailable for pacing and for lack of tables", () => {
    const tables = [t("a", 4), t("b", 4)];
    const bookings = [booking("1", "a", "19:00", 4), booking("2", "b", "19:00", 4)];
    const tight = { ...settings, maxCoversPerSlot: 8 };
    const slots = availabilityForDate({ dateIso: "2026-12-01", partySize: 2, settings: tight, hours, isClosureDate: false, tables, bookings, now });
    const s1900 = slots.find((s) => s.time === "19:00")!;
    expect(s1900.available).toBe(false);
    expect(s1900.reason).toBe("pacing");
    const s1930 = slots.find((s) => s.time === "19:30")!;
    expect(s1930).toMatchObject({ available: false, reason: "no_table" });
    expect(slots.find((s) => s.time === "20:30")!.available).toBe(true);
  });
});

describe("status transitions", () => {
  it("allows the normal flow and blocks nonsense", () => {
    expect(canTransition("PENDING", "CONFIRMED")).toBe(true);
    expect(canTransition("CONFIRMED", "COMPLETED")).toBe(true);
    expect(canTransition("CONFIRMED", "NO_SHOW")).toBe(true);
    expect(canTransition("PENDING", "COMPLETED")).toBe(false);
    expect(canTransition("COMPLETED", "CANCELLED")).toBe(false);
  });
});
