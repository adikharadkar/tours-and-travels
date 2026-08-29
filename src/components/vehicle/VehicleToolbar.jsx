import { useState, useRef, useEffect } from "react";
import { VEHICLE_TYPES, OWNERSHIP_TYPES } from "../../constants/vehicles";

const SORT_OPTIONS = [
  { label: "Vehicle Code", value: "vehicleCode" },
  { label: "Vehicle Number", value: "vehicleNumber" },
  { label: "Make / Model", value: "make" },
  { label: "Seating Capacity", value: "seatingCapacity" },
  { label: "Ownership", value: "ownershipType" },
  { label: "Status", value: "isActive" },
  { label: "Document Expiry", value: "documentExpiry" },
];

export default function VehicleToolbar({
  operationalTab,
  onOperationalTabChange,
  tabCounts = { all: 0, available: 0, on_trip: 0, maintenance: 0 },
  searchQuery,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  ownershipFilter,
  onOwnershipFilterChange,
  statusFilter,
  onStatusFilterChange,
  docStatusFilter,
  onDocStatusFilterChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onResetFilters,
  activeFilterCount = 0,
}) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMoreOpen(false);
      }
    }
    if (isMoreOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMoreOpen]);

  const tabs = [
    { value: "all", label: "All Vehicles", count: tabCounts.all },
    { value: "available", label: "Available", count: tabCounts.available },
    { value: "on_trip", label: "On Trip", count: tabCounts.on_trip },
    {
      value: "maintenance",
      label: "Maintenance",
      count: tabCounts.maintenance,
    },
  ];

  return (
    <div className="flex flex-col gap-3 mb-5">
      {/* Top row: Operational segment buttons + Quick Filters + More Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Segmented Tab Selector matching Invoices / FleetCore */}
        <div className="flex items-center p-1 rounded-md bg-slate-100 dark:bg-[#121314] border border-slate-200 dark:border-[#27272a] overflow-x-auto max-w-full">
          {tabs.map((tab) => {
            const isActive = operationalTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                aria-label={tab.label}
                onClick={() => onOperationalTabChange(tab.value)}
                className={[
                  "px-3 py-1.5 text-xs font-medium rounded transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5",
                  isActive
                    ? "bg-white dark:bg-[#1f2021] text-slate-900 dark:text-zinc-100 shadow-xs font-semibold"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200",
                ].join(" ")}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={[
                      "text-[10px] font-mono px-1.5 py-0.2 rounded-full",
                      isActive
                        ? "bg-slate-100 dark:bg-[#2a2b2e] text-slate-800 dark:text-zinc-200 font-bold"
                        : "bg-slate-200/70 dark:bg-[#1e1f24] text-slate-500 dark:text-zinc-400",
                    ].join(" ")}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right side: Quick Filters + More Filters */}
        <div
          className="flex items-center gap-2 relative ml-auto"
          ref={dropdownRef}
        >
          {/* Quick Vehicle Type Filter */}
          <div className="relative flex items-center">
            <select
              value={typeFilter}
              onChange={(e) => onTypeFilterChange(e.target.value)}
              aria-label="Filter by vehicle type"
              className={[
                "h-9 pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg border appearance-none transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-cyan-500/30",
                typeFilter !== "all"
                  ? "bg-cyan-50 text-cyan-900 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-500/50 ring-1 ring-cyan-500/20 shadow-xs"
                  : "bg-slate-50 dark:bg-[#191b26] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#262837] hover:bg-slate-100 dark:hover:bg-[#202330] hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs",
              ].join(" ")}
            >
              <option value="all" className="dark:bg-[#191b26]">
                All Types
              </option>
              {VEHICLE_TYPES.map((t) => (
                <option
                  key={t.value}
                  value={t.value}
                  className="dark:bg-[#191b26]"
                >
                  {t.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 dark:text-slate-400 pointer-events-none select-none">
              expand_more
            </span>
          </div>

          {/* Quick Ownership Filter */}
          <div className="relative hidden sm:flex items-center">
            <select
              value={ownershipFilter}
              onChange={(e) => onOwnershipFilterChange(e.target.value)}
              aria-label="Filter by ownership"
              className={[
                "h-9 pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg border appearance-none transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-cyan-500/30",
                ownershipFilter !== "all"
                  ? "bg-cyan-50 text-cyan-900 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-500/50 ring-1 ring-cyan-500/20 shadow-xs"
                  : "bg-slate-50 dark:bg-[#191b26] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#262837] hover:bg-slate-100 dark:hover:bg-[#202330] hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs",
              ].join(" ")}
            >
              <option value="all" className="dark:bg-[#191b26]">
                All Ownerships
              </option>
              {OWNERSHIP_TYPES.map((o) => (
                <option
                  key={o.value}
                  value={o.value}
                  className="dark:bg-[#191b26]"
                >
                  {o.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 dark:text-slate-400 pointer-events-none select-none">
              expand_more
            </span>
          </div>

          {/* More Filters button */}
          <button
            type="button"
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            aria-expanded={isMoreOpen}
            aria-label="Filters"
            className={[
              "h-9 flex items-center gap-1.5 px-3.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer select-none",
              isMoreOpen || activeFilterCount > 0
                ? "bg-cyan-50 text-cyan-800 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-500/50 shadow-xs ring-1 ring-cyan-500/20"
                : "bg-slate-50 dark:bg-[#191b26] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#262837] hover:bg-slate-100 dark:hover:bg-[#202330] hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs",
            ].join(" ")}
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-cyan-600 text-white text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* More Filters Dropdown Menu */}
          {isMoreOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-xl bg-white dark:bg-[#161822] border border-slate-200/90 dark:border-[#262837] shadow-xl p-4 z-40 flex flex-col gap-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#262837] pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                  Filter Vehicles
                </span>
                <button
                  type="button"
                  aria-label="Reset all filters"
                  onClick={() => {
                    onResetFilters();
                    setIsMoreOpen(false);
                  }}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    refresh
                  </span>
                  <span>Reset all filters</span>
                </button>
              </div>

              {/* Master Status Filter */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => onStatusFilterChange(e.target.value)}
                    className="w-full h-9 pl-3 pr-8 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#191b26] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  >
                    <option value="all" className="dark:bg-[#191b26]">
                      All Statuses
                    </option>
                    <option value="active" className="dark:bg-[#191b26]">
                      Active
                    </option>
                    <option value="inactive" className="dark:bg-[#191b26]">
                      Inactive
                    </option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 dark:text-slate-400 pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Document Compliance Filter */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                  Document Compliance
                </label>
                <div className="relative">
                  <select
                    value={docStatusFilter}
                    onChange={(e) => onDocStatusFilterChange(e.target.value)}
                    className="w-full h-9 pl-3 pr-8 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#191b26] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  >
                    <option value="all" className="dark:bg-[#191b26]">
                      All Compliance
                    </option>
                    <option value="valid" className="dark:bg-[#191b26]">
                      All Valid
                    </option>
                    <option value="expiring_soon" className="dark:bg-[#191b26]">
                      Expiring Soon (within 30 days)
                    </option>
                    <option value="expired" className="dark:bg-[#191b26]">
                      Expired (Immediate Attention)
                    </option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 dark:text-slate-400 pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Sort selector */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => onSortByChange(e.target.value)}
                    className="h-8 px-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#191b26] text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Order
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) => onSortOrderChange(e.target.value)}
                    className="h-8 px-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#191b26] text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsMoreOpen(false)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-all cursor-pointer shadow-xs"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Second row: Search input + active filter tags */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 dark:text-slate-400 pointer-events-none">
            search
          </span>
          <input
            type="text"
            aria-label="Search vehicles"
            placeholder="Search vehicles by number, make, model, code..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-lg bg-slate-50 dark:bg-[#191b26] border border-slate-200 dark:border-[#262837] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                close
              </span>
            </button>
          )}
        </div>

        {/* Active filters pill list */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 dark:text-zinc-500 text-[11px]">
              Filtered by:
            </span>
            {typeFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1f2021] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-[#27272a]">
                Type: {typeFilter}
                <button
                  type="button"
                  onClick={() => onTypeFilterChange("all")}
                  className="hover:text-rose-500 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}
            {ownershipFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1f2021] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-[#27272a]">
                Ownership: {ownershipFilter}
                <button
                  type="button"
                  onClick={() => onOwnershipFilterChange("all")}
                  className="hover:text-rose-500 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}
            {statusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1f2021] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-[#27272a]">
                Status: {statusFilter}
                <button
                  type="button"
                  onClick={() => onStatusFilterChange("all")}
                  className="hover:text-rose-500 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}
            {docStatusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1f2021] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-[#27272a]">
                Compliance: {docStatusFilter}
                <button
                  type="button"
                  onClick={() => onDocStatusFilterChange("all")}
                  className="hover:text-rose-500 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={onResetFilters}
              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer ml-1"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
