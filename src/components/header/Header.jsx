import { useLocation } from "react-router-dom";
import HeaderContext from "./HeaderContext";
import HeaderSearch from "./HeaderSearch";
import HeaderAction from "./HeaderAction";
import HeaderThemeToggle from "./HeaderThemeToggle";
import HeaderNotifications from "./HeaderNotifications";
import HeaderUser from "./HeaderUser";
import { getHeaderConfig } from "../../config/headerConfig";

export default function Header({ onOpenMobile }) {
  const location = useLocation();
  const config = getHeaderConfig(location.pathname, location.search);

  return (
    <header
      className={[
        "h-[72px] sticky top-0 z-30 shrink-0 flex items-center justify-between px-4 md:px-6 lg:px-8",
        "transition-colors duration-200",
        // Light Theme: Clean, airy surface with crisp outline
        "bg-white/95 backdrop-blur-md border-b border-[#e2e8f0]",
        // Dark Theme: Midnight Level 1 surface with micro-border
        "dark:bg-[#1a1d26]/95 dark:backdrop-blur-md dark:border-white/5",
      ].join(" ")}
    >
      {/* 1. Left Zone: Mobile Menu Toggle + Breadcrumbs & Title */}
      <div className="flex items-center gap-3 min-w-0">
        {onOpenMobile && (
          <button
            type="button"
            onClick={onOpenMobile}
            aria-label="Open navigation"
            className="md:hidden p-2 rounded-lg text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] dark:text-[#cbc3d7] dark:hover:text-[#e2e2eb] dark:hover:bg-[#33343b]/50 transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
          </button>
        )}

        <HeaderContext title={config.title} breadcrumbs={config.breadcrumbs} />
      </div>

      {/* 2. Center Zone: Global Search */}
      <HeaderSearch />

      {/* 3. Right Zone: Contextual Action + Theme + Notifications + Profile */}
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
        {/* Dynamic Contextual Action Button */}
        {config.primaryAction && <HeaderAction action={config.primaryAction} />}

        {/* Divider */}
        {config.primaryAction && (
          <div className="h-6 w-px bg-[#e2e8f0] dark:bg-white/10 mx-0.5 sm:mx-1 hidden sm:block" />
        )}

        {/* Theme Toggle */}
        <HeaderThemeToggle />

        {/* Live Notifications */}
        <HeaderNotifications />

        {/* User Profile */}
        <HeaderUser />
      </div>
    </header>
  );
}
