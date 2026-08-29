import { useState, useRef, useEffect } from "react";
import { TRIP_STATUS_LABELS, TRIP_TYPE_LABELS } from "../../../constants/trips";

export default function CalendarToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  assignmentFilter,
  onAssignmentFilterChange,
  tripTypeFilter,
  onTripTypeFilterChange,
  vehicleFilter,
  onVehicleFilterChange,
  driverFilter,
  onDriverFilterChange,
  conflictOnly,
  onConflictOnlyChange,
  vehicles = [],
  drivers = [],
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

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search trips (code, customer, route, fleet)..."
            aria-label="Search trips"
            className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                close
              </span>
            </button>
          )}
        </div>

        {/* Quick Filters + More Filters */}
        <div
          className="flex items-center gap-2 relative ml-auto"
          ref={dropdownRef}
        >
          {/* Quick Status Filter */}
          <div className="relative flex items-center">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              aria-label="Filter by status"
              className={[
                "h-8 sm:h-9 pl-2.5 pr-7 py-1 text-xs font-semibold rounded-lg border appearance-none transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-violet-500/30",
                statusFilter !== "all"
                  ? "bg-violet-50 dark:bg-violet-950/50 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 font-bold"
                  : "bg-white dark:bg-[#161822] border-slate-200 dark:border-[#262837] text-slate-700 dark:text-slate-300 hover:border-slate-300",
              ].join(" ")}
            >
              <option value="all">All Statuses</option>
              {Object.entries(TRIP_STATUS_LABELS).map(([val, lbl]) => (
                <option key={val} value={val}>
                  {lbl}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2 pointer-events-none text-slate-400 text-[16px]">
              expand_more
            </span>
          </div>

          {/* Quick Assignment Filter */}
          <div className="relative hidden md:flex items-center">
            <select
              value={assignmentFilter}
              onChange={(e) => onAssignmentFilterChange(e.target.value)}
              aria-label="Filter by assignment status"
              className={[
                "h-8 sm:h-9 pl-2.5 pr-7 py-1 text-xs font-semibold rounded-lg border appearance-none transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-violet-500/30",
                assignmentFilter !== "all"
                  ? "bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 font-bold"
                  : "bg-white dark:bg-[#161822] border-slate-200 dark:border-[#262837] text-slate-700 dark:text-slate-300 hover:border-slate-300",
              ].join(" ")}
            >
              <option value="all">All Assignments</option>
              <option value="unassigned">Any Unassigned</option>
              <option value="unassigned_vehicle">Unassigned Vehicle</option>
              <option value="unassigned_driver">Unassigned Driver</option>
              <option value="assigned">Fully Assigned</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 pointer-events-none text-slate-400 text-[16px]">
              expand_more
            </span>
          </div>

          {/* More Filters Toggle Button */}
          <button
            type="button"
            aria-label="More Filters"
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={[
              "h-8 sm:h-9 px-3 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer select-none",
              isMoreOpen || activeFilterCount > 0
                ? "bg-violet-50 dark:bg-violet-950/40 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 font-bold"
                : "bg-white dark:bg-[#161822] border-slate-200 dark:border-[#262837] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600",
            ].join(" ")}
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span className="hidden sm:inline">More Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-violet-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Reset Filters */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              aria-label="Reset all filters"
              className="h-8 sm:h-9 px-2 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}

          {/* More Filters Popover Drawer */}
          {isMoreOpen && (
            <div className="absolute right-0 top-11 z-30 w-72 sm:w-80 p-4 rounded-xl bg-white dark:bg-[#191b26] border border-slate-200 dark:border-[#262837] shadow-xl space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#262837]">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Advanced Filters
                </span>
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                >
                  Clear all
                </button>
              </div>

              {/* Conflict Only Toggle */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30">
                <label
                  htmlFor="conflict-only-toggle"
                  className="text-xs font-semibold text-rose-800 dark:text-rose-300 cursor-pointer"
                >
                  Show Conflicts Only
                </label>
                <input
                  id="conflict-only-toggle"
                  type="checkbox"
                  checked={conflictOnly}
                  onChange={(e) => onConflictOnlyChange(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
              </div>

              {/* Trip Type Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Trip Type
                </label>
                <select
                  value={tripTypeFilter}
                  onChange={(e) => onTripTypeFilterChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#121318] text-slate-800 dark:text-slate-200"
                >
                  <option value="all">All Trip Types</option>
                  {Object.entries(TRIP_TYPE_LABELS).map(([val, lbl]) => (
                    <option key={val} value={val}>
                      {lbl}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Vehicle
                </label>
                <select
                  value={vehicleFilter}
                  onChange={(e) => onVehicleFilterChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#121318] text-slate-800 dark:text-slate-200"
                >
                  <option value="all">All Vehicles</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vehicleNumber} {v.makeModel ? `(${v.makeModel})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Driver Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Driver
                </label>
                <select
                  value={driverFilter}
                  onChange={(e) => onDriverFilterChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#121318] text-slate-800 dark:text-slate-200"
                >
                  <option value="all">All Drivers</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
