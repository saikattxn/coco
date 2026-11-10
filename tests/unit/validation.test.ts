import { describe, expect, it } from "vitest";
import { contactSchema, eventEnquirySchema, fieldErrors, menuItemSchema, newsletterSchema, offerSchema, reservationSchema } from "@/lib/validation";
import { parsePriceToPence, slugify, telHref } from "@/lib/format";
import { toCsvSafe } from "../support/csv";
import { offerState } from "@/lib/offers";
import { roleHas, ROLES, PERMISSIONS } from "@/server/permissions";
import { renderTemplate } from "@/server/notifications/templates";

const validBooking = { name: "Priya Shah", email: "Priya@Example.com", phone: "07700 900123", partySize: "4", date: "2026-12-01", time: "19:30", occasion: "Birthday", specialRequests: "", marketingConsent: "on", website: "" };

describe("booking validation", () => {
  it("accepts a valid booking and normalises it", () => {
    const r = reservationSchema.parse(validBooking);
    expect(r.email).toBe("priya@example.com");
    expect(r.partySize).toBe(4);
    expect(r.marketingConsent).toBe(true);
    expect(r.specialRequests).toBeUndefined();
  });
  it("rejects bad input with friendly messages", () => {
    const r = reservationSchema.safeParse({ ...validBooking, email: "nope", phone: "abc", time: "7.30pm", name: "A" });
    expect(r.success).toBe(false);
    const e = fieldErrors(r.error!);
    expect(e.email).toMatch(/valid email/);
    expect(e.phone).toMatch(/phone/);
    expect(e.time).toBeDefined();
    expect(e.name).toBeDefined();
  });
  it("rejects bots that fill the honeypot", () => {
    expect(reservationSchema.safeParse({ ...validBooking, website: "spam" }).success).toBe(false);
  });
  it("caps special requests length", () => {
    expect(reservationSchema.safeParse({ ...validBooking, specialRequests: "x".repeat(501) }).success).toBe(false);
  });
  it("defaults marketing consent to false when unticked", () => {
    expect(reservationSchema.parse({ ...validBooking, marketingConsent: undefined }).marketingConsent).toBe(false);
  });
});

describe("other forms", () => {
  it("validates contact and event enquiries", () => {
    expect(contactSchema.safeParse({ name: "Sam", email: "sam@example.com", message: "short" }).success).toBe(false);
    expect(eventEnquirySchema.safeParse({ name: "Sam Lee", email: "sam@example.com", phone: "01844 343111", eventType: "BIRTHDAY", eventDate: "2026-12-12", guests: "20" }).success).toBe(true);
    expect(eventEnquirySchema.safeParse({ name: "Sam Lee", email: "sam@example.com", phone: "01844 343111", eventType: "WEDDING", eventDate: "2026-12-12", guests: "20" }).success).toBe(false);
  });
  it("requires explicit newsletter consent", () => {
    expect(newsletterSchema.safeParse({ email: "a@b.co" }).success).toBe(false);
    expect(newsletterSchema.safeParse({ email: "a@b.co", consent: "on" }).success).toBe(true);
  });
  it("validates menu items and prices", () => {
    expect(menuItemSchema.safeParse({ name: "Lamb Chops", price: "14.50", categoryId: "c", spiceLevel: "1" }).success).toBe(true);
    expect(menuItemSchema.safeParse({ name: "Lamb Chops", price: "14.505", categoryId: "c", spiceLevel: "1" }).success).toBe(false);
    expect(parsePriceToPence("£12.45")).toBe(1245);
    expect(parsePriceToPence("12")).toBe(1200);
    expect(parsePriceToPence("abc")).toBeNull();
  });
  it("rejects offers that end before they start", () => {
    const r = offerSchema.safeParse({ title: "Midweek", description: "Two courses for less", type: "MIDWEEK", terms: "Mon–Wed only", startsAt: "2026-12-10", endsAt: "2026-12-01", active: "on" });
    expect(r.success).toBe(false);
  });
});

describe("offer activation", () => {
  const now = new Date("2026-11-10T12:00:00Z");
  it("is live, scheduled, expired or paused", () => {
    expect(offerState({ active: true, startsAt: null, endsAt: null }, now).label).toBe("Live");
    expect(offerState({ active: true, startsAt: new Date("2026-12-01"), endsAt: null }, now).label).toBe("Scheduled");
    expect(offerState({ active: true, startsAt: null, endsAt: new Date("2026-11-01") }, now).label).toBe("Expired");
    expect(offerState({ active: false, startsAt: null, endsAt: null }, now).label).toBe("Paused");
  });
});

describe("permissions", () => {
  it("gives each role only its functions", () => {
    expect(roleHas("SUPER_ADMIN", "staff.manage")).toBe(true);
    expect(roleHas("MANAGER", "staff.manage")).toBe(false);
    expect(roleHas("MANAGER", "settings.write")).toBe(true);
    expect(roleHas("RESERVATIONS", "reservations.write")).toBe(true);
    expect(roleHas("RESERVATIONS", "menu.write")).toBe(false);
    expect(roleHas("RESERVATIONS", "customers.write")).toBe(false);
    expect(roleHas("CONTENT", "menu.write")).toBe(true);
    expect(roleHas("CONTENT", "reservations.read")).toBe(false);
    expect(roleHas("CONTENT", "customers.read")).toBe(false);
    expect(roleHas("UNKNOWN", "dashboard.view")).toBe(false);
  });
  it("only references defined permissions", () => {
    for (const r of Object.values(ROLES)) for (const p of r.permissions) expect(PERMISSIONS[p]).toBeDefined();
  });
});

describe("helpers", () => {
  it("slugifies and builds tel links", () => {
    expect(slugify("Tandoori Chicken Half on the bone")).toBe("tandoori-chicken-half-on-the-bone");
    expect(telHref("01844 343111")).toBe("tel:+441844343111");
  });
  it("neutralises spreadsheet formulas in CSV exports", () => {
    expect(toCsvSafe([["=HYPERLINK(\"x\")", "a,b", "ok"]])).toBe('\uFEFF"\'=HYPERLINK(""x"")","a,b",ok');
  });
});

describe("email templates", () => {
  it("renders branded confirmation emails and escapes guest input", () => {
    const m = renderTemplate("reservation.confirmed", { name: "<script>x</script>", reference: "CT-ABC123", dateLabel: "Tuesday 1 December 2026", timeLabel: "7:30pm", partySize: 2, manageUrl: "https://example.com/m" });
    expect(m.subject).toContain("Tuesday 1 December 2026");
    expect(m.html).not.toContain("<script>x</script>");
    expect(m.html).toContain("&lt;script&gt;");
    expect(m.text).toContain("CT-ABC123");
  });
  it("throws on unknown templates", () => {
    expect(() => renderTemplate("nope", {})).toThrow();
  });
});
