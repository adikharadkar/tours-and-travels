import { forwardRef } from "react";

const Pagination = forwardRef(function Pagination(
  {
    currentPage,
    totalPages,
    onPageChange,
    className = "",
    siblingCount = 1,
    compact = false,
  },
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
      className={[
        "flex items-center justify-between gap-2 sm:gap-3",
        className,
      ].join(" ")}
    >
      <button
        type="button"
        aria-label="Go to previous page"
        disabled={!canGoPrevious}
        onClick={() => handlePageChange(currentPage - 1)}
        className={[
          "inline-flex items-center justify-center transition-colors cursor-pointer",
          compact
            ? "h-8 w-8 rounded border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            : "h-8 px-3 rounded-md border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          "disabled:pointer-events-none disabled:opacity-30 disabled:cursor-not-allowed",
        ].join(" ")}
      >
        {compact ? (
          <span className="material-symbols-outlined text-[18px] leading-none">
            chevron_left
          </span>
        ) : (
          "Previous"
        )}
      </button>

      <div className="flex items-center gap-1">
        {pages.map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                aria-hidden="true"
                className="px-1.5 text-xs text-slate-500 select-none"
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
                "flex h-8 min-w-8 items-center justify-center rounded px-2 text-xs font-medium transition-all cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                isCurrentPage
                  ? "bg-slate-900 text-white dark:bg-[#202330] dark:text-slate-100 dark:border dark:border-slate-700 font-semibold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200",
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
          "inline-flex items-center justify-center transition-colors cursor-pointer",
          compact
            ? "h-8 w-8 rounded border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            : "h-8 px-3 rounded-md border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          "disabled:pointer-events-none disabled:opacity-30 disabled:cursor-not-allowed",
        ].join(" ")}
      >
        {compact ? (
          <span className="material-symbols-outlined text-[18px] leading-none">
            chevron_right
          </span>
        ) : (
          "Next"
        )}
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
