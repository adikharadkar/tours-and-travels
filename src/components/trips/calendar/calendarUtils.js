/**
 * FleetCore Calendar Utilities
 * Date manipulation, conflict detection, period calculations, and formatting.
 */

/**
 * Safely parse a date string or timestamp.
 * @param {string|Date|number} val
 * @returns {Date|null}
 */
export function parseDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Check if two dates are on the same calendar day.
 * @param {Date} d1
 * @param {Date} d2
 * @returns {boolean}
 */
export function isSameDay(d1, d2) {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Checks if a trip spans across or touches a specific day.
 * @param {Object} trip
 * @param {Date} targetDay
 * @returns {boolean}
 */
export function isTripOnDay(trip, targetDay) {
  if (!trip?.startDateTime) return false;
  const start = parseDate(trip.startDateTime);
  if (!start) return false;

  const end = parseDate(trip.endDateTime) || start;

  const dayStart = new Date(
    targetDay.getFullYear(),
    targetDay.getMonth(),
    targetDay.getDate(),
    0,
    0,
    0,
    0,
  );
  const dayEnd = new Date(
    targetDay.getFullYear(),
    targetDay.getMonth(),
    targetDay.getDate(),
    23,
    59,
    59,
    999,
  );

  return start <= dayEnd && end >= dayStart;
}

/**
 * Get start of week (Sunday or Monday). Default is Sunday (0) or Monday (1).
 * @param {Date} date
 * @param {number} startDay 0 for Sunday, 1 for Monday. Default 0 (matching tests/system)
 * @returns {Date}
 */
export function getStartOfWeek(date, startDay = 0) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = (day < startDay ? 7 : 0) + day - startDay;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of week.
 * @param {Date} date
 * @param {number} startDay
 * @returns {Date}
 */
export function getEndOfWeek(date, startDay = 0) {
  const start = getStartOfWeek(date, startDay);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Get all 7 days for the week of given date.
 * @param {Date} date
 * @param {number} startDay
 * @returns {Date[]}
 */
export function getWeekDays(date, startDay = 0) {
  const start = getStartOfWeek(date, startDay);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

/**
 * Format a human-readable title for the currently selected period.
 * @param {'day'|'week'|'month'} view
 * @param {Date} date
 * @returns {string}
 */
export function formatPeriodTitle(view, date) {
  if (!date) return "";

  if (view === "day") {
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (view === "week") {
    const start = getStartOfWeek(date, 0);
    const end = getEndOfWeek(date, 0);

    const startMonth = start.toLocaleString("default", { month: "short" });
    const endMonth = end.toLocaleString("default", { month: "short" });
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    if (startYear !== endYear) {
      return `${startMonth} ${start.getDate()}, ${startYear} – ${endMonth} ${end.getDate()}, ${endYear}`;
    }

    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${startYear}`;
    }

    return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${startYear}`;
  }

  // Month view
  return date.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
}

/**
 * Format time range string (e.g., "09:00 – 18:00").
 * @param {string} startStr
 * @param {string} endStr
 * @returns {string}
 */
export function formatTimeRange(startStr, endStr) {
  const start = parseDate(startStr);
  const end = parseDate(endStr);

  if (!start) return "--:--";

  const formatTime = (d) =>
    d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  if (!end) return `${formatTime(start)}`;
  return `${formatTime(start)}–${formatTime(end)}`;
}

/**
 * Check if two time ranges overlap.
 */
export function isTimeOverlapping(startA, endA, startB, endB) {
  if (!startA || !endA || !startB || !endB) return false;
  const aStart = new Date(startA).getTime();
  const aEnd = new Date(endA).getTime();
  const bStart = new Date(startB).getTime();
  const bEnd = new Date(endB).getTime();

  if (isNaN(aStart) || isNaN(aEnd) || isNaN(bStart) || isNaN(bEnd))
    return false;
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Calculate overlap duration in minutes and format string.
 */
export function calculateOverlap(startA, endA, startB, endB) {
  const aStart = new Date(startA).getTime();
  const aEnd = new Date(endA).getTime();
  const bStart = new Date(startB).getTime();
  const bEnd = new Date(endB).getTime();

  const overlapStart = Math.max(aStart, bStart);
  const overlapEnd = Math.min(aEnd, bEnd);
  const diffMs = overlapEnd - overlapStart;

  if (diffMs <= 0) return { minutes: 0, formatted: "0m" };

  const totalMinutes = Math.round(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours > 0 && mins > 0) {
    return { minutes: totalMinutes, formatted: `${hours}h ${mins}m` };
  } else if (hours > 0) {
    return { minutes: totalMinutes, formatted: `${hours}h` };
  }
  return { minutes: totalMinutes, formatted: `${mins}m` };
}

/**
 * Detect all vehicle and driver scheduling conflicts across trips.
 * Only non-cancelled trips in active states cause conflicts.
 * @param {Array} trips
 * @param {Map} vehicleMap
 * @param {Map} driverMap
 * @returns {{ conflicts: Array, conflictTripIdsSet: Set, conflictsByTripIdMap: Map }}
 */
export function detectAllConflicts(
  trips = [],
  vehicleMap = new Map(),
  driverMap = new Map(),
) {
  const conflicts = [];
  const conflictTripIdsSet = new Set();
  const conflictsByTripIdMap = new Map();

  const activeTrips = trips.filter(
    (t) =>
      t &&
      t.status !== "cancelled" &&
      t.startDateTime &&
      (t.endDateTime || t.startDateTime),
  );

  for (let i = 0; i < activeTrips.length; i++) {
    for (let j = i + 1; j < activeTrips.length; j++) {
      const tripA = activeTrips[i];
      const tripB = activeTrips[j];

      const endA = tripA.endDateTime || tripA.startDateTime;
      const endB = tripB.endDateTime || tripB.startDateTime;

      if (
        !isTimeOverlapping(tripA.startDateTime, endA, tripB.startDateTime, endB)
      ) {
        continue;
      }

      // Check Vehicle Conflict
      if (
        tripA.vehicleId &&
        tripB.vehicleId &&
        tripA.vehicleId === tripB.vehicleId
      ) {
        const overlap = calculateOverlap(
          tripA.startDateTime,
          endA,
          tripB.startDateTime,
          endB,
        );
        const veh = vehicleMap.get(tripA.vehicleId);
        const conflictRecord = {
          id: `veh-${tripA.id}-${tripB.id}`,
          type: "vehicle",
          resourceId: tripA.vehicleId,
          resourceLabel: veh?.vehicleNumber || "Vehicle",
          tripA,
          tripB,
          overlapMinutes: overlap.minutes,
          overlapFormatted: overlap.formatted,
          message: `Vehicle ${veh?.vehicleNumber || ""} double-booked: ${tripA.tripCode} & ${tripB.tripCode} (${overlap.formatted} overlap)`,
        };

        conflicts.push(conflictRecord);
        conflictTripIdsSet.add(tripA.id);
        conflictTripIdsSet.add(tripB.id);

        if (!conflictsByTripIdMap.has(tripA.id))
          conflictsByTripIdMap.set(tripA.id, []);
        if (!conflictsByTripIdMap.has(tripB.id))
          conflictsByTripIdMap.set(tripB.id, []);
        conflictsByTripIdMap.get(tripA.id).push(conflictRecord);
        conflictsByTripIdMap.get(tripB.id).push(conflictRecord);
      }

      // Check Driver Conflict
      if (
        tripA.driverId &&
        tripB.driverId &&
        tripA.driverId === tripB.driverId
      ) {
        const overlap = calculateOverlap(
          tripA.startDateTime,
          endA,
          tripB.startDateTime,
          endB,
        );
        const drv = driverMap.get(tripA.driverId);
        const conflictRecord = {
          id: `drv-${tripA.id}-${tripB.id}`,
          type: "driver",
          resourceId: tripA.driverId,
          resourceLabel: drv?.name || "Driver",
          tripA,
          tripB,
          overlapMinutes: overlap.minutes,
          overlapFormatted: overlap.formatted,
          message: `Driver ${drv?.name || ""} double-booked: ${tripA.tripCode} & ${tripB.tripCode} (${overlap.formatted} overlap)`,
        };

        conflicts.push(conflictRecord);
        conflictTripIdsSet.add(tripA.id);
        conflictTripIdsSet.add(tripB.id);

        if (!conflictsByTripIdMap.has(tripA.id))
          conflictsByTripIdMap.set(tripA.id, []);
        if (!conflictsByTripIdMap.has(tripB.id))
          conflictsByTripIdMap.set(tripB.id, []);
        conflictsByTripIdMap.get(tripA.id).push(conflictRecord);
        conflictsByTripIdMap.get(tripB.id).push(conflictRecord);
      }
    }
  }

  return {
    conflicts,
    conflictTripIdsSet,
    conflictsByTripIdMap,
  };
}

/**
 * Calculate Schedule Health KPIs from live trip and conflict data.
 */
export function getScheduleHealthMetrics(
  trips = [],
  conflicts = [],
  referenceDate = new Date(),
) {
  const today = new Date(referenceDate);

  let scheduledToday = 0;
  let inProgress = 0;
  let unassigned = 0;

  trips.forEach((trip) => {
    if (!trip || trip.status === "cancelled") return;

    if (trip.status === "in_progress") {
      inProgress++;
    }

    if (isTripOnDay(trip, today)) {
      scheduledToday++;
    }

    if (
      (!trip.vehicleId || !trip.driverId) &&
      trip.status !== "completed" &&
      trip.status !== "cancelled"
    ) {
      unassigned++;
    }
  });

  return {
    scheduledToday,
    inProgress,
    unassigned,
    conflictsCount: conflicts.length,
  };
}

/**
 * Check if a trip is delayed.
 */
export function isTripDelayed(trip) {
  if (!trip || trip.status === "completed" || trip.status === "cancelled")
    return false;
  const now = new Date();

  if (trip.startDateTime) {
    const start = parseDate(trip.startDateTime);
    if (
      start &&
      start < now &&
      (trip.status === "draft" || trip.status === "confirmed")
    ) {
      return true;
    }
  }

  if (trip.endDateTime && trip.status === "in_progress") {
    const end = parseDate(trip.endDateTime);
    if (end && end < now) {
      return true;
    }
  }

  return false;
}
