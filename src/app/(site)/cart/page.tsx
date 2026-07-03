"use client";

import Image from "next/image";
import Link from "next/link";
import { useStore } from "@/components/StoreProvider";
import { inr } from "@/lib/format";

export default function CartPage() {
  const { cart, setQty, removeFromBag } = useStore();
  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const shipping = 0; // free shipping in India

  if (cart.length === 0) {
    return (
      <main className="wrap page">
        <div className="empty">
          <h2>Your bag is empty</h2>
          <p>Discover handwoven pieces crafted to order.</p>
          <Link className="btn btn--solid" href="/shop">Shop the collection</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="wrap page">
      <Link className="link-back" href="/shop">← Continue shopping</Link>
      <div className="page-head">
        <h1>Your bag</h1>
      </div>
      <div className="cart-wrap">
        <div>
          {cart.map((l) => (
            <div className="cart-line" key={`${l.id}-${l.size ?? ""}-${l.color ?? ""}`}>
              <div className="cart-line__img">
                {l.image && <Image src={l.image} alt={l.name} fill sizes="88px" style={{ objectFit: "cover" }} />}
              </div>
              <div>
                <h4>{l.name}</h4>
                {l.color && <div className="sm">Colour: {l.color}</div>}
                {l.size && <div className="sm">Size: {l.size}</div>}
                <div className="sm">₹{inr(l.price)}</div>
                <button
                  className="sm"
                  style={{ color: "var(--gold-2)", marginTop: ".3rem" }}
                  onClick={() => removeFromBag(l.id, l.size, l.color)}
                >
                  Remove
                </button>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="qty">
                  <button onClick={() => setQty(l.id, l.size, l.qty - 1, l.color)} aria-label="Decrease">−</button>
                  <span>{l.qty}</span>
                  <button onClick={() => setQty(l.id, l.size, l.qty + 1, l.color)} aria-label="Increase">+</button>
                </div>
                <div className="price" style={{ marginTop: ".5rem" }}>₹{inr(l.price * l.qty)}</div>
              </div>
            </div>
          ))}
        </div>

        <aside className="summary">
          <h3>Summary</h3>
          <div className="row"><span>Subtotal</span><span>₹{inr(subtotal)}</span></div>
          <div className="row"><span>Shipping</span><span>{shipping === 0 ? "Free" : `₹${inr(shipping)}`}</span></div>
          <div className="row total"><span>Total</span><span>₹{inr(subtotal + shipping)}</span></div>
          <Link className="btn btn--gold" href="/checkout">Proceed to Checkout</Link>
          <p className="sm" style={{ marginTop: ".8rem", color: "var(--muted)", textAlign: "center" }}>
            Taxes calculated at checkout
          </p>
        </aside>
      </div>
    </main>
  );
}
