import { useState } from "react";

export default function CalendarNeedsAttention({
  conflicts = [],
  unassignedTrips = [],
  customerMap = new Map(),
  vehicleMap: _vehicleMap = new Map(),
  driverMap: _driverMap = new Map(),
  onSelectTrip,
  onEditTrip,
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (conflicts.length === 0 && unassignedTrips.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 overflow-hidden transition-all shadow-xs">
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-rose-100/50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/30">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-rose-600 dark:text-rose-400">
            warning
          </span>
          <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
            Needs Operational Attention
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-600 text-white">
            {conflicts.length + unassignedTrips.length}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
            {conflicts.length > 0 && (
              <span>
                <strong>{conflicts.length}</strong> schedule conflicts
              </span>
            )}
            {conflicts.length > 0 && unassignedTrips.length > 0 && (
              <span>•</span>
            )}
            {unassignedTrips.length > 0 && (
              <span>
                <strong>{unassignedTrips.length}</strong> unassigned trips
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={
              isExpanded
                ? "Collapse attention section"
                : "Expand attention section"
            }
            className="text-xs font-semibold text-rose-700 dark:text-rose-300 hover:underline cursor-pointer"
          >
            {isExpanded ? "Hide" : "View"}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 space-y-2.5 max-h-56 overflow-y-auto">
          {/* Conflicts List */}
          {conflicts.map((conflict) => (
            <div
              key={conflict.id}
              className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-[#161822] border border-rose-200 dark:border-rose-800/40 text-xs shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  {conflict.type === "vehicle"
                    ? "Vehicle Conflict"
                    : "Driver Conflict"}
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {conflict.resourceLabel}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  • Overlap:{" "}
                  <strong className="text-rose-600 dark:text-rose-400">
                    {conflict.overlapFormatted}
                  </strong>
                </span>
                <span className="hidden md:inline text-slate-400">
                  ({conflict.tripA.tripCode} & {conflict.tripB.tripCode})
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                <button
                  type="button"
                  onClick={() => onSelectTrip?.(conflict.tripA)}
                  className="px-2 py-1 rounded text-[11px] font-semibold bg-slate-100 dark:bg-[#1f212d] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#282b3a] transition-colors cursor-pointer"
                >
                  View {conflict.tripA.tripCode}
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTrip?.(conflict.tripB)}
                  className="px-2 py-1 rounded text-[11px] font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer"
                >
                  View {conflict.tripB.tripCode}
                </button>
              </div>
            </div>
          ))}

          {/* Unassigned Trips List */}
          {unassignedTrips.map((trip) => {
            const cust = customerMap.get(trip.customerId);
            const isMissingVeh = !trip.vehicleId;
            const isMissingDrv = !trip.driverId;

            return (
              <div
                key={trip.id}
                className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-[#161822] border border-amber-200 dark:border-amber-800/40 text-xs shadow-2xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Unassigned Fleet
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {trip.tripCode}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300 truncate">
                    {cust ? cust.name : trip.customerName || "Customer"}
                  </span>
                  <span className="text-slate-400 hidden sm:inline">
                    ({trip.pickupLocation || "Pickup"} →{" "}
                    {trip.dropLocation || "Drop"})
                  </span>
                  <span className="text-amber-700 dark:text-amber-300 text-[11px]">
                    Missing:{" "}
                    {isMissingVeh && isMissingDrv
                      ? "Vehicle & Driver"
                      : isMissingVeh
                        ? "Vehicle"
                        : "Driver"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                  <button
                    type="button"
                    onClick={() => onSelectTrip?.(trip)}
                    className="px-2 py-1 rounded text-[11px] font-semibold bg-slate-100 dark:bg-[#1f212d] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#282b3a] transition-colors cursor-pointer"
                  >
                    View Trip
                  </button>
                  {onEditTrip && (
                    <button
                      type="button"
                      onClick={() => onEditTrip?.(trip)}
                      className="px-2 py-1 rounded text-[11px] font-semibold bg-violet-600 text-white hover:bg-violet-700 transition-colors cursor-pointer"
                    >
                      Assign Fleet
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
