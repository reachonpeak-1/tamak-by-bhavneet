import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { priceCart, type CartItemInput } from "@/lib/pricing";

export const runtime = "nodejs";

// Creates a Razorpay order with a SERVER-COMPUTED amount (client prices ignored).
export async function POST(req: Request) {
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

  let priced;
  try {
    priced = await priceCart(body.items ?? []);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  try {
    const rzp = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await rzp.orders.create({
      amount: priced.amountPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      notes: { items: priced.lines.map((l) => `${l.id}x${l.qty}`).join(",") },
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
