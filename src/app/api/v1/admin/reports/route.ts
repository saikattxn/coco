import type { NextRequest } from "next/server";
import { apiAuth, csvResponse, toCsv } from "@/server/api";
import { buildReport } from "@/server/reports";

/** GET /api/v1/admin/reports?from=&to= — report data as CSV. */
export async function GET(req: NextRequest) {
  const auth = await apiAuth(req, "reports.view");
  if ("response" in auth) return auth.response;
  const from = req.nextUrl.searchParams.get("from") ?? "";
  const to = req.nextUrl.searchParams.get("to") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return new Response("from and to are required", { status: 400 });
  const r = await buildReport(from, to);
  const rows: (string | number)[][] = [["Section", "Item", "Value"]];
  rows.push(["Totals", "Bookings (excl. cancelled)", r.totals.bookings], ["Totals", "Covers", r.totals.covers]);
  for (const [k, v] of Object.entries(r.status)) rows.push(["Status", k, v]);
  for (const [k, v] of Object.entries(r.source)) rows.push(["Source", k, v]);
  for (const w of r.weekly) rows.push(["Week bookings", w.week, w.bookings], ["Week covers", w.week, w.covers]);
  for (const h of r.byHour) rows.push(["Start hour", `${h.hour}:00`, h.bookings]);
  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((d, i) => rows.push(["Weekday", d, r.byDay[i]]));
  for (const [k, v] of Object.entries(r.leadBuckets)) rows.push(["Lead time", k, v]);
  for (const [k, v] of Object.entries(r.enquiries.eventTypes)) rows.push(["Event enquiries", k, v]);
  rows.push(["Contact messages", "Total", r.enquiries.contacts]);
  for (const [k, v] of Object.entries(r.website)) rows.push(["Website actions", k, v]);
  return csvResponse(`report-${from}-to-${to}.csv`, toCsv(rows));
}
