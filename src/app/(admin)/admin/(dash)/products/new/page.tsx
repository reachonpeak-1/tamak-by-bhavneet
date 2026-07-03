import Link from "next/link";
import ProductEditor from "@/components/admin/ProductEditor";
import { listCategoriesFresh } from "@/lib/data/categories";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await listCategoriesFresh();
  return (
    <>
      <div className="adm-list-head">
        <div>
          <span className="adm-eyebrow">Catalog</span>
          <h1 className="adm-h">New product</h1>
        </div>
        <Link className="adm-btn adm-btn--ghost" href="/admin/products">← Back</Link>
      </div>
      <ProductEditor categories={categories} />
    </>
  );
}
