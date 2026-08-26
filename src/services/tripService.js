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
    id: "trp_apex_01",
    tripCode: "TRP-0101",
    bookingDate: "2026-08-03",
    tripType: "outstation",
    status: "completed",
    customerId: "cust_apex_1",
    vehicleId: "veh_1",
    vehicleNumber: "MH 12 AB 1234",
    driverId: "drv_1",
    driverName: "Rajesh Patil",
    referenceNumber: "APX-AUG-101",
    pickupLocation: "Mumbai HQ (BKC)",
    dropLocation: "Pune MIDC Plant",
    stops: "Navi Mumbai, Expressway Plaza",
    pickupInstructions: "Executive shuttle service for senior engineers",
    startDateTime: "2026-08-04T07:30",
    endDateTime: "2026-08-04T20:30",
    duration: "13 Hours",
    openingKm: 45100,
    closingKm: 45420,
    totalKm: 320,
    rateType: "per_day",
    baseRate: 28000,
    ratePerKm: 22,
    ratePerHour: 300,
    ratePerDay: 28000,
    extraKmCharges: 1400,
    extraHourCharges: 600,
    driverCharges: 1000,
    tollCharges: 1200,
    parkingCharges: 400,
    otherCharges: 0,
    discountType: "fixed",
    discountValue: 0,
    discountAmount: 0,
    taxApplicable: true,
    taxType: "gst_12",
    taxRate: 12,
    taxAmount: 3912,
    totalAmount: 36512,
    advanceAmount: 0,
    balanceAmount: 36512,
    paymentStatus: "unpaid",
    notes: "BharatBenz 36S AC coach dispatched on time.",
    createdAt: "2026-08-03T09:00:00.000Z",
    updatedAt: "2026-08-04T20:30:00.000Z",
  },
  {
    id: "trp_apex_02",
    tripCode: "TRP-0102",
    bookingDate: "2026-08-07",
    tripType: "outstation",
    status: "completed",
    customerId: "cust_apex_1",
    vehicleId: "veh_2",
    vehicleNumber: "MH 14 DE 5678",
    driverId: "drv_2",
    driverName: "Amit Sharma",
    referenceNumber: "APX-AUG-102",
    pickupLocation: "Andheri East Tech Center",
    dropLocation: "Nashik Manufacturing Facility",
    stops: "Kasara Ghat, Igatpuri Halt",
    pickupInstructions: "Project team site inspection visit",
    startDateTime: "2026-08-08T06:00",
    endDateTime: "2026-08-08T22:00",
    duration: "16 Hours",
    openingKm: 28100,
    closingKm: 28480,
    totalKm: 380,
    rateType: "per_trip",
    baseRate: 22500,
    ratePerKm: 18,
    ratePerHour: 250,
    ratePerDay: 0,
    extraKmCharges: 0,
    extraHourCharges: 500,
    driverCharges: 800,
    tollCharges: 680,
    parkingCharges: 250,
    otherCharges: 0,
    discountType: "fixed",
    discountValue: 0,
    discountAmount: 0,
    taxApplicable: true,
    taxType: "gst_12",
    taxRate: 12,
    taxAmount: 2859.6,
    totalAmount: 27589.6,
    advanceAmount: 0,
    balanceAmount: 27589.6,
    paymentStatus: "unpaid",
    notes: "Force Urbania 17S. Customer confirmed completion.",
    createdAt: "2026-08-07T11:00:00.000Z",
    updatedAt: "2026-08-08T22:00:00.000Z",
  },
  {
    id: "trp_apex_03",
    tripCode: "TRP-0103",
    bookingDate: "2026-08-11",
    tripType: "airport_transfer",
    status: "completed",
    customerId: "cust_apex_1",
    vehicleId: "veh_3",
    vehicleNumber: "DL 01 XY 9988",
    driverId: "drv_1",
    driverName: "Rajesh Patil",
    referenceNumber: "APX-AUG-103",
    pickupLocation: "Mumbai Airport T2",
    dropLocation: "Navi Mumbai Tech Park",
    stops: "",
    pickupInstructions: "Boardroom executive arrival (Flight UK-812)",
    startDateTime: "2026-08-12T09:00",
    endDateTime: "2026-08-12T14:00",
    duration: "5 Hours",
    openingKm: 61000,
    closingKm: 61095,
    totalKm: 95,
    rateType: "per_trip",
    baseRate: 6800,
    ratePerKm: 0,
    ratePerHour: 0,
    ratePerDay: 0,
    extraKmCharges: 0,
    extraHourCharges: 0,
    driverCharges: 0,
    tollCharges: 350,
    parkingCharges: 200,
    otherCharges: 0,
    discountType: "fixed",
    discountValue: 0,
    discountAmount: 0,
    taxApplicable: true,
    taxType: "gst_12",
    taxRate: 12,
    taxAmount: 882,
    totalAmount: 8232,
    advanceAmount: 0,
    balanceAmount: 8232,
    paymentStatus: "unpaid",
    notes: "Innova Crysta VIP transfer.",
    createdAt: "2026-08-11T14:00:00.000Z",
    updatedAt: "2026-08-12T14:00:00.000Z",
  },
  {
    id: "trp_apex_04",
    tripCode: "TRP-0104",
    bookingDate: "2026-08-14",
    tripType: "outstation",
    status: "completed",
    customerId: "cust_apex_1",
    vehicleId: "veh_1",
    vehicleNumber: "MH 12 AB 1234",
    driverId: "drv_1",
    driverName: "Rajesh Patil",
    referenceNumber: "APX-AUG-104",
    pickupLocation: "Pune Hinjawadi Phase 1",
    dropLocation: "Mumbai Port Trust Area",
    stops: "Talegaon, Chembur Highway",
    pickupInstructions: "Cargo logistics and staff transit team",
    startDateTime: "2026-08-15T08:00",
    endDateTime: "2026-08-15T19:30",
    duration: "11 Hours 30 Mins",
    openingKm: 45700,
    closingKm: 45980,
    totalKm: 280,
    rateType: "per_trip",
    baseRate: 18400,
    ratePerKm: 20,
    ratePerHour: 0,
    ratePerDay: 0,
    extraKmCharges: 0,
    extraHourCharges: 0,
    driverCharges: 800,
    tollCharges: 980,
    parkingCharges: 250,
    otherCharges: 0,
    discountType: "fixed",
    discountValue: 0,
    discountAmount: 0,
    taxApplicable: true,
    taxType: "gst_12",
    taxRate: 12,
    taxAmount: 2451.6,
    totalAmount: 22881.6,
    advanceAmount: 0,
    balanceAmount: 22881.6,
    paymentStatus: "unpaid",
    notes: "Single day return logistics transit.",
    createdAt: "2026-08-14T10:00:00.000Z",
    updatedAt: "2026-08-15T19:30:00.000Z",
  },
  {
    id: "trp_apex_05",
    tripCode: "TRP-0105",
    bookingDate: "2026-08-18",
    tripType: "outstation",
    status: "completed",
    customerId: "cust_apex_1",
    vehicleId: "veh_1",
    vehicleNumber: "MH 12 AB 1234",
    driverId: "drv_1",
    driverName: "Rajesh Patil",
    referenceNumber: "APX-AUG-105",
    pickupLocation: "Thane Distribution Hub",
    dropLocation: "JNPT Port Terminal Container Yard",
    stops: "Turbhe, Belapur, Uran",
    pickupInstructions: "Port logistics operations inspection team",
    startDateTime: "2026-08-19T07:00",
    endDateTime: "2026-08-19T21:00",
    duration: "14 Hours",
    openingKm: 46000,
    closingKm: 46350,
    totalKm: 350,
    rateType: "per_trip",
    baseRate: 34200,
    ratePerKm: 24,
    ratePerHour: 300,
    ratePerDay: 0,
    extraKmCharges: 1200,
    extraHourCharges: 600,
    driverCharges: 1200,
    tollCharges: 1450,
    parkingCharges: 500,
    otherCharges: 0,
    discountType: "fixed",
    discountValue: 0,
    discountAmount: 0,
    taxApplicable: true,
    taxType: "gst_12",
    taxRate: 12,
    taxAmount: 4698,
    totalAmount: 43848,
    advanceAmount: 0,
    balanceAmount: 43848,
    paymentStatus: "unpaid",
    notes: "Heavy passenger movement. Extra parking for terminal gate.",
    createdAt: "2026-08-18T09:30:00.000Z",
    updatedAt: "2026-08-19T21:00:00.000Z",
  },
  {
    id: "trp_apex_06",
    tripCode: "TRP-0106",
    bookingDate: "2026-08-21",
    tripType: "package",
    status: "completed",
    customerId: "cust_apex_1",
    vehicleId: "veh_2",
    vehicleNumber: "MH 14 DE 5678",
    driverId: "drv_2",
    driverName: "Amit Sharma",
    referenceNumber: "APX-AUG-106",
    pickupLocation: "Kurla Complex HQ",
    dropLocation: "Chhatrapati Sambhajinagar Facility",
    stops: "Ahmednagar MIDC, Waluj",
    pickupInstructions: "Regional management quarterly tour",
    startDateTime: "2026-08-22T06:00",
    endDateTime: "2026-08-23T22:00",
    duration: "2 Days",
    openingKm: 28500,
    closingKm: 29250,
    totalKm: 750,
    rateType: "package",
    baseRate: 42000,
    ratePerKm: 20,
    ratePerHour: 0,
    ratePerDay: 21000,
    extraKmCharges: 0,
    extraHourCharges: 0,
    driverCharges: 2000,
    tollCharges: 1850,
    parkingCharges: 450,
    otherCharges: 0,
    discountType: "fixed",
    discountValue: 0,
    discountAmount: 0,
    taxApplicable: true,
    taxType: "gst_12",
    taxRate: 12,
    taxAmount: 5556,
    totalAmount: 51856,
    advanceAmount: 0,
    balanceAmount: 51856,
    paymentStatus: "unpaid",
    notes: "2-Day corporate tour package.",
    createdAt: "2026-08-21T11:00:00.000Z",
    updatedAt: "2026-08-23T22:00:00.000Z",
  },
  {
    id: "trp_apex_07",
    tripCode: "TRP-0107",
    bookingDate: "2026-08-23",
    tripType: "outstation",
    status: "completed",
    customerId: "cust_apex_1",
    vehicleId: "veh_3",
    vehicleNumber: "DL 01 XY 9988",
    driverId: "drv_1",
    driverName: "Rajesh Patil",
    referenceNumber: "APX-AUG-107",
    pickupLocation: "BKC Office",
    dropLocation: "Pune Hinjawadi Phase 2",
    stops: "Wakad Bridge",
    pickupInstructions: "Executive transport",
    startDateTime: "2026-08-24T08:00",
    endDateTime: "2026-08-24T18:00",
    duration: "10 Hours",
    openingKm: 61150,
    closingKm: 61460,
    totalKm: 310,
    rateType: "per_trip",
    baseRate: 7500,
    ratePerKm: 16,
    ratePerHour: 0,
    ratePerDay: 0,
    extraKmCharges: 0,
    extraHourCharges: 0,
    driverCharges: 500,
    tollCharges: 850,
    parkingCharges: 200,
    otherCharges: 0,
    discountType: "fixed",
    discountValue: 0,
    discountAmount: 0,
    taxApplicable: true,
    taxType: "gst_12",
    taxRate: 12,
    taxAmount: 1086,
    totalAmount: 10136,
    advanceAmount: 0,
    balanceAmount: 10136,
    paymentStatus: "unpaid",
    notes: "Completed smoothly.",
    createdAt: "2026-08-23T15:00:00.000Z",
    updatedAt: "2026-08-24T18:00:00.000Z",
  },
  {
    id: "trp_apex_08",
    tripCode: "TRP-0108",
    bookingDate: "2026-08-24",
    tripType: "airport_transfer",
    status: "completed",
    customerId: "cust_apex_1",
    vehicleId: "veh_3",
    vehicleNumber: "DL 01 XY 9988",
    driverId: "drv_2",
    driverName: "Amit Sharma",
    referenceNumber: "APX-AUG-108",
    pickupLocation: "Mumbai International Airport",
    dropLocation: "South Bombay Luxury Hotels",
    stops: "Sea Link",
    pickupInstructions: "VIP delegation from Tokyo office",
    startDateTime: "2026-08-25T09:00",
    endDateTime: "2026-08-25T15:00",
    duration: "6 Hours",
    openingKm: 61500,
    closingKm: 61590,
    totalKm: 90,
    rateType: "per_trip",
    baseRate: 12000,
    ratePerKm: 0,
    ratePerHour: 0,
    ratePerDay: 0,
    extraKmCharges: 0,
    extraHourCharges: 0,
    driverCharges: 500,
    tollCharges: 400,
    parkingCharges: 300,
    otherCharges: 0,
    discountType: "fixed",
    discountValue: 0,
    discountAmount: 0,
    taxApplicable: true,
    taxType: "gst_12",
    taxRate: 12,
    taxAmount: 1584,
    totalAmount: 14784,
    advanceAmount: 0,
    balanceAmount: 14784,
    paymentStatus: "unpaid",
    notes: "VIP guest pickup service completed.",
    createdAt: "2026-08-24T16:00:00.000Z",
    updatedAt: "2026-08-25T15:00:00.000Z",
  },
  {
    id: "trp_apex_09",
    tripCode: "TRP-0109",
    bookingDate: "2026-08-25",
    tripType: "outstation",
    status: "in_progress",
    customerId: "cust_apex_1",
    vehicleId: "veh_1",
    vehicleNumber: "MH 12 AB 1234",
    driverId: "drv_1",
    driverName: "Rajesh Patil",
    referenceNumber: "APX-AUG-109",
    pickupLocation: "BKC Mumbai",
    dropLocation: "Goa Tech Summit Venue",
    stops: "Kolhapur, Nipani",
    pickupInstructions: "Annual offsite delegate coach",
    startDateTime: "2026-08-25T06:00",
    endDateTime: "2026-08-27T20:00",
    duration: "2 Days 14 Hours",
    openingKm: 46400,
    closingKm: null,
    totalKm: null,
    rateType: "package",
    baseRate: 48000,
    ratePerKm: 22,
    ratePerHour: 0,
    ratePerDay: 24000,
    extraKmCharges: 0,
    extraHourCharges: 0,
    driverCharges: 2500,
    tollCharges: 2200,
    parkingCharges: 600,
    otherCharges: 0,
    discountType: "fixed",
    discountValue: 0,
    discountAmount: 0,
    taxApplicable: true,
    taxType: "gst_12",
    taxRate: 12,
    taxAmount: 6396,
    totalAmount: 59696,
    advanceAmount: 30000,
    balanceAmount: 29696,
    paymentStatus: "partially_paid",
    notes: "Currently on route near Satara.",
    createdAt: "2026-08-25T05:00:00.000Z",
    updatedAt: "2026-08-25T06:00:00.000Z",
  },
  {
    id: "trp_apex_10",
    tripCode: "TRP-0001",
    bookingDate: "2026-08-01",
    tripType: "outstation",
    status: "completed",
    customerId: "cust_apex_1",
    vehicleId: "veh_1",
    vehicleNumber: "MH 12 AB 1234",
    driverId: "drv_1",
    driverName: "Rajesh Patil",
    referenceNumber: "BK-APX-981",
    pickupLocation: "Chhatrapati Sambhajinagar",
    dropLocation: "Pune",
    stops: "MIDC Waluj, Ahmednagar Highway",
    startDateTime: "2026-08-02T08:00",
    endDateTime: "2026-08-03T18:00",
    duration: "1 Day 10 Hours",
    openingKm: 44800,
    closingKm: 45100,
    totalKm: 300,
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
    balanceAmount: 12400,
    paymentStatus: "partially_paid",
    notes: "Already invoiced in INV-2026-084",
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-03T18:00:00.000Z",
  },
  {
    id: "trp_zenith_01",
    tripCode: "TRP-0201",
    bookingDate: "2026-08-05",
    tripType: "outstation",
    status: "completed",
    customerId: "cust_zenith_6",
    vehicleId: "veh_2",
    vehicleNumber: "MH 14 DE 5678",
    driverId: "drv_2",
    driverName: "Amit Sharma",
    referenceNumber: "ZNT-AUG-01",
    pickupLocation: "Hinjawadi Phase 2, Pune",
    dropLocation: "Mahabaleshwar Resort",
    stops: "Shirwal, Wai",
    pickupInstructions: "Annual engineering leadership retreat",
    startDateTime: "2026-08-06T06:00",
    endDateTime: "2026-08-07T21:00",
    duration: "2 Days",
    openingKm: 27800,
    closingKm: 28320,
    totalKm: 520,
    rateType: "package",
    baseRate: 36000,
    ratePerKm: 20,
    ratePerHour: 0,
    ratePerDay: 18000,
    extraKmCharges: 0,
    extraHourCharges: 0,
    driverCharges: 2000,
    tollCharges: 1400,
    parkingCharges: 400,
    otherCharges: 0,
    discountType: "fixed",
    discountValue: 0,
    discountAmount: 0,
    taxApplicable: true,
    taxType: "gst_12",
    taxRate: 12,
    taxAmount: 4776,
    totalAmount: 44576,
    advanceAmount: 0,
    balanceAmount: 44576,
    paymentStatus: "unpaid",
    notes: "Force Urbania 17S luxury offsite booking.",
    createdAt: "2026-08-05T10:00:00.000Z",
    updatedAt: "2026-08-07T21:00:00.000Z",
  },
  {
    id: "trp_zenith_02",
    tripCode: "TRP-0202",
    bookingDate: "2026-08-12",
    tripType: "outstation",
    status: "completed",
    customerId: "cust_zenith_6",
    vehicleId: "veh_3",
    vehicleNumber: "DL 01 XY 9988",
    driverId: "drv_1",
    driverName: "Rajesh Patil",
    referenceNumber: "ZNT-AUG-02",
    pickupLocation: "Pune Airport (PNQ)",
    dropLocation: "Hinjawadi Tech Park",
    stops: "",
    pickupInstructions: "Client partner VIP pickup",
    startDateTime: "2026-08-13T10:00",
    endDateTime: "2026-08-13T16:00",
    duration: "6 Hours",
    openingKm: 60800,
    closingKm: 60880,
    totalKm: 80,
    rateType: "per_trip",
    baseRate: 5500,
    ratePerKm: 0,
    ratePerHour: 0,
    ratePerDay: 0,
    extraKmCharges: 0,
    extraHourCharges: 0,
    driverCharges: 0,
    tollCharges: 150,
    parkingCharges: 250,
    otherCharges: 0,
    discountType: "fixed",
    discountValue: 0,
    discountAmount: 0,
    taxApplicable: true,
    taxType: "gst_12",
    taxRate: 12,
    taxAmount: 708,
    totalAmount: 6608,
    advanceAmount: 0,
    balanceAmount: 6608,
    paymentStatus: "unpaid",
    notes: "Executive Sedan transit.",
    createdAt: "2026-08-12T14:00:00.000Z",
    updatedAt: "2026-08-13T16:00:00.000Z",
  },
  {
    id: "trp_gt_01",
    tripCode: "TRP-0301",
    bookingDate: "2026-08-14",
    tripType: "outstation",
    status: "completed",
    customerId: "cust_gt_2",
    vehicleId: "veh_1",
    vehicleNumber: "MH 12 AB 1234",
    driverId: "drv_1",
    driverName: "Rajesh Patil",
    referenceNumber: "GT-AUG-301",
    pickupLocation: "Bengaluru Whitefield",
    dropLocation: "Chennai Central Hub",
    stops: "Hosur, Krishnagiri, Vellore",
    pickupInstructions: "Interstate shuttle transport",
    startDateTime: "2026-08-15T05:00",
    endDateTime: "2026-08-15T22:00",
    duration: "17 Hours",
    openingKm: 45000,
    closingKm: 45380,
    totalKm: 380,
    rateType: "per_trip",
    baseRate: 38000,
    ratePerKm: 25,
    ratePerHour: 0,
    ratePerDay: 0,
    extraKmCharges: 0,
    extraHourCharges: 0,
    driverCharges: 1500,
    tollCharges: 1800,
    parkingCharges: 300,
    otherCharges: 0,
    discountType: "fixed",
    discountValue: 0,
    discountAmount: 0,
    taxApplicable: true,
    taxType: "gst_12",
    taxRate: 12,
    taxAmount: 4992,
    totalAmount: 46592,
    advanceAmount: 0,
    balanceAmount: 46592,
    paymentStatus: "unpaid",
    notes: "Interstate route movement.",
    createdAt: "2026-08-14T12:00:00.000Z",
    updatedAt: "2026-08-15T22:00:00.000Z",
  },
  {
    id: "trp_gt_02",
    tripCode: "TRP-0302",
    bookingDate: "2026-08-18",
    tripType: "outstation",
    status: "completed",
    customerId: "cust_gt_2",
    vehicleId: "veh_2",
    vehicleNumber: "MH 14 DE 5678",
    driverId: "drv_2",
    driverName: "Amit Sharma",
    referenceNumber: "GT-AUG-302",
    pickupLocation: "Bengaluru Electronic City",
    dropLocation: "Mysuru Industrial Estate",
    stops: "Bidadi, Mandya",
    pickupInstructions: "Supply chain operations team",
    startDateTime: "2026-08-19T07:00",
    endDateTime: "2026-08-19T20:00",
    duration: "13 Hours",
    openingKm: 28400,
    closingKm: 28720,
    totalKm: 320,
    rateType: "per_trip",
    baseRate: 26000,
    ratePerKm: 20,
    ratePerHour: 0,
    ratePerDay: 0,
    extraKmCharges: 0,
    extraHourCharges: 0,
    driverCharges: 800,
    tollCharges: 950,
    parkingCharges: 250,
    otherCharges: 0,
    discountType: "fixed",
    discountValue: 0,
    discountAmount: 0,
    taxApplicable: true,
    taxType: "gst_12",
    taxRate: 12,
    taxAmount: 3360,
    totalAmount: 31360,
    advanceAmount: 0,
    balanceAmount: 31360,
    paymentStatus: "unpaid",
    notes: "Completed without incident.",
    createdAt: "2026-08-18T10:00:00.000Z",
    updatedAt: "2026-08-19T20:00:00.000Z",
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
