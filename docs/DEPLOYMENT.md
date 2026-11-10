# Deployment guide

Recommended: **Vercel** (app + cron) and a **managed PostgreSQL** in the UK/EU region (Neon, Supabase or AWS RDS London). Any Node 22 host works if you add your own cron for the three job URLs.

## 1. Database

1. Create a Postgres 14+ database in a London/EU region. Use a connection string with `sslmode=require`. On serverless hosts use the provider's **pooled** connection string.
   - **Supabase via the Vercel integration (current staging setup):** connect the Supabase integration to the Vercel project and select the database. It injects `POSTGRES_PRISMA_URL` (pooled, used by the app) and `POSTGRES_URL_NON_POOLING` (used for migrations) — no passwords to copy.
   - **Supabase, manual:** Vercel can't reach Supabase's IPv6-only direct connection, so use the IPv4 poolers from *Connect* in the Supabase dashboard: `DATABASE_URL` = transaction pooler (port **6543**) and `DIRECT_URL` = session pooler (port **5432**), both with user `postgres.<project-ref>`, ending `?sslmode=require&uselibpqcompat=true`. `DATABASE_POOL_MAX` defaults to 3 on Vercel.
   - Row-level security is enabled on every table with no policies, and the `anon`/`authenticated` roles have no grants, so nothing is reachable through Supabase's public Data API. The app connects as the database owner.
2. From your machine (or CI) with `DATABASE_URL` set:
   ```bash
   npx prisma migrate deploy
   SEED_ADMIN_EMAIL=manager@… SEED_ADMIN_NAME="…" npm run db:seed
   ```
   Note the temporary password printed once, sign in, and change it under **My account**.
3. Turn on automated daily backups with point-in-time recovery (Neon/Supabase/RDS all provide this; keep at least 7 days). Test a restore once before launch.

## 2. Third-party services

| Service | Steps | Env vars |
|---|---|---|
| **Resend** (email) | Create an account, verify the sending domain (add its DNS records), create an API key | `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `ADMIN_NOTIFY_EMAIL` |
| **Cloudinary** (images) | Create an account; copy cloud name, API key and secret | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| **Google Tag Manager** | Create a container; add a GA4 Configuration tag. Enable Consent Mode in the container (the site sends consent updates) | `NEXT_PUBLIC_GTM_ID` |
| **Google Search Console** | Verify the domain (DNS TXT record) and submit `https://<domain>/sitemap.xml` | — |
| **Google Business Profile** | Set the website link to the new homepage and the booking link to `/book` | — |

Until a service is configured the site keeps working and the dashboard shows it as "awaiting configuration" (Booking settings → Integrations). Bookings are still saved without email.

## 3. Vercel

1. Import the Git repository. Framework: Next.js. Node 22.
2. Add environment variables (Production): everything in `.env.example` that applies, including `DATABASE_URL`, `APP_URL` (`https://cocotamarindhp27.co.uk`), `APP_SECRET` (`openssl rand -base64 48`), `CRON_SECRET`, and `ALLOW_INDEXING=1` **for production only**.
3. The build command is `npm run vercel-build` (picked up automatically): it applies pending migrations, runs the idempotent seed (it never overwrites existing data), then builds. Public pages are prerendered from the database, so `DATABASE_URL` and `DIRECT_URL` must be available at build time.
4. Deploy. Cron jobs from `vercel.json` are created automatically and send the `CRON_SECRET` bearer token. They run **once a day** so they work on the free Hobby plan (emails are also sent immediately after each action). On Pro you can tighten them: notifications `*/5 * * * *`, reminders `0 * * * *`.

## 4. Domain & HTTPS

1. Add `cocotamarindhp27.co.uk` and `www.` in Vercel → Domains and update DNS as instructed (A/CNAME). HTTPS certificates are automatic.
2. Make `www` redirect to the apex (or the reverse) — pick one and keep `APP_URL` matching it.
3. The app sends HSTS, CSP, X-Frame-Options and other security headers (see `next.config.ts`). Old WordPress URLs (`/reservation/`, `/contact-us/` …) 301-redirect to the new pages.
4. Ask Just Order Online to point the **Booking** link on `order.cocotamarindhp27.co.uk` to `https://cocotamarindhp27.co.uk/book`, so there is only one booking journey.

## 5. Before go-live checklist

- [ ] Replace the sample seating plan (Dashboard → Booking settings → Seating plan)
- [ ] Confirm booking rules (party sizes, durations, notice, pacing)
- [ ] Kitchen verifies allergens for each dish and ticks "verified"
- [ ] Confirm the second phone number (01844 346100 vs 343100)
- [ ] Add dessert and drinks menus (categories exist, hidden)
- [ ] Review privacy policy, terms, cookie policy and retention periods
- [ ] Upload new photography (and alt text)
- [ ] Send a test booking end to end and check the emails arrive
- [ ] Create staff accounts; managers turn on two-step verification
- [ ] `ALLOW_INDEXING=1` on production only; submit the sitemap
- [ ] Keep the old WordPress site's `noindex` until launch, then retire it

## 6. Monitoring

- **Vercel**: function logs and Cron run history. Failed emails also appear in the dashboard (Overview banner and Booking settings → Recent emails).
- **Errors**: add Sentry if wanted (`npx @sentry/wizard -i nextjs`) — not included by default.
- **Uptime**: a free uptime monitor on `/` and `/api/v1/availability?date=<future date>&partySize=2`.
- **Activity log** in the dashboard records every staff change, export and sign-in.

## 7. Updating

Push to the main branch → Vercel builds and deploys. For schema changes: create a migration locally (`npm run db:migrate`), commit it, and run `npx prisma migrate deploy` against production before or as part of the deploy.
