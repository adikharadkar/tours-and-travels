import { forwardRef } from "react";

const Pagination = forwardRef(function Pagination(
  { currentPage, totalPages, onPageChange, className = "", siblingCount = 1 },
  ref,
) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = getPaginationPages(currentPage, totalPages, siblingCount);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  function handlePageChange(page) {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    onPageChange(page);
  }

  return (
    <nav
      ref={ref}
      aria-label="Pagination"
      className={["flex items-center justify-between gap-4", className].join(
        " ",
      )}
    >
      <button
        type="button"
        aria-label="Go to previous page"
        disabled={!canGoPrevious}
        onClick={() => handlePageChange(currentPage - 1)}
        className={[
          "rounded-md border border-border px-3 py-2",
          "text-sm font-medium text-foreground",
          "transition-colors",
          "hover:bg-background",
          "focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-focus",
          "disabled:pointer-events-none disabled:opacity-50",
        ].join(" ")}
      >
        Previous
      </button>

      <div className="flex items-center gap-1">
        {pages.map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                aria-hidden="true"
                className="px-2 text-sm text-muted"
              >
                ...
              </span>
            );
          }

          const isCurrentPage = page === currentPage;

          return (
            <button
              key={page}
              type="button"
              aria-label={`Go to page ${page}`}
              aria-current={isCurrentPage ? "page" : undefined}
              onClick={() => handlePageChange(page)}
              className={[
                "flex h-9 min-w-9 items-center justify-center",
                "rounded-md px-2 text-sm font-medium",
                "transition-colors",
                "focus-visible:outline-none",
                "focus-visible:ring-2 focus-visible:ring-focus",
                isCurrentPage
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-background",
              ].join(" ")}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Go to next page"
        disabled={!canGoNext}
        onClick={() => handlePageChange(currentPage + 1)}
        className={[
          "rounded-md border border-border px-3 py-2",
          "text-sm font-medium text-foreground",
          "transition-colors",
          "hover:bg-background",
          "focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-focus",
          "disabled:pointer-events-none disabled:opacity-50",
        ].join(" ")}
      >
        Next
      </button>
    </nav>
  );
});

function getPaginationPages(currentPage, totalPages, siblingCount) {
  const totalVisiblePages = siblingCount * 2 + 5;

  if (totalPages <= totalVisiblePages) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const leftSibling = Math.max(currentPage - siblingCount, 1);

  const rightSibling = Math.min(currentPage + siblingCount, totalPages);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftItemCount = 3 + siblingCount * 2;

    return [
      ...Array.from({ length: leftItemCount }, (_, index) => index + 1),
      "...",
      totalPages,
    ];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightItemCount = 3 + siblingCount * 2;

    return [
      1,
      "...",
      ...Array.from(
        { length: rightItemCount },
        (_, index) => totalPages - rightItemCount + index + 1,
      ),
    ];
  }

  return [
    1,
    "...",
    ...Array.from(
      { length: rightSibling - leftSibling + 1 },
      (_, index) => leftSibling + index,
    ),
    "...",
    totalPages,
  ];
}

export default Pagination;
