# Coco Tamarind — Audit & Architecture

_Phase 1 deliverable · prepared 10 November 2026 · phases 1–6 implemented (see DEVELOPMENT_LOG.md)_

## 1. Audit of the current digital estate

The audit covered the main site (`cocotamarindhp27.co.uk`, every public page), the ordering and booking site (`order.cocotamarindhp27.co.uk`), and third-party listings (Tripadvisor, Google-derived directories, Nextdoor, Vale Life).

### 1.1 What exists today

| Asset | Platform | Notes |
|---|---|---|
| Main website | WordPress, "BRONX Shopping" theme (footer still reads "© 2015 BRONX Shopping WordPress Theme"), Slider Revolution 5.4.8.1, built by Just Order Online in 2019 | Home, About, Reservation, Gallery, Offers, Contact, Privacy pages. Content largely unchanged since 2019. |
| Online ordering | Just Order Online (JOO) on `order.` subdomain | Full menu (15 categories, ~190 items) with prices, allergen text and spice levels; collection & delivery; cash, card, Apple Pay; 20 % off collection orders over £20; pre-orders from 10:00. SMS marketing via Joopium "TextBoost". |
| Booking — "Reservation (New)" | JOO booking form on `order./booking` | Name, phone, email, guests, date, time, message. No visible confirmation reference or availability logic. |
| Booking — "Reservation" | Legacy WordPress form on `/reservation/` | Name, email, mobile, guests, date, time, remarks, "enter any two digits" spam check. Still live and still linked from the About page. |
| Social | Facebook, Instagram, X/Twitter, YouTube, Google+ | Google+ was shut down in 2019 — dead link. |

### 1.2 Verified business facts (used as source of truth)

- **Address:** Aylesbury Road, Askett, Princes Risborough, Buckinghamshire HP27 9LY
- **Phone:** 01844 343111 (consistent everywhere). A second number is shown as **01844 346 100** on the website but **01844 343100** on a local listing — ⚠️ _needs confirmation from management before launch._
- **Email:** cocotamarindhp27@gmail.com
- **Hours:** Open 7 days. Lunch 12:00–14:00, dinner 17:30–23:00. Open bank holidays; closed Christmas Day.
- **Cuisine (own words):** Northern Indian and Bangladeshi dishes; serpentine bar with pre-dinner drinks, Indian street food and tapas; seasonal local produce where possible; low-calorie options on request; "any dish not on the menu can be served on request".
- **Free parking** — stated on the homepage.
- **Live offer:** 20 % off collection orders over £20.
- **Ordering rules (JOO):** collection minimum £1, delivery minimum £25, delivery charges by distance tier.

Third-party claims that are **not** verified and must not be published without sign-off: halal status (Tripadvisor says yes, another directory says no), "fully air-conditioned", children's menu, review counts and star ratings (these change — link out instead of hard-coding).

### 1.3 Critical issues

1. **The whole main site tells Google not to index it.** Every page carries `<meta name="robots" content="noindex, nofollow">`. This is the single biggest cause of weak local search visibility and should be fixed even before the new site launches (one WordPress setting: _Settings → Reading → "Discourage search engines"_).
2. **Two competing booking journeys.** "Reservation (New)" and "Reservation" both appear in the main nav, collecting bookings into different places. A Tripadvisor reviewer advises others to "book on the phone rather than online as it can often get lost" — consistent with this split.
3. **Pinch-zoom is disabled** (`maximum-scale=1, user-scalable=no`). Fails WCAG 1.4.4 and frustrates older diners on mobile.
4. **Cookie banner uses implied consent** ("we'll assume you're ok with this"). Not acceptable for non-essential cookies under PECR / UK GDPR.
5. **Outdated plugins.** Slider Revolution 5.4.x is many years old; old versions have had serious published vulnerabilities.

### 1.3a Findings from the live browser check

- **Hero is blank on load.** The Slider Revolution hero shows an empty white panel for several seconds before the first slide appears — the most important screen is the slowest to paint (poor LCP).
- **Hero offer text is bright green on a busy food photo** — low contrast, off-brand, hard to read.
- **No `<h1>` on the homepage.** The page has no main heading for search engines or screen readers.
- **Unused WooCommerce scripts** (add-to-cart, cart fragments, order attribution) load on every page although the site sells nothing — ~20 scripts in total, including jQuery Migrate, Skrollr and a popup plugin.
- **Google Analytics (gtag) loads before any consent choice.**
- **Structured data is generic** (Yoast WebPage/WebSite/Organization) — no `Restaurant` type, hours, menu or price range.
- **Gallery** is seven small thumbnails with no captions or categories; at least one site image is stock photography (`wine-1761613_1280.jpg`).
- **Branding to carry forward:** ornate gold-framed logo on black with the red "coco tamarind" wordmark, "Fine Indian Dining", "Fully Licensed Restaurant & Takeaway"; warm bronze/gold gradients. The new palette (burgundy, cream, muted gold, charcoal) is a natural evolution of this.
- The ordering subdomain wasn't opened in the browser (site permission not granted), but its full content was reviewed via fetch.

