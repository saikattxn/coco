/** Time helpers. All business times are Europe/London; storage is UTC. Pure functions (unit tested). */
export const TIME_ZONE = "Europe/London";

const partsFmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
  weekday: "short",
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function londonParts(date: Date) {
  const p = Object.fromEntries(partsFmt.formatToParts(date).map((x) => [x.type, x.value]));
  return {
    year: Number(p.year),
    month: Number(p.month),
    day: Number(p.day),
    hour: Number(p.hour),
    minute: Number(p.minute),
    second: Number(p.second),
    weekday: WEEKDAYS.indexOf(p.weekday as string),
  };
}

/** Offset of London from UTC at the given instant, in minutes (0 or 60). */
export function londonOffsetMinutes(date: Date): number {
  const p = londonParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

/** Convert a London wall-clock date ("2026-11-10") and time ("19:30") to a UTC Date. */
export function londonToUtc(dateIso: string, time: string): Date {
  const [y, m, d] = dateIso.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let result = guess - londonOffsetMinutes(new Date(guess)) * 60000;
  // Re-check around DST transitions
  const offset2 = londonOffsetMinutes(new Date(result));
  result = guess - offset2 * 60000;
  return new Date(result);
}

export function londonDateIso(date: Date): string {
  const p = londonParts(date);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function londonTime(date: Date): string {
  const p = londonParts(date);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

/** Weekday (0 = Sunday) of a calendar date string. */
export function weekdayOf(dateIso: string): number {
  const [y, m, d] = dateIso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Calendar date stored in a @db.Date column. */
export function dateOnly(dateIso: string): Date {
  return new Date(`${dateIso}T00:00:00.000Z`);
}

export function dateOnlyIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDaysIso(dateIso: string, days: number): string {
  const d = dateOnly(dateIso);
  d.setUTCDate(d.getUTCDate() + days);
  return dateOnlyIso(d);
}

export function minutesOf(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function timeOf(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function formatDateLong(dateIso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(dateOnly(dateIso));
}

export function formatTime12(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, "0")}${suffix}`;
}
