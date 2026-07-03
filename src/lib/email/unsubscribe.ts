// One-click unsubscribe links — HMAC-signed so we never store a per-user token.
// The link target verifies the signature, then flips the subscriber to
// status="unsubscribed". Mirrors the HMAC approach in the Razorpay verify route.
import "server-only";
import crypto from "node:crypto";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tamak.in";

function secret(): string {
  const s = process.env.NEWSLETTER_SECRET;
  if (!s) throw new Error("NEWSLETTER_SECRET is not set.");
  return s;
}

export function unsubToken(email: string): string {
  return crypto.createHmac("sha256", secret()).update(email.toLowerCase()).digest("hex");
}

export function verifyUnsub(email: string, token: string): boolean {
  if (!email || !token) return false;
  const expected = unsubToken(email);
  return expected.length === token.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

export function unsubUrl(email: string): string {
  const e = encodeURIComponent(email.toLowerCase());
  return `${SITE}/api/newsletter/unsubscribe?e=${e}&t=${unsubToken(email)}`;
}
