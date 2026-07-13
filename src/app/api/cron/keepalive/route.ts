import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Pinged on a schedule (see .github/workflows/supabase-keepalive.yml) so the
// Supabase project always has a DB request within its 7-day free-tier
// inactivity window and never auto-pauses.
function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const expected = Buffer.from(secret);
  const actual = Buffer.from(token);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { error } = await supabaseAdmin().from("content").select("id").limit(1);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[cron:keepalive] failed:", (e as Error).message);
    return NextResponse.json({ error: "Ping failed" }, { status: 500 });
  }
}
