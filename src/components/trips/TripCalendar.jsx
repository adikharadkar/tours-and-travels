import { useState, useMemo } from "react";
import CalendarHeader from "./calendar/CalendarHeader";
import CalendarHealthBar from "./calendar/CalendarHealthBar";
import CalendarToolbar from "./calendar/CalendarToolbar";
import CalendarWeekView from "./calendar/CalendarWeekView";
import CalendarDayView from "./calendar/CalendarDayView";
import CalendarMonthView from "./calendar/CalendarMonthView";
import CalendarResourceView from "./calendar/CalendarResourceView";
import CalendarNeedsAttention from "./calendar/CalendarNeedsAttention";
import {
  parseDate,
  detectAllConflicts,
  getScheduleHealthMetrics,
  isTripOnDay,
} from "./calendar/calendarUtils";

export default function TripCalendar({
  trips = [],
  customers = [],
  vehicles = [],
  drivers = [],
  customerMap: propCustomerMap,
  vehicleMap: propVehicleMap,
  driverMap: propDriverMap,
  onSelectTrip,
  onSelectVehicle,
  onSelectDriver,
  onEditTrip,
  onNewTrip: _onNewTrip,
  initialView = "week",
  initialScheduleMode = "trips",
  initialDate,
  isLoading = false,
}) {
  // View mode: 'week' (default), 'day', 'month'
  const [viewMode, setViewMode] = useState(initialView);

  // Schedule mode: 'trips' (default), 'vehicles', 'drivers'
  const [scheduleMode, setScheduleMode] = useState(initialScheduleMode);

  // Reference Date for current period
  const [currentDate, setCurrentDate] = useState(() => {
    if (initialDate) {
      const parsed = parseDate(initialDate);
      if (parsed) return parsed;
    }
    if (trips.length > 0 && trips[0]?.startDateTime) {
      const firstDate = parseDate(trips[0].startDateTime);
      if (firstDate) return firstDate;
    }
    return new Date();
  });

  // Selected Day (primarily for Month view details drawer)
  const [selectedDay, setSelectedDay] = useState(null);

  // Health Metric quick filter
  const [metricFilter, setMetricFilter] = useState(null);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [tripTypeFilter, setTripTypeFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [driverFilter, setDriverFilter] = useState("all");
  const [conflictOnly, setConflictOnly] = useState(false);

  // Compute lookup maps
  const customerMap = useMemo(() => {
    if (propCustomerMap) return propCustomerMap;
    const map = new Map();
    customers.forEach((c) => map.set(c.id, c));
    return map;
  }, [customers, propCustomerMap]);

  const vehicleMap = useMemo(() => {
    if (propVehicleMap) return propVehicleMap;
    const map = new Map();
    vehicles.forEach((v) => map.set(v.id, v));
    return map;
  }, [vehicles, propVehicleMap]);

  const driverMap = useMemo(() => {
    if (propDriverMap) return propDriverMap;
    const map = new Map();
    drivers.forEach((d) => map.set(d.id, d));
    return map;
  }, [drivers, propDriverMap]);

  // Conflict Detection Engine
  const { conflicts, conflictTripIdsSet, conflictsByTripIdMap } =
    useMemo(() => {
      return detectAllConflicts(trips, vehicleMap, driverMap);
    }, [trips, vehicleMap, driverMap]);

  // Schedule Health Metrics
  const healthMetrics = useMemo(() => {
    return getScheduleHealthMetrics(trips, conflicts, currentDate);
  }, [trips, conflicts, currentDate]);

  // Unassigned trips for Needs Attention
  const unassignedTrips = useMemo(() => {
    return trips.filter(
      (t) =>
        t &&
        (!t.vehicleId || !t.driverId) &&
        t.status !== "completed" &&
        t.status !== "cancelled",
    );
  }, [trips]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (statusFilter !== "all") count++;
    if (assignmentFilter !== "all") count++;
    if (tripTypeFilter !== "all") count++;
    if (vehicleFilter !== "all") count++;
    if (driverFilter !== "all") count++;
    if (conflictOnly) count++;
    if (metricFilter) count++;
    return count;
  }, [
    searchQuery,
    statusFilter,
    assignmentFilter,
    tripTypeFilter,
    vehicleFilter,
    driverFilter,
    conflictOnly,
    metricFilter,
  ]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setAssignmentFilter("all");
    setTripTypeFilter("all");
    setVehicleFilter("all");
    setDriverFilter("all");
    setConflictOnly(false);
    setMetricFilter(null);
  };

  // Filtered trips
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      if (!trip) return false;

      // Metric Filter
      if (metricFilter === "today") {
        if (!isTripOnDay(trip, currentDate)) return false;
      } else if (metricFilter === "in_progress") {
        if (trip.status !== "in_progress") return false;
      } else if (metricFilter === "unassigned") {
        if (
          trip.vehicleId &&
          trip.driverId &&
          trip.status !== "completed" &&
          trip.status !== "cancelled"
        )
          return false;
      } else if (metricFilter === "conflicts") {
        if (!conflictTripIdsSet.has(trip.id)) return false;
      }

      // Conflict Only
      if (conflictOnly && !conflictTripIdsSet.has(trip.id)) {
        return false;
      }

      // Status
      if (statusFilter !== "all" && trip.status !== statusFilter) {
        return false;
      }

      // Assignment
      if (assignmentFilter === "unassigned") {
        if (trip.vehicleId && trip.driverId) return false;
      } else if (assignmentFilter === "unassigned_vehicle") {
        if (trip.vehicleId) return false;
      } else if (assignmentFilter === "unassigned_driver") {
        if (trip.driverId) return false;
      } else if (assignmentFilter === "assigned") {
        if (!trip.vehicleId || !trip.driverId) return false;
      }

      // Trip Type
      if (tripTypeFilter !== "all" && trip.tripType !== tripTypeFilter) {
        return false;
      }

      // Vehicle
      if (vehicleFilter !== "all" && trip.vehicleId !== vehicleFilter) {
        return false;
      }

      // Driver
      if (driverFilter !== "all" && trip.driverId !== driverFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const code = (trip.tripCode || "").toLowerCase();
        const custName = (
          customerMap.get(trip.customerId)?.name ||
          trip.customerName ||
          ""
        ).toLowerCase();
        const pickup = (trip.pickupLocation || "").toLowerCase();
        const drop = (trip.dropLocation || "").toLowerCase();
        const vehNum = (
          vehicleMap.get(trip.vehicleId)?.vehicleNumber || ""
        ).toLowerCase();
        const drvName = (
          driverMap.get(trip.driverId)?.name || ""
        ).toLowerCase();

        const matches =
          code.includes(q) ||
          custName.includes(q) ||
          pickup.includes(q) ||
          drop.includes(q) ||
          vehNum.includes(q) ||
          drvName.includes(q);

        if (!matches) return false;
      }

      return true;
    });
  }, [
    trips,
    metricFilter,
    conflictOnly,
    statusFilter,
    assignmentFilter,
    tripTypeFilter,
    vehicleFilter,
    driverFilter,
    searchQuery,
    conflictTripIdsSet,
    customerMap,
    vehicleMap,
    driverMap,
    currentDate,
  ]);

  // Navigation handlers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === "day") {
      d.setDate(d.getDate() - 1);
    } else if (viewMode === "week") {
      d.setDate(d.getDate() - 7);
    } else {
      d.setMonth(d.getMonth() - 1);
    }
    setCurrentDate(d);
    setSelectedDay(null);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === "day") {
      d.setDate(d.getDate() + 1);
    } else if (viewMode === "week") {
      d.setDate(d.getDate() + 7);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    setCurrentDate(d);
    setSelectedDay(null);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today);
  };

  const handleSelectPreset = (preset) => {
    const d = new Date();
    if (preset === "tomorrow") {
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
      setViewMode("day");
    } else if (preset === "this_week") {
      setCurrentDate(d);
      setViewMode("week");
    } else if (preset === "next_7_days") {
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
      setViewMode("week");
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Calendar Header (Title, Subtitle, Schedule Mode Switcher, Date Nav, View Toggles) */}
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onViewModeChange={(m) => {
          setViewMode(m);
          setSelectedDay(null);
        }}
        scheduleMode={scheduleMode}
        onScheduleModeChange={setScheduleMode}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onSelectPreset={handleSelectPreset}
      />

      {/* 2. Schedule Health Summary Bar */}
      <CalendarHealthBar
        metrics={healthMetrics}
        activeFilter={metricFilter}
        onSelectMetricFilter={setMetricFilter}
      />

      {/* 3. Operational Attention (Conflicts & Unassigned Trips Drawer) */}
      <CalendarNeedsAttention
        conflicts={conflicts}
        unassignedTrips={unassignedTrips}
        customerMap={customerMap}
        vehicleMap={vehicleMap}
        driverMap={driverMap}
        onSelectTrip={onSelectTrip}
        onEditTrip={onEditTrip}
      />

      {/* 4. Calendar Search & Filter Toolbar */}
      <CalendarToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        assignmentFilter={assignmentFilter}
        onAssignmentFilterChange={setAssignmentFilter}
        tripTypeFilter={tripTypeFilter}
        onTripTypeFilterChange={setTripTypeFilter}
        vehicleFilter={vehicleFilter}
        onVehicleFilterChange={setVehicleFilter}
        driverFilter={driverFilter}
        onDriverFilterChange={setDriverFilter}
        conflictOnly={conflictOnly}
        onConflictOnlyChange={setConflictOnly}
        vehicles={vehicles}
        drivers={drivers}
        onResetFilters={handleResetFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* 5. Main Calendar Content Area */}
      {isLoading ? (
        <div className="py-20 text-center rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822]">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-violet-600 border-r-transparent align-[-0.125em]" />
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Loading operational calendar data...
          </p>
        </div>
      ) : scheduleMode === "vehicles" ? (
        <CalendarResourceView
          resourceType="vehicles"
          currentDate={currentDate}
          viewMode={viewMode === "day" ? "day" : "week"}
          trips={filteredTrips}
          vehicles={vehicles}
          drivers={drivers}
          customerMap={customerMap}
          vehicleMap={vehicleMap}
          driverMap={driverMap}
          conflictTripIdsSet={conflictTripIdsSet}
          conflictsByTripIdMap={conflictsByTripIdMap}
          onSelectTrip={onSelectTrip}
          onSelectVehicle={onSelectVehicle}
          onSelectDriver={onSelectDriver}
        />
      ) : scheduleMode === "drivers" ? (
        <CalendarResourceView
          resourceType="drivers"
          currentDate={currentDate}
          viewMode={viewMode === "day" ? "day" : "week"}
          trips={filteredTrips}
          vehicles={vehicles}
          drivers={drivers}
          customerMap={customerMap}
          vehicleMap={vehicleMap}
          driverMap={driverMap}
          conflictTripIdsSet={conflictTripIdsSet}
          conflictsByTripIdMap={conflictsByTripIdMap}
          onSelectTrip={onSelectTrip}
          onSelectVehicle={onSelectVehicle}
          onSelectDriver={onSelectDriver}
        />
      ) : viewMode === "week" ? (
        <CalendarWeekView
          currentDate={currentDate}
          trips={filteredTrips}
          customerMap={customerMap}
          vehicleMap={vehicleMap}
          driverMap={driverMap}
          conflictTripIdsSet={conflictTripIdsSet}
          conflictsByTripIdMap={conflictsByTripIdMap}
          onSelectTrip={onSelectTrip}
          onSelectDay={(day) => {
            setCurrentDate(day);
            setViewMode("day");
          }}
        />
      ) : viewMode === "day" ? (
        <CalendarDayView
          currentDate={currentDate}
          trips={filteredTrips}
          customerMap={customerMap}
          vehicleMap={vehicleMap}
          driverMap={driverMap}
          conflictTripIdsSet={conflictTripIdsSet}
          conflictsByTripIdMap={conflictsByTripIdMap}
          onSelectTrip={onSelectTrip}
        />
      ) : (
        <CalendarMonthView
          currentDate={currentDate}
          trips={filteredTrips}
          customerMap={customerMap}
          vehicleMap={vehicleMap}
          driverMap={driverMap}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          onCloseSelectedDay={() => setSelectedDay(null)}
          onSelectTrip={onSelectTrip}
        />
      )}
    </div>
  );
}
