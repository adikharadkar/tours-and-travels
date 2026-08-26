/**
 * Evaluates the real operational state of a vehicle based on its master status and existing trips.
 *
 * Concepts are kept strictly separated:
 * 1. Vehicle Status: Active vs Inactive
 * 2. Operational Availability: Available, On Trip, Maintenance / Inactive
 * 3. Compliance: Healthy / Valid, Expiring Soon, Expired
 *
 * @param {Object} vehicle
 * @param {Array} trips
 * @param {Date} [referenceDate]
 * @returns {Object}
 */
export function getVehicleOperationalState(
  vehicle,
  trips = [],
  referenceDate = new Date(),
) {
  if (!vehicle) {
    return {
      operationalStatus: "available",
      label: "Available",
      subtext: "Ready for assignment",
      activeTrip: null,
      upcomingTrips: [],
      recentTrips: [],
    };
  }

  // If vehicle is marked inactive in master records
  if (vehicle.isActive === false) {
    return {
      operationalStatus: "maintenance",
      label: "Maintenance",
      subtext: "Inactive in master fleet",
      activeTrip: null,
      upcomingTrips: [],
      recentTrips: [],
    };
  }

  const vehicleTrips = (trips || []).filter(
    (t) =>
      t.vehicleId === vehicle.id ||
      (t.vehicleNumber &&
        vehicle.vehicleNumber &&
        t.vehicleNumber.replace(/\s+/g, "").toUpperCase() ===
          vehicle.vehicleNumber.replace(/\s+/g, "").toUpperCase()),
  );

  const nowTime = referenceDate.getTime();

  // 1. Check for in-progress trip
  const inProgressTrip = vehicleTrips.find((t) => t.status === "in_progress");
  if (inProgressTrip) {
    return {
      operationalStatus: "on_trip",
      label: "On Trip",
      subtext: inProgressTrip.tripCode || "Active Trip",
      activeTrip: inProgressTrip,
      upcomingTrips: [],
      recentTrips: vehicleTrips.filter((t) => t.status === "completed"),
    };
  }

  // 2. Check for confirmed trip covering current time
  const currentConfirmedTrip = vehicleTrips.find((t) => {
    if (t.status !== "confirmed") return false;
    if (!t.startDateTime || !t.endDateTime) return false;
    const start = new Date(t.startDateTime).getTime();
    const end = new Date(t.endDateTime).getTime();
    return !isNaN(start) && !isNaN(end) && nowTime >= start && nowTime <= end;
  });

  if (currentConfirmedTrip) {
    return {
      operationalStatus: "on_trip",
      label: "On Trip",
      subtext: currentConfirmedTrip.tripCode || "Confirmed Trip",
      activeTrip: currentConfirmedTrip,
      upcomingTrips: [],
      recentTrips: vehicleTrips.filter((t) => t.status === "completed"),
    };
  }

  // 3. Collect upcoming and recent trips
  const upcomingTrips = vehicleTrips
    .filter((t) => {
      if (t.status !== "confirmed" && t.status !== "draft") return false;
      const start = new Date(t.startDateTime).getTime();
      return !isNaN(start) && start > nowTime;
    })
    .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

  const recentTrips = vehicleTrips
    .filter((t) => t.status === "completed")
    .sort(
      (a, b) =>
        new Date(b.endDateTime || b.updatedAt) -
        new Date(a.endDateTime || a.updatedAt),
    );

  return {
    operationalStatus: "available",
    label: "Available",
    subtext: "Available for assignment",
    activeTrip: null,
    upcomingTrips,
    recentTrips,
  };
}
