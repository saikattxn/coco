// Tests never send real email and always use the dedicated test database.
(process.env as Record<string, string>).NODE_ENV = "test";
process.env.EMAIL_TRANSPORT = "log";
process.env.RATE_LIMIT_DISABLED = "1";
process.env.APP_URL = "http://localhost:3000";
process.env.APP_SECRET = process.env.APP_SECRET || "test-secret-test-secret-test-secret-123456";
if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
