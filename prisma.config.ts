import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a session connection. With a transaction pooler for the app (e.g. Supabase
    // port 6543), set DIRECT_URL to a session/direct connection; otherwise DATABASE_URL is used.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
});
