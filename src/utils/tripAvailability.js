/**
 * Checks if two time intervals overlap.
 * Assumes ISO strings or Date-parseable strings.
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
 * Returns any active conflicting trips for a given vehicle.
 * Only 'confirmed' and 'in_progress' trips cause blocking conflicts.
 * @param {string} vehicleId
 * @param {string} startDateTime
 * @param {string} endDateTime
 * @param {string|null} excludeTripId
 * @param {Array} trips
 * @returns {Array} List of conflicting trip objects
 */
export function getVehicleConflicts(
  vehicleId,
  startDateTime,
  endDateTime,
  excludeTripId = null,
  trips = [],
) {
  if (!vehicleId || !startDateTime || !endDateTime || !Array.isArray(trips)) {
    return [];
  }

  return trips.filter((trip) => {
    if (trip.id === excludeTripId) return false;
    if (trip.vehicleId !== vehicleId) return false;
    if (trip.status !== "confirmed" && trip.status !== "in_progress")
      return false;

    return isTimeOverlapping(
      startDateTime,
      endDateTime,
      trip.startDateTime,
      trip.endDateTime,
    );
  });
}

/**
 * Checks if a vehicle is available for the given time slot.
 * @param {string} vehicleId
 * @param {string} startDateTime
 * @param {string} endDateTime
 * @param {string|null} excludeTripId
 * @param {Array} trips
 * @returns {boolean}
 */
export function isVehicleAvailable(
  vehicleId,
  startDateTime,
  endDateTime,
  excludeTripId = null,
  trips = [],
) {
  const conflicts = getVehicleConflicts(
    vehicleId,
    startDateTime,
    endDateTime,
    excludeTripId,
    trips,
  );
  return conflicts.length === 0;
}

/**
 * Returns any active conflicting trips for a given driver.
 * Only 'confirmed' and 'in_progress' trips cause blocking conflicts.
 * @param {string} driverId
 * @param {string} startDateTime
 * @param {string} endDateTime
 * @param {string|null} excludeTripId
 * @param {Array} trips
 * @returns {Array} List of conflicting trip objects
 */
export function getDriverConflicts(
  driverId,
  startDateTime,
  endDateTime,
  excludeTripId = null,
  trips = [],
) {
  if (!driverId || !startDateTime || !endDateTime || !Array.isArray(trips)) {
    return [];
  }

  return trips.filter((trip) => {
    if (trip.id === excludeTripId) return false;
    if (trip.driverId !== driverId) return false;
    if (trip.status !== "confirmed" && trip.status !== "in_progress")
      return false;

    return isTimeOverlapping(
      startDateTime,
      endDateTime,
      trip.startDateTime,
      trip.endDateTime,
    );
  });
}

/**
 * Checks if a driver is available for the given time slot.
 * @param {string} driverId
 * @param {string} startDateTime
 * @param {string} endDateTime
 * @param {string|null} excludeTripId
 * @param {Array} trips
 * @returns {boolean}
 */
export function isDriverAvailable(
  driverId,
  startDateTime,
  endDateTime,
  excludeTripId = null,
  trips = [],
) {
  const conflicts = getDriverConflicts(
    driverId,
    startDateTime,
    endDateTime,
    excludeTripId,
    trips,
  );
  return conflicts.length === 0;
}
