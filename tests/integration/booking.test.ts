import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { BookingError, cancelByGuest, changeStatus, createReservation, findByManageToken, getAvailability, queueReminders, requestChangeByGuest, updateReservation } from "@/server/booking/service";
import { processOutbox, enqueueEmail } from "@/server/notifications/outbox";
import { LogTransport } from "@/server/notifications/transport";
import { runMaintenance, anonymiseCustomer } from "@/server/maintenance";
import { futureTuesday, guest, resetBookingData, useSeating } from "../support/db";

const code = async (p: Promise<unknown>) => {
  try {
    await p;
    return "OK";
  } catch (e) {
    if (e instanceof BookingError) return e.code;
    throw e;
  }
};

beforeEach(async () => {
  await resetBookingData();
  await useSeating([{ label: "T1", max: 2 }, { label: "T2", max: 2 }, { label: "T3", max: 4 }, { label: "T4", max: 6, min: 4 }]);
  LogTransport.outbox = [];
});
afterAll(() => db.$disconnect());

describe("creating reservations", () => {
  it("confirms a small party, allocates the smallest table, queues emails and audits", async () => {
    const { reservation, manageToken } = await createReservation(guest(1, { marketingConsent: true }));
    expect(reservation.status).toBe("CONFIRMED");
    expect(reservation.reference).toMatch(/^CT-[A-Z2-9]{6}$/);
    const table = await db.table.findUnique({ where: { id: reservation.tableId! } });
    expect(table?.maxCovers).toBe(2);
    const notes = await db.notification.findMany({ where: { reservationId: reservation.id } });
    expect(notes.map((n) => n.template).sort()).toEqual(["admin.reservation", "reservation.confirmed"]);
    expect(await db.auditLog.count({ where: { entityId: reservation.id, action: "reservation.create" } })).toBe(1);
    const customer = await db.customer.findUniqueOrThrow({ where: { id: reservation.customerId } });
    expect(customer.marketingConsent).toBe(true);
    expect(await findByManageToken(reservation.reference, manageToken)).not.toBeNull();
    expect(await findByManageToken(reservation.reference, "wrong-token")).toBeNull();
  });

  it("holds larger online parties as pending for staff approval", async () => {
    await db.table.create({ data: { label: "T9", areaId: (await db.seatingArea.findFirstOrThrow()).id, maxCovers: 8, minCovers: 6 } });
    const { reservation } = await createReservation(guest(2, { partySize: 7, time: "20:00" }));
    expect(reservation.status).toBe("PENDING");
    const n = await db.notification.findFirstOrThrow({ where: { reservationId: reservation.id, template: { startsWith: "reservation." } } });
    expect(n.template).toBe("reservation.pending");
  });

  it("rejects online parties above the online limit", async () => {
    expect(await code(createReservation(guest(3, { partySize: 12 })))).toBe("PARTY_SIZE");
  });

  it("prevents the same guest double-booking the same service", async () => {
    await createReservation(guest(4));
    expect(await code(createReservation(guest(4, { time: "20:30" })))).toBe("DUPLICATE");
    // lunch the same day is a different service
    expect(await code(createReservation(guest(4, { time: "12:30" })))).toBe("OK");
  });

  it("rejects times outside opening hours and closed dates", async () => {
    expect(await code(createReservation(guest(5, { time: "16:00" })))).toBe("UNAVAILABLE");
    expect(await code(createReservation(guest(5, { time: "22:45" })))).toBe("UNAVAILABLE"); // after last seating
    const date = futureTuesday(20);
    await db.closureDate.create({ data: { date: new Date(`${date}T00:00:00Z`), reason: "Test closure" } });
    expect(await code(createReservation(guest(5, { date })))).toBe("CLOSED");
  });

  it("respects the paused online booking switch but lets staff book", async () => {
    await db.bookingSettings.update({ where: { id: "default" }, data: { onlineBookingEnabled: false } });
    expect(await code(createReservation(guest(6)))).toBe("DISABLED");
    const staff = await db.user.findFirstOrThrow();
    expect(await code(createReservation({ ...guest(6), email: "" }, { staffUserId: staff.id, source: "PHONE" }))).toBe("OK");
  });

  it("combines joinable tables for a group that no single table fits", async () => {
    await useSeating([{ label: "A", max: 4, group: "g" }, { label: "B", max: 4, group: "g" }]);
    const { reservation } = await createReservation(guest(7, { partySize: 6 }));
    expect(reservation.joinedTableIds).toHaveLength(1);
  });
});

