import SidebarSection from "./SidebarSection";
import SidebarNavItem from "./SidebarNavItem";

export default function SidebarNavigation({
  isCollapsed,
  onItemClick,
  activeTripsCount = 3,
}) {
  return (
    <nav className="flex-1 overflow-y-auto sidebar-scroll py-4 px-3 flex flex-col gap-5">
      {/* 1. OVERVIEW */}
      <SidebarSection title="Overview" isCollapsed={isCollapsed}>
        <SidebarNavItem
          name="Dashboard"
          path="/dashboard"
          icon="dashboard"
          isCollapsed={isCollapsed}
          onClick={onItemClick}
        />
      </SidebarSection>

      {/* 2. OPERATIONS */}
      <SidebarSection title="Operations" isCollapsed={isCollapsed}>
        <SidebarNavItem
          name="Trips / Bookings"
          path="/trips"
          icon="route"
          badge={activeTripsCount}
          badgeType="secondary"
          isCollapsed={isCollapsed}
          onClick={onItemClick}
          isExact={true}
        />
        <SidebarNavItem
          name="Calendar"
          path="/trips?view=calendar"
          icon="calendar_month"
          isCollapsed={isCollapsed}
          onClick={onItemClick}
        />
      </SidebarSection>

      {/* 3. MASTERS */}
      <SidebarSection title="Masters" isCollapsed={isCollapsed}>
        <SidebarNavItem
          name="Customers"
          path="/customers"
          icon="group"
          isCollapsed={isCollapsed}
          onClick={onItemClick}
        />
        <SidebarNavItem
          name="Vehicles"
          path="/vehicles"
          icon="directions_car"
          isCollapsed={isCollapsed}
          onClick={onItemClick}
        />
        <SidebarNavItem
          name="Drivers"
          path="/drivers"
          icon="badge"
          isCollapsed={isCollapsed}
          onClick={onItemClick}
        />
      </SidebarSection>

      {/* 4. FINANCE */}
      <SidebarSection title="Finance" isCollapsed={isCollapsed}>
        <SidebarNavItem
          name="Invoices"
          path="/trips?tab=invoices"
          icon="receipt_long"
          isCollapsed={isCollapsed}
          onClick={onItemClick}
        />
        <SidebarNavItem
          name="Payments"
          path="/trips?tab=payments"
          icon="payments"
          isCollapsed={isCollapsed}
          onClick={onItemClick}
        />
        <SidebarNavItem
          name="Ledger"
          path="/trips?tab=ledger"
          icon="account_balance_wallet"
          isCollapsed={isCollapsed}
          onClick={onItemClick}
        />
      </SidebarSection>

      {/* 5. INSIGHTS */}
      <SidebarSection title="Insights" isCollapsed={isCollapsed}>
        <SidebarNavItem
          name="Reports"
          path="/dashboard?view=reports"
          icon="analytics"
          isCollapsed={isCollapsed}
          onClick={onItemClick}
        />
      </SidebarSection>

      {/* 6. SYSTEM */}
      <div className="mt-auto pt-2">
        <SidebarSection title="System" isCollapsed={isCollapsed}>
          <SidebarNavItem
            name="Settings"
            path="/settings"
            icon="settings"
            isCollapsed={isCollapsed}
            onClick={onItemClick}
          />
        </SidebarSection>
      </div>
    </nav>
  );
}
