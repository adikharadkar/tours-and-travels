import { Link, useLocation } from "react-router-dom";
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
        "h-[72px] sticky top-0 z-30 shrink-0 flex items-center px-4 md:px-6 lg:px-8",
        "transition-colors duration-200",
        // Light Theme: Clean, airy surface with crisp outline
        "bg-white/95 backdrop-blur-md border-b border-[#e2e8f0]",
        // Dark Theme: Midnight Level 1 surface with micro-border
        "dark:bg-[#1a1d26]/95 dark:backdrop-blur-md dark:border-white/5",
      ].join(" ")}
    >
      {/* 1. Mobile Header (< md): Matches Stitch mobile design */}
      <div className="flex md:hidden items-center justify-between w-full">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={onOpenMobile}
          aria-label="Open navigation"
          className="p-2 -ml-1.5 rounded-lg text-[#6b38d4] dark:text-[#d0bcff] hover:bg-[#f1f5f9] dark:hover:bg-[#33343b]/50 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        {/* Centered FleetCore Brand Wordmark */}
        <Link
          to="/dashboard"
          className="font-bold text-2xl tracking-tight text-[#6b38d4] dark:text-[#d0bcff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b38d4] rounded"
        >
          FleetCore
        </Link>

        {/* Right Action Controls: Global Search & User Profile */}
        <div className="flex items-center gap-1 -mr-1">
          <HeaderSearch />
          <HeaderUser />
        </div>
      </div>

      {/* 2. Desktop Header (>= md): Enterprise layout with Breadcrumbs, Global Search, and Actions */}
      <div className="hidden md:flex items-center justify-between w-full">
        {/* Left Zone: Breadcrumbs & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <HeaderContext
            title={config.title}
            breadcrumbs={config.breadcrumbs}
          />
        </div>

        {/* Center Zone: Global Search */}
        <HeaderSearch />

        {/* Right Zone: Contextual Action + Theme + Notifications + Profile */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 shrink-0">
          {/* Dynamic Contextual Action Button */}
          {config.primaryAction && (
            <HeaderAction action={config.primaryAction} />
          )}

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
      </div>
    </header>
  );
}
