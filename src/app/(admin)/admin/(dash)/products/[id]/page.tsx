import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllProductsFresh } from "@/lib/data/products";
import { listCategoriesFresh } from "@/lib/data/categories";
import ProductEditor from "@/components/admin/ProductEditor";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [products, categories] = await Promise.all([getAllProductsFresh(), listCategoriesFresh()]);
  const product = products.find((p) => p.id === id);
  if (!product) notFound();

  return (
    <>
      <div className="adm-list-head">
        <div>
          <span className="adm-eyebrow">Catalog · {product.id}</span>
          <h1 className="adm-h">{product.name}</h1>
        </div>
        <div className="adm-actions">
          <Link className="adm-btn adm-btn--ghost" href={`/product/${product.slug}`} target="_blank">View live ↗</Link>
          <Link className="adm-btn adm-btn--ghost" href="/admin/products">← Back</Link>
        </div>
      </div>
      <ProductEditor product={product} categories={categories} />
    </>
  );
}
