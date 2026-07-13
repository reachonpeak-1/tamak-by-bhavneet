// Cookie-session Supabase client for server components and route handlers.
// Reads the session cookies written by the @supabase/ssr browser client.
import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
// Node < 22 has no native WebSocket; supabase-js's realtime client needs a
// transport even though we never use realtime channels.
import ws from "ws";

export async function supabaseServer(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      realtime: { transport: ws as unknown as typeof globalThis.WebSocket },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Server components can't set cookies during render; middleware/route
          // handlers can. Swallow the error in the read-only case.
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {}
        },
      },
    }
  );
}
