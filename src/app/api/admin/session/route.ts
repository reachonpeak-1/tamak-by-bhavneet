import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/supabase/requireAdminSession";
import { supabaseServer } from "@/lib/supabase/server";
import { allow } from "@/lib/rate-limit";

export const runtime = "nodejs";

// POST → the @supabase/ssr browser client already wrote session cookies during
// sign-in; this just verifies the session belongs to an admin account so the
// login page can show a clear error before redirecting into /admin.
// DELETE signs out server-side (clears the session cookies).
export async function POST(req: Request) {
  if (!allow(req, "admin:session", 15, 60_000)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Not an admin account" }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  return NextResponse.json({ ok: true });
}
