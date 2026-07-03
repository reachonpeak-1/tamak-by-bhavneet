import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { priceCart, type CartItemInput } from "@/lib/pricing";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

interface VerifyBody {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  items: CartItemInput[];
  customer: { name: string; email: string; phone: string; address: string; city: string; pincode: string };
  userId?: string | null;
}

// Verifies the Razorpay signature, recomputes the amount, writes the order.
export async function POST(req: Request) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return NextResponse.json({ error: "Payments not configured" }, { status: 503 });

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

  // signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret)
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const valid =
    expected.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
  if (!valid) return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });

  // recompute amount from catalog (never trust client)
  let priced;
  try {
    priced = await priceCart(b.items ?? []);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  try {
    const db = adminDb();
    const ref = await db.collection("orders").add({
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
      userId: b.userId ?? null,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, orderRef: ref.id });
  } catch (e) {
    console.error("order write error", e);
    // payment verified but DB write failed — surface so the client can retry/record
    return NextResponse.json({ ok: true, warning: "Payment verified; order not yet saved" });
  }
}
