"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import { useStore } from "@/components/StoreProvider";
import ProductGrid from "@/components/ProductGrid";

// Wishlist ids live in localStorage (client). The full catalog is passed in from
// the server page so cards reflect the live Firestore data.
export default function WishlistView({ allProducts }: { allProducts: Product[] }) {
  const { wishlist } = useStore();
  const items = allProducts.filter((p) => wishlist.includes(p.id));

  if (items.length === 0)
    return (
      <div className="empty">
        <h2>Nothing saved yet</h2>
        <p>Tap the heart on any piece to save it here.</p>
        <Link className="btn btn--solid" href="/shop">Browse the collection</Link>
      </div>
    );

  return <ProductGrid products={items} />;
}
