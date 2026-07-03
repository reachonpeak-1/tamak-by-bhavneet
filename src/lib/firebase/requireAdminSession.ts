import "server-only";
import { cookies } from "next/headers";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "./admin";

// Verifies the __session cookie (minted by /api/admin/session) and requires the
// `admin` custom claim. For admin SERVER components/pages. Mutation APIs use the
// Bearer-token requireAdmin() instead.
export async function requireAdminSession(): Promise<DecodedIdToken | null> {
  const cookie = (await cookies()).get("__session")?.value;
  if (!cookie) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(cookie, true);
    return decoded.admin === true ? decoded : null;
  } catch {
    return null;
  }
}
