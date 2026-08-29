import { useMemo } from "react";
import { isSameDay, parseDate } from "./calendarUtils";
import { TripStatusBadge } from "../TripStatusBadge";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarMonthView({
  currentDate,
  trips = [],
  customerMap = new Map(),
  vehicleMap = new Map(),
  driverMap = new Map(),
  selectedDay,
  onSelectDay,
  onCloseSelectedDay,
  onSelectTrip,
}) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 6 rows matrix (42 days)
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Next month filler days to complete 42
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  // Index trips by date
  const tripsByDate = useMemo(() => {
    const map = new Map();

    trips.forEach((trip) => {
      if (!trip?.startDateTime) return;
      const startDate = parseDate(trip.startDateTime);
      const endDate = parseDate(trip.endDateTime) || startDate;

      if (!startDate) return;

      const current = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
      );
      const last = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate(),
      );

      while (current <= last) {
        const key = `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`;
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key).push(trip);
        current.setDate(current.getDate() + 1);
      }
    });

    return map;
  }, [trips]);

  const selectedDayTrips = useMemo(() => {
    if (!selectedDay) return [];
    const key = `${selectedDay.getFullYear()}-${selectedDay.getMonth()}-${selectedDay.getDate()}`;
    return tripsByDate.get(key) || [];
  }, [selectedDay, tripsByDate]);

  const today = new Date();

  return (
    <div className="space-y-4">
      {/* Month Calendar Matrix */}
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] shadow-xs">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#121318] text-center">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* 6-Row Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-[#262837]">
          {calendarDays.map(({ date, isCurrentMonth }) => {
            const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            const dayTrips = tripsByDate.get(dateKey) || [];
            const isToday = isSameDay(date, today);
            const isSelected = selectedDay && isSameDay(date, selectedDay);

            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => onSelectDay(date)}
                className={[
                  "min-h-[90px] sm:min-h-[105px] p-1.5 sm:p-2 text-left flex flex-col justify-between transition-colors cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-violet-500/50",
                  !isCurrentMonth
                    ? "bg-slate-50/50 dark:bg-[#121318]/40 text-slate-400 dark:text-slate-600"
                    : "bg-white dark:bg-[#161822] text-slate-800 dark:text-slate-200",
                  isSelected
                    ? "ring-2 ring-violet-500 bg-violet-50/40 dark:bg-violet-950/20 z-10"
                    : "hover:bg-slate-50 dark:hover:bg-[#1c1f2b]",
                ].join(" ")}
              >
                {/* Day Number + Count */}
                <div className="flex items-center justify-between">
                  <span
                    className={[
                      "w-6 h-6 flex items-center justify-center rounded-full text-xs font-mono font-bold",
                      isToday
                        ? "bg-violet-600 text-white shadow-xs"
                        : isSelected
                          ? "bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300"
                          : "",
                    ].join(" ")}
                  >
                    {date.getDate()}
                  </span>

                  {dayTrips.length > 0 && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-[#262837] text-slate-600 dark:text-slate-300">
                      {dayTrips.length}
                    </span>
                  )}
                </div>

                {/* Event Pill Preview in cell */}
                <div className="mt-1 space-y-1 w-full overflow-hidden">
                  {dayTrips.slice(0, 2).map((trip) => {
                    const status = trip.status || "draft";
                    let bgClass =
                      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                    if (status === "in_progress") {
                      bgClass =
                        "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300";
                    } else if (status === "confirmed") {
                      bgClass =
                        "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300";
                    } else if (status === "completed") {
                      bgClass =
                        "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
                    }

                    return (
                      <div
                        key={trip.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTrip?.(trip);
                        }}
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded truncate font-medium hover:opacity-80 transition-opacity ${bgClass}`}
                        title={`${trip.tripCode}: ${trip.pickupLocation} → ${trip.dropLocation}`}
                      >
                        {trip.tripCode}
                      </div>
                    );
                  })}
                  {dayTrips.length > 2 && (
                    <div className="text-[9px] font-semibold text-slate-400 pl-0.5">
                      +{dayTrips.length - 2} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Panel */}
      {selectedDay && (
        <div className="rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] overflow-hidden shadow-md">
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-[#262837] bg-slate-50/80 dark:bg-[#121318]">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Trips for{" "}
                {selectedDay.toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedDayTrips.length}{" "}
                {selectedDayTrips.length === 1
                  ? "trip scheduled"
                  : "trips scheduled"}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close Details"
              onClick={onCloseSelectedDay}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#262837] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1f212d] transition-colors cursor-pointer"
            >
              Close Details
            </button>
          </div>

          {/* Trip Items */}
          <div className="p-3">
            {selectedDayTrips.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No trips scheduled for this date.
              </div>
            ) : (
              <div className="space-y-2">
                {selectedDayTrips.map((trip) => {
                  const customer = customerMap.get(trip.customerId);
                  const vehicle = trip.vehicleId
                    ? vehicleMap.get(trip.vehicleId)
                    : null;
                  const driver = trip.driverId
                    ? driverMap.get(trip.driverId)
                    : null;

                  return (
                    <div
                      key={trip.id}
                      onClick={() => onSelectTrip?.(trip)}
                      className="p-3 rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50/50 dark:bg-[#1b1e2a] hover:border-violet-300 dark:hover:border-violet-700 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                            {trip.tripCode}
                          </span>
                          <TripStatusBadge status={trip.status} />
                        </div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {customer ? customer.name : "Customer"}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          {trip.pickupLocation || "Origin"} →{" "}
                          {trip.dropLocation || "Destination"}
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5 sm:text-right">
                        <div>{vehicle ? vehicle.vehicleNumber : "Vehicle"}</div>
                        <div>{driver ? driver.name : "Driver"}</div>
                        {trip.totalAmount > 0 && (
                          <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                            ₹{Number(trip.totalAmount).toLocaleString("en-IN")}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
