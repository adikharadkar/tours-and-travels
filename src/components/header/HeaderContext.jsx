import { Link } from "react-router-dom";

export default function HeaderContext({ title, breadcrumbs = [] }) {
  return (
    <div className="flex flex-col min-w-0">
      {/* Breadcrumb Trail */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumbs"
          className="flex items-center gap-1 text-[11px] md:text-xs font-medium text-[#64748b] dark:text-[#cbc3d7]/70 leading-none mb-1 truncate"
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <span
                key={`${crumb.label}-${index}`}
                className="flex items-center gap-1 shrink-0"
              >
                {crumb.path && !isLast ? (
                  <Link
                    to={crumb.path}
                    className="hover:text-[#6b38d4] dark:hover:text-[#d0bcff] transition-colors focus-visible:outline-none focus-visible:underline"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={
                      isLast
                        ? "text-[#0f172a] dark:text-[#d0bcff] font-semibold"
                        : "text-[#64748b] dark:text-[#cbc3d7]/70"
                    }
                  >
                    {crumb.label}
                  </span>
                )}

                {!isLast && (
                  <span
                    className="material-symbols-outlined text-[13px] md:text-[14px] text-[#94a3b8] dark:text-[#958ea0]"
                    aria-hidden="true"
                  >
                    chevron_right
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      )}

      {/* Main Page Title */}
      <h1 className="text-lg md:text-2xl font-bold tracking-tight text-[#0f172a] dark:text-[#e2e2eb] leading-tight truncate">
        {title}
      </h1>
    </div>
  );
}
