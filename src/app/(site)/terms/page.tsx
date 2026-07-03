import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & conditions",
  description: "Terms of use for the तमक by Bhavneet online store.",
};

export default function Terms() {
  return (
    <main className="wrap page prose">
      <div className="page-head">
        <span className="eyebrow">Policies</span>
        <h1>Terms &amp; conditions</h1>
      </div>
      <p>By using this website and placing an order, you agree to the following terms.</p>
      <h3>Products</h3>
      <p>
        Our pieces are handwoven; slight variations in colour, weave and finish are natural and not defects. On-screen
        colours may vary by display.
      </p>
      <h3>Pricing &amp; payment</h3>
      <p>
        Prices are in INR and inclusive of applicable taxes unless stated. Payments are processed securely via Razorpay
        (UPI, cards, net banking) or Cash on Delivery where available.
      </p>
      <h3>Orders</h3>
      <p>
        We may cancel an order due to stocking, pricing errors or suspected fraud, with a full refund. Made-to-order items
        enter crafting once payment is confirmed.
      </p>
      <h3>Shipping, returns &amp; refunds</h3>
      <p>Governed by our Shipping and Returns &amp; Refunds policies.</p>
      <h3>Contact</h3>
      <p>care@tamak.in · Bathinda, Punjab, India.</p>
      <p className="muted">Last updated: 2026.</p>
    </main>
  );
}
