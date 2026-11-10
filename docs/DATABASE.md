# Database & business rules

PostgreSQL via Prisma 7. Schema: `prisma/schema.prisma`. Migrations: `prisma/migrations/`.

Conventions: text `cuid` ids; money as integer **pence**; all timestamps in **UTC**; business dates/times in **Europe/London** (converted in `src/lib/time.ts`, DST-safe and unit tested); `deletedAt` soft deletion where staff can "delete" content.

## Entities

| Group | Models | Notes |
|---|---|---|
| Staff & access | `User`, `Role`, `Permission`, `RolePermission`, `Session` | Roles map to permissions (many-to-many). Sessions store only a SHA-256 of the cookie token. |
| Guests | `Customer` | Unique lower-case email. Marketing consent with timestamp + source. `anonymisedAt` after erasure. |
| Bookings | `Reservation`, `SeatingArea`, `Table`, `OpeningHours`, `ClosureDate`, `BookingSettings` | `ReservationStatus` enum: PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW. |
| Menu | `MenuCategory`, `MenuItem`, `Allergen` (the 14 UK allergens), `MenuItemAllergen`, `DietaryTag`, `MenuItemDietary` | `allergenInfoVerified` gates what the public site may claim. |
| Content | `ContentBlock`, `SiteSettings` (singleton), `PageSeo`, `GalleryImage`, `Offer` | |
| Enquiries & marketing | `ContactEnquiry`, `EventEnquiry`, `NewsletterSubscriber` | `EnquiryStatus`: NEW, IN_PROGRESS, RESPONDED, CLOSED, SPAM. |
| Operations | `Notification` (email outbox), `AuditLog`, `AnalyticsEvent`, `RateLimit` | |

### Key relationships

```
Role ─< RolePermission >─ Permission        User >─ Role        User ─< Session
Customer ─< Reservation >─ Table >─ SeatingArea     Reservation ─< Notification
MenuCategory ─< MenuItem ─< MenuItemAllergen >─ Allergen
                        └─< MenuItemDietary >─ DietaryTag
User ─< AuditLog
```

Foreign keys use `ON DELETE RESTRICT` by default (you can't delete a table that has bookings — deactivate it instead), `CASCADE` for join rows and sessions, `SET NULL` for optional links.

### Important indexes and constraints

- `Reservation(serviceDate, status)`, `Reservation(tableId, startsAt)`, `Reservation(startsAt)` — availability and day views.
- `Reservation.reference` and `Reservation.manageTokenHash` unique.
- `Table(areaId, label)` unique; `OpeningHours(weekday, period)` unique; `ClosureDate.date` unique.
- `Notification.idempotencyKey` unique — the guarantee against duplicate emails.
- `Notification(status, nextAttemptAt)` — outbox polling.

## Booking rules (`src/server/booking/engine.ts` — pure, unit tested)

1. **Slots** run from opening time to *closing − last-seating offset* at the configured interval, inside each open session (lunch/dinner) for that weekday. Closure dates have none. Guests need *lead time* notice and may book up to *max days ahead*; staff bookings skip those two rules.
2. **Table time** depends on party size (1–2, 3–4, 5+), all configurable.
3. **Seating:** the smallest free table whose min/max covers fit the party; otherwise the smallest combination (2–3 tables) of *joinable* tables in the same area and join group. A table is busy if any PENDING, CONFIRMED or COMPLETED booking overlaps the time window. Back-to-back bookings don't overlap.
4. **Kitchen pacing:** total covers starting in one slot window ≤ *max covers per slot* (online bookings).
5. **Approval:** online parties larger than *confirm instantly up to* are PENDING until staff confirm. Parties above *largest online party* are sent to the events enquiry.
6. **Duplicates:** a guest (by email) can't hold two active bookings in the same service on the same day.
7. **Concurrency:** creating, moving or reinstating a booking runs in a transaction that takes `pg_advisory_xact_lock(hashtext('booking:' || date))`, re-reads the day and re-checks rules 1–6 before writing. Simultaneous requests for the last table are serialised; exactly one wins (covered by integration tests firing 12–20 parallel requests).
8. **Status changes** follow an allowed-transition map. Reinstating a cancelled booking re-checks that a table is free.
9. **Guest self-service:** the manage link carries an HMAC of the reference (keyed with `APP_SECRET`); only its SHA-256 is stored.

## Allergen rule

The site shows allergens as definitive only when `allergenInfoVerified = true`. Otherwise it lists what the original menu stated and says "to be confirmed — please ask our team". "Gluten-free" can only be set on verified dishes. Nothing is ever labelled allergen-free.

## Emails (outbox)

Emails are written to `Notification` **inside the same transaction** as the change that caused them, keyed by an idempotency key (e.g. `reservation:<id>:created`). A worker claims due rows with `FOR UPDATE SKIP LOCKED`, sends via the transport, and records `SENT` / `FAILED` (retried with 2, 4, 8, 16-minute backoff, 5 attempts) / `SKIPPED` (no provider configured). The worker runs straight after each request (`after()`) and every 5 minutes via cron.

## Retention

Daily maintenance anonymises guests with no booking in the last 24 months (and no marketing consent) and enquiries older than 12 months, and clears expired sessions and rate-limit rows. Periods are in `src/server/maintenance.ts` — **confirm them with the business**.
