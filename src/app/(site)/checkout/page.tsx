"use client";

import Link from "next/link";
import Script from "next/script";
import { useState } from "react";
import { useStore } from "@/components/StoreProvider";
import { useAuth } from "@/components/AuthProvider";
import { inr } from "@/lib/format";

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
};
declare global {
  interface Window {
    Razorpay?: new (o: RazorpayOptions) => { open: () => void };
  }
}

const empty = { name: "", email: "", phone: "", address: "", city: "", pincode: "" };

export default function CheckoutPage() {
  const { cart, clearCart, toast } = useStore();
  const { getToken } = useAuth();
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const total = subtotal;
  const items = cart.map((l) => ({ id: l.id, size: l.size, qty: l.qty, color: l.color }));

  const valid =
    form.name && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && /^\d{10}$/.test(form.phone.replace(/\D/g, "")) &&
    form.address && form.city && /^\d{6}$/.test(form.pincode);

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function placeOrder() {
    if (!valid) {
      toast("Please complete all fields correctly");
      return;
    }
    setBusy(true);
    try {
      // online → create Razorpay order (send auth token so the order is
      // attributed to the signed-in buyer server-side; guests omit it)
      const token = await getToken().catch(() => null);
      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start payment");
      if (!window.Razorpay) throw new Error("Payment library not loaded");

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "तमक by Bhavneet",
        description: "Handwoven ethnic wear",
        order_id: data.orderId,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: "#a9823a" },
        handler: async (r) => {
          const v = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...r, customer: form }),
          });
          const vd = await v.json();
          if (v.ok && vd.ok) {
            clearCart();
            setDone(vd.orderRef || r.razorpay_payment_id);
          } else {
            toast(vd.error || "Payment verification failed");
          }
        },
      });
      rzp.open();
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="wrap page">
        <div className="empty">
          <h2>Thank you — order placed ✦</h2>
          <p>
            Your order reference is <b>{done}</b>. We&apos;ll email you the details and updates as your piece is crafted.
          </p>
          <Link className="btn btn--solid" href="/shop">Continue shopping</Link>
        </div>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="wrap page">
        <div className="empty">
          <h2>Your bag is empty</h2>
          <Link className="btn btn--solid" href="/shop">Shop the collection</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="wrap page">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Link className="link-back" href="/cart">← Back to bag</Link>
      <div className="page-head"><h1>Checkout</h1></div>

      <div className="cart-wrap">
        <div>
          <div className="eyebrow" style={{ marginBottom: ".8rem" }}>Shipping details</div>
          <div style={{ display: "grid", gap: ".8rem", gridTemplateColumns: "1fr 1fr" }}>
            <input className="co-in" style={{ gridColumn: "1 / -1" }} placeholder="Full name" value={form.name} onChange={set("name")} />
            <input className="co-in" placeholder="Email" value={form.email} onChange={set("email")} />
            <input className="co-in" placeholder="Phone (10 digits)" value={form.phone} onChange={set("phone")} />
            <input className="co-in" style={{ gridColumn: "1 / -1" }} placeholder="Address" value={form.address} onChange={set("address")} />
            <input className="co-in" placeholder="City" value={form.city} onChange={set("city")} />
            <input className="co-in" placeholder="Pincode (6 digits)" value={form.pincode} onChange={set("pincode")} />
          </div>

          <div className="eyebrow" style={{ margin: "1.6rem 0 .8rem" }}>Payment</div>
          <p style={{ fontSize: "0.95rem", color: "var(--muted)", margin: "0 0 1rem" }}>
            Online payment via UPI, Cards, or Netbanking.
          </p>
        </div>

        <aside className="summary">
          <h3>Order</h3>
          {cart.map((l) => (
            <div className="row" key={`${l.id}-${l.size ?? ""}-${l.color ?? ""}`}>
              <span>{l.name}{l.color ? ` · ${l.color}` : ""}{l.size ? ` · ${l.size}` : ""} × {l.qty}</span>
              <span>₹{inr(l.price * l.qty)}</span>
            </div>
          ))}
          <div className="row"><span>Shipping</span><span>Free</span></div>
          <div className="row total"><span>Total</span><span>₹{inr(total)}</span></div>
          <button className="btn btn--gold" onClick={placeOrder} disabled={busy}>
            {busy ? "Please wait…" : `Pay ₹${inr(total)}`}
          </button>
        </aside>
      </div>
    </main>
  );
}
