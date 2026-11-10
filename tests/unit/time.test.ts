import { describe, expect, it } from "vitest";
import { addDaysIso, formatTime12, londonDateIso, londonTime, londonToUtc, weekdayOf } from "@/lib/time";

describe("London time helpers", () => {
  it("converts winter (GMT) wall-clock times", () => {
    expect(londonToUtc("2026-01-15", "19:30").toISOString()).toBe("2026-01-15T19:30:00.000Z");
  });
  it("converts summer (BST) wall-clock times", () => {
    expect(londonToUtc("2026-07-15", "19:30").toISOString()).toBe("2026-07-15T18:30:00.000Z");
  });
  it("handles the day the clocks go forward", () => {
    // 29 March 2026: 01:00 GMT → 02:00 BST
    expect(londonToUtc("2026-03-29", "12:00").toISOString()).toBe("2026-03-29T11:00:00.000Z");
    expect(londonToUtc("2026-03-28", "12:00").toISOString()).toBe("2026-03-28T12:00:00.000Z");
  });
  it("round-trips dates and times", () => {
    const d = londonToUtc("2026-10-25", "18:15"); // clocks went back that morning
    expect(londonDateIso(d)).toBe("2026-10-25");
    expect(londonTime(d)).toBe("18:15");
  });
  it("reports the London calendar date near midnight", () => {
    expect(londonDateIso(new Date("2026-07-01T23:30:00Z"))).toBe("2026-07-02");
  });
  it("adds days and finds weekdays", () => {
    expect(addDaysIso("2026-12-31", 1)).toBe("2027-01-01");
    expect(weekdayOf("2026-11-10")).toBe(2); // Tuesday
  });
  it("formats 12-hour times", () => {
    expect(formatTime12("17:30")).toBe("5:30pm");
    expect(formatTime12("12:00")).toBe("12pm");
    expect(formatTime12("00:15")).toBe("12:15am");
  });
});
