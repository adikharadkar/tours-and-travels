import { getNextVehicleCode } from "./vehicleCodeService";
import { normalizeVehicleNumber } from "../utils/validation/vehicleValidation";

const VEHICLES_STORAGE_KEY = "vehicles";

const DEFAULT_VEHICLES = [
  {
    id: "veh_1",
    vehicleCode: "VEH-0001",
    vehicleNumber: "MH 12 AB 1234",
    vehicleType: "bus",
    make: "BharatBenz",
    model: "1624 Sleeper Coach",
    seatingCapacity: 36,
    fuelType: "diesel",
    ownershipType: "own",
    isActive: true,
    insuranceExpiry: "2026-11-20",
    fitnessExpiry: "2026-10-15",
    pucExpiry: "2026-09-10",
    permitExpiry: "2027-03-01",
    taxExpiry: "2026-12-31",
    createdAt: "2026-01-10T10:00:00.000Z",
    updatedAt: "2026-01-10T10:00:00.000Z",
  },
  {
    id: "veh_2",
    vehicleCode: "VEH-0002",
    vehicleNumber: "MH 14 DE 5678",
    vehicleType: "traveller",
    make: "Force",
    model: "Urbania Luxury 17S",
    seatingCapacity: 17,
    fuelType: "diesel",
    ownershipType: "own",
    isActive: true,
    insuranceExpiry: "2026-09-05",
    fitnessExpiry: "2026-12-10",
    pucExpiry: "2026-09-01",
    permitExpiry: "2026-11-30",
    taxExpiry: "2026-12-31",
    createdAt: "2026-01-15T11:00:00.000Z",
    updatedAt: "2026-01-15T11:00:00.000Z",
  },
  {
    id: "veh_3",
    vehicleCode: "VEH-0003",
    vehicleNumber: "DL 01 XY 9988",
    vehicleType: "car",
    make: "Toyota",
    model: "Innova Crysta 2.4 ZX",
    seatingCapacity: 7,
    fuelType: "diesel",
    ownershipType: "attached",
    isActive: true,
    insuranceExpiry: "2026-08-10",
    fitnessExpiry: "2027-01-15",
    pucExpiry: "2026-08-15",
    permitExpiry: "2026-12-31",
    taxExpiry: "2026-12-31",
    createdAt: "2026-02-01T12:00:00.000Z",
    updatedAt: "2026-02-01T12:00:00.000Z",
  },
  {
    id: "veh_4",
    vehicleCode: "VEH-0004",
    vehicleNumber: "KA 05 MN 4321",
    vehicleType: "mini_bus",
    make: "Tata",
    model: "Starbus Ultra",
    seatingCapacity: 24,
    fuelType: "cng",
    ownershipType: "leased",
    isActive: true,
    insuranceExpiry: "2027-04-15",
    fitnessExpiry: "2027-02-28",
    pucExpiry: "2026-12-05",
    permitExpiry: "2027-05-10",
    taxExpiry: "2027-03-31",
    createdAt: "2026-02-20T15:30:00.000Z",
    updatedAt: "2026-02-20T15:30:00.000Z",
  },
];

const getStoredVehicles = () => {
  try {
    const storedVehicles = localStorage.getItem(VEHICLES_STORAGE_KEY);

    if (!storedVehicles) {
      localStorage.setItem(
        VEHICLES_STORAGE_KEY,
        JSON.stringify(DEFAULT_VEHICLES),
      );
      return DEFAULT_VEHICLES;
    }

    const vehicles = JSON.parse(storedVehicles);

    if (!Array.isArray(vehicles)) {
      throw new Error("Stored vehicle data is invalid.");
    }

    let needsResave = false;
    const normalized = vehicles.map((v, index) => {
      if (!v.id) {
        needsResave = true;
        return {
          ...v,
          id: `veh_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 8)}`,
        };
      }
      return v;
    });

    if (needsResave) {
      localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(normalized));
    }

    return normalized;
  } catch (error) {
    console.error("Failed to read vehicles from localStorage:", error);
    throw new Error("Unable to load vehicle data.", { cause: error });
  }
};

export function getVehicles() {
  return getStoredVehicles();
}

export function getVehicleById(vehicleId) {
  if (!vehicleId) {
    return null;
  }

  const vehicles = getStoredVehicles();
  return vehicles.find((vehicle) => vehicle.id === vehicleId) ?? null;
}

