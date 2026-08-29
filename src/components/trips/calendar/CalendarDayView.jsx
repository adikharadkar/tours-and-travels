import { useMemo } from "react";
import { isTripOnDay, formatTimeRange, isTripDelayed } from "./calendarUtils";
import { TripStatusBadge } from "../TripStatusBadge";

export default function CalendarDayView({
  currentDate,
  trips = [],
  customerMap = new Map(),
  vehicleMap = new Map(),
  driverMap = new Map(),
  conflictTripIdsSet = new Set(),
  conflictsByTripIdMap = new Map(),
  onSelectTrip,
}) {
  const dayTrips = useMemo(() => {
    return trips
      .filter((t) => isTripOnDay(t, currentDate))
      .sort((a, b) => {
        const timeA = new Date(a.startDateTime).getTime() || 0;
        const timeB = new Date(b.startDateTime).getTime() || 0;
        return timeA - timeB;
      });
  }, [trips, currentDate]);

  // Categorize for quick operational triage
  const categorizedTrips = useMemo(() => {
    const inProgress = [];
    const upcoming = [];
    const completed = [];
    const delayed = [];
    const others = [];

    dayTrips.forEach((trip) => {
      if (trip.status === "in_progress") {
        if (isTripDelayed(trip)) {
          delayed.push(trip);
        } else {
          inProgress.push(trip);
        }
      } else if (trip.status === "completed") {
        completed.push(trip);
      } else if (isTripDelayed(trip)) {
        delayed.push(trip);
      } else if (trip.status === "confirmed" || trip.status === "draft") {
        upcoming.push(trip);
      } else {
        others.push(trip);
      }
    });

    return { inProgress, upcoming, completed, delayed, others };
  }, [dayTrips]);

  if (dayTrips.length === 0) {
    return (
      <div className="py-16 text-center rounded-xl border border-dashed border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
          <span className="material-symbols-outlined text-2xl">event_busy</span>
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          No trips scheduled for this date.
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          There are no active dispatches or bookings recorded on this day.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Day Summary Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border border-cyan-200 dark:border-cyan-800/40 bg-cyan-50/50 dark:bg-cyan-950/20">
          <div className="text-[11px] font-semibold text-cyan-800 dark:text-cyan-300">
            Active / In Progress
          </div>
          <div className="text-xl font-bold font-mono text-cyan-900 dark:text-cyan-100 mt-0.5">
            {categorizedTrips.inProgress.length}
          </div>
        </div>

        <div className="p-3 rounded-xl border border-violet-200 dark:border-violet-800/40 bg-violet-50/50 dark:bg-violet-950/20">
          <div className="text-[11px] font-semibold text-violet-800 dark:text-violet-300">
            Upcoming Today
          </div>
          <div className="text-xl font-bold font-mono text-violet-900 dark:text-violet-100 mt-0.5">
            {categorizedTrips.upcoming.length}
          </div>
        </div>

        <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
            Completed
          </div>
          <div className="text-xl font-bold font-mono text-emerald-900 dark:text-emerald-100 mt-0.5">
            {categorizedTrips.completed.length}
          </div>
        </div>

        <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-800/40 bg-rose-50/50 dark:bg-rose-950/20">
          <div className="text-[11px] font-semibold text-rose-800 dark:text-rose-300">
            Delayed / Attention
          </div>
          <div className="text-xl font-bold font-mono text-rose-900 dark:text-rose-100 mt-0.5">
            {categorizedTrips.delayed.length}
          </div>
        </div>
      </div>

      {/* Hourly / Chronological Schedule List */}
      <div className="rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-slate-200 dark:border-[#262837] bg-slate-50/70 dark:bg-[#121318] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-slate-500">
              schedule
            </span>
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              Day Dispatch Timeline ({dayTrips.length}{" "}
              {dayTrips.length === 1 ? "Trip" : "Trips"})
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Sorted chronologically
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-[#262837]">
          {dayTrips.map((trip) => {
            const customer = customerMap.get(trip.customerId);
            const vehicle = trip.vehicleId
              ? vehicleMap.get(trip.vehicleId)
              : null;
            const driver = trip.driverId ? driverMap.get(trip.driverId) : null;
            const hasConflict = conflictTripIdsSet.has(trip.id);
            const tripConflicts = conflictsByTripIdMap.get(trip.id) || [];
            const timeRange = formatTimeRange(
              trip.startDateTime,
              trip.endDateTime,
            );
            const isDelayed = isTripDelayed(trip);

            return (
              <div
                key={trip.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectTrip?.(trip)}
                onKeyDown={(e) => e.key === "Enter" && onSelectTrip?.(trip)}
                aria-label={`Trip ${trip.tripCode}: ${customer?.name || "Customer"}`}
                className={[
                  "p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-slate-50/80 dark:hover:bg-[#1b1e2a] cursor-pointer select-none",
                  hasConflict ? "bg-rose-50/20 dark:bg-rose-950/10" : "",
                ].join(" ")}
              >
                {/* Left: Time + Main Info */}
                <div className="flex items-start gap-4">
                  {/* Time Badge */}
                  <div className="w-24 shrink-0 font-mono text-xs font-bold text-slate-700 dark:text-slate-300 py-1 px-2 rounded-lg bg-slate-100 dark:bg-[#121318] border border-slate-200 dark:border-[#262837] text-center">
                    {timeRange}
                  </div>

                  {/* Trip Details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-slate-100 hover:text-violet-600 dark:hover:text-violet-400">
                        {trip.tripCode}
                      </span>
                      <TripStatusBadge status={trip.status} />
                      {isDelayed && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          Delayed
                        </span>
                      )}
                      {hasConflict && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white flex items-center gap-1">
                          <span className="material-symbols-outlined text-[10px]">
                            warning
                          </span>
                          Conflict ({tripConflicts[0]?.overlapFormatted})
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {customer
                        ? customer.name
                        : trip.customerName || "Customer"}
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-slate-400">
                        route
                      </span>
                      <span>
                        {trip.pickupLocation || "Origin"} →{" "}
                        {trip.dropLocation || "Destination"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Fleet Assignment & Total */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-[#262837]">
                  <div className="text-right space-y-0.5">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 justify-end">
                      <span className="material-symbols-outlined text-[14px] text-slate-400">
                        directions_car
                      </span>
                      <span>
                        {vehicle?.vehicleNumber || "Unassigned Vehicle"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 justify-end">
                      <span className="material-symbols-outlined text-[14px] text-slate-400">
                        person
                      </span>
                      <span>{driver?.name || "Unassigned Driver"}</span>
                    </div>
                  </div>

                  {trip.totalAmount > 0 && (
                    <div className="text-xs font-bold font-mono text-slate-900 dark:text-slate-100">
                      ₹{Number(trip.totalAmount).toLocaleString("en-IN")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