describe("overbooking protection", () => {
  it("gives the last table to exactly one of many simultaneous requests", async () => {
    await useSeating([{ label: "Only", max: 2 }]);
    const attempts = await Promise.all(Array.from({ length: 12 }, (_, i) => code(createReservation(guest(100 + i)))));
    expect(attempts.filter((a) => a === "OK")).toHaveLength(1);
    expect(attempts.filter((a) => a === "UNAVAILABLE")).toHaveLength(11);
    expect(await db.reservation.count()).toBe(1);
  });

  it("never double-books tables under concurrent load across overlapping times", async () => {
    await useSeating([{ label: "A", max: 2 }, { label: "B", max: 2 }, { label: "C", max: 2 }]);
    const times = ["19:00", "19:15", "19:30", "19:45", "20:00"];
    await Promise.all(Array.from({ length: 20 }, (_, i) => code(createReservation(guest(200 + i, { time: times[i % times.length] })))));
    const rows = await db.reservation.findMany({ where: { status: "CONFIRMED" } });
    for (const a of rows) for (const b of rows) {
      if (a.id !== b.id && a.tableId === b.tableId) expect(a.startsAt < b.endsAt && b.startsAt < a.endsAt).toBe(false);
    }
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThanOrEqual(3 * 2); // at most two sittings per table across 19:00–20:00 + 90 min
  });

  it("enforces kitchen pacing per slot", async () => {
    await db.bookingSettings.update({ where: { id: "default" }, data: { maxCoversPerSlot: 4 } });
    await useSeating([{ label: "A", max: 2 }, { label: "B", max: 2 }, { label: "C", max: 2 }]);
    expect(await code(createReservation(guest(300)))).toBe("OK");
    expect(await code(createReservation(guest(301)))).toBe("OK");
    expect(await code(createReservation(guest(302)))).toBe("UNAVAILABLE");
    expect(await code(createReservation(guest(302, { time: "19:15" })))).toBe("OK");
  });
});

describe("availability", () => {
  it("reflects existing bookings", async () => {
    await useSeating([{ label: "Only", max: 2 }]);
    const date = futureTuesday();
    expect((await getAvailability(date, 2)).slots.find((s) => s.time === "19:00")?.available).toBe(true);
    await createReservation(guest(400));
    const after = await getAvailability(date, 2);
    expect(after.slots.find((s) => s.time === "19:00")?.available).toBe(false);
    expect(after.slots.find((s) => s.time === "18:15")?.available).toBe(false); // would overlap
    expect(after.slots.find((s) => s.time === "20:30")?.available).toBe(true);
  });
  it("sends large groups to the events enquiry", async () => {
    const res = await getAvailability(futureTuesday(), 14);
    expect(res.slots).toHaveLength(0);
    expect(res.message).toMatch(/event enquiry/);
  });
});

describe("changes and cancellations", () => {
  it("lets a guest cancel with their link, and blocks a wrong token", async () => {
    const { reservation, manageToken } = await createReservation(guest(500));
    expect(await code(cancelByGuest(reservation.reference, "bad"))).toBe("NOT_FOUND");
    await cancelByGuest(reservation.reference, manageToken);
    const r = await db.reservation.findUniqueOrThrow({ where: { id: reservation.id } });
    expect(r.status).toBe("CANCELLED");
    expect(await db.notification.count({ where: { reservationId: r.id, template: "reservation.cancelled" } })).toBe(1);
    expect(await code(cancelByGuest(reservation.reference, manageToken))).toBe("INVALID_STATUS");
  });

  it("records guest change requests for staff", async () => {
    const { reservation, manageToken } = await createReservation(guest(501));
    await requestChangeByGuest(reservation.reference, manageToken, "Could we come at 8pm instead?");
    expect((await db.reservation.findUniqueOrThrow({ where: { id: reservation.id } })).changeRequest).toMatch(/8pm/);
  });

  it("won't reinstate a cancelled booking if its table has gone", async () => {
    await useSeating([{ label: "Only", max: 2 }]);
    const staff = await db.user.findFirstOrThrow();
    const first = await createReservation(guest(600));
    await changeStatus(first.reservation.id, "CANCELLED", { userId: staff.id });
    await createReservation(guest(601));
    expect(await code(changeStatus(first.reservation.id, "CONFIRMED", { userId: staff.id }))).toBe("NO_TABLE");
  });

  it("approves pending bookings and emails the guest", async () => {
    const staff = await db.user.findFirstOrThrow();
    const { reservation } = await createReservation(guest(602), { staffUserId: staff.id, status: "PENDING" });
    await changeStatus(reservation.id, "CONFIRMED", { userId: staff.id });
    expect(await db.notification.count({ where: { reservationId: reservation.id, template: "reservation.confirmed" } })).toBe(1);
    expect(await code(changeStatus(reservation.id, "PENDING", { userId: staff.id }))).toBe("OK");
  });

  it("moves a booking and re-allocates seating, refusing clashes", async () => {
    await useSeating([{ label: "A", max: 2 }, { label: "B", max: 2 }]);
    const staff = await db.user.findFirstOrThrow();
    const a = await createReservation(guest(700, { time: "19:00" }));
    await createReservation(guest(701, { time: "21:00" }));
    await createReservation(guest(702, { time: "21:00" }));
    expect(await code(updateReservation(a.reservation.id, { date: futureTuesday(), time: "21:00", partySize: 2 }, staff.id))).toBe("NO_TABLE");
    const moved = await updateReservation(a.reservation.id, { date: futureTuesday(), time: "18:00", partySize: 2 }, staff.id);
    expect(moved.startsAt.toISOString()).not.toBe(a.reservation.startsAt.toISOString());
    expect(await db.notification.count({ where: { reservationId: a.reservation.id, template: "reservation.modified" } })).toBe(1);
  });
});

