# REST API — `/api/v1`

JSON over HTTPS. Dates are `YYYY-MM-DD` (Europe/London calendar date); times `HH:MM` (24-hour, London); timestamps ISO 8601 UTC. Errors return `{ "error": string, ... }`.

Public endpoints are rate-limited per IP. Admin endpoints use the staff session cookie (sign in at `/admin/login`); write requests must come from the site's own origin (CSRF protection) and each endpoint checks a permission.

The website itself mostly uses server actions that call the same service layer, so behaviour is identical whichever route is used.

## Public

### `GET /api/v1/availability?date=2026-12-01&partySize=2`
Bookable start times.
```json
{ "date": "2026-12-01", "partySize": 2, "closed": false, "message": null,
  "slots": [{ "time": "12:00", "period": "LUNCH", "available": true }, …] }
```
`400` invalid query · `429` rate limited. Large parties get no slots and a `message` pointing to the events enquiry.

### `POST /api/v1/reservations`
Create a guest booking (same rules as the booking page).
```json
{ "name": "Asha Patel", "email": "asha@example.com", "phone": "07700 900456", "partySize": 2,
  "date": "2026-12-01", "time": "19:30", "occasion": "Birthday", "specialRequests": "Window table",
  "marketingConsent": false }
```
`201 { reference, status, startsAt, partySize, manageUrl }` · `400` validation (`fields` map) or party size · `409` `UNAVAILABLE` / `DUPLICATE` / `CLOSED` · `503` online booking paused · `429`.

### `GET /api/v1/menu`
Visible menu: categories → items with `price` (GBP), `spiceLevel` (0–4), `vegetarian`, `available`, `dietaryTags`, `allergens: { verified, listed }`.

### `POST /api/v1/events`
First-party conversion counter. Body `{ "name": "order_click", "path": "/" }`; names: `booking_started`, `reservation_completed`, `order_click`, `phone_click`, `directions_click`, `contact_submitted`, `event_enquiry_submitted`, `newsletter_signup`. `204`.

## Admin (session cookie)

| Method & path | Permission | Purpose |
|---|---|---|
| `GET /api/v1/admin/reservations?date=` | `reservations.read` | Bookings for a day |
| `POST /api/v1/admin/reservations` | `reservations.write` | Staff booking. Body as public, plus `source` (`PHONE`/`WALK_IN`/`STAFF`), `tableId?`, `status` (`CONFIRMED`/`PENDING`), `staffNotes?`, `sendEmail?`; `email` optional |
| `PATCH /api/v1/admin/reservations/:id` | `reservations.write` | `{ status?, reason?, notify?, date?, time?, partySize?, tableId? }` — move and/or change status (`409` on clashes or invalid transitions) |
| `GET /api/v1/admin/reservations/export?from=&to=&status=` | `reservations.export` | CSV (contact columns only with `customers.read`) |
| `GET /api/v1/admin/customers/export[?consent=1]` | `customers.write` | Customer CSV (or marketing opt-ins only) |
| `GET /api/v1/admin/customers/:id/export` | `customers.write` | Subject-access export (JSON) |
| `GET /api/v1/admin/reports?from=&to=` | `reports.view` | Report data as CSV |

`401` not signed in · `403` missing permission or cross-site request. CSV cells beginning `= + - @` are prefixed to prevent spreadsheet formula injection. Exports are written to the audit log.

## Scheduled jobs

Require `Authorization: Bearer $CRON_SECRET`; `401` otherwise. Configured in `vercel.json`.

| Path | Schedule | Does |
|---|---|---|
| `GET /api/v1/cron/notifications` | daily 06:00 UTC (every 5 min on Pro) | Send queued / retry failed emails — emails are also sent immediately after each action |
| `GET /api/v1/cron/reminders` | daily 10:00 UTC (hourly on Pro) | Queue reminder emails, then send |
| `GET /api/v1/cron/maintenance` | daily 03:30 | Data retention and housekeeping |
