import { createHash, randomBytes } from "node:crypto";

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

export function bookingReference(): string {
  const bytes = randomBytes(6);
  let out = "CT-";
  for (const b of bytes) out += REF_ALPHABET[b % REF_ALPHABET.length];
  return out;
}

import { createHmac } from "node:crypto";

function appSecret(): string {
  const s = process.env.APP_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("APP_SECRET must be set (32+ characters).");
    return "development-only-secret-change-me-0123456789";
  }
  return s;
}

/** Guest self-service token for a booking: derived, so every email can include the link. */
export function manageTokenFor(reference: string): string {
  return createHmac("sha256", appSecret()).update(`manage:${reference}`).digest("base64url").slice(0, 32);
}
