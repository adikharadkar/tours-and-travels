import { useState, useRef, useEffect } from "react";
import {
  TRIP_STATUSES,
  PAYMENT_STATUSES,
  TRIP_TYPES,
} from "../../constants/trips";

const DATE_FILTER_OPTIONS = [
  { label: "All Dates", value: "all" },
  { label: "Today", value: "today" },
  { label: "Tomorrow", value: "tomorrow" },
  { label: "This Week", value: "this_week" },
  { label: "Next 7 Days", value: "next_7_days" },
  { label: "This Month", value: "this_month" },
];

const SORT_OPTIONS = [
  { label: "Start Date (Earliest First)", value: "date_asc" },
  { label: "Start Date (Latest First)", value: "date_desc" },
  { label: "Amount (High to Low)", value: "amount_desc" },
  { label: "Amount (Low to High)", value: "amount_asc" },
  { label: "Customer Name", value: "customer_asc" },
  { label: "Trip Code", value: "code_desc" },
];

export default function TripToolbar({
  activeTab,
  onTabChange,
  tabCounts = {
    all: 0,
    in_progress: 0,
    confirmed: 0,
    ready_to_invoice: 0,
    needs_attention: 0,
    completed: 0,
  },
  searchQuery,
  onSearchChange,
  tripTypeFilter,
  onTripTypeFilterChange,
  paymentFilter,
  onPaymentFilterChange,
  statusFilter,
  onStatusFilterChange,
  dateFilter,
  onDateFilterChange,
  vehicleFilter,
  onVehicleFilterChange,
  driverFilter,
  onDriverFilterChange,
  vehicles = [],
  drivers = [],
  sortBy,
  onSortByChange,
  onResetFilters,
  onExportCsv,
  viewMode = "list",
  onViewModeChange,
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
    { value: "all", label: "All Trips", count: tabCounts.all },
    {
      value: "in_progress",
      label: "In Progress",
      count: tabCounts.in_progress,
    },
    { value: "confirmed", label: "Confirmed", count: tabCounts.confirmed },
    {
      value: "ready_to_invoice",
      label: "Ready to Invoice",
      count: tabCounts.ready_to_invoice,
    },
    {
      value: "needs_attention",
      label: "Needs Attention",
      count: tabCounts.needs_attention,
      isAlert: tabCounts.needs_attention > 0,
    },
    { value: "completed", label: "Completed", count: tabCounts.completed },
  ];

  return (
    <div className="flex flex-col gap-3 mb-5">
      {/* Top row: Operational tabs + Quick Filters + View Toggle + Export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Segmented Tab Selector matching Invoices / FleetCore */}
        <div className="flex items-center p-1 rounded-md bg-slate-100 dark:bg-[#121314] border border-slate-200 dark:border-[#27272a] overflow-x-auto max-w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                aria-label={tab.label}
                onClick={() => onTabChange(tab.value)}
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
                      tab.isAlert
                        ? "bg-rose-600 text-white font-bold"
                        : isActive
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

        {/* Right side: Quick Filters + View Switcher + More Filters + Export */}
        <div
          className="flex items-center gap-2 relative ml-auto"
          ref={dropdownRef}
        >
          {/* Quick Trip Type Filter */}
          <div className="relative hidden sm:flex items-center">
            <select
              value={tripTypeFilter}
              onChange={(e) => onTripTypeFilterChange(e.target.value)}
              aria-label="Filter by trip type"
              className={[
                "h-9 pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg border appearance-none transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-cyan-500/30",
                tripTypeFilter !== "all"
                  ? "bg-cyan-50 text-cyan-900 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-500/50 ring-1 ring-cyan-500/20 shadow-xs"
                  : "bg-slate-50 dark:bg-[#191b26] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#262837] hover:bg-slate-100 dark:hover:bg-[#202330] hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs",
              ].join(" ")}
            >
              <option value="all" className="dark:bg-[#191b26]">
                All Trip Types
              </option>
              {TRIP_TYPES.map((t) => (
                <option
                  key={t.value}
                  value={t.value}
                  className="dark:bg-[#191b26]"
                >
                  {t.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 pointer-events-none select-none">
              expand_more
            </span>
          </div>

          {/* Quick Payment Status Filter */}
          <div className="relative hidden md:flex items-center">
            <select
              value={paymentFilter}
              onChange={(e) => onPaymentFilterChange(e.target.value)}
              aria-label="Filter by payment status"
              className={[
                "h-9 pl-3 pr-8 py-1.5 text-xs font-semibold rounded-lg border appearance-none transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-cyan-500/30",
                paymentFilter !== "all"
                  ? "bg-cyan-50 text-cyan-900 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-500/50 ring-1 ring-cyan-500/20 shadow-xs"
                  : "bg-slate-50 dark:bg-[#191b26] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#262837] hover:bg-slate-100 dark:hover:bg-[#202330] hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs",
              ].join(" ")}
            >
              <option value="all" className="dark:bg-[#191b26]">
                All Payments
              </option>
              {PAYMENT_STATUSES.map((p) => (
                <option
                  key={p.value}
                  value={p.value}
                  className="dark:bg-[#191b26]"
                >
                  {p.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 pointer-events-none select-none">
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

          {/* View Mode Toggle: List / Calendar */}
          {onViewModeChange && (
            <div className="flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#191b26] shadow-2xs">
              <button
                type="button"
                onClick={() => onViewModeChange("list")}
                aria-label="List"
                className={[
                  "h-8 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer",
                  viewMode === "list"
                    ? "bg-white dark:bg-[#222533] text-slate-900 dark:text-slate-100 shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
                ].join(" ")}
              >
                <span className="material-symbols-outlined text-[16px]">
                  table_rows
                </span>
                <span className="hidden sm:inline">List</span>
              </button>

              <button
                type="button"
                onClick={() => onViewModeChange("calendar")}
                aria-label="Calendar"
                className={[
                  "h-8 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer",
                  viewMode === "calendar"
                    ? "bg-white dark:bg-[#222533] text-slate-900 dark:text-slate-100 shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
                ].join(" ")}
              >
                <span className="material-symbols-outlined text-[16px]">
                  calendar_month
                </span>
                <span className="hidden sm:inline">Calendar</span>
              </button>
            </div>
          )}

          {/* Export CSV Button */}
          {onExportCsv && (
            <button
              type="button"
              onClick={onExportCsv}
              title="Export CSV"
              aria-label="Export CSV"
              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#191b26] hover:bg-slate-100 dark:hover:bg-[#202330] text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-slate-500 dark:text-slate-400">
                download
              </span>
              <span className="hidden md:inline">Export</span>
            </button>
          )}

          {/* More Filters Dropdown Menu */}
          {isMoreOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-xl bg-white dark:bg-[#161822] border border-slate-200/90 dark:border-[#262837] shadow-xl p-4 z-40 flex flex-col gap-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#262837] pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                  Filter Trips
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

              {/* Status Filter */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                  Trip Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => onStatusFilterChange(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#191b26] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                >
                  <option value="all">All Statuses</option>
                  {TRIP_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                  Date Range
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => onDateFilterChange(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#191b26] text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  {DATE_FILTER_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle Filter */}
              {vehicles.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                    Assigned Vehicle
                  </label>
                  <select
                    value={vehicleFilter}
                    onChange={(e) => onVehicleFilterChange(e.target.value)}
                    className="w-full h-9 pl-3 pr-8 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#191b26] text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="all">All Vehicles</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNumber || v.vehicleCode}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Driver Filter */}
              {drivers.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                    Assigned Driver
                  </label>
                  <select
                    value={driverFilter}
                    onChange={(e) => onDriverFilterChange(e.target.value)}
                    className="w-full h-9 pl-3 pr-8 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#191b26] text-slate-800 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="all">All Drivers</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sort By selector */}
              <div className="flex flex-col gap-1 pt-1">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Sort Order
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
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 pointer-events-none">
            search
          </span>
          <input
            type="text"
            aria-label="Search trips"
            placeholder="Search trip code, customer, route..."
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
            {tripTypeFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1f2021] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-[#27272a]">
                Type: {tripTypeFilter}
                <button
                  type="button"
                  onClick={() => onTripTypeFilterChange("all")}
                  className="hover:text-rose-500 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}
            {paymentFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1f2021] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-[#27272a]">
                Payment: {paymentFilter}
                <button
                  type="button"
                  onClick={() => onPaymentFilterChange("all")}
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
            {dateFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1f2021] text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-[#27272a]">
                Date: {dateFilter}
                <button
                  type="button"
                  onClick={() => onDateFilterChange("all")}
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