export function deleteVehicle(vehicleId) {
  if (!vehicleId) {
    throw new Error("Vehicle ID is required.");
  }

  const vehicles = getStoredVehicles();
  const vehicleExists = vehicles.some((vehicle) => vehicle.id === vehicleId);

  if (!vehicleExists) {
    throw new Error("Vehicle not found.");
  }

  const updatedVehicles = vehicles.filter(
    (vehicle) => vehicle.id !== vehicleId,
  );

  try {
    localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(updatedVehicles));
  } catch (error) {
    console.error("Failed to delete vehicle from localStorage:", error);
    throw new Error("Unable to delete vehicle.", { cause: error });
  }

  return true;
}

const findDuplicateVehicle = (
  vehicleData,
  vehicles,
  excludedVehicleId = null,
) => {
  const normalizedNumber = normalizeVehicleNumber(vehicleData.vehicleNumber);

  if (!normalizedNumber) return null;

  const existingVehicles = vehicles.filter(
    (vehicle) => vehicle.id !== excludedVehicleId,
  );

  const match = existingVehicles.find(
    (vehicle) =>
      normalizeVehicleNumber(vehicle.vehicleNumber) === normalizedNumber,
  );

  return match || null;
};

export function updateVehicle(vehicleId, vehicleData) {
  if (!vehicleId) {
    throw new Error("Vehicle ID is required.");
  }

  if (!vehicleData || typeof vehicleData !== "object") {
    throw new Error("Invalid vehicle data.");
  }

  const vehicles = getStoredVehicles();

  const vehicleIndex = vehicles.findIndex(
    (vehicle) => vehicle.id === vehicleId,
  );

  if (vehicleIndex === -1) {
    throw new Error("Vehicle not found.");
  }

  const duplicateVehicle = findDuplicateVehicle(
    vehicleData,
    vehicles,
    vehicleId,
  );

  if (duplicateVehicle) {
    throw new Error(
      `Another vehicle already exists with code ${duplicateVehicle.vehicleCode}.`,
    );
  }

  const existingVehicle = vehicles[vehicleIndex];

  const formattedVehicleNumber = normalizeVehicleNumber(
    vehicleData.vehicleNumber,
  );

  const updatedVehicle = {
    ...existingVehicle,
    ...vehicleData,

    vehicleNumber: formattedVehicleNumber || existingVehicle.vehicleNumber,

    id: existingVehicle.id,
    vehicleCode: existingVehicle.vehicleCode,
    createdAt: existingVehicle.createdAt,
    updatedAt: new Date().toISOString(),
  };

  const updatedVehicles = vehicles.map((vehicle, index) =>
    index === vehicleIndex ? updatedVehicle : vehicle,
  );

  try {
    localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(updatedVehicles));
  } catch (error) {
    console.error("Failed to update vehicle in localStorage:", error);

    console.error("Original localStorage error:", error?.cause ?? error);

    throw new Error("Unable to update vehicle.", {
      cause: error,
    });
  }

  return updatedVehicle;
}

export function saveVehicle(vehicleData) {
  if (!vehicleData || typeof vehicleData !== "object") {
    throw new Error("Invalid vehicle data.");
  }

  const vehicles = getStoredVehicles();

  const duplicateVehicle = findDuplicateVehicle(vehicleData, vehicles);

  if (duplicateVehicle) {
    throw new Error(
      `Vehicle already exists with code ${duplicateVehicle.vehicleCode}.`,
    );
  }

  const formattedVehicleNumber = normalizeVehicleNumber(
    vehicleData.vehicleNumber,
  );

  const newId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `veh_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const now = new Date().toISOString();

  const vehicle = {
    ...vehicleData,
    id: newId,
    vehicleNumber: formattedVehicleNumber,
    vehicleCode: getNextVehicleCode(),
    isActive: vehicleData.isActive !== false,
    createdAt: now,
    updatedAt: now,
  };

  const updatedVehicles = [...vehicles, vehicle];

  try {
    localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(updatedVehicles));
  } catch (error) {
    console.error("Failed to save vehicle to localStorage:", error);
    throw new Error("Unable to save vehicle.", { cause: error });
  }

  return vehicle;
}
