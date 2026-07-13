import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { allow } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Public subscribe endpoint. Writes via the service-role client (anon is denied by RLS).
export async function POST(req: Request) {
  if (!allow(req, "newsletter", 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { email?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const email = String(body.email ?? "").trim().toLowerCase();
  // Reject HTML metacharacters so a stored email can never be used for XSS in
  // the unsubscribe page or admin views.
  if (email.length > 254 || !/^[^\s@<>"'&]+@[^\s@<>"'&]+\.[^\s@<>"'&]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  try {
    const sb = supabaseAdmin();
    const { data: existing } = await sb.from("subscribers").select("id").eq("email", email).maybeSingle();
    if (!existing) {
      const { error } = await sb.from("subscribers").insert({
        data: {
          email,
          source: String(body.source ?? "site").slice(0, 40),
          status: "active",
          createdAt: new Date().toISOString(),
        },
      });
      // 23505 = unique violation (concurrent double-submit) — treat as already subscribed
      if (error && error.code !== "23505") throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("newsletter error", e);
    return NextResponse.json({ error: "Could not subscribe" }, { status: 503 });
  }
}