### 1.4 SEO weaknesses

- `noindex` (above).
- Ordering site `<title>` is a 300-character keyword string; no meta descriptions on either site.
- Homepage title is "20% OFF* – Coco Tamarind…", which buries the core search term ("Indian restaurant Princes Risborough").
- No structured data (Restaurant / LocalBusiness schema), no sitemap advertised, no canonical strategy between the two domains.
- Menu exists only on the ordering subdomain, rendered by the ordering app; the main domain has no crawlable menu.
- "Reviews" links to `tripadvisor.in` (India) rather than `tripadvisor.co.uk`.
- Images named `DSC01087.jpg`, `s3.jpg` with no alt text.

### 1.5 UX problems

- No booking reference, confirmation email or modification path visible to guests.
- Menu has no dietary filters; allergen data is free text and inconsistent (some items list none — which reads as "allergen-free" but isn't verified).
- Desserts and drinks are absent from the online menu although the restaurant serves them.
- No events / celebrations page despite parties being a core trade.
- Navigation has 10 items including legal links; mixes two domains with different headers and footers.
- Copy contains typos ("deserts", "yougurt", "chiilies") that cheapen the premium positioning.

### 1.6 Worth retaining

- The JOO ordering platform: it works, takes payments, and has the menu data. Replacing it now adds risk with no clear gain.
- The menu's allergen and spice data — imported as a starting point, flagged for management verification.
- The "talented waiters at the serpentine bar" story, the Northern Indian & Bangladeshi heritage, local sourcing and "dishes on request" — authentic and distinctive.
- Existing photography (to be supplemented with a proper shoot).

## 2. Recommendations

**Ordering — retain Just Order Online.** Link to it from a branded "Order online" journey, track clicks, and design the data model so a native ordering module can be added later without rework (see §5.4).

**Booking — replace both forms with one native reservation system.** The JOO booking page is a plain form with no availability logic, and the legacy WordPress form is a separate inbox. A native system gives real-time availability, overbooking protection, references, confirmation/cancellation emails, and one dashboard for staff. Actions at launch:
- 301-redirect `/reservation/` to `/book`.
- Ask JOO to remove or redirect their "Booking" link to `https://cocotamarindhp27.co.uk/book`.

## 3. Sitemap

```
/                      Home
/menu                  Menu (filterable, crawlable)
/book                  Reserve a table → /book/confirmed/[ref]
/booking/[ref]         Manage booking (view / cancel / request change; token-protected)
/order                 Branded hand-off to Just Order Online
/offers                Current offers
/celebrations          Birthdays, anniversaries, group & private dining + enquiry form
/gallery               Categorised gallery with lightbox
/about                 Our story
/contact               Map, directions, hours, contact form
/privacy  /terms  /cookies
/admin/*               Staff dashboard (authenticated)
/api/v1/*              REST API
```

## 4. Technical architecture

```
Browser ──► Next.js 16 (App Router, React Server Components)
              ├─ Public pages  (SSR/ISR, cached; revalidated on admin edits)
              ├─ /admin        (server-rendered, session-protected, RBAC per action)
              ├─ /api/v1       (REST route handlers, Zod-validated, rate-limited)
              └─ Server actions (forms; same service layer as the API)
                       │
                Service layer (src/server/*) — business rules live here once
                       │
                Prisma 7 ──► PostgreSQL (managed: Neon / Supabase / RDS)
                       │
     Integrations:  Resend (email, via outbox) · Cloudinary (images)
                    Just Order Online (links) · GA4 via GTM (consent-gated)
                    Google Maps embed · Sentry (optional)
```

| Concern | Decision | Why |
|---|---|---|
| Framework | Next.js 16 App Router, TypeScript, Tailwind CSS 4, Framer Motion, Lucide | Per brief; one deployable, SSR for SEO. |
| API | REST under `/api/v1`, documented in `docs/API.md` | Public & admin endpoints share the service layer with server actions. |
| Validation | Zod schemas shared by client and server | One source of truth for forms. |
| Database | PostgreSQL + Prisma 7 (driver adapter `@prisma/adapter-pg`) | Relational integrity, migrations, transactions. |
| Auth | Own DB-backed sessions: bcrypt hashing, random 256-bit token (stored hashed), httpOnly/Secure/SameSite=Lax cookie, 12 h idle expiry; optional TOTP MFA | No external auth vendor needed for a staff-only login; sessions revocable. |
| Authorisation | Role → Permission table; every server action & API handler calls `requirePermission()` | Enforced server-side, never by hiding buttons. |
| Email | Resend through a `Notification` outbox (idempotency key, attempts, status) processed by a cron-triggered worker | No duplicate sends; retries; delivery log. Dev/test uses a log transport. |
| Images | Cloudinary signed uploads; local-disk adapter for development | Optimised delivery; no secrets in the browser. |
| Hosting | Vercel + managed Postgres; Vercel Cron for reminders/outbox | Simple ops for a small business. |

## 5. Data model (summary)

Full schema: `prisma/schema.prisma`. Key relationships:

- **User** ⟶ **Role** ⟶ **Permission** (many-to-many). **Session** belongs to User.
- **Customer** (unique email) has many **Reservation**s; holds marketing-consent flag + timestamp + source.
- **Reservation** → Customer, optional **Table**; `status` enum (PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW); unique `reference`; `manageToken` (hashed) for guest self-service; `startsAt`/`endsAt` stored in UTC.
- **SeatingArea** has many **Table**s (min/max covers, combinable flag, active).
- **OpeningHours** (weekday, service period, open/close) + **ClosureDate** (exceptions such as Christmas Day).
- **BookingSettings** (singleton): slot interval, durations by party size, lead time, max days ahead, last-seating offset, max covers per slot, auto-confirm limit, largest online party, reminder timing.
- **MenuCategory** ⟶ **MenuItem** ⟷ **Allergen** (the 14 UK allergens) and ⟷ **DietaryTag**; item has price in pence, spice level 0–4, `allergenInfoVerified` flag, availability, featured, sort order, soft delete.
- **Offer**, **GalleryImage**, **ContactEnquiry**, **EventEnquiry**, **NewsletterSubscriber**, **SiteSettings** + **ContentBlock** (CMS), **AuditLog**, **Notification**, **AnalyticsEvent** (first-party conversion counts).

### 5.1 Booking rules
1. A slot is offered only inside a service period, at least _lead time_ from now, within _max days ahead_, not on a closure date, and no later than closing time minus the _last-seating_ offset.
2. Seating: allocate the smallest active table (or permitted combination within one area) whose capacity fits the party and has no overlapping non-cancelled booking.
3. Kitchen pacing: total covers starting in any slot ≤ _max covers per slot_.
4. Parties above the _auto-confirm limit_ are created as **PENDING** for staff approval; others are **CONFIRMED** immediately.
5. Duplicate prevention: the same customer cannot hold two active bookings starting within the same service period on the same day.
6. **Concurrency:** creation runs in a transaction that first takes `pg_advisory_xact_lock` on the booking date, re-checks availability, then inserts. Two simultaneous requests for the last table are serialised; the second sees no availability.

### 5.2 Allergen rule
An item shows allergen chips only when `allergenInfoVerified = true`. Otherwise the site shows "Allergen information to be confirmed — please ask our team". No item is ever labelled allergen-free, and the "gluten-free" filter only matches items with a verified gluten-free tag.

### 5.3 Data protection
Personal data: customers, enquiries, subscribers. Retention defaults (configurable, need business sign-off): reservations 24 months after visit, enquiries 12 months, then anonymised by a scheduled job. Subject-access export and erasure from the customer screen. Marketing consent is opt-in, recorded with timestamp and source. ⚠️ Privacy policy, terms and retention periods are drafts requiring legal review.

### 5.4 Future native ordering
Planned, not built: `Order`, `OrderItem`, `DeliveryZone`, `DiscountCode` models behind the existing `orderingEnabled` switch in SiteSettings (today it controls the Just Order Online buttons). Every order button already goes through one setting and one tracked component, so a native checkout can replace the link in one place. Payments would use Stripe Checkout (no card data touches our servers).

## 6. Phase plan

| Phase | Output |
|---|---|
| 1 Research & architecture | This document, schema, sitemap |
| 2 UI/UX | Design system, all public pages |
| 3 Backend | Prisma models, migrations, seed, services, REST API, auth, RBAC, booking engine |
| 4 Admin | Dashboard, reservations (list/calendar/manual/CSV), menu, content, gallery, offers, customers, enquiries, staff, reports, audit log |
| 5 Integrations | JOO links, Resend outbox, Cloudinary, GA4/GTM with consent, Maps |
| 6 Testing & security | Unit, integration (real Postgres), E2E (Playwright), concurrency test, headers, rate limits |
| 7 Deployment | Vercel + Postgres guide, backups, monitoring |

## 7. Open questions for management
1. Correct second phone number (346100 vs 343100)?
2. Seating plan: number of tables, sizes, areas (bar / main / private), which can be combined.
3. Largest party to confirm automatically; how far ahead bookings may be made.
4. Dessert and drinks menus (not on the ordering site).
5. Verified allergen sheet from the kitchen (the online data is free text).
6. Halal status, air-conditioning, private room capacity.
7. Approval to use review quotes (and which ones) — none are published until approved.
8. Access to Google Business Profile, Search Console and the JOO account.
