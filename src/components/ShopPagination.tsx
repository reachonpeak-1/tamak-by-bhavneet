"use client";

interface ShopPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function ShopPagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: ShopPaginationProps) {
  if (totalPages <= 1 && totalItems <= 12) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers array with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      if (start > 2) pages.push("...");

      for (let i = start; i <= end; i++) pages.push(i);

      if (end < totalPages - 1) pages.push("...");

      pages.push(totalPages);
    }

    return pages;
  };

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <div className="shop-pagination-wrap">
      {/* Items Range & Page Size Selector */}
      <div className="shop-pagination__meta">
        <span className="pagination-count">
          Showing <b>{startItem}–{endItem}</b> of <b>{totalItems}</b> creations
        </span>

        <div className="page-size-selector">
          <label htmlFor="pageSizeSelect">Show:</label>
          <select
            id="pageSizeSelect"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="page-size-dropdown"
          >
            <option value={12}>12 per page</option>
            <option value={24}>24 per page</option>
            <option value={48}>48 per page</option>
          </select>
        </div>
      </div>

      {/* Page Navigation Controls */}
      {totalPages > 1 && (
        <div className="shop-pagination__controls">
          {/* Previous Page Button */}
          <button
            type="button"
            className="pg-btn pg-btn--nav"
            onClick={() => handlePageClick(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous Page"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span>Previous</span>
          </button>

          {/* Numbered Page Buttons */}
          <div className="pg-numbers">
            {getPageNumbers().map((num, idx) =>
              typeof num === "number" ? (
                <button
                  key={idx}
                  type="button"
                  className={`pg-btn pg-btn--num ${currentPage === num ? "active" : ""}`}
                  onClick={() => handlePageClick(num)}
                  aria-current={currentPage === num ? "page" : undefined}
                >
                  {num}
                </button>
              ) : (
                <span key={idx} className="pg-ellipsis">
                  {num}
                </span>
              )
            )}
          </div>

          {/* Next Page Button */}
          <button
            type="button"
            className="pg-btn pg-btn--nav"
            onClick={() => handlePageClick(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next Page"
          >
            <span>Next</span>
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
