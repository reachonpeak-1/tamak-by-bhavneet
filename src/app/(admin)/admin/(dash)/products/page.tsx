import Link from "next/link";
import { getAllProductsFresh } from "@/lib/data/products";
import { inr } from "@/lib/format";
import ProductRowActions from "@/components/admin/ProductRowActions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q, page } = await searchParams;
  let products = await getAllProductsFresh();
  if (q) {
    const t = q.toLowerCase();
    products = products.filter((p) => p.name.toLowerCase().includes(t) || p.category.toLowerCase().includes(t) || p.id.toLowerCase().includes(t));
  }

  const total = products.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(pageCount, Math.max(1, Number(page) || 1));
  const start = (current - 1) * PAGE_SIZE;
  products = products.slice(start, start + PAGE_SIZE);
  const pageHref = (p: number) => `/admin/products?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) }).toString()}`;

  return (
    <>
      <div className="adm-list-head">
        <div>
          <span className="adm-eyebrow">Catalog</span>
          <h1 className="adm-h">Products</h1>
          <p className="adm-sub">{total} items{pageCount > 1 ? ` · page ${current} of ${pageCount}` : ""}</p>
        </div>
        <Link className="adm-btn adm-btn--gold" href="/admin/products/new">+ New product</Link>
      </div>

      <form className="adm-row" method="get" style={{ marginBottom: "1.2rem" }}>
        <input name="q" className="adm-in" placeholder="Search products…" defaultValue={q ?? ""} style={{ maxWidth: 320 }} />
        <button className="adm-btn adm-btn--ghost">Search</button>
      </form>

      <table className="adm-table desktop-only">
        <thead>
          <tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Tag</th><th></th></tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td data-label="Name"><Link href={`/admin/products/${p.id}`}>{p.name}</Link></td>
              <td data-label="Category">{p.category}</td>
              <td data-label="Price">₹{inr(p.price)}</td>
              <td data-label="Stock">{p.stock <= 3 ? <span className="adm-pill adm-pill--low">{p.stock}</span> : p.stock}</td>
              <td data-label="Tag">{p.tag ? <span className="adm-pill">{p.tag}</span> : "—"}</td>
              <td style={{ textAlign: "right" }}><ProductRowActions id={p.id} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile Card Layout */}
      <div className="adm-products-mobile-grid mobile-only">
        {products.map((p) => (
          <div key={p.id} className="adm-product-card-mobile">
            <div className="adm-product-card-mobile__header">
              {p.image ? (
                <img src={p.image} alt={p.name} className="adm-product-card-mobile__img" />
              ) : (
                <div className="adm-product-card-mobile__img-placeholder" />
              )}
              <div className="adm-product-card-mobile__meta">
                <Link href={`/admin/products/${p.id}`} className="adm-product-card-mobile__title">
                  {p.name}
                </Link>
                <div className="adm-product-card-mobile__details">
                  <span className="adm-product-card-mobile__category">{p.category}</span>
                  <span className="adm-product-card-mobile__divider">·</span>
                  <span className="adm-product-card-mobile__price">₹{inr(p.price)}</span>
                </div>
              </div>
            </div>
            
            <div className="adm-product-card-mobile__footer">
              <div className="adm-product-card-mobile__status">
                {p.stock <= 3 ? (
                  <span className="adm-pill adm-pill--low">Low stock ({p.stock})</span>
                ) : (
                  <span className="adm-product-card-mobile__stock">{p.stock} in stock</span>
                )}
                {p.tag && (
                  <span className="adm-pill adm-pill--active" style={{ marginLeft: "0.4rem" }}>
                    {p.tag}
                  </span>
                )}
              </div>
              <div className="adm-product-card-mobile__actions">
                <ProductRowActions id={p.id} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {pageCount > 1 && (
        <div className="adm-pagination">
          {current > 1 ? (
            <Link className="adm-btn adm-btn--ghost adm-btn--sm" href={pageHref(current - 1)}>
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2">
                <path d="M15 19l-7-7 7-7" />
              </svg>
              Prev
            </Link>
          ) : (
            <span className="adm-btn adm-btn--ghost adm-btn--sm disabled" aria-disabled>
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2">
                <path d="M15 19l-7-7 7-7" />
              </svg>
              Prev
            </span>
          )}

          <span className="adm-pagination__counter">
            Page <b>{current}</b> of <b>{pageCount}</b>
          </span>

          {current < pageCount ? (
            <Link className="adm-btn adm-btn--ghost adm-btn--sm" href={pageHref(current + 1)}>
              Next
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <span className="adm-btn adm-btn--ghost adm-btn--sm disabled" aria-disabled>
              Next
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </span>
          )}
        </div>
      )}
    </>
  );
}
