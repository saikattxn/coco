import { defineConfig, devices } from "@playwright/test";
import { randomBytes } from "node:crypto";

/**
 * End-to-end tests run against a production build using a dedicated database (E2E_DATABASE_URL).
 * Emails go to the log transport — no real customer is ever emailed.
 */
if (!process.env.E2E_DATABASE_URL) throw new Error("Set E2E_DATABASE_URL to a disposable database for end-to-end tests.");
const PORT = Number(process.env.E2E_PORT || 3100);
process.env.E2E_ADMIN_EMAIL ||= "e2e-admin@cocotamarind.local";
process.env.E2E_PASSWORD ||= randomBytes(12).toString("base64url");
const chrome = process.env.PLAYWRIGHT_CHROME_PATH; // use an installed Chrome instead of downloading browsers

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    launchOptions: chrome ? { executablePath: chrome } : undefined,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /public\.spec\.ts/ },
  ],
  webServer: {
    command: `npx tsx tests/e2e/setup-db.ts && npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      DATABASE_URL: process.env.E2E_DATABASE_URL ?? "",
      APP_URL: `http://localhost:${PORT}`,
      APP_SECRET: "e2e-secret-e2e-secret-e2e-secret-e2e-secret",
      EMAIL_TRANSPORT: "log",
      RATE_LIMIT_DISABLED: "1",
      IMAGES_UNOPTIMIZED: "1",
      CRON_SECRET: "e2e-cron-secret",
      SEED_ADMIN_EMAIL: process.env.E2E_ADMIN_EMAIL,
      SEED_ADMIN_PASSWORD: process.env.E2E_PASSWORD,
      SEED_DEMO: "1",
      SEED_DEMO_PASSWORD: process.env.E2E_PASSWORD,
      E2E_SKIP_MIGRATE: process.env.E2E_SKIP_MIGRATE ?? "",
    },
  },
});
