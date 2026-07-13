import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Returns the signed-in user's orders. Auth via Supabase access token in the
// Authorization: Bearer <token> header. Matches by userId OR customer email so
// orders migrated from Firebase (whose userId was a Firebase uid) still show
// for re-registered customers.
export async function GET(req: Request) {
  const authz = req.headers.get("authorization") || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : "";
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const sb = supabaseAdmin();
    const { data: userData, error: authErr } = await sb.auth.getUser(token);
    if (authErr || !userData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id: uid, email, email_confirmed_at } = userData.user;

    // Only widen the match to guest orders by email when the account's email is
    // CONFIRMED — otherwise someone could register an unconfirmed account with a
    // victim's address and read their guest-checkout order history. The email is
    // additionally shape-validated before use in the filter (defence in depth).
    const safeEmail =
      email && email_confirmed_at && /^[^\s@<>"'&(),]+@[^\s@<>"'&(),]+\.[^\s@<>"'&(),]+$/.test(email)
        ? email.toLowerCase()
        : null;

    let query = sb
      .from("orders")
      .select("id,data")
      .order("created_at", { ascending: false })
      .limit(50);
    query = safeEmail
      ? query.or(`user_id.eq.${uid},customer_email.eq.${safeEmail}`)
      : query.eq("user_id", uid);

    const { data: rows, error } = await query;
    if (error) throw error;
    const orders = (rows ?? []).map((r) => ({ ...(r.data as object), id: r.id }));
    return NextResponse.json({ orders });
  } catch (e) {
    console.error("me/orders error", e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
