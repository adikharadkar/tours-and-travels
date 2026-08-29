import { useMemo } from "react";
import {
  getWeekDays,
  isTripOnDay,
  formatTimeRange,
  isSameDay,
} from "./calendarUtils";
import { TripStatusBadge } from "../TripStatusBadge";

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarResourceView({
  resourceType = "vehicles", // 'vehicles' | 'drivers'
  currentDate,
  viewMode = "week", // 'week' | 'day'
  trips = [],
  vehicles = [],
  drivers = [],
  customerMap = new Map(),
  vehicleMap: _vehicleMap = new Map(),
  driverMap: _driverMap = new Map(),
  conflictTripIdsSet = new Set(),
  conflictsByTripIdMap = new Map(),
  onSelectTrip,
}) {
  const days = useMemo(() => {
    if (viewMode === "day") {
      return [currentDate];
    }
    return getWeekDays(currentDate, 0);
  }, [currentDate, viewMode]);

  const today = new Date();

  // Resources list
  const resourceList = useMemo(() => {
    if (resourceType === "vehicles") {
      return vehicles.map((v) => ({
        id: v.id,
        primaryText: v.vehicleNumber,
        secondaryText: v.makeModel || "Vehicle",
        status: v.status || "available",
        capacity: v.capacity ? `${v.capacity} Ton` : null,
      }));
    } else {
      return drivers.map((d) => ({
        id: d.id,
        primaryText: d.name,
        secondaryText: d.phone || d.licenseNumber || "Driver",
        status: d.status || "active",
        experience: d.experience ? `${d.experience} yrs` : null,
      }));
    }
  }, [resourceType, vehicles, drivers]);

  // Index trips by resourceId and day
  const tripsByResource = useMemo(() => {
    const map = new Map();

    resourceList.forEach((res) => {
      const resTrips = trips.filter((t) => {
        const matchId = resourceType === "vehicles" ? t.vehicleId : t.driverId;
        return matchId === res.id;
      });

      const dayAllocations = days.map((day) => {
        const matchingForDay = resTrips.filter((t) => isTripOnDay(t, day));
        return {
          day,
          trips: matchingForDay,
        };
      });

      map.set(res.id, {
        totalTrips: resTrips.length,
        dayAllocations,
      });
    });

    return map;
  }, [resourceList, trips, days, resourceType]);

  if (resourceList.length === 0) {
    return (
      <div className="py-16 text-center rounded-xl border border-dashed border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
          <span className="material-symbols-outlined text-2xl">
            {resourceType === "vehicles" ? "directions_car" : "badge"}
          </span>
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          No {resourceType} registered.
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Add {resourceType} to the fleet to plan resource schedules.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resource Table Grid */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] shadow-xs">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#121318]">
              {/* Resource Name Header */}
              <th className="p-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 w-48 sm:w-56 sticky left-0 bg-slate-50 dark:bg-[#121318] z-10 border-r border-slate-200 dark:border-[#262837]">
                {resourceType === "vehicles" ? "Vehicle" : "Driver"}
              </th>

              {/* Days Columns */}
              {days.map((day) => {
                const dayName = DAYS_SHORT[day.getDay()];
                const isToday = isSameDay(day, today);
                return (
                  <th
                    key={day.toISOString()}
                    className={[
                      "p-3 text-center text-xs font-bold border-r last:border-r-0 border-slate-200 dark:border-[#262837]",
                      isToday
                        ? "bg-violet-50/80 dark:bg-violet-950/40 text-violet-900 dark:text-violet-200"
                        : "text-slate-600 dark:text-slate-400",
                    ].join(" ")}
                  >
                    <div className="uppercase text-[10px] tracking-wider text-slate-400">
                      {dayName}
                    </div>
                    <div className="font-mono text-xs mt-0.5">
                      {day.getDate()}{" "}
                      <span className="text-[10px] text-slate-400 font-normal">
                        {day.toLocaleString("default", { month: "short" })}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-[#262837]">
            {resourceList.map((res) => {
              const allocation = tripsByResource.get(res.id);

              return (
                <tr
                  key={res.id}
                  className="hover:bg-slate-50/60 dark:hover:bg-[#191b26] transition-colors"
                >
                  {/* Resource Info Column (Sticky) */}
                  <td className="p-3 sticky left-0 bg-white dark:bg-[#161822] z-10 border-r border-slate-200 dark:border-[#262837] shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-[#1f212d] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#262837] shrink-0">
                        <span className="material-symbols-outlined text-[18px]">
                          {resourceType === "vehicles"
                            ? "directions_car"
                            : "badge"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate font-mono">
                          {res.primaryText}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {res.secondaryText}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Days Timeline Slots */}
                  {allocation?.dayAllocations.map(
                    ({ day, trips: slotTrips }) => {
                      const hasTrips = slotTrips.length > 0;
                      const hasConflict =
                        slotTrips.length > 1 ||
                        slotTrips.some((t) => conflictTripIdsSet.has(t.id));

                      return (
                        <td
                          key={day.toISOString()}
                          className={[
                            "p-2 align-top border-r last:border-r-0 border-slate-200 dark:border-[#262837] min-w-[130px]",
                            isSameDay(day, today)
                              ? "bg-violet-50/20 dark:bg-violet-950/10"
                              : "",
                          ].join(" ")}
                        >
                          {!hasTrips ? (
                            <div className="h-full min-h-[50px] flex items-center justify-center text-[10px] text-slate-400 font-medium rounded-md border border-dashed border-slate-100 dark:border-[#262837]/60">
                              Available
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {slotTrips.map((trip) => {
                                const isTripConflict = conflictTripIdsSet.has(
                                  trip.id,
                                );
                                const tripConflicts =
                                  conflictsByTripIdMap.get(trip.id) || [];
                                const timeRange = formatTimeRange(
                                  trip.startDateTime,
                                  trip.endDateTime,
                                );
                                const customer = customerMap.get(
                                  trip.customerId,
                                );

                                return (
                                  <div
                                    key={trip.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => onSelectTrip?.(trip)}
                                    onKeyDown={(e) =>
                                      e.key === "Enter" && onSelectTrip?.(trip)
                                    }
                                    className={[
                                      "p-2 rounded-lg border text-left cursor-pointer transition-all hover:shadow-xs",
                                      isTripConflict || hasConflict
                                        ? "border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/40"
                                        : "border-slate-200 dark:border-[#2a2d3c] bg-white dark:bg-[#1d202d] hover:border-violet-300",
                                    ].join(" ")}
                                  >
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-slate-100">
                                        {trip.tripCode}
                                      </span>
                                      <TripStatusBadge status={trip.status} />
                                    </div>
                                    <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                                      {customer
                                        ? customer.name
                                        : trip.customerName || "Customer"}
                                    </div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                      {trip.pickupLocation} →{" "}
                                      {trip.dropLocation}
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-400 mt-1">
                                      {timeRange}
                                    </div>

                                    {isTripConflict && (
                                      <div className="mt-1 pt-1 border-t border-rose-200 dark:border-rose-900/50 text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px]">
                                          warning
                                        </span>
                                        <span>
                                          {tripConflicts[0]?.overlapFormatted ||
                                            "Double-booked"}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    },
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
