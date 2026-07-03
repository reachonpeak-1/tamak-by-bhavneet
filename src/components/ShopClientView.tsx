"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
  initialSort?: string;
  initialQuery?: string;
}

export default function ShopClientView({
  allProducts,
  categories,
  initialCat,
  initialSub,
  initialSort = "featured",
  initialQuery = "",
}: ShopClientViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState(initialSort);
  const [priceRange, setPriceRange] = useState("all");
  const [selectedFabric, setSelectedFabric] = useState("all");
  const [gridCols, setGridCols] = useState(3);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Sync state if URL searchParams change
  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    const sort = searchParams.get("sort") ?? "featured";
    setSearchQuery(q);
    setSortBy(sort);
    setCurrentPage(1);
  }, [searchParams]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, priceRange, selectedFabric, sortBy, initialCat, initialSub]);

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
    } else if (sortBy === "newest") {
      result = result.filter((p) => p.tag === "New").concat(result.filter((p) => p.tag !== "New"));
    }

    return result;
  }, [allProducts, initialCat, initialSub, searchQuery, priceRange, selectedFabric, sortBy]);

  // Paginated Slice
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setPriceRange("all");
    setSelectedFabric("all");
    setSortBy("featured");
    setCurrentPage(1);
    if (initialCat || initialSub) {
      router.push("/shop");
    }
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (gridContainerRef.current) {
      const topOffset = gridContainerRef.current.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: Math.max(0, topOffset), behavior: "smooth" });
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
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
        onSearchChange={handleSearchChange}
        sortBy={sortBy}
        onSortChange={setSortBy}
        priceRange={priceRange}
        onPriceChange={setPriceRange}
        selectedFabric={selectedFabric}
        onFabricChange={setSelectedFabric}
        availableFabrics={availableFabrics}
        gridCols={gridCols}
        onGridColsChange={setGridCols}
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
            onPageSizeChange={handlePageSizeChange}
          />
        </>
      )}
    </div>
  );
}
