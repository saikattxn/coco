import "server-only";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { TOTP, Secret } from "otpauth";
import { db } from "@/lib/db";
import { randomToken, sha256 } from "@/lib/tokens";
import type { PermissionKey } from "./permissions";
import { audit } from "./audit";
import { rateLimit } from "./rate-limit";

export const SESSION_COOKIE = "ct_admin";
const SESSION_IDLE_HOURS = 12;
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  roleKey: string;
  roleName: string;
  permissions: Set<string>;
  mfaEnabled: boolean;
  sessionId: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function passwordProblems(password: string): string | null {
  if (password.length < 12) return "Use at least 12 characters.";
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return "Use a mix of letters and numbers.";
  return null;
}

// A dummy hash so failed lookups take the same time as real comparisons
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO7Y1oZz8Cq9hQ4Zb9qkqW8y8m3iVQ4yq";

export async function attemptLogin(emailRaw: string, password: string) {
  const email = emailRaw.trim().toLowerCase();
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await rateLimit(`login:${ip}`, 20, 15 * 60))) {
    return { ok: false as const, error: "Too many attempts. Please wait 15 minutes and try again." };
  }
  const user = await db.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !user.active) return { ok: false as const, error: "Email or password is incorrect." };
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { ok: false as const, error: "This account is temporarily locked. Try again later." };
  }
  if (!valid) {
    const failed = user.failedLogins + 1;
    await db.user.update({
      where: { id: user.id },
      data: {
        failedLogins: failed >= MAX_FAILED_LOGINS ? 0 : failed,
        lockedUntil: failed >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCK_MINUTES * 60000) : null,
      },
    });
    await audit({ userId: user.id, action: "auth.login_failed", entityType: "User", entityId: user.id, summary: "Failed login", ipAddress: ip });
    return { ok: false as const, error: "Email or password is incorrect." };
  }

  const token = randomToken();
  await db.session.create({
    data: {
      tokenHash: sha256(token),
      userId: user.id,
      mfaPassed: !user.mfaEnabled,
      expiresAt: new Date(Date.now() + SESSION_IDLE_HOURS * 3600_000),
      ipAddress: ip,
      userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
    },
  });
  await db.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
  await audit({ userId: user.id, action: "auth.login", entityType: "User", entityId: user.id, summary: "Signed in", ipAddress: ip });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_IDLE_HOURS * 3600,
  });
  return { ok: true as const, mfaRequired: user.mfaEnabled };
}

async function loadSession(token: string | undefined) {
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
  });
  if (!session || session.expiresAt < new Date() || !session.user.active) return null;
  // Sliding expiry, written at most every 5 minutes
  if (Date.now() - session.lastSeenAt.getTime() > 5 * 60_000) {
    await db.session.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date(), expiresAt: new Date(Date.now() + SESSION_IDLE_HOURS * 3600_000) },
    });
  }
  return session;
}

/** Returns the signed-in user (with MFA completed) or null. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await loadSession(token);
  if (!session || !session.mfaPassed) return null;
  const u = session.user;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    roleKey: u.role.key,
    roleName: u.role.name,
    permissions: new Set(u.role.permissions.map((rp) => rp.permission.key)),
    mfaEnabled: u.mfaEnabled,
    sessionId: session.id,
  };
}

/** Session that has passed the password step but still needs a TOTP code. */
export async function getPendingMfaSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await loadSession(token);
  if (!session || session.mfaPassed || !session.user.mfaSecret) return null;
  return session;
}

export function verifyTotp(secretBase32: string, code: string): boolean {
  const totp = new TOTP({ issuer: "Coco Tamarind", algorithm: "SHA1", digits: 6, period: 30, secret: Secret.fromBase32(secretBase32) });
  return totp.validate({ token: code.replace(/\s/g, ""), window: 1 }) !== null;
}

export function newTotp(email: string) {
  const secret = new Secret({ size: 20 });
  const totp = new TOTP({ issuer: "Coco Tamarind", label: email, algorithm: "SHA1", digits: 6, period: 30, secret });
  return { secret: secret.base32, uri: totp.toString() };
}

export async function completeMfa(code: string) {
  const session = await getPendingMfaSession();
  if (!session) return { ok: false as const, error: "Your sign-in has expired. Please start again." };
  if (!(await rateLimit(`mfa:${session.id}`, 6, 15 * 60))) return { ok: false as const, error: "Too many attempts." };
  if (!verifyTotp(session.user.mfaSecret!, code)) return { ok: false as const, error: "That code didn't match. Try the latest code." };
  await db.session.update({ where: { id: session.id }, data: { mfaPassed: true } });
  return { ok: true as const };
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: sha256(token) } });
  jar.delete(SESSION_COOKIE);
}

/** For pages: redirect to login when signed out. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** For pages and server actions: enforce a permission (redirects to the access-denied page if missing). */
export async function requirePermission(permission: PermissionKey): Promise<CurrentUser> {
  const user = await requireUser();
  if (!user.permissions.has(permission)) redirect("/admin/forbidden");
  return user;
}

export function can(user: CurrentUser, permission: PermissionKey) {
  return user.permissions.has(permission);
}
