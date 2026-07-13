import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { priceCart, type CartItemInput } from "@/lib/pricing";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { allow } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Creates a Razorpay order with a SERVER-COMPUTED amount (client prices ignored).
// The authoritative cart + buyer identity are stored in the order `notes` so the
// verify step can trust them (Razorpay returns notes on orders.fetch) instead of
// re-reading a client payload.
export async function POST(req: Request) {
  if (!allow(req, "rzp:order", 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
  }

  let body: { items?: CartItemInput[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Buyer identity from a verified token (never from the body). Guests → null.
  let uid: string | null = null;
  const authz = req.headers.get("authorization") || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : "";
  if (token) {
    try {
      const { data } = await supabaseAdmin().auth.getClaims(token);
      uid = data?.claims?.sub ?? null;
    } catch {
      uid = null;
    }
  }

  let priced;
  try {
    priced = await priceCart(body.items ?? []);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  // Compact, server-trusted cart snapshot for repricing at verify time. Kept
  // small to stay within Razorpay's per-note value limit; falls back to id:qty
  // if the full form would be too large.
  const full = JSON.stringify(
    priced.lines.map((l) => ({ id: l.id, qty: l.qty, size: l.size, color: l.color }))
  );
  const itemsNote = full.length <= 240 ? full : priced.lines.map((l) => `${l.id}:${l.qty}`).join(",");

  try {
    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await rzp.orders.create({
      amount: priced.amountPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: { items: itemsNote, uid: uid ?? "" },
    });
    return NextResponse.json({
      orderId: order.id,
      amount: priced.amountPaise,
      currency: "INR",
      keyId,
      subtotal: priced.subtotal,
    });
  } catch (e) {
    console.error("razorpay order error", e);
    return NextResponse.json({ error: "Could not create order" }, { status: 502 });
  }
}
