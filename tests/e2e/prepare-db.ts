// Clears transactional data between e2e runs and keeps passwords in sync with this run.
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
async function main() {
  await db.notification.deleteMany();
  await db.reservation.deleteMany();
  await db.customer.deleteMany();
  await db.eventEnquiry.deleteMany();
  await db.contactEnquiry.deleteMany();
  await db.session.deleteMany();
  await db.rateLimit.deleteMany();
  await db.offer.deleteMany({ where: { slug: { startsWith: "e2e-" } } });
  const hash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD!, 12);
  await db.user.updateMany({ data: { passwordHash: hash, failedLogins: 0, lockedUntil: null, mfaEnabled: false, mfaSecret: null } });
}
main().finally(() => db.$disconnect());
