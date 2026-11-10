/** Branded transactional email templates. Pure: payload in, subject/html/text out. */
export type TemplatePayload = Record<string, string | number | null | undefined>;

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(title: string, bodyHtml: string, p: TemplatePayload) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title></head>
<body style="margin:0;background:#f6f1e9;font-family:Georgia,'Times New Roman',serif;color:#2a2223">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e9;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fffdf9;border:1px solid #e6dccb">
<tr><td style="background:#4a1420;padding:28px 32px;text-align:center">
<div style="font-size:26px;letter-spacing:1px;color:#f3e7d3">Coco Tamarind</div>
<div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#c9a96a;margin-top:6px">Fine Indian Dining · Askett</div>
</td></tr>
<tr><td style="padding:32px;font-size:16px;line-height:1.6">${bodyHtml}</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #e6dccb;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:#6b5e5a">
${esc(p.restaurantName ?? "Coco Tamarind")} · ${esc(p.address ?? "")}<br>
${p.phone ? `Call us on <a href="tel:${esc(String(p.phone).replace(/\s/g, ""))}" style="color:#4a1420">${esc(p.phone)}</a>` : ""}
</td></tr></table></td></tr></table></body></html>`;
}

function details(p: TemplatePayload) {
  const rows: [string, unknown][] = [
    ["Reference", p.reference],
    ["Date", p.dateLabel],
    ["Time", p.timeLabel],
    ["Guests", p.partySize],
    ["Occasion", p.occasion],
    ["Requests", p.specialRequests],
  ];
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:20px 0;border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
${rows
  .filter(([, v]) => v !== undefined && v !== null && v !== "")
  .map(([k, v]) => `<tr><td style="padding:8px 0;color:#6b5e5a;width:110px;border-bottom:1px solid #efe6d8">${k}</td><td style="padding:8px 0;border-bottom:1px solid #efe6d8"><strong>${esc(v)}</strong></td></tr>`)
  .join("")}</table>`;
}

const button = (href: unknown, label: string) =>
  `<p style="margin:24px 0"><a href="${esc(href)}" style="display:inline-block;background:#4a1420;color:#f3e7d3;text-decoration:none;padding:12px 22px;font-family:Arial,sans-serif;font-size:14px;letter-spacing:.5px">${label}</a></p>`;

const textDetails = (p: TemplatePayload) =>
  [`Reference: ${p.reference}`, `Date: ${p.dateLabel}`, `Time: ${p.timeLabel}`, `Guests: ${p.partySize}`].join("\n");

