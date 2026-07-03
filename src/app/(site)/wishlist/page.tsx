import { getAllProducts } from "@/lib/data/products";
import WishlistView from "@/components/WishlistView";

export default async function WishlistPage() {
  const allProducts = await getAllProducts();

  return (
    <main className="wrap page">
      <div className="page-head">
        <span className="eyebrow">Saved</span>
        <h1>Your wishlist</h1>
      </div>
      <WishlistView allProducts={allProducts} />
    </main>
  );
}
