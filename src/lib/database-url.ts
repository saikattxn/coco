/**
 * Connection strings. Supports plain env vars (DATABASE_URL / DIRECT_URL) and the variables the
 * Vercel ↔ Supabase integration injects (POSTGRES_PRISMA_URL, POSTGRES_URL, POSTGRES_URL_NON_POOLING).
 */
const PRISMA_ONLY_PARAMS = ["pgbouncer", "supa", "connection_limit", "pool_timeout", "schema"];

function clean(url: string): string {
  if (!url) return url;
  try {
    const u = new URL(url);
    for (const p of PRISMA_ONLY_PARAMS) u.searchParams.delete(p);
    // node-postgres treats sslmode=require as verify-full; use libpq semantics (encrypted, as intended)
    if (u.searchParams.get("sslmode") === "require" && !u.searchParams.has("uselibpqcompat")) u.searchParams.set("uselibpqcompat", "true");
    return u.toString();
  } catch {
    return url;
  }
}

/** Used by the running app (pooled connection). */
export function databaseUrl(): string {
  return clean(process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || "");
}

/** Used by migrations (session/direct connection). */
export function migrationUrl(): string {
  return process.env.DIRECT_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
}