export const TEMPLATES = {
  "reservation.confirmed": (p: TemplatePayload) => ({
    subject: `Your table is confirmed — ${p.dateLabel}, ${p.timeLabel}`,
    html: layout("Booking confirmed", `<p>Dear ${esc(p.name)},</p><p>Thank you for booking with us. We look forward to welcoming you.</p>${details(p)}${button(p.manageUrl, "View or manage your booking")}<p style="font-size:14px;color:#6b5e5a">If you have an allergy or dietary requirement, please tell your server when you arrive.</p>`, p),
    text: `Dear ${p.name},\n\nYour table at Coco Tamarind is confirmed.\n\n${textDetails(p)}\n\nManage your booking: ${p.manageUrl}\n`,
  }),
  "reservation.pending": (p: TemplatePayload) => ({
    subject: `We've received your booking request — ${p.reference}`,
    html: layout("Booking request received", `<p>Dear ${esc(p.name)},</p><p>Thank you — we've received your request. For larger parties our team confirms each booking personally; we'll email you as soon as it's confirmed.</p>${details(p)}${button(p.manageUrl, "View your request")}`, p),
    text: `Dear ${p.name},\n\nWe've received your booking request and will confirm it shortly.\n\n${textDetails(p)}\n\n${p.manageUrl}\n`,
  }),
  "reservation.cancelled": (p: TemplatePayload) => ({
    subject: `Your booking ${p.reference} has been cancelled`,
    html: layout("Booking cancelled", `<p>Dear ${esc(p.name)},</p><p>Your booking has been cancelled.${p.cancelReason ? ` ${esc(p.cancelReason)}` : ""}</p>${details(p)}${button(p.bookUrl, "Make a new booking")}`, p),
    text: `Dear ${p.name},\n\nYour booking has been cancelled.\n\n${textDetails(p)}\n\nBook again: ${p.bookUrl}\n`,
  }),
  "reservation.modified": (p: TemplatePayload) => ({
    subject: `Your booking ${p.reference} has been updated`,
    html: layout("Booking updated", `<p>Dear ${esc(p.name)},</p><p>Your booking has been updated. Here are the latest details:</p>${details(p)}${button(p.manageUrl, "View your booking")}`, p),
    text: `Dear ${p.name},\n\nYour booking has been updated.\n\n${textDetails(p)}\n\n${p.manageUrl}\n`,
  }),
  "reservation.reminder": (p: TemplatePayload) => ({
    subject: `See you soon — your table at ${p.timeLabel}`,
    html: layout("Booking reminder", `<p>Dear ${esc(p.name)},</p><p>A friendly reminder of your booking with us. Free parking is available on site.</p>${details(p)}${button(p.manageUrl, "Need to make a change?")}`, p),
    text: `Dear ${p.name},\n\nA reminder of your booking.\n\n${textDetails(p)}\n\n${p.manageUrl}\n`,
  }),
  "admin.reservation": (p: TemplatePayload) => ({
    subject: `${p.headline}: ${p.reference} · ${p.partySize} guests · ${p.dateLabel} ${p.timeLabel}`,
    html: layout("New booking activity", `<p><strong>${esc(p.headline)}</strong></p>${details(p)}<p style="font-family:Arial,sans-serif;font-size:14px">${esc(p.name)} · ${esc(p.email)} · ${esc(p.phoneNumber)}</p>${button(p.adminUrl, "Open in dashboard")}`, p),
    text: `${p.headline}\n\n${textDetails(p)}\n${p.name} ${p.email} ${p.phoneNumber}\n${p.adminUrl}\n`,
  }),
  "admin.contact": (p: TemplatePayload) => ({
    subject: `New website message from ${p.name}`,
    html: layout("New contact enquiry", `<p><strong>${esc(p.name)}</strong> (${esc(p.email)}${p.phoneNumber ? `, ${esc(p.phoneNumber)}` : ""}) wrote:</p><p><em>${esc(p.subject ?? "")}</em></p><p style="white-space:pre-line">${esc(p.message)}</p>${button(p.adminUrl, "Open in dashboard")}`, p),
    text: `${p.name} (${p.email}) wrote:\n\n${p.message}\n\n${p.adminUrl}\n`,
  }),
  "admin.event": (p: TemplatePayload) => ({
    subject: `Event enquiry: ${p.eventTypeLabel} for ${p.guests} on ${p.dateLabel}`,
    html: layout("New event enquiry", `<p><strong>${esc(p.name)}</strong> · ${esc(p.email)} · ${esc(p.phoneNumber)}</p><p>${esc(p.eventTypeLabel)} · ${esc(p.guests)} guests · ${esc(p.dateLabel)} ${esc(p.preferredTime ?? "")}</p><p style="white-space:pre-line">${esc(p.message ?? "")}</p>${button(p.adminUrl, "Open in dashboard")}`, p),
    text: `${p.name} ${p.email} ${p.phoneNumber}\n${p.eventTypeLabel} for ${p.guests} on ${p.dateLabel}\n\n${p.message ?? ""}\n${p.adminUrl}\n`,
  }),
  "event.received": (p: TemplatePayload) => ({
    subject: "Thank you for your enquiry",
    html: layout("Enquiry received", `<p>Dear ${esc(p.name)},</p><p>Thank you for thinking of us for your ${esc(String(p.eventTypeLabel).toLowerCase())} on ${esc(p.dateLabel)} for ${esc(p.guests)} guests. A member of our team will be in touch shortly to talk through the details.</p>`, p),
    text: `Dear ${p.name},\n\nThank you for your enquiry. We'll be in touch shortly.\n`,
  }),
} as const;

export type TemplateKey = keyof typeof TEMPLATES;

export function renderTemplate(key: string, payload: TemplatePayload) {
  const fn = TEMPLATES[key as TemplateKey];
  if (!fn) throw new Error(`Unknown email template: ${key}`);
  return fn(payload);
}
