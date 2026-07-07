import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getActiveProducts, getProduct } from "@/lib/data/products";
import { inr } from "@/lib/format";
import ProductDetail from "@/components/ProductDetail";
import ProductRail from "@/components/ProductRail";

// Pre-render every active product page → static + instant from the edge. New products
// added later render on demand (dynamicParams defaults to true).
export async function generateStaticParams() {
  return (await getActiveProducts()).map((p) => ({ slug: p.slug }));
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return { title: "Not found" };
  return {
    title: p.name,
    description: p.description || `${p.name} — handwoven ${p.category.toLowerCase()} by तमक.`,
    openGraph: {
      title: p.name,
      description: p.description,
      images: p.image ? [{ url: p.image }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: p.image ? [p.image] : undefined,
    category: p.category,
    brand: { "@type": "Brand", name: "तमक by Bhavneet" },
    aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviews },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: p.price,
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  const related = (await getActiveProducts()).filter((x) => x.category === p.category && x.id !== p.id).slice(0, 10);

  return (
    <main className="wrap page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductDetail p={p} />
      <p className="count-note" style={{ marginTop: "2rem" }}>SKU {p.id} · ₹{inr(p.price)}</p>
      {related.length > 0 && (
        <ProductRail eyebrow="You may also like" title={`More ${p.category}`} products={related} />
      )}
    </main>
  );
}
