"use client";

interface ShopToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  priceRange: string;
  onPriceChange: (price: string) => void;
  selectedFabric: string;
  onFabricChange: (fabric: string) => void;
  availableFabrics: string[];
  gridCols: number;
  onGridColsChange: (cols: number) => void;
  totalResults: number;
  activeCat?: string;
  activeSub?: string;
  onResetFilters: () => void;
}

export default function ShopToolbar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  priceRange,
  onPriceChange,
  selectedFabric,
  onFabricChange,
  availableFabrics,
  gridCols,
  onGridColsChange,
  totalResults,
  activeCat,
  activeSub,
  onResetFilters,
}: ShopToolbarProps) {
  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    (priceRange !== "all" ? 1 : 0) +
    (selectedFabric !== "all" ? 1 : 0) +
    (activeCat ? 1 : 0) +
    (activeSub ? 1 : 0);

  return (
    <div className="shop-toolbar-bar">
      <div className="shop-toolbar-row">
        {/* Search Input */}
        <div className="shop-search-inline">
          <svg viewBox="0 0 24 24" className="search-icon" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search sarees, kurtas, silk…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search products"
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Minimal Dropdown Filters */}
        <div className="shop-filters-group">
          {/* Price Filter */}
          <div className="select-pill">
            <select
              value={priceRange}
              onChange={(e) => onPriceChange(e.target.value)}
              aria-label="Filter by Price"
            >
              <option value="all">Price: All</option>
              <option value="0-3000">Under ₹3,000</option>
              <option value="3000-7000">₹3,000 – ₹7,000</option>
              <option value="7000-15000">₹7,000 – ₹15,000</option>
              <option value="15000+">₹15,000 & Above</option>
            </select>
            <svg viewBox="0 0 24 24" className="select-chevron"><path d="M6 9l6 6 6-6" /></svg>
          </div>

          {/* Fabric Filter */}
          {availableFabrics.length > 0 && (
            <div className="select-pill">
              <select
                value={selectedFabric}
                onChange={(e) => onFabricChange(e.target.value)}
                aria-label="Filter by Fabric"
              >
                <option value="all">Fabric: All</option>
                {availableFabrics.map((fab) => (
                  <option key={fab} value={fab}>
                    {fab}
                  </option>
                ))}
              </select>
              <svg viewBox="0 0 24 24" className="select-chevron"><path d="M6 9l6 6 6-6" /></svg>
            </div>
          )}

          {/* Sort Filter */}
          <div className="select-pill">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              aria-label="Sort products"
            >
              <option value="featured">Sort: Featured</option>
              <option value="newest">New Arrivals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
            <svg viewBox="0 0 24 24" className="select-chevron"><path d="M6 9l6 6 6-6" /></svg>
          </div>
        </div>

        {/* Counter & Grid Switcher */}
        <div className="shop-toolbar-right">
          <span className="results-count">
            <b>{totalResults}</b> {totalResults === 1 ? "style" : "styles"}
          </span>

          {/* Grid View Toggle */}
          <div className="grid-toggle-bar">
            <button
              type="button"
              className={`grid-toggle-btn ${gridCols === 2 ? "active" : ""}`}
              onClick={() => onGridColsChange(2)}
              title="2 Columns View"
              aria-label="2 Columns View"
            >
              <span />
              <span />
            </button>
            <button
              type="button"
              className={`grid-toggle-btn ${gridCols === 3 ? "active" : ""}`}
              onClick={() => onGridColsChange(3)}
              title="3 Columns View"
              aria-label="3 Columns View"
            >
              <span />
              <span />
              <span />
            </button>
            <button
              type="button"
              className={`grid-toggle-btn ${gridCols === 4 ? "active" : ""}`}
              onClick={() => onGridColsChange(4)}
              title="4 Columns View"
              aria-label="4 Columns View"
            >
              <span />
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips (if any active) */}
      {activeFilterCount > 0 && (
        <div className="active-chips-row">
          {activeCat && <span className="chip-tag">{activeCat}</span>}
          {activeSub && <span className="chip-tag">{activeSub}</span>}
          {searchQuery && (
            <span className="chip-tag">
              Search: “{searchQuery}”
              <button onClick={() => onSearchChange("")}>✕</button>
            </span>
          )}
          {priceRange !== "all" && (
            <span className="chip-tag">
              Price: {priceRange}
              <button onClick={() => onPriceChange("all")}>✕</button>
            </span>
          )}
          {selectedFabric !== "all" && (
            <span className="chip-tag">
              Fabric: {selectedFabric}
              <button onClick={() => onFabricChange("all")}>✕</button>
            </span>
          )}
          <button type="button" className="reset-link" onClick={onResetFilters}>
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
