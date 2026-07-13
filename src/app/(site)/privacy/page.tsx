import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How तमक by Bhavneet collects, uses and protects your personal information.",
};

export default function Privacy() {
  return (
    <main className="wrap page prose">
      <div className="page-head">
        <span className="eyebrow">Policies</span>
        <h1>Privacy policy</h1>
      </div>
      <p>
        We respect your privacy. This policy explains what we collect and how we use it when you shop with तमक by Bhavneet.
      </p>
      <h3>What we collect</h3>
      <ul>
        <li>Contact &amp; delivery details (name, email, phone, address) to fulfil orders.</li>
        <li>Order and payment status (payments are processed securely by Razorpay; we do not store card details).</li>
        <li>Account details if you choose to sign in (via Supabase Authentication).</li>
      </ul>
      <h3>How we use it</h3>
      <p>To process orders, provide support, send order updates, and — only with your consent — occasional offers.</p>
      <h3>Sharing</h3>
      <p>
        We share data only with service providers needed to run the store (payment gateway, logistics, cloud hosting) and
        as required by law. We never sell your data.
      </p>
      <h3>Your rights</h3>
      <p>You may request access to or deletion of your data by emailing care@tamak.in.</p>
      <p className="muted">Last updated: 2026.</p>
    </main>
  );
}
