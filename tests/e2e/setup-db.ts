// Prepares the e2e database before the server builds: migrate (unless prepared externally), seed, clear test data.
import { execSync } from "node:child_process";

const env = { ...process.env, NODE_ENV: "development" as const };
if (!process.env.DATABASE_URL) throw new Error("E2E_DATABASE_URL must point at a disposable database.");
if (process.env.E2E_SKIP_MIGRATE !== "1") execSync("npx prisma migrate reset --force --skip-seed", { stdio: "inherit", env });
execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env });
execSync("npx tsx tests/e2e/prepare-db.ts", { stdio: "inherit", env });