describe("notifications", () => {
  it("sends queued emails once, even if processing runs twice", async () => {
    await createReservation(guest(800));
    const first = await processOutbox();
    const second = await processOutbox();
    expect(first.sent).toBe(2);
    expect(second.sent).toBe(0);
    expect(LogTransport.outbox.filter((m) => m.to === "guest800@example.com")).toHaveLength(1);
    expect(await db.notification.count({ where: { status: "SENT" } })).toBe(2);
  });

  it("deduplicates by idempotency key", async () => {
    const payload = { name: "X", email: "x@example.com", phoneNumber: "1", reference: "CT-TEST01", partySize: 2, dateLabel: "d", timeLabel: "t", headline: "h" };
    await enqueueEmail(db, { key: "dup-test", template: "admin.reservation", to: "a@example.com", payload });
    await enqueueEmail(db, { key: "dup-test", template: "admin.reservation", to: "a@example.com", payload });
    expect(await db.notification.count({ where: { idempotencyKey: "dup-test" } })).toBe(1);
  });

  it("marks failures for retry with backoff", async () => {
    await db.notification.create({ data: { idempotencyKey: "bad", template: "missing.template", recipient: "a@example.com", subject: "x", payload: {} } });
    const r = await processOutbox();
    expect(r.failed).toBe(1);
    const n = await db.notification.findUniqueOrThrow({ where: { idempotencyKey: "bad" } });
    expect(n.status).toBe("FAILED");
    expect(n.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("queues reminders once per booking", async () => {
    const staff = await db.user.findFirstOrThrow();
    const { reservation } = await createReservation(guest(900), { staffUserId: staff.id });
    // pretend the booking is 12 hours away
    const start = new Date(Date.now() + 12 * 3600_000);
    await db.reservation.update({ where: { id: reservation.id }, data: { startsAt: start, endsAt: new Date(start.getTime() + 90 * 60000) } });
    expect(await queueReminders()).toBe(1);
    expect(await queueReminders()).toBe(0);
    expect(await db.notification.count({ where: { reservationId: reservation.id, template: "reservation.reminder" } })).toBe(1);
  });
});

describe("data protection", () => {
  it("erases personal data but keeps anonymous booking records", async () => {
    const { reservation } = await createReservation(guest(1000, { specialRequests: "Nut allergy" }));
    await anonymiseCustomer(reservation.customerId, null, "test");
    const c = await db.customer.findUniqueOrThrow({ where: { id: reservation.customerId } });
    expect(c.email).not.toContain("guest1000");
    expect(c.anonymisedAt).not.toBeNull();
    const r = await db.reservation.findUniqueOrThrow({ where: { id: reservation.id } });
    expect(r.specialRequests).toBeNull();
    expect(r.partySize).toBe(2);
  });
  it("runs retention housekeeping without touching recent data", async () => {
    await createReservation(guest(1001));
    const res = await runMaintenance();
    expect(res.customersAnonymised).toBe(0);
    expect(await db.customer.count({ where: { anonymisedAt: null } })).toBe(1);
  });
});
