// Supabase client SDK (browser). Uses @supabase/ssr's cookie-backed session
// storage so server components and route handlers can read the same session.
// Lazily initialised so the app builds and runs even before env vars are set.
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function getBrowserClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured — set NEXT_PUBLIC_SUPABASE_* env vars.");
  }
  // detectSessionInUrl: false — OAuth code exchange happens exclusively via the
  // server-side /auth/callback route (see src/app/auth/callback/route.ts), which
  // also enforces the admin check. Without this, the browser client would silently
  // self-consume a stray ?code= on any page (this one is mounted globally via
  // AuthProvider), bypassing that check with no visible error.
  if (!client) client = createBrowserClient(url!, anonKey!, { auth: { detectSessionInUrl: false } });
  return client;
}
