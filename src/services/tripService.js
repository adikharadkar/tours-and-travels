import { getNextTripCode } from "./tripCodeService";
import {
  calculateTripAmount,
  calculateTripDuration,
  calculateTotalKm,
  toNumber,
} from "../utils/tripCalculation";
import {
  getVehicleConflicts,
  getDriverConflicts,
} from "../utils/tripAvailability";
import { canTransitionStatus } from "../utils/tripStatus";
import { validateTrip } from "../utils/validation/tripValidation";
import { getCustomerById } from "./customerService";
import { getVehicleById } from "./vehicleService";
import { getDriverById } from "./driverService";
import { isDriverEligible } from "../utils/driverLicenseStatus";

const TRIPS_STORAGE_KEY = "trips";

export const DEFAULT_TRIPS = [
  {
    id: "trp_1",
    tripCode: "TRP-0001",
    bookingDate: "2026-08-20",
    tripType: "outstation",
    status: "confirmed",
    customerId: "cust_1",
    vehicleId: "veh_1",
    driverId: "drv_1",
    referenceNumber: "BK-APX-981",
    pickupLocation: "Chhatrapati Sambhajinagar",
    dropLocation: "Pune",
    stops: "MIDC Waluj, Ahmednagar Highway",
    pickupInstructions:
      "Report at Main Gate 1, Perkins / Apex Facility by 7:45 AM",
    startDateTime: "2026-08-24T08:00",
    endDateTime: "2026-08-25T18:00",
    duration: "1 Day 10 Hours",
    openingKm: 45200,
    closingKm: null,
    totalKm: null,
    rateType: "per_day",
    baseRate: 18000,
    ratePerKm: 22,
    ratePerHour: 300,
    ratePerDay: 9000,
    extraKmCharges: 0,
    extraHourCharges: 0,
    driverCharges: 1000,
    tollCharges: 1200,
    parkingCharges: 300,
    otherCharges: 0,
    discountType: "fixed",
    discountValue: 500,
    discountAmount: 500,
    taxApplicable: true,
    taxType: "gst_12",
    taxRate: 12,
    taxAmount: 2400,
    totalAmount: 22400,
    advanceAmount: 10000,
    advancePaymentMode: "bank_transfer",
    advancePaymentReference: "NEFT-9912048",
    advancePaymentDate: "2026-08-20",
    balanceAmount: 12400,
    paymentStatus: "partially_paid",
    notes: "Corporate executive group. AC BharatBenz bus requested.",
    statusHistory: [
      {
        status: "draft",
        timestamp: "2026-08-20T09:00:00.000Z",
        note: "Draft booking created",
      },
      {
        status: "confirmed",
        timestamp: "2026-08-20T11:30:00.000Z",
        note: "Advance received and trip confirmed",
      },
    ],
    createdAt: "2026-08-20T09:00:00.000Z",
    updatedAt: "2026-08-20T11:30:00.000Z",
  },
  {
    id: "trp_2",
    tripCode: "TRP-0002",
    bookingDate: "2026-08-21",
    tripType: "package",
    status: "in_progress",
    customerId: "cust_2",
    vehicleId: "veh_2",
    driverId: "drv_2",
    referenceNumber: "HRZ-AUG-04",
    pickupLocation: "Bengaluru Airport (BLR)",
    dropLocation: "Coorg Resort & Spa",
    stops: "Mysuru Palace, Kushalnagar",
    pickupInstructions:
      "Flight 6E-204 arriving at 6:30 AM. Name board required.",
    startDateTime: "2026-08-23T06:00",
    endDateTime: "2026-08-26T20:00",
    duration: "3 Days 14 Hours",
    openingKm: 28400,
    closingKm: null,
    totalKm: null,
    rateType: "package",
    baseRate: 32000,
    ratePerKm: 18,
    ratePerHour: 250,
    ratePerDay: 8000,
    extraKmCharges: 0,
    extraHourCharges: 0,
    driverCharges: 1500,
    tollCharges: 850,
    parkingCharges: 250,
    otherCharges: 0,
    discountType: "percentage",
    discountValue: 5,
    discountAmount: 1730,
    taxApplicable: true,
    taxType: "gst_5",
    taxRate: 5,
    taxAmount: 1643.5,
    totalAmount: 34513.5,
    advanceAmount: 34513.5,
    advancePaymentMode: "upi",
    advancePaymentReference: "UPI-4819283719",
    advancePaymentDate: "2026-08-21",
    balanceAmount: 0,
    paymentStatus: "paid",
    notes: "Tour package includes Mysuru halt. Force Urbania 17S.",
    statusHistory: [
      {
        status: "draft",
        timestamp: "2026-08-21T10:00:00.000Z",
        note: "Package booking created",
      },
      {
        status: "confirmed",
        timestamp: "2026-08-21T12:00:00.000Z",
        note: "Full payment received via UPI",
      },
      {
        status: "in_progress",
        timestamp: "2026-08-23T06:00:00.000Z",
        note: "Trip started with opening KM 28400",
      },
    ],
    createdAt: "2026-08-21T10:00:00.000Z",
    updatedAt: "2026-08-23T06:00:00.000Z",
  },
  {
    id: "trp_3",
    tripCode: "TRP-0003",
    bookingDate: "2026-08-18",
    tripType: "round_trip",
    status: "completed",
    customerId: "cust_3",
    vehicleId: "veh_3",
    driverId: "drv_1",
    referenceNumber: "DR-SETHI-01",
    pickupLocation: "Greater Kailash 1, New Delhi",
    dropLocation: "Taj Mahal, Agra",
    stops: "Yamuna Expressway Toll Plaza, Mathura",
    pickupInstructions: "Pickup from residence porch.",
    startDateTime: "2026-08-20T07:00",
    endDateTime: "2026-08-20T21:00",
    duration: "14 Hours",
    openingKm: 61200,
    closingKm: 61680,
    totalKm: 480,
    rateType: "per_km",
    baseRate: 7200,
    ratePerKm: 15,
    ratePerHour: 200,
    ratePerDay: 0,
    extraKmCharges: 0,
    extraHourCharges: 400,
    driverCharges: 500,
    tollCharges: 980,
    parkingCharges: 200,
    otherCharges: 0,
    discountType: "fixed",
    discountValue: 0,
    discountAmount: 0,
    taxApplicable: true,
    taxType: "gst_5",
    taxRate: 5,
    taxAmount: 464,
    totalAmount: 9744,
    advanceAmount: 9744,
    advancePaymentMode: "card",
    advancePaymentReference: "POS-TXN-8841",
    advancePaymentDate: "2026-08-18",
    balanceAmount: 0,
    paymentStatus: "paid",
    notes:
      "Day trip to Agra completed successfully. Customer gave excellent feedback.",
    statusHistory: [
      {
        status: "draft",
        timestamp: "2026-08-18T14:00:00.000Z",
        note: "Draft created",
      },
      {
        status: "confirmed",
        timestamp: "2026-08-18T15:00:00.000Z",
        note: "Confirmed",
      },
      {
        status: "in_progress",
        timestamp: "2026-08-20T07:00:00.000Z",
        note: "Started from Delhi",
      },
      {
        status: "completed",
        timestamp: "2026-08-20T21:15:00.000Z",
        note: "Completed with 480 total KM",
      },
    ],
    createdAt: "2026-08-18T14:00:00.000Z",
    updatedAt: "2026-08-20T21:15:00.000Z",
  },
  {
    id: "trp_4",
    tripCode: "TRP-0004",
    bookingDate: "2026-08-22",
    tripType: "airport_transfer",
    status: "draft",
    customerId: "cust_1",
    vehicleId: "veh_4",
    driverId: "drv_2",
    referenceNumber: "",
    pickupLocation: "MIDC Industrial Estate, Bengaluru",
    dropLocation: "Kempegowda International Airport",
    stops: "",
    pickupInstructions: "Staff pickup at 10:00 AM sharp",
    startDateTime: "2026-08-28T10:00",
    endDateTime: "2026-08-28T16:00",
    duration: "6 Hours",
    openingKm: null,
    closingKm: null,
    totalKm: null,
    rateType: "per_trip",
    baseRate: 4500,
    ratePerKm: 0,
    ratePerHour: 0,
    ratePerDay: 0,
    extraKmCharges: 0,
    extraHourCharges: 0,
    driverCharges: 0,
    tollCharges: 300,
    parkingCharges: 150,
    otherCharges: 0,
    discountType: "fixed",
    discountValue: 0,
    discountAmount: 0,
    taxApplicable: true,
    taxType: "gst_12",
    taxRate: 12,
    taxAmount: 594,
    totalAmount: 5544,
    advanceAmount: 0,
    advancePaymentMode: "",
    advancePaymentReference: "",
    advancePaymentDate: "",
    balanceAmount: 5544,
    paymentStatus: "unpaid",
    notes: "Staff airport drop for evening flight.",
    statusHistory: [
      {
        status: "draft",
        timestamp: "2026-08-22T16:30:00.000Z",
        note: "Draft created by coordinator",
      },
    ],
    createdAt: "2026-08-22T16:30:00.000Z",
    updatedAt: "2026-08-22T16:30:00.000Z",
  },
];

