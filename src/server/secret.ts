import "server-only";
import { db } from "@/lib/db";
import { randomToken } from "@/lib/tokens";

let cached: string | null = null;

/**
 * The secret that signs guest "manage booking" links. Uses APP_SECRET when set; otherwise a random
 * secret is generated once and kept in the (locked-down) AppConfig table, so deployments need no setup.
 * Call this OUTSIDE database transactions.
 */
export async function getAppSecret(): Promise<string> {
  const fromEnv = process.env.APP_SECRET;
  if (fromEnv && fromEnv.length >= 32) return fromEnv;
  if (cached) return cached;
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) return (cached = "development-only-secret-change-me-0123456789");
  await db.appConfig.createMany({ data: [{ key: "app_secret", value: randomToken(48) }], skipDuplicates: true });
  const row = await db.appConfig.findUniqueOrThrow({ where: { key: "app_secret" } });
  return (cached = row.value);
}
