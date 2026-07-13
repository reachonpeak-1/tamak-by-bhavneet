import "server-only";
import { supabaseAdmin } from "./admin";

export interface AdminIdentity {
  uid: string;
  email: string | null;
}

// profiles.is_admin lookups are memoized briefly so the guard costs ~0ms on
// warm calls. Revoking an admin takes effect within TTL_MS (the old Firebase
// session-cookie guard skipped revocation checks entirely, so this is stricter).
const TTL_MS = 60_000;
const adminCache = new Map<string, { isAdmin: boolean; expires: number }>();

export async function isAdminUid(uid: string): Promise<boolean> {
  const hit = adminCache.get(uid);
  if (hit && hit.expires > Date.now()) return hit.isAdmin;
  const { data: profile } = await supabaseAdmin()
    .from("profiles")
    .select("is_admin")
    .eq("id", uid)
    .maybeSingle();
  const isAdmin = Boolean(profile?.is_admin);
  adminCache.set(uid, { isAdmin, expires: Date.now() + TTL_MS });
  return isAdmin;
}

// Verifies a Supabase access token from the Authorization header and requires
// the profiles.is_admin flag. Returns the admin identity, or null if not
// authorized. Used by admin mutation API routes.
//
// getClaims() verifies the JWT locally against the project's JWKS (cached in
// the client after the first fetch) — no per-request auth round-trip.
export async function requireAdmin(req: Request): Promise<AdminIdentity | null> {
  const authz = req.headers.get("authorization") || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : "";
  if (!token) return null;
  try {
    const { data, error } = await supabaseAdmin().auth.getClaims(token);
    if (error || !data?.claims?.sub) return null;
    const uid = data.claims.sub;
    if (!(await isAdminUid(uid))) return null;
    return { uid, email: (data.claims.email as string | undefined) ?? null };
  } catch {
    return null;
  }
}
