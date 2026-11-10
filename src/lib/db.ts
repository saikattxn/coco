import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { databaseUrl } from "./database-url";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const connectionString = databaseUrl();
  if (!connectionString) throw new Error("No database configured: set DATABASE_URL (or connect the Supabase integration).");
  // Serverless functions keep a small pool; the database-side pooler multiplexes connections.
  const max = Number(process.env.DATABASE_POOL_MAX || (process.env.VERCEL ? 3 : 10));
  return new PrismaClient({ adapter: new PrismaPg({ connectionString, max }) });
}

export const db = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
