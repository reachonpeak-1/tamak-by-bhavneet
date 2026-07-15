"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Product } from "@/lib/types";
import type { Category } from "@/lib/data/categories";
import CategoryNavbar from "./CategoryNavbar";
import ShopToolbar from "./ShopToolbar";
import ProductGrid from "./ProductGrid";
import ShopPagination from "./ShopPagination";

interface ShopClientViewProps {
  allProducts: Product[];
  categories: Category[];
  initialCat?: string;
  initialSub?: string;
}

// URL param defaults. A param equal to its default is dropped from the URL to keep
// links tidy; anything absent falls back to these values when read.
const DEFAULTS: Record<string, string> = {
  q: "",
  sort: "featured",
  price: "all",
  fabric: "all",
  cols: "3",
  size: "12",
  page: "1",
};

export default function ShopClientView({
  allProducts,
  categories,
  initialCat,
  initialSub,
}: ShopClientViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // ---- All listing state is derived from the URL, so the browser Back button
  //      restores the exact page/filters/sort — and, because the same products
  //      re-render, native scroll restoration lands where the shopper left off.
  const searchQuery = searchParams.get("q") ?? "";
  const sortBy = searchParams.get("sort") ?? "featured";
  const priceRange = searchParams.get("price") ?? "all";
  const selectedFabric = searchParams.get("fabric") ?? "all";
  const gridCols = Number(searchParams.get("cols")) || 3;
  const pageSize = Number(searchParams.get("size")) || 12;
  const currentPageRaw = Math.max(1, Number(searchParams.get("page")) || 1);

  /**
   * Write listing state into the URL. Uses router.replace so the shop stays a single
   * history entry that always reflects the latest view (Back from a product returns
   * straight to the restored listing). scroll:false keeps the viewport put on filter
   * changes. Filter/sort/size changes reset the page to 1; page/cols changes don't.
   * Params equal to their default are removed to keep the URL clean.
   */
  const setParams = (
    patch: Record<string, string | number>,
    { resetPage = true }: { resetPage?: boolean } = {}
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) params.set(k, String(v));
    if (resetPage && !("page" in patch)) params.set("page", "1");
    for (const [k, dflt] of Object.entries(DEFAULTS)) {
      if ((params.get(k) ?? dflt) === dflt) params.delete(k);
    }
    const qs = params.toString();
    router.replace(qs ? `/shop?${qs}` : "/shop", { scroll: false });
  };

  const activeCategory = initialCat
    ? categories.find((c) => c.name.toLowerCase() === initialCat.toLowerCase())
    : undefined;

  // Extract unique list of available fabrics
  const availableFabrics = useMemo(() => {
    const fabricsSet = new Set<string>();
    allProducts.forEach((p) => {
      if (p.fabric) {
        const mainFab = p.fabric.split("·")[0].split(",")[0].trim();
        if (mainFab) fabricsSet.add(mainFab);
      }
    });
    return Array.from(fabricsSet).sort();
  }, [allProducts]);

  // Filter & Sort logic
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Category Filter
    if (initialCat) {
      result = result.filter(
        (p) => p.category.toLowerCase() === initialCat.toLowerCase()
      );
    }

    // Subcategory Filter
    if (initialSub && initialCat) {
      result = result.filter(
        (p) => (p.subcategory ?? "").toLowerCase() === initialSub.toLowerCase()
      );
    }

    // Text Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((p) =>
        [p.name, p.category, p.subcategory, p.color, p.keywords, p.fabric, p.description]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    // Price Range Filter
    if (priceRange !== "all") {
      if (priceRange === "0-3000") result = result.filter((p) => p.price <= 3000);
      else if (priceRange === "3000-7000")
        result = result.filter((p) => p.price > 3000 && p.price <= 7000);
      else if (priceRange === "7000-15000")
        result = result.filter((p) => p.price > 7000 && p.price <= 15000);
      else if (priceRange === "15000+") result = result.filter((p) => p.price > 15000);
    }

    // Fabric Filter
    if (selectedFabric !== "all") {
      result = result.filter((p) =>
        (p.fabric ?? "").toLowerCase().includes(selectedFabric.toLowerCase())
      );
    }

    // Sorting
    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "new") {
      result = result.filter((p) => p.tag === "New").concat(result.filter((p) => p.tag !== "New"));
    }

    return result;
  }, [allProducts, initialCat, initialSub, searchQuery, priceRange, selectedFabric, sortBy]);

  // Paginated Slice (clamp page to available range so a stale/shared ?page= never
  // renders an empty grid)
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const currentPage = Math.min(currentPageRaw, totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const handleResetFilters = () => {
    router.replace("/shop", { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    setParams({ page: newPage }, { resetPage: false });
    if (gridContainerRef.current) {
      const topOffset = gridContainerRef.current.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: Math.max(0, topOffset) });
    }
  };

  return (
    <div className="shop-page-wrapper" ref={gridContainerRef}>
      {/* Category Pills Header */}
      <CategoryNavbar categories={categories} activeCat={initialCat} />

      {/* Subcategory Chips Bar */}
      {activeCategory && activeCategory.subs.length > 0 && (
        <div className="subfilters-container">
          <div className="subfilters">
            <Link
              className={`subchip${!initialSub ? " active" : ""}`}
              href={`/shop?cat=${encodeURIComponent(activeCategory.name)}`}
            >
              All {activeCategory.name}
            </Link>
            {activeCategory.subs.map((s) => (
              <Link
                key={s}
                className={`subchip${
                  initialSub?.toLowerCase() === s.toLowerCase() ? " active" : ""
                }`}
                href={`/shop?cat=${encodeURIComponent(
                  activeCategory.name
                )}&sub=${encodeURIComponent(s)}`}
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Shop Control & Filter Toolbar */}
      <ShopToolbar
        searchQuery={searchQuery}
        onSearchChange={(q) => setParams({ q })}
        sortBy={sortBy}
        onSortChange={(sort) => setParams({ sort })}
        priceRange={priceRange}
        onPriceChange={(price) => setParams({ price })}
        selectedFabric={selectedFabric}
        onFabricChange={(fabric) => setParams({ fabric })}
        availableFabrics={availableFabrics}
        gridCols={gridCols}
        onGridColsChange={(cols) => setParams({ cols }, { resetPage: false })}
        totalResults={filteredProducts.length}
        activeCat={initialCat}
        activeSub={initialSub}
        onResetFilters={handleResetFilters}
      />

      {/* Product Results Grid */}
      {filteredProducts.length === 0 ? (
        <div className="shop-empty-state">
          <div className="shop-empty-state__icon">
            <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" fill="none" strokeWidth="1.2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
              <path d="M8 11h6" />
            </svg>
          </div>
          <h2>No matching atelier creations found</h2>
          <p>We couldn’t find any styles matching your search or active filters.</p>
          <button type="button" className="btn btn--solid" onClick={handleResetFilters}>
            Explore All Handwoven Pieces
          </button>
        </div>
      ) : (
        <>
          <ProductGrid products={paginatedProducts} gridCols={gridCols} />

          {/* Pagination Controls */}
          <ShopPagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredProducts.length}
            onPageChange={handlePageChange}
            onPageSizeChange={(size) => setParams({ size })}
          />
        </>
      )}
    </div>
  );
}
