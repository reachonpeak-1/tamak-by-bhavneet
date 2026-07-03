import { NextResponse } from "next/server";
import { priceCart, type CartItemInput } from "@/lib/pricing";
import { adminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

// TEMPORARY — create an order WITHOUT payment, so the admin order flow can be tested.
// Disabled in production unless ALLOW_TEST_ORDERS=1 is set. Remove this route once
// order creation has been verified.
interface TestOrderBody {
  items: CartItemInput[];
  customer?: { name: string; email: string; phone: string; address: string; city: string; pincode: string };
}

export async function POST(req: Request) {
  const allowed = process.env.NODE_ENV !== "production" || process.env.ALLOW_TEST_ORDERS === "1";
  if (!allowed) return NextResponse.json({ error: "Test orders are disabled" }, { status: 403 });

  let b: TestOrderBody;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // recompute amount from catalog (same as the real payment path)
  let priced;
  try {
    priced = await priceCart(b.items ?? []);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  try {
    const db = adminDb();
    const ref = await db.collection("orders").add({
      status: "pending",
      method: "test", // marks this as a no-payment test order
      lines: priced.lines,
      subtotal: priced.subtotal,
      shipping: priced.shipping,
      tax: priced.tax,
      amount: priced.amountPaise,
      currency: "INR",
      customer: b.customer ?? null,
      userId: null,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, orderRef: ref.id });
  } catch (e) {
    console.error("test order write error", e);
    return NextResponse.json({ error: "Could not save order" }, { status: 500 });
  }
}
