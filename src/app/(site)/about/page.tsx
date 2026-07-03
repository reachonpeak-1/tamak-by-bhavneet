import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "The Craft",
  description: "तमक by Bhavneet — handwoven suits, sarees and lehengas, made to order by weaving families across India.",
};

export default function About() {
  return (
    <main className="wrap page prose">
      <div className="page-head">
        <span className="eyebrow">The House of तमक</span>
        <h1>Woven slowly, worn for years</h1>
      </div>
      <p>
        तमक began with a simple belief — that what you wear for life’s most-remembered days should be made by human
        hands, not hurried machines. Every suit, saree and lehenga is cut, woven and finished to order.
      </p>
      <h2>Our weavers</h2>
      <p>
        We work directly with weaving families across India, paying fairly and keeping ancestral techniques alive — from
        Banarasi zari to Lucknowi chikankari and Chanderi gota patti. There is no mass production here, and no two pieces
        are exactly alike.
      </p>
      <h2>Made to measure</h2>
      <p>
        Most pieces are crafted to order in 2–3 weeks. Share your measurements at checkout, or book a fitting at our
        Bathinda atelier and we’ll tailor your piece to you.
      </p>
      <h2>Visit the atelier</h2>
      <p>
        SCO 12, Model Town Phase 1, Bathinda, Punjab 151001. Open Mon–Sat, 10am–7pm.{" "}
        <Link href="/contact">Get in touch →</Link>
      </p>
      <p className="muted">— Bhavneet</p>
    </main>
  );
}
