import { getNextDriverCode } from "./driverCodeService";
import { normalizeLicenseNumber } from "../utils/validation/driverValidation";
import { isDriverEligible } from "../utils/driverLicenseStatus";

const DRIVERS_STORAGE_KEY = "drivers";

const DEFAULT_DRIVERS = [
  {
    id: "drv_1",
    driverCode: "DRV-0001",
    prefix: "mr",
    name: "Rajesh Patil",
    dateOfBirth: "1988-06-15",
    mobile: "9876543210",
    alternateMobile: "9876543211",
    email: "rajesh.patil88@gmail.com",
    address: "Flat 102, Shanti Vihar, Kothrud",
    city: "pune",
    state: "MH",
    pinCode: "411038",
    licenseNumber: "MH1220100012345",
    licenseType: "hmv",
    licenseIssueDate: "2010-05-10",
    licenseExpiryDate: "2027-05-10",
    issuingAuthority: "RTO Pune (MH-12)",
    driverType: "own",
    joiningDate: "2022-04-01",
    employeeReferenceId: "EMP-DRV-01",
    dailyRate: 900,
    notes:
      "Experienced heavy bus driver for interstate tours. Certified defensive driver.",
    isActive: true,
    createdAt: "2026-01-10T10:00:00.000Z",
    updatedAt: "2026-01-10T10:00:00.000Z",
  },
  {
    id: "drv_2",
    driverCode: "DRV-0002",
    prefix: "mr",
    name: "Amit Sharma",
    dateOfBirth: "1992-11-20",
    mobile: "9823012345",
    alternateMobile: "",
    email: "amit.sharma92@yahoo.com",
    address: "B-14, Sector 18, Vashi",
    city: "navi_mumbai",
    state: "MH",
    pinCode: "400703",
    licenseNumber: "MH4320140098765",
    licenseType: "commercial",
    licenseIssueDate: "2014-09-08",
    licenseExpiryDate: "2026-09-08",
    issuingAuthority: "RTO Navi Mumbai (MH-43)",
    driverType: "contract",
    joiningDate: "2023-08-15",
    employeeReferenceId: "CON-044",
    dailyRate: 800,
    notes:
      "Contractual driver for Tempo Traveller and luxury minibuses. Renewal in progress.",
    isActive: true,
    createdAt: "2026-01-15T11:00:00.000Z",
    updatedAt: "2026-01-15T11:00:00.000Z",
  },
  {
    id: "drv_3",
    driverCode: "DRV-0003",
    prefix: "mr",
    name: "Suresh Pawar",
    dateOfBirth: "1985-03-25",
    mobile: "9766551122",
    alternateMobile: "9766551123",
    email: "",
    address: "Plot 45, Garkheda Parisar",
    city: "aurangabad",
    state: "MH",
    pinCode: "431005",
    licenseNumber: "MH2020080055443",
    licenseType: "transport",
    licenseIssueDate: "2008-08-01",
    licenseExpiryDate: "2026-08-01",
    issuingAuthority: "RTO Aurangabad (MH-20)",
    driverType: "attached",
    joiningDate: "2024-01-10",
    employeeReferenceId: "ATT-V02",
    dailyRate: 750,
    notes:
      "Attached owner-operator driver. License expired recently, awaiting medical clearance.",
    isActive: true,
    createdAt: "2026-02-01T12:00:00.000Z",
    updatedAt: "2026-02-01T12:00:00.000Z",
  },
  {
    id: "drv_4",
    driverCode: "DRV-0004",
    prefix: "mr",
    name: "Manoj Deshmukh",
    dateOfBirth: "1990-09-12",
    mobile: "9422019988",
    alternateMobile: "",
    email: "manoj.deshmukh@gmail.com",
    address: "78, Ring Road, Trimurti Nagar",
    city: "nagpur",
    state: "MH",
    pinCode: "440022",
    licenseNumber: "MH3120120077889",
    licenseType: "lmv",
    licenseIssueDate: "2012-11-30",
    licenseExpiryDate: "2027-11-30",
    issuingAuthority: "RTO Nagpur (MH-31)",
    driverType: "own",
    joiningDate: "2023-03-01",
    employeeReferenceId: "EMP-DRV-04",
    dailyRate: 850,
    notes:
      "Currently on extended medical leave. Mark inactive until resume notice.",
    isActive: false,
    createdAt: "2026-02-20T15:30:00.000Z",
    updatedAt: "2026-02-20T15:30:00.000Z",
  },
];

