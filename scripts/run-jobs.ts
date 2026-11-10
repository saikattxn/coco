/**
 * Run the scheduled jobs once, locally (sends due emails, queues reminders, retention housekeeping).
 * In production these run via Vercel Cron hitting /api/v1/cron/*.  Usage: npm run jobs:run
 */
import "dotenv/config";

async function main() {
  const base = process.env.APP_URL || "http://localhost:3000";
  const headers = { authorization: `Bearer ${process.env.CRON_SECRET}` };
  for (const job of ["reminders", "notifications", "maintenance"]) {
    const res = await fetch(`${base}/api/v1/cron/${job}`, { headers });
    console.log(job, res.status, await res.text());
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
