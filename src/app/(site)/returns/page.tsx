import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Returns & refunds",
  description: "Return, exchange and refund policy for तमक by Bhavneet.",
};

export default function Returns() {
  return (
    <main className="wrap page prose">
      <div className="page-head">
        <span className="eyebrow">Policies</span>
        <h1>Returns &amp; refunds</h1>
      </div>
      <h3>7-day returns</h3>
      <p>
        If you’re not happy with your piece, you may request a return or exchange within 7 days of delivery, provided the
        item is unworn, unwashed and with original tags intact.
      </p>
      <h3>Made-to-measure items</h3>
      <p>
        Pieces custom-stitched to your measurements are eligible for exchange/alteration but not refund, except in case of
        a manufacturing defect or wrong item received.
      </p>
      <h3>How to request</h3>
      <ul>
        <li>Email care@tamak.in with your order reference within 7 days.</li>
        <li>We’ll arrange a pickup or share return instructions.</li>
        <li>Once inspected, refunds are issued to the original payment method within 5–7 business days.</li>
      </ul>
      <h3>Cancellations</h3>
      <p>Orders can be cancelled before they enter crafting/dispatch for a full refund.</p>
      <p className="muted">For help, contact care@tamak.in.</p>
    </main>
  );
}
