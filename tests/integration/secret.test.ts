import { afterAll, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { databaseUrl } from "@/lib/database-url";

afterAll(() => db.$disconnect());

describe("app secret", () => {
  it("is generated once and stored when APP_SECRET isn't set (as on a fresh Vercel deploy)", async () => {
    await db.appConfig.deleteMany();
    vi.stubEnv("APP_SECRET", "");
    vi.stubEnv("VERCEL", "1");
    vi.resetModules();
    const { getAppSecret } = await import("@/server/secret");
    const first = await getAppSecret();
    expect(first.length).toBeGreaterThanOrEqual(48);
    vi.resetModules();
    const again = await (await import("@/server/secret")).getAppSecret();
    expect(again).toBe(first);
    vi.unstubAllEnvs();
  });
});

describe("connection strings", () => {
  it("accepts Vercel/Supabase integration variables and normalises SSL", () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("POSTGRES_PRISMA_URL", "postgres://postgres.ref:pw@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x&pgbouncer=true");
    const url = new URL(databaseUrl());
    expect(url.port).toBe("6543");
    expect(url.searchParams.get("uselibpqcompat")).toBe("true");
    expect(url.searchParams.has("pgbouncer")).toBe(false);
    expect(url.searchParams.has("supa")).toBe(false);
    vi.unstubAllEnvs();
  });
});
