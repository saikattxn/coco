# Development log

## 2026-11-10 — Phases 1–6

**Phase 1 — Research & architecture.** Audited both domains and third-party listings (see `AUDIT_AND_ARCHITECTURE.md`). Key findings: the whole main site is `noindex, nofollow`; two competing booking forms; pinch-zoom disabled; implied cookie consent; Slider Revolution 5.4; no `<h1>`; GA loaded before consent. Decision: keep Just Order Online for ordering; replace both booking forms with a native reservation system.

**Phase 2 — UI.** Design tokens from the brief (burgundy, cream, muted gold, charcoal; Cormorant Garamond + Manrope, self-hosted). One signature element: the jharokha arch framing photography, echoing the existing gold-frame logo. Editorial menu lines with dotted leaders. Mobile: persistent Book / Order / Call bar.

**Phase 3 — Backend.** Prisma schema (30 tables), seed, booking engine (pure functions) and transactional service with per-date advisory locks, auth (DB sessions, bcrypt, lockout, optional TOTP), RBAC, email outbox, storage adapter, REST API.

**Phase 4 — Dashboard.** Overview, reservations (list, calendar, detail, manual, approval, edit, CSV), menu, offers, content/SEO/testimonials, gallery, customers (consent, export, erasure), enquiries, staff, booking settings & seating, reports, activity log, account/MFA.

**Phase 5 — Integrations.** JOO links (tracked), Resend, Cloudinary, GTM with Consent Mode, click-to-load Google Maps, Vercel Cron.

**Phase 6 — Testing.** 38 unit tests, 23 integration tests on real Postgres (including 12- and 20-way concurrency tests), 26 Playwright tests on desktop and mobile with axe WCAG checks. E2E and lint surfaced and fixed: duplicate form IDs on multi-form pages, hero definition-list markup, a logo link whose label didn't match its text, synchronous state updates in effects (booking form, consent banner), and a CSP directive that broke plain-http local runs.

### Decisions and deviations

- **Menu content** was imported from the live ordering site (215 dishes, 15 categories) with prices and spice levels unchanged; obvious typos in descriptions corrected. Allergen text imported as **unverified**. Desserts and Drinks categories created hidden (not on the ordering site).
- **Testimonials:** none published — only approved genuine quotes can be added (dashboard). The homepage links to Tripadvisor reviews instead of quoting ratings that change.
- **Seating plan:** a clearly labelled sample (16 tables) so availability works; must be replaced.
- **Popular dishes / offer revenue:** not reported — order data lives with JOO. Reports say so rather than estimating.
- **Initial migration SQL** was generated in this build environment from `schema.prisma` with a converter following Prisma's SQL conventions, because Prisma's migration engine binary could not be downloaded here (blocked host). It was applied to Postgres and exercised by all tests. On a normal machine run `npx prisma migrate diff --from-migrations prisma/migrations --to-schema prisma/schema.prisma --script` once; it should print nothing (or only cosmetic differences, which can be committed as a follow-up migration).
- **Prisma 7.10** (latest stable; 8.x is still RC). **Next.js 16.4** with Cache Components: public pages are prerendered and invalidated by tag (`updateTag`) when staff edit content; staff pages render per request.
- **Images:** the restaurant's existing photos are referenced from the current site until a new shoot is uploaded to Cloudinary. One stock image on the old site (`wine-1761613_1280.jpg`) was deliberately not imported.
- **Social icons** are text links (Instagram, Facebook) rather than brand logos.

### Open questions for management

1. Second phone number: 01844 346100 (website) or 01844 343100 (listing)?
2. Real seating plan, combinable tables, private room capacity.
3. Booking limits: largest online party, instant-confirm limit, notice, pacing.
4. Dessert and drinks menus; verified allergen sheet.
5. Halal status and air-conditioning (third-party listings disagree) — not published.
6. Retention periods (24 months bookings / 12 months enquiries) and the draft legal pages.
7. Access to Google Business Profile, Search Console, the JOO account and the domain DNS.

### Next steps (suggested)

- Phase 7 deployment (see `DEPLOYMENT.md`) once accounts are available.
- Optional: Sentry error monitoring; a "today's floor" printable view; native ordering with Stripe Checkout (schema space reserved in the architecture).
