import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping policy",
  description: "Shipping timelines, charges and delivery information for तमक orders.",
};

export default function Shipping() {
  return (
    <main className="wrap page prose">
      <div className="page-head">
        <span className="eyebrow">Policies</span>
        <h1>Shipping policy</h1>
      </div>
      <h3>Processing time</h3>
      <p>
        Most pieces are handwoven and made to order, with a typical crafting time of 2–3 weeks. Ready-to-ship items are
        dispatched within 2–3 business days.
      </p>
      <h3>Charges</h3>
      <ul>
        <li><b>Within India:</b> Free standard shipping on all orders.</li>
        <li><b>International:</b> Insured express delivery, charges shown at checkout.</li>
      </ul>
      <h3>Delivery</h3>
      <p>
        Indian orders are usually delivered 3–6 business days after dispatch. You’ll receive tracking details by email/SMS
        once your order ships.
      </p>
      <p className="muted">Questions? Email care@tamak.in.</p>
    </main>
  );
}
