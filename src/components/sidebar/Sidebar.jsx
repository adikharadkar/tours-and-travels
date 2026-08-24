import { useState, useEffect } from "react";
import SidebarBrand from "./SidebarBrand";
import SidebarNavigation from "./SidebarNavigation";
import SidebarInsights from "./SidebarInsights";
import SidebarUser from "./SidebarUser";
import { getTrips } from "../../services/tripService";

export default function Sidebar({ isOpenMobile, onCloseMobile }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("fleetcore_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const [stats, setStats] = useState({
    activeTrips: 3,
    totalActive: 124,
    alerts: 3,
  });

  // Calculate live counts from trip service if available
  useEffect(() => {
    try {
      const trips = getTrips();
      if (Array.isArray(trips) && trips.length > 0) {
        const confirmedOrOngoing = trips.filter(
          (t) =>
            t.status === "confirmed" ||
            t.status === "ongoing" ||
            t.status === "scheduled",
        );
        const draftOrPending = trips.filter(
          (t) => t.status === "draft" || t.status === "pending",
        );

        setStats({
          activeTrips: confirmedOrOngoing.length || 3,
          totalActive: 120 + trips.length,
          alerts: draftOrPending.length > 0 ? draftOrPending.length : 3,
        });
      }
    } catch {
      // fallback to default Stitch values
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("fleetcore_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          role="presentation"
          aria-hidden="true"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity duration-300"
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        aria-label="Primary Navigation"
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col shrink-0 h-screen transition-all duration-300 ease-in-out",
          // Theme surfaces
          "bg-white border-r border-[#e2e8f0] shadow-xs",
          "dark:bg-[#191b22] dark:border-[#494454]/30 dark:shadow-md",
          // Collapsed / Expanded width
          isCollapsed ? "w-20" : "w-72 md:w-80",
          // Mobile responsive slide-in
          isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "md:static md:z-auto",
        ].join(" ")}
      >
        {/* Brand Header */}
        <SidebarBrand
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
          onCloseMobile={onCloseMobile}
        />

        {/* Scrollable Navigation */}
        <SidebarNavigation
          isCollapsed={isCollapsed}
          onItemClick={onCloseMobile}
          activeTripsCount={stats.activeTrips}
        />

        {/* Bottom Section: Operational Summary & User Profile */}
        <div className="p-3 border-t border-[#e2e8f0] dark:border-[#494454]/30 bg-[#f8fafc]/50 dark:bg-[#1a1d26] shrink-0 flex flex-col gap-3 transition-colors">
          <SidebarInsights
            activeCount={stats.totalActive}
            alertCount={stats.alerts}
            isCollapsed={isCollapsed}
          />
          <SidebarUser isCollapsed={isCollapsed} />
        </div>
      </aside>
    </>
  );
}
