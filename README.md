# Coco Tamarind — website & restaurant platform

The public website, table-booking system and staff dashboard for **Coco Tamarind**, Aylesbury Road, Askett, Princes Risborough HP27 9LY.

- **Public site:** home, menu (with dietary/spice/allergen filters), table booking with live availability, guest booking management, offers, celebrations & private dining enquiries, gallery, about, contact, privacy/terms/cookies.
- **Staff dashboard** (`/admin`): reservations (day list, calendar, manual bookings, approvals, edits, CSV export), menu, offers, page content & SEO, gallery, customers (consent, data export, erasure), enquiries, staff accounts & roles, booking rules & seating plan, reports, activity log.
- **Online ordering** stays with Just Order Online — every "Order" button links to it and clicks are counted.

## Status

| Area | Status |
|---|---|
| Public pages, booking engine, dashboard, REST API | Built and tested |
| Email (Resend) | Built — **awaiting configuration** (`RESEND_API_KEY`, `EMAIL_FROM`) |
| Image uploads (Cloudinary) | Built — **awaiting configuration**; image links work meanwhile |
| Google Tag Manager / GA4 | Built (consent-gated) — **awaiting** `NEXT_PUBLIC_GTM_ID` |
| Seating plan | **Sample data** — replace with the real floor plan before launch |
| Allergen data | Imported from the ordering site as **unverified** — kitchen sign-off needed |
| Privacy policy, terms, retention periods | **Drafts** — need business / legal review |

See [`docs/DEVELOPMENT_LOG.md`](docs/DEVELOPMENT_LOG.md) for open questions and decisions.

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · PostgreSQL · Prisma 7 (`@prisma/adapter-pg`) · Zod · Resend · Cloudinary · Vitest · Playwright + axe.

## Install and run locally

Requirements: Node.js 22+, PostgreSQL 14+.

```bash
npm install                      # also generates the Prisma client
cp .env.example .env             # then fill in DATABASE_URL, APP_SECRET, CRON_SECRET
                                 # for local work also set EMAIL_TRANSPORT="log"
npx prisma migrate deploy        # create the tables
npm run db:seed                  # roles, allergens, hours, menu, offer, gallery, sample seating, first admin
npm run dev                      # http://localhost:3000  ·  dashboard at /admin
```

The seed prints a temporary password for the first Super Admin if `SEED_ADMIN_PASSWORD` is empty. Change it from **My account** after signing in. Set `SEED_DEMO=1` and `SEED_DEMO_PASSWORD` to also create demo Manager, Front of house and Editor accounts (`manager@`, `reservations@`, `content@cocotamarind.local`).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Develop, build, serve |
| `npm run lint` / `typecheck` | ESLint / TypeScript |
| `npm test` | Unit + integration tests (needs `TEST_DATABASE_URL`, a disposable database) |
| `npm run test:e2e` | Browser tests against a production build (needs `E2E_DATABASE_URL`) |
| `npm run db:migrate` / `db:deploy` / `db:seed` | Prisma migrations / seed |
| `npm run jobs:run` | Run scheduled jobs once against `APP_URL` |

## Project structure

```
prisma/                schema, migrations, seed, menu data imported from the ordering site
src/app/(site)/        public pages and their server actions
src/app/admin/         login, MFA and the staff dashboard
src/app/api/v1/        REST API (public, admin, cron)
src/server/            business logic: booking engine & service, auth, notifications, storage, reports
src/lib/               shared helpers: time zones, validation schemas, formatting
src/components/        site and admin UI components
tests/                 unit, integration (real Postgres) and e2e (Playwright) tests
docs/                  audit & architecture, database, API, deployment, admin guide, development log
```

## Documentation

- [Audit & architecture](docs/AUDIT_AND_ARCHITECTURE.md)
- [Database & business rules](docs/DATABASE.md)
- [REST API](docs/API.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [Administrator guide](docs/ADMIN_GUIDE.md)
- [Development log](docs/DEVELOPMENT_LOG.md)
