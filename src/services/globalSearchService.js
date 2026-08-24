import { getCustomers } from "./customerService";
import { getVehicles } from "./vehicleService";
import { getDrivers } from "./driverService";
import { getTrips } from "./tripService";

/**
 * Searches across all operational modules (Customers, Vehicles, Drivers, Trips)
 * @param {string} query
 * @returns {{
 *   customers: Array<{ id: string, title: string, subtitle: string, category: string, link: string }>,
 *   vehicles: Array<{ id: string, title: string, subtitle: string, category: string, link: string }>,
 *   drivers: Array<{ id: string, title: string, subtitle: string, category: string, link: string }>,
 *   trips: Array<{ id: string, title: string, subtitle: string, category: string, link: string }>,
 *   totalMatches: number
 * }}
 */
export function executeGlobalSearch(query = "") {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return {
      customers: [],
      vehicles: [],
      drivers: [],
      trips: [],
      totalMatches: 0,
    };
  }

  // 1. Search Customers
  const customerResults = [];
  try {
    const customers = getCustomers() || [];
    for (const c of customers) {
      const match =
        (c.name && c.name.toLowerCase().includes(normalized)) ||
        (c.customerCode && c.customerCode.toLowerCase().includes(normalized)) ||
        (c.mobile && c.mobile.includes(normalized)) ||
        (c.email && c.email.toLowerCase().includes(normalized)) ||
        (c.city && c.city.toLowerCase().includes(normalized));

      if (match) {
        customerResults.push({
          id: c.id,
          title: c.name,
          subtitle: `${c.customerCode || ""} • ${c.mobile || c.city || "Customer"}`,
          category: "Customer",
          icon: "group",
          link: `/customers?search=${encodeURIComponent(c.customerCode || c.name)}`,
        });
      }
      if (customerResults.length >= 4) break;
    }
  } catch (err) {
    console.error("Global search error on customers:", err);
  }

  // 2. Search Vehicles
  const vehicleResults = [];
  try {
    const vehicles = getVehicles() || [];
    for (const v of vehicles) {
      const match =
        (v.registrationNumber &&
          v.registrationNumber.toLowerCase().includes(normalized)) ||
        (v.vehicleCode && v.vehicleCode.toLowerCase().includes(normalized)) ||
        (v.model && v.model.toLowerCase().includes(normalized)) ||
        (v.vehicleType && v.vehicleType.toLowerCase().includes(normalized));

      if (match) {
        vehicleResults.push({
          id: v.id,
          title: v.registrationNumber,
          subtitle: `${v.vehicleCode || ""} • ${v.model || v.vehicleType || "Vehicle"}`,
          category: "Vehicle",
          icon: "local_shipping",
          link: `/vehicles?search=${encodeURIComponent(v.registrationNumber || v.vehicleCode)}`,
        });
      }
      if (vehicleResults.length >= 4) break;
    }
  } catch (err) {
    console.error("Global search error on vehicles:", err);
  }

  // 3. Search Drivers
  const driverResults = [];
  try {
    const drivers = getDrivers() || [];
    for (const d of drivers) {
      const match =
        (d.name && d.name.toLowerCase().includes(normalized)) ||
        (d.driverCode && d.driverCode.toLowerCase().includes(normalized)) ||
        (d.mobile && d.mobile.includes(normalized)) ||
        (d.licenseNumber && d.licenseNumber.toLowerCase().includes(normalized));

      if (match) {
        driverResults.push({
          id: d.id,
          title: d.name,
          subtitle: `${d.driverCode || ""} • ${d.licenseType ? d.licenseType.toUpperCase() : "Driver"}`,
          category: "Driver",
          icon: "badge",
          link: `/drivers?search=${encodeURIComponent(d.driverCode || d.name)}`,
        });
      }
      if (driverResults.length >= 4) break;
    }
  } catch (err) {
    console.error("Global search error on drivers:", err);
  }

  // 4. Search Trips
  const tripResults = [];
  try {
    const trips = getTrips() || [];
    for (const t of trips) {
      const match =
        (t.tripCode && t.tripCode.toLowerCase().includes(normalized)) ||
        (t.startCity && t.startCity.toLowerCase().includes(normalized)) ||
        (t.dropCity && t.dropCity.toLowerCase().includes(normalized)) ||
        (t.status && t.status.toLowerCase().includes(normalized));

      if (match) {
        tripResults.push({
          id: t.id,
          title: t.tripCode || `Trip #${t.id}`,
          subtitle: `${t.startCity || "Depot"} → ${t.dropCity || "Destination"} (${t.status || "active"})`,
          category: "Trip",
          icon: "route",
          link: `/trips?search=${encodeURIComponent(t.tripCode || "")}`,
        });
      }
      if (tripResults.length >= 4) break;
    }
  } catch (err) {
    console.error("Global search error on trips:", err);
  }

  const totalMatches =
    customerResults.length +
    vehicleResults.length +
    driverResults.length +
    tripResults.length;

  return {
    customers: customerResults,
    vehicles: vehicleResults,
    drivers: driverResults,
    trips: tripResults,
    totalMatches,
  };
}
