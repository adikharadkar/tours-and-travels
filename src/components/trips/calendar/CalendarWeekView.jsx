import { useMemo } from "react";
import {
  getWeekDays,
  isSameDay,
  isTripOnDay,
  formatTimeRange,
} from "./calendarUtils";
import { TripStatusBadge } from "../TripStatusBadge";

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarWeekView({
  currentDate,
  trips = [],
  customerMap = new Map(),
  vehicleMap = new Map(),
  driverMap = new Map(),
  conflictTripIdsSet = new Set(),
  conflictsByTripIdMap = new Map(),
  onSelectTrip,
  onSelectDay,
}) {
  const weekDays = useMemo(() => getWeekDays(currentDate, 0), [currentDate]);

  // Group trips by day for this week
  const tripsByDay = useMemo(() => {
    const today = new Date();
    return weekDays.map((day) => {
      const dayTrips = trips.filter((t) => isTripOnDay(t, day));
      return {
        date: day,
        isToday: isSameDay(day, today),
        trips: dayTrips,
      };
    });
  }, [weekDays, trips]);

  return (
    <div className="space-y-4">
      {/* Desktop Week Grid (>= md) */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] shadow-xs">
        {/* Day Header Row */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-[#262837] bg-slate-50/80 dark:bg-[#121318]">
          {tripsByDay.map(({ date, isToday, trips: dayTrips }) => {
            const dayName = DAYS_SHORT[date.getDay()];
            const dayNum = date.getDate();
            const monthShort = date.toLocaleString("default", {
              month: "short",
            });

            return (
              <div
                key={date.toISOString()}
                onClick={() => onSelectDay?.(date)}
                className={[
                  "p-3 text-center border-r last:border-r-0 border-slate-200 dark:border-[#262837] cursor-pointer transition-colors hover:bg-slate-100/60 dark:hover:bg-[#1b1e2a]",
                  isToday ? "bg-violet-50/60 dark:bg-violet-950/20" : "",
                ].join(" ")}
              >
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {dayName}
                </div>
                <div className="mt-1 flex items-center justify-center gap-1">
                  <span
                    className={[
                      "w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold font-mono transition-transform",
                      isToday
                        ? "bg-violet-600 text-white shadow-xs scale-105"
                        : "text-slate-800 dark:text-slate-200",
                    ].join(" ")}
                  >
                    {dayNum}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {monthShort}
                  </span>
                </div>
                <div className="mt-1">
                  {dayTrips.length > 0 ? (
                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-[#262837] text-slate-700 dark:text-slate-300">
                      {dayTrips.length}{" "}
                      {dayTrips.length === 1 ? "trip" : "trips"}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">No trips</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Day Events Grid Columns */}
        <div className="grid grid-cols-7 min-h-[480px] divide-x divide-slate-200 dark:divide-[#262837]">
          {tripsByDay.map(({ date, isToday, trips: dayTrips }) => (
            <div
              key={`events-${date.toISOString()}`}
              className={[
                "p-2 space-y-2 flex flex-col transition-colors",
                isToday ? "bg-violet-50/20 dark:bg-violet-950/10" : "",
              ].join(" ")}
            >
              {dayTrips.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-center p-3 text-[11px] text-slate-400">
                  <span>Available</span>
                </div>
              ) : (
                dayTrips.map((trip) => {
                  const customer = customerMap.get(trip.customerId);
                  const vehicle = trip.vehicleId
                    ? vehicleMap.get(trip.vehicleId)
                    : null;
                  const driver = trip.driverId
                    ? driverMap.get(trip.driverId)
                    : null;
                  const hasConflict = conflictTripIdsSet.has(trip.id);
                  const tripConflicts = conflictsByTripIdMap.get(trip.id) || [];
                  const timeRange = formatTimeRange(
                    trip.startDateTime,
                    trip.endDateTime,
                  );

                  return (
                    <div
                      key={`${date.toISOString()}-${trip.id}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectTrip?.(trip)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && onSelectTrip?.(trip)
                      }
                      aria-label={`Trip ${trip.tripCode}: ${customer?.name || "Customer"}, ${trip.pickupLocation} to ${trip.dropLocation}`}
                      className={[
                        "group p-2.5 rounded-lg border text-left transition-all cursor-pointer select-none bg-white dark:bg-[#1b1e2a] hover:shadow-md",
                        hasConflict
                          ? "border-rose-400 dark:border-rose-700 bg-rose-50/40 dark:bg-rose-950/20 ring-1 ring-rose-500/30"
                          : "border-slate-200 dark:border-[#2b2e3e] hover:border-violet-300 dark:hover:border-violet-700",
                      ].join(" ")}
                    >
                      {/* Top row: Code + Status Badge */}
                      <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 font-mono tracking-tight group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                          {trip.tripCode}
                        </span>
                        <TripStatusBadge status={trip.status} />
                      </div>

                      {/* Customer */}
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {customer
                          ? customer.name
                          : trip.customerName || "Customer"}
                      </div>

                      {/* Route */}
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                        <span>{trip.pickupLocation || "Origin"}</span>
                        <span className="text-[10px] text-slate-400">→</span>
                        <span>{trip.dropLocation || "Destination"}</span>
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-1 text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-[#262837]">
                        <span className="material-symbols-outlined text-[12px]">
                          schedule
                        </span>
                        <span>{timeRange}</span>
                      </div>

                      {/* Vehicle & Driver or Unassigned alert */}
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        {vehicle ? (
                          <span
                            className="truncate max-w-[80px]"
                            title={vehicle.vehicleNumber}
                          >
                            {vehicle.vehicleNumber}
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            No Veh
                          </span>
                        )}
                        {driver ? (
                          <span
                            className="truncate max-w-[70px]"
                            title={driver.name}
                          >
                            {driver.name.split(" ")[0]}
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            No Drv
                          </span>
                        )}
                      </div>

                      {/* Conflict Alert Tag */}
                      {hasConflict && (
                        <div className="mt-1.5 pt-1 border-t border-rose-200 dark:border-rose-900/40 flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                          <span className="material-symbols-outlined text-[12px]">
                            warning
                          </span>
                          <span>
                            {tripConflicts[0]?.overlapFormatted || "Conflict"}{" "}
                            Overlap
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Week View (< md) */}
      <div className="md:hidden space-y-3">
        {tripsByDay.map(({ date, isToday, trips: dayTrips }) => {
          const dayName = DAYS_SHORT[date.getDay()];
          const dayNum = date.getDate();
          const monthShort = date.toLocaleString("default", { month: "short" });

          return (
            <div
              key={`mobile-${date.toISOString()}`}
              className="rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] overflow-hidden shadow-2xs"
            >
              {/* Day Subheader */}
              <div
                className={[
                  "flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-[#262837]",
                  isToday
                    ? "bg-violet-50 dark:bg-violet-950/40"
                    : "bg-slate-50 dark:bg-[#121318]",
                ].join(" ")}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={[
                      "w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold font-mono",
                      isToday
                        ? "bg-violet-600 text-white"
                        : "text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-[#262837]",
                    ].join(" ")}
                  >
                    {dayNum}
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {dayName}, {monthShort} {dayNum}
                  </span>
                  {isToday && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-violet-600 text-white">
                      Today
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {dayTrips.length} {dayTrips.length === 1 ? "trip" : "trips"}
                </span>
              </div>

              {/* Day Trips List */}
              <div className="p-2 space-y-2">
                {dayTrips.length === 0 ? (
                  <div className="py-3 text-center text-xs text-slate-400">
                    No trips scheduled
                  </div>
                ) : (
                  dayTrips.map((trip) => {
                    const customer = customerMap.get(trip.customerId);
                    const vehicle = trip.vehicleId
                      ? vehicleMap.get(trip.vehicleId)
                      : null;
                    const driver = trip.driverId
                      ? driverMap.get(trip.driverId)
                      : null;
                    const hasConflict = conflictTripIdsSet.has(trip.id);
                    const timeRange = formatTimeRange(
                      trip.startDateTime,
                      trip.endDateTime,
                    );

                    return (
                      <div
                        key={`m-trip-${trip.id}`}
                        onClick={() => onSelectTrip?.(trip)}
                        className={[
                          "p-3 rounded-lg border text-left cursor-pointer transition-all bg-white dark:bg-[#1b1e2a]",
                          hasConflict
                            ? "border-rose-400 dark:border-rose-700 bg-rose-50/30 dark:bg-rose-950/20"
                            : "border-slate-200 dark:border-[#2b2e3e]",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
                            {trip.tripCode}
                          </span>
                          <TripStatusBadge status={trip.status} />
                        </div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {customer
                            ? customer.name
                            : trip.customerName || "Customer"}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          {trip.pickupLocation} → {trip.dropLocation}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-xs text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-100 dark:border-[#262837]">
                          <span className="font-mono">{timeRange}</span>
                          <span>
                            {vehicle?.vehicleNumber || "No Vehicle"} •{" "}
                            {driver?.name || "No Driver"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
