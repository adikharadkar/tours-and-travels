import { useState, useMemo } from "react";
import Button from "../ui/Button";
import Card, { CardContent, CardHeader, CardTitle } from "../ui/Card";
import { TripStatusBadge } from "./TripStatusBadge";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export default function TripCalendar({
  trips = [],
  customers = [],
  vehicles = [],
  drivers = [],
  onSelectTrip,
}) {
  const [currentDate, setCurrentDate] = useState(() => {
    // Default to the month of the first trip or today
    if (trips.length > 0 && trips[0].startDateTime) {
      const firstDate = parseDate(trips[0].startDateTime);
      if (firstDate)
        return new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
    }
    return new Date();
  });

  const [selectedDay, setSelectedDay] = useState(null);

  const customerMap = useMemo(() => {
    const map = new Map();
    customers.forEach((c) => map.set(c.id, c));
    return map;
  }, [customers]);

  const vehicleMap = useMemo(() => {
    const map = new Map();
    vehicles.forEach((v) => map.set(v.id, v));
    return map;
  }, [vehicles]);

  const driverMap = useMemo(() => {
    const map = new Map();
    drivers.forEach((d) => map.set(d.id, d));
    return map;
  }, [drivers]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(today);
  };

  // Build calendar matrix
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

    // Next month filler days to complete 6 rows (42 days)
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
      if (!trip.startDateTime) return;
      const startDate = parseDate(trip.startDateTime);
      const endDate = parseDate(trip.endDateTime) || startDate;

      if (!startDate) return;

      // Span over days
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

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
          <CardTitle className="text-base font-bold">{monthName}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={goToToday}
            >
              Today
            </Button>
            <div className="flex items-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={prevMonth}
                aria-label="Previous month"
              >
                ‹
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={nextMonth}
                aria-label="Next month"
              >
                ›
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-2 md:p-4">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted mb-1">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(({ date, isCurrentMonth }, idx) => {
              const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
              const dayTrips = tripsByDate.get(key) || [];
              const isToday = isSameDay(date, new Date());
              const isSelected = selectedDay && isSameDay(date, selectedDay);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedDay(date)}
                  className={[
                    "min-h-[72px] md:min-h-[96px] p-1.5 text-left rounded-md border transition-colors flex flex-col justify-between",
                    isCurrentMonth
                      ? "bg-surface border-border text-foreground"
                      : "bg-background/40 border-border/50 text-muted opacity-60",
                    isToday ? "ring-2 ring-primary border-primary" : "",
                    isSelected ? "bg-primary/5 border-primary" : "",
                    "hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={[
                        "text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center",
                        isToday
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground",
                      ].join(" ")}
                    >
                      {date.getDate()}
                    </span>
                    {dayTrips.length > 0 && (
                      <span className="text-[10px] font-mono px-1 rounded bg-primary/10 text-primary font-semibold">
                        {dayTrips.length}
                      </span>
                    )}
                  </div>

                  {/* Trip Pills in cell */}
                  <div className="mt-1 space-y-1 w-full overflow-hidden">
                    {dayTrips.slice(0, 2).map((trip) => {
                      const cust = customerMap.get(trip.customerId);
                      return (
                        <div
                          key={trip.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTrip(trip);
                          }}
                          className={[
                            "px-1.5 py-0.5 rounded text-[10px] truncate cursor-pointer font-medium",
                            trip.status === "confirmed"
                              ? "bg-primary/10 text-primary hover:bg-primary/20"
                              : trip.status === "in_progress"
                                ? "bg-warning/10 text-warning hover:bg-warning/20"
                                : trip.status === "completed"
                                  ? "bg-success/10 text-success hover:bg-success/20"
                                  : "bg-muted/20 text-muted hover:bg-muted/30",
                          ].join(" ")}
                          title={`${trip.tripCode} - ${cust?.name || "Customer"}`}
                        >
                          <span className="font-mono">{trip.tripCode}</span> ·{" "}
                          {cust?.name || "Customer"}
                        </div>
                      );
                    })}
                    {dayTrips.length > 2 && (
                      <span className="text-[9px] text-muted block text-center">
                        +{dayTrips.length - 2} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Details Panel */}
      {selectedDay && (
        <Card>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Trips for{" "}
              {selectedDay.toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDay(null)}
            >
              Close Details
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            {selectedDayTrips.length === 0 ? (
              <p className="text-xs text-muted">
                No trips scheduled for this date.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedDayTrips.map((trip) => {
                  const cust = customerMap.get(trip.customerId);
                  const veh = vehicleMap.get(trip.vehicleId);
                  const drv = driverMap.get(trip.driverId);

                  return (
                    <div
                      key={trip.id}
                      onClick={() => onSelectTrip(trip)}
                      className="p-3 rounded-lg border border-border bg-surface hover:border-primary cursor-pointer transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {trip.tripCode}
                        </span>
                        <TripStatusBadge status={trip.status} />
                      </div>
                      <div className="text-xs font-semibold text-foreground truncate">
                        {cust?.name || "Customer"}
                      </div>
                      <div className="text-[11px] text-muted">
                        {trip.pickupLocation} → {trip.dropLocation}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted pt-1 border-t border-border">
                        <span>{veh ? veh.vehicleNumber : "Vehicle"}</span>
                        <span>{drv ? drv.name : "Driver"}</span>
                        <span className="font-mono font-bold text-foreground">
                          ₹
                          {Number(trip.totalAmount || 0).toLocaleString(
                            "en-IN",
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
