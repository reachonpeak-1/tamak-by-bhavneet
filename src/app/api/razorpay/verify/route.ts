import { NextResponse } from "next/server";
import crypto from "node:crypto";
import Razorpay from "razorpay";
import { priceCart, type CartItemInput } from "@/lib/pricing";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { allow } from "@/lib/rate-limit";

export const runtime = "nodejs";

interface VerifyBody {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  customer: { name: string; email: string; phone: string; address: string; city: string; pincode: string };
}

// Parse the server-written `notes.items` snapshot (JSON array, or the compact
// "id:qty,id:qty" fallback) back into cart inputs for authoritative repricing.
function parseItemsNote(note: unknown): CartItemInput[] {
  const s = typeof note === "string" ? note : "";
  if (s.startsWith("[")) {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) return arr.map((x) => ({ id: String(x.id), qty: Number(x.qty) || 1, size: x.size, color: x.color }));
    } catch {}
  }
  return s
    .split(",")
    .map((pair) => pair.split(":"))
    .filter(([id]) => id)
    .map(([id, qty]) => ({ id, qty: Number(qty) || 1 }));
}

// Verifies the Razorpay signature, confirms the ACTUAL charge, then writes the
// order idempotently. The cart is re-priced from the server-written order notes
// — never from the client — and matched against the amount Razorpay captured.
export async function POST(req: Request) {
  if (!allow(req, "rzp:verify", 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret || !keyId) return NextResponse.json({ error: "Payments not configured" }, { status: 503 });

  let b: VerifyBody;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = b;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment fields" }, { status: 400 });
  }

  // 1. Signature authenticity (binds order_id + payment_id to our secret).
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  const valid =
    expected.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
  if (!valid) return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });

  const sb = supabaseAdmin();

  // 2. Idempotency short-circuit — if this payment was already recorded, return it.
  const { data: existing } = await sb
    .from("orders")
    .select("id")
    .eq("data->>paymentId", razorpay_payment_id)
    .maybeSingle();
  if (existing) return NextResponse.json({ ok: true, orderRef: existing.id });

  // 3. Fetch the AUTHORITATIVE order from Razorpay and confirm it was paid.
  let rzpOrder;
  try {
    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
    rzpOrder = await rzp.orders.fetch(razorpay_order_id);
  } catch (e) {
    console.error("razorpay fetch error", e);
    return NextResponse.json({ error: "Could not verify payment" }, { status: 502 });
  }
  if (rzpOrder.status !== "paid") {
    return NextResponse.json({ error: "Payment not captured" }, { status: 400 });
  }

  // 4. Reprice from the SERVER-WRITTEN notes and bind to the real charge.
  let priced;
  try {
    priced = await priceCart(parseItemsNote(rzpOrder.notes?.items));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
  if (priced.amountPaise !== Number(rzpOrder.amount)) {
    console.error(`[verify] amount mismatch: priced=${priced.amountPaise} charged=${rzpOrder.amount} order=${razorpay_order_id}`);
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  const userId = (typeof rzpOrder.notes?.uid === "string" && rzpOrder.notes.uid) || null;

  // 5. Decrement stock atomically (RPC guards against oversell races).
  let needsRestock: string[] = [];
  try {
    const { data: failed } = await sb.rpc("decrement_stock", {
      lines: priced.lines.map((l) => ({ id: l.id, qty: l.qty })),
    });
    if (Array.isArray(failed)) needsRestock = failed as string[];
  } catch (e) {
    // Payment already captured — never hard-fail here; log for reconciliation.
    console.error("[verify] stock decrement failed:", (e as Error).message);
  }

  // 6. Persist the order (unique index on paymentId enforces idempotency).
  try {
    const { data: row, error } = await sb
      .from("orders")
      .insert({
        data: {
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          status: "paid",
          lines: priced.lines,
          subtotal: priced.subtotal,
          shipping: priced.shipping,
          tax: priced.tax,
          amount: priced.amountPaise,
          currency: "INR",
          customer: b.customer ?? null,
          userId,
          ...(needsRestock.length ? { needsRestock } : {}),
          createdAt: new Date().toISOString(),
        },
      })
      .select("id")
      .single();
    if (error) {
      // 23505 = unique violation → a concurrent request already recorded it.
      if (error.code === "23505") {
        const { data: dup } = await sb
          .from("orders")
          .select("id")
          .eq("data->>paymentId", razorpay_payment_id)
          .maybeSingle();
        if (dup) return NextResponse.json({ ok: true, orderRef: dup.id });
      }
      throw error;
    }
    return NextResponse.json({ ok: true, orderRef: row.id });
  } catch (e) {
    console.error("order write error", e);
    return NextResponse.json({ ok: false, error: "Payment verified but the order could not be saved. Please contact support with your payment id." }, { status: 500 });
  }
}
