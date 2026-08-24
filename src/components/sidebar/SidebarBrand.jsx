import { Link } from "react-router-dom";

export default function SidebarBrand({
  isCollapsed,
  onToggleCollapse,
  onCloseMobile,
}) {
  return (
    <div className="h-20 px-5 flex items-center justify-between border-b border-[#e2e8f0] dark:border-[#494454]/30 shrink-0 transition-colors">
      <Link
        to="/dashboard"
        className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b38d4] dark:focus-visible:ring-[#d0bcff] rounded-lg"
        title="FleetCore Operational Center"
      >
        {/* Brand Icon */}
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#06b6d4] via-[#57dffe] to-[#6b38d4] dark:from-[#4cd7f6] dark:to-[#d0bcff] flex items-center justify-center shrink-0 shadow-sm dark:glow-active transition-transform group-hover:scale-105">
          <span
            className="material-symbols-outlined text-white dark:text-[#0c0e14] text-xl font-bold"
            data-filled="true"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            local_shipping
          </span>
        </div>

        {/* Brand Name & Subtitle */}
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-xl tracking-tight text-[#6b38d4] dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-[#4cd7f6] dark:to-[#d0bcff]">
              FleetCore
            </span>
            <span className="text-[10px] font-semibold tracking-widest uppercase text-[#64748b] dark:text-[#cbc3d7]">
              OPERATIONAL CENTER
            </span>
          </div>
        )}
      </Link>

      {/* Action buttons (Collapse / Mobile Close) */}
      <div className="flex items-center gap-1">
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation"
            className="p-2 rounded-lg text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] dark:text-[#cbc3d7] dark:hover:text-[#e2e2eb] dark:hover:bg-[#33343b]/50 transition-colors md:hidden"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden md:flex p-1.5 rounded-lg text-[#64748b] hover:text-[#6b38d4] hover:bg-[#f1f5f9] dark:text-[#cbc3d7] dark:hover:text-[#d0bcff] dark:hover:bg-[#33343b]/50 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">
              {isCollapsed ? "last_page" : "first_page"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