const getStoredTrips = () => {
  try {
    const stored = localStorage.getItem(TRIPS_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(DEFAULT_TRIPS));
      return DEFAULT_TRIPS;
    }

    const trips = JSON.parse(stored);
    if (!Array.isArray(trips)) {
      throw new Error("Stored trip data is invalid.");
    }
    return trips;
  } catch (error) {
    console.error("Failed to read trips from localStorage:", error);
    return [];
  }
};

const setStoredTrips = (trips) => {
  try {
    localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
  } catch (error) {
    console.error("Failed to save trips to localStorage:", error);
    throw new Error("Failed to persist trip records.", { cause: error });
  }
};

export const getTrips = () => {
  return getStoredTrips();
};

export const getTripById = (id) => {
  if (!id) return null;
  const trips = getStoredTrips();
  return trips.find((t) => t.id === id) || null;
};

/**
 * Validates availability and eligibility before saving or updating if status is not draft/cancelled.
 */
function validateTripEntitiesAndAvailability(tripData, currentTripId = null) {
  const trips = getStoredTrips();

  // Validate Customer
  const customer = getCustomerById(tripData.customerId);
  if (!customer) {
    throw new Error("Selected customer does not exist in master records.");
  }

  // Validate Vehicle
  const vehicle = getVehicleById(tripData.vehicleId);
  if (!vehicle) {
    throw new Error("Selected vehicle does not exist in master records.");
  }
  if (vehicle.isActive === false) {
    throw new Error(
      `Vehicle ${vehicle.vehicleNumber || vehicle.vehicleCode} is inactive and cannot be assigned.`,
    );
  }

  // Validate Driver
  const driver = getDriverById(tripData.driverId);
  if (!driver) {
    throw new Error("Selected driver does not exist in master records.");
  }
  if (driver.isActive === false) {
    throw new Error(
      `Driver ${driver.name} is inactive and cannot be assigned.`,
    );
  }
  if (!isDriverEligible(driver)) {
    throw new Error(
      `Driver ${driver.name} has an expired license or is ineligible for trips.`,
    );
  }

  // Check conflicts if trip is Confirmed or In Progress
  if (tripData.status === "confirmed" || tripData.status === "in_progress") {
    const vehicleConflicts = getVehicleConflicts(
      tripData.vehicleId,
      tripData.startDateTime,
      tripData.endDateTime,
      currentTripId,
      trips,
    );
    if (vehicleConflicts.length > 0) {
      const conflict = vehicleConflicts[0];
      throw new Error(
        `Vehicle is already assigned to ${conflict.tripCode} (${conflict.startDateTime} - ${conflict.endDateTime}).`,
      );
    }

    const driverConflicts = getDriverConflicts(
      tripData.driverId,
      tripData.startDateTime,
      tripData.endDateTime,
      currentTripId,
      trips,
    );
    if (driverConflicts.length > 0) {
      const conflict = driverConflicts[0];
      throw new Error(
        `Driver is already assigned to ${conflict.tripCode} (${conflict.startDateTime} - ${conflict.endDateTime}).`,
      );
    }
  }
}

