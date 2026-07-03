import { listCategoriesFresh } from "@/lib/data/categories";
import CategoriesAdmin from "@/components/admin/CategoriesAdmin";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await listCategoriesFresh();
  return (
    <>
      <div className="adm-list-head">
        <div>
          <span className="adm-eyebrow">Catalog</span>
          <h1 className="adm-h">Categories</h1>
          <p className="adm-sub">Create categories with a photo and name — they power the homepage rail and product options.</p>
        </div>
      </div>
      <CategoriesAdmin initial={categories} />
    </>
  );
}
