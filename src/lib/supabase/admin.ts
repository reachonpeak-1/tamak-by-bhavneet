// Supabase service-role client (server only). Used by API routes and server
// pages for trusted reads/writes: it bypasses RLS, mirroring the old
// "Firebase Admin SDK bypasses rules" architecture.
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
// Node < 22 has no native WebSocket; supabase-js's realtime client needs a
// transport even though we never use realtime channels.
import ws from "ws";

let client: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error("Supabase not configured — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.");
  }
  if (!client) {
    client = createClient(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { transport: ws as unknown as typeof globalThis.WebSocket },
    });
  }
  return client;
}

export const STORAGE_BUCKET = "media";

export function publicStorageUrl(key: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${key}`;
}