/**
 * Creates and persists a new trip.
 */
export const saveTrip = (tripData) => {
  const validation = validateTrip(tripData);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    throw new Error(firstError || "Please check all required fields.");
  }

  const initialStatus = tripData.status || "draft";
  const processedData = {
    ...tripData,
    status: initialStatus,
  };

  validateTripEntitiesAndAvailability(processedData, null);

  const durationObj = calculateTripDuration(
    tripData.startDateTime,
    tripData.endDateTime,
  );
  const financial = calculateTripAmount(tripData);
  const totalKm = calculateTotalKm(tripData.openingKm, tripData.closingKm);

  const tripCode = getNextTripCode();
  const now = new Date().toISOString();
  const id = `trp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const newTrip = {
    ...tripData,
    id,
    tripCode,
    status: initialStatus,
    duration: durationObj.text,
    openingKm:
      tripData.openingKm === "" ||
      tripData.openingKm === null ||
      tripData.openingKm === undefined
        ? null
        : Number(tripData.openingKm),
    closingKm:
      tripData.closingKm === "" ||
      tripData.closingKm === null ||
      tripData.closingKm === undefined
        ? null
        : Number(tripData.closingKm),
    totalKm,
    baseRate: toNumber(tripData.baseRate),
    ratePerKm: toNumber(tripData.ratePerKm),
    ratePerHour: toNumber(tripData.ratePerHour),
    ratePerDay: toNumber(tripData.ratePerDay),
    extraKmCharges: toNumber(tripData.extraKmCharges),
    extraHourCharges: toNumber(tripData.extraHourCharges),
    driverCharges: toNumber(tripData.driverCharges),
    tollCharges: toNumber(tripData.tollCharges),
    parkingCharges: toNumber(tripData.parkingCharges),
    otherCharges: toNumber(tripData.otherCharges),
    discountType: tripData.discountType || "fixed",
    discountValue: toNumber(tripData.discountValue),
    discountAmount: financial.discountAmount,
    taxApplicable: Boolean(tripData.taxApplicable),
    taxType: tripData.taxType || "gst_12",
    taxRate: toNumber(tripData.taxRate),
    taxAmount: financial.taxAmount,
    totalAmount: financial.totalAmount,
    advanceAmount: financial.advanceAmount,
    advancePaymentMode: tripData.advancePaymentMode || "",
    advancePaymentReference: tripData.advancePaymentReference || "",
    advancePaymentDate: tripData.advancePaymentDate || "",
    balanceAmount: financial.balanceAmount,
    paymentStatus: financial.paymentStatus,
    notes: tripData.notes || "",
    statusHistory: [
      {
        status: initialStatus,
        timestamp: now,
        note: `Trip created as ${initialStatus}`,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  const trips = getStoredTrips();
  const updatedTrips = [newTrip, ...trips];
  setStoredTrips(updatedTrips);

  return newTrip;
};

/**
 * Updates an existing trip record.
 */
export const updateTrip = (id, tripData) => {
  const trips = getStoredTrips();
  const index = trips.findIndex((t) => t.id === id);

  if (index === -1) {
    throw new Error("Trip record not found.");
  }

  const existingTrip = trips[index];

  const validation = validateTrip({ ...existingTrip, ...tripData });
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0];
    throw new Error(firstError || "Please check all required fields.");
  }

  const targetStatus = tripData.status || existingTrip.status;

  // Validate state transition if status changed
  if (targetStatus !== existingTrip.status) {
    if (!canTransitionStatus(existingTrip.status, targetStatus)) {
      throw new Error(
        `Cannot transition trip from ${existingTrip.status} to ${targetStatus}.`,
      );
    }
  }

  const merged = {
    ...existingTrip,
    ...tripData,
    id: existingTrip.id,
    tripCode: existingTrip.driverCode || existingTrip.tripCode,
    status: targetStatus,
  };

  validateTripEntitiesAndAvailability(merged, id);

  const durationObj = calculateTripDuration(
    merged.startDateTime,
    merged.endDateTime,
  );
  const financial = calculateTripAmount(merged);
  const totalKm = calculateTotalKm(merged.openingKm, merged.closingKm);
  const now = new Date().toISOString();

  const statusHistory = Array.isArray(existingTrip.statusHistory)
    ? [...existingTrip.statusHistory]
    : [];

  if (targetStatus !== existingTrip.status) {
    statusHistory.push({
      status: targetStatus,
      timestamp: now,
      note: tripData.statusNote || `Status changed to ${targetStatus}`,
    });
  }

  const updatedTrip = {
    ...existingTrip,
    ...tripData,
    id: existingTrip.id,
    tripCode: existingTrip.tripCode,
    createdAt: existingTrip.createdAt,
    status: targetStatus,
    duration: durationObj.text,
    openingKm:
      merged.openingKm === "" ||
      merged.openingKm === null ||
      merged.openingKm === undefined
        ? null
        : Number(merged.openingKm),
    closingKm:
      merged.closingKm === "" ||
      merged.closingKm === null ||
      merged.closingKm === undefined
        ? null
        : Number(merged.closingKm),
    totalKm,
    baseRate: toNumber(merged.baseRate),
    ratePerKm: toNumber(merged.ratePerKm),
    ratePerHour: toNumber(merged.ratePerHour),
    ratePerDay: toNumber(merged.ratePerDay),
    extraKmCharges: toNumber(merged.extraKmCharges),
    extraHourCharges: toNumber(merged.extraHourCharges),
    driverCharges: toNumber(merged.driverCharges),
    tollCharges: toNumber(merged.tollCharges),
    parkingCharges: toNumber(merged.parkingCharges),
    otherCharges: toNumber(merged.otherCharges),
    discountType: merged.discountType || "fixed",
    discountValue: toNumber(merged.discountValue),
    discountAmount: financial.discountAmount,
    taxApplicable: Boolean(merged.taxApplicable),
    taxType: merged.taxType || "gst_12",
    taxRate: toNumber(merged.taxRate),
    taxAmount: financial.taxAmount,
    totalAmount: financial.totalAmount,
    advanceAmount: financial.advanceAmount,
    advancePaymentMode: merged.advancePaymentMode || "",
    advancePaymentReference: merged.advancePaymentReference || "",
    advancePaymentDate: merged.advancePaymentDate || "",
    balanceAmount: financial.balanceAmount,
    paymentStatus: financial.paymentStatus,
    notes: merged.notes || "",
    statusHistory,
    updatedAt: now,
  };

  trips[index] = updatedTrip;
  setStoredTrips(trips);

  return updatedTrip;
};

/**
 * Permanently deletes a trip if in Draft status.
 */
export const deleteTrip = (id) => {
  const trips = getStoredTrips();
  const target = trips.find((t) => t.id === id);

  if (!target) {
    throw new Error("Trip not found for deletion.");
  }

  if (target.status !== "draft") {
    throw new Error(
      `Cannot delete a trip in '${target.status}' status. Only Draft trips can be deleted. Cancel the trip instead.`,
    );
  }

  const remaining = trips.filter((t) => t.id !== id);
  setStoredTrips(remaining);

  return target;
};

/**
 * Transitions a Draft trip to Confirmed.
 */
export const confirmTrip = (id) => {
  const trip = getTripById(id);
  if (!trip) throw new Error("Trip not found.");

  return updateTrip(id, {
    status: "confirmed",
    statusNote: "Trip confirmed and scheduled",
  });
};

/**
 * Transitions a Confirmed trip to In Progress.
 */
export const startTrip = (id, { openingKm } = {}) => {
  const trip = getTripById(id);
  if (!trip) throw new Error("Trip not found.");

  const updatePayload = {
    status: "in_progress",
    statusNote: "Trip started",
  };

  if (openingKm !== undefined && openingKm !== null && openingKm !== "") {
    updatePayload.openingKm = Number(openingKm);
  }

  return updateTrip(id, updatePayload);
};

/**
 * Completes an In Progress trip.
 */
export const completeTrip = (
  id,
  { actualEndDateTime, closingKm, additionalCharges = {}, notes } = {},
) => {
  const trip = getTripById(id);
  if (!trip) throw new Error("Trip not found.");

  const updatePayload = {
    status: "completed",
    statusNote: "Trip completed",
    ...additionalCharges,
  };

  if (actualEndDateTime) {
    updatePayload.endDateTime = actualEndDateTime;
  }

  if (closingKm !== undefined && closingKm !== null && closingKm !== "") {
    updatePayload.closingKm = Number(closingKm);
  }

  if (notes) {
    updatePayload.notes = notes;
  }

  return updateTrip(id, updatePayload);
};

/**
 * Cancels a Draft or Confirmed trip.
 */
export const cancelTrip = (id, reason = "") => {
  const trip = getTripById(id);
  if (!trip) throw new Error("Trip not found.");

  if (trip.status === "completed") {
    throw new Error("Completed trips cannot be cancelled.");
  }

  return updateTrip(id, {
    status: "cancelled",
    statusNote: reason ? `Trip cancelled: ${reason}` : "Trip cancelled",
  });
};