const getStoredDrivers = () => {
  try {
    const storedDrivers = localStorage.getItem(DRIVERS_STORAGE_KEY);

    if (!storedDrivers) {
      localStorage.setItem(
        DRIVERS_STORAGE_KEY,
        JSON.stringify(DEFAULT_DRIVERS),
      );
      return DEFAULT_DRIVERS;
    }

    const drivers = JSON.parse(storedDrivers);

    if (!Array.isArray(drivers)) {
      throw new Error("Stored driver data is invalid.");
    }

    return drivers;
  } catch (error) {
    console.error("Failed to read drivers from localStorage:", error);
    return [];
  }
};

const setStoredDrivers = (drivers) => {
  try {
    localStorage.setItem(DRIVERS_STORAGE_KEY, JSON.stringify(drivers));
  } catch (error) {
    console.error("Failed to save drivers to localStorage:", error);
    throw new Error("Failed to persist driver records.", { cause: error });
  }
};

export const getDrivers = () => {
  return getStoredDrivers();
};

export const getDriverById = (id) => {
  if (!id) return null;
  const drivers = getStoredDrivers();
  return drivers.find((driver) => driver.id === id) || null;
};

/**
 * Returns drivers eligible for trip assignment (Active + Valid/Expiring license, not Expired).
 */
export const getEligibleDrivers = () => {
  const drivers = getStoredDrivers();
  return drivers.filter((driver) => isDriverEligible(driver));
};

export const saveDriver = (driverData) => {
  const drivers = getStoredDrivers();

  const normalizedLicense = normalizeLicenseNumber(driverData.licenseNumber);

  // Uniqueness check: Driving License Number
  const isDuplicate = drivers.some(
    (driver) =>
      normalizeLicenseNumber(driver.licenseNumber) === normalizedLicense,
  );

  if (isDuplicate) {
    throw new Error(
      `Driver already exists with license number ${normalizedLicense}.`,
    );
  }

  const driverCode = getNextDriverCode();
  const now = new Date().toISOString();

  const newDriver = {
    ...driverData,
    id: `drv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    driverCode,
    licenseNumber: normalizedLicense,
    dailyRate:
      driverData.dailyRate === "" ||
      driverData.dailyRate === null ||
      driverData.dailyRate === undefined
        ? null
        : Number(driverData.dailyRate),
    isActive: driverData.isActive !== false,
    createdAt: now,
    updatedAt: now,
  };

  const updatedDrivers = [newDriver, ...drivers];
  setStoredDrivers(updatedDrivers);

  return newDriver;
};

export const updateDriver = (id, driverData) => {
  const drivers = getStoredDrivers();
  const existingIndex = drivers.findIndex((driver) => driver.id === id);

  if (existingIndex === -1) {
    throw new Error("Driver record not found.");
  }

  const existingDriver = drivers[existingIndex];
  const normalizedLicense = normalizeLicenseNumber(driverData.licenseNumber);

  // Uniqueness check against other drivers
  const isDuplicate = drivers.some(
    (driver) =>
      driver.id !== id &&
      normalizeLicenseNumber(driver.licenseNumber) === normalizedLicense,
  );

  if (isDuplicate) {
    throw new Error(
      `Driver already exists with license number ${normalizedLicense}.`,
    );
  }

  const updatedDriver = {
    ...existingDriver,
    ...driverData,
    // Critical immutable fields:
    id: existingDriver.id,
    driverCode: existingDriver.driverCode,
    createdAt: existingDriver.createdAt,
    // Updated fields:
    licenseNumber: normalizedLicense,
    dailyRate:
      driverData.dailyRate === "" ||
      driverData.dailyRate === null ||
      driverData.dailyRate === undefined
        ? null
        : Number(driverData.dailyRate),
    isActive: driverData.isActive !== false,
    updatedAt: new Date().toISOString(),
  };

  drivers[existingIndex] = updatedDriver;
  setStoredDrivers(drivers);

  return updatedDriver;
};

export const deleteDriver = (id) => {
  const drivers = getStoredDrivers();
  const targetDriver = drivers.find((driver) => driver.id === id);

  if (!targetDriver) {
    throw new Error("Driver not found for deletion.");
  }

  const remainingDrivers = drivers.filter((driver) => driver.id !== id);
  setStoredDrivers(remainingDrivers);

  return targetDriver;
};
