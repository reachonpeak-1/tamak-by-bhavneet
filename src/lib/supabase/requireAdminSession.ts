import "server-only";
import { supabaseServer } from "./server";
import { isAdminUid, type AdminIdentity } from "./requireAdmin";

// Verifies the Supabase session cookies (written at sign-in by the browser
// client) and requires the profiles.is_admin flag. For admin SERVER
// components/pages and cookie-authed GET downloads. Mutation APIs use the
// Bearer-token requireAdmin() instead.
export async function requireAdminSession(): Promise<AdminIdentity | null> {
  try {
    const sb = await supabaseServer();
    // Local JWT verification (JWKS cached) — no per-request auth round-trip.
    const { data, error } = await sb.auth.getClaims();
    if (error || !data?.claims?.sub) return null;
    const uid = data.claims.sub;
    if (!(await isAdminUid(uid))) return null;
    return { uid, email: (data.claims.email as string | undefined) ?? null };
  } catch {
    return null;
  }
}
