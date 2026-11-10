import { formatTime12 } from "./time";

type H = { weekday: number; period: "LUNCH" | "DINNER"; opensAt: string; closesAt: string; isClosed: boolean };
export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function dayLine(hours: H[], weekday: number): string {
  const sessions = hours
    .filter((h) => h.weekday === weekday && !h.isClosed)
    .sort((a, b) => a.opensAt.localeCompare(b.opensAt))
    .map((h) => `${formatTime12(h.opensAt)}–${formatTime12(h.closesAt)}`);
  return sessions.length ? sessions.join(", ") : "Closed";
}

/** Group days with identical hours: [{ label: "Every day", value: "12pm–2pm, 5:30pm–11pm" }] */
export function summariseHours(hours: H[]): { label: string; value: string }[] {
  const order = [1, 2, 3, 4, 5, 6, 0]; // Monday first
  const lines = order.map((d) => ({ d, v: dayLine(hours, d) }));
  if (lines.every((l) => l.v === lines[0].v)) return [{ label: "Every day", value: lines[0].v }];
  const groups: { days: number[]; v: string }[] = [];
  for (const l of lines) {
    const last = groups.at(-1);
    if (last && last.v === l.v) last.days.push(l.d);
    else groups.push({ days: [l.d], v: l.v });
  }
  return groups.map((g) => ({
    label: g.days.length === 1 ? DAY_NAMES[g.days[0]] : `${DAY_NAMES[g.days[0]]} – ${DAY_NAMES[g.days.at(-1)!]}`,
    value: g.v,
  }));
}

/** schema.org openingHoursSpecification */
export function openingHoursSpec(hours: H[]) {
  return hours
    .filter((h) => !h.isClosed)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${DAY_NAMES[h.weekday]}`,
      opens: h.opensAt,
      closes: h.closesAt,
    }));
}
