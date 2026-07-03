import Link from "next/link";
import type { Metadata } from "next";
import { getAllProducts } from "@/lib/data/products";
import { listCategories } from "@/lib/data/categories";
import ShopClientView from "@/components/ShopClientView";

export const metadata: Metadata = {
  title: "Shop All | तमक BY BHAVNEET",
  description: "Browse every handwoven piece — sarees, suits, kurtas, kurtis, dupattas and more.",
};

interface Props {
  searchParams: Promise<{ cat?: string; sub?: string; sort?: string; q?: string }>;
}

export default async function Shop({ searchParams }: Props) {
  const { cat, sub, sort, q } = await searchParams;
  const activeCat = cat?.replace(/\+/g, " ");
  const activeSub = sub?.replace(/\+/g, " ");
  const query = (q ?? "").trim();

  const [allProducts, categories] = await Promise.all([getAllProducts(), listCategories()]);

  const heading = query
    ? `Search Results`
    : activeCat
      ? activeSub
        ? `${activeCat} · ${activeSub}`
        : activeCat
      : "Shop all";

  return (
    <main className="wrap page shop-page">
      {/* Luxury Breadcrumb */}
      <nav className="shop-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span className="sep">/</span>
        <Link href="/shop">Atelier</Link>
        {activeCat && (
          <>
            <span className="sep">/</span>
            <Link href={`/shop?cat=${encodeURIComponent(activeCat)}`}>{activeCat}</Link>
          </>
        )}
        {activeSub && (
          <>
            <span className="sep">/</span>
            <span className="current">{activeSub}</span>
          </>
        )}
      </nav>

      {/* Hero Header */}
      <header className="page-head reveal">
        <span className="eyebrow">The Atelier Wardrobe</span>
        <h1>{heading}</h1>
        <p>
          Each piece handwoven and crafted to order. Discover {allProducts.length} timeless styles in our master collection.
        </p>
      </header>

      {/* Interactive Client View */}
      <ShopClientView
        allProducts={allProducts}
        categories={categories}
        initialCat={activeCat}
        initialSub={activeSub}
        initialSort={sort}
        initialQuery={query}
      />
    </main>
  );
}
