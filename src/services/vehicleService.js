import { getNextVehicleCode } from "./vehicleCodeService";
import { normalizeVehicleNumber } from "../utils/validation/vehicleValidation";

const VEHICLES_STORAGE_KEY = "vehicles";

const getStoredVehicles = () => {
  try {
    const storedVehicles = localStorage.getItem(VEHICLES_STORAGE_KEY);

    if (!storedVehicles) {
      return [];
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

  const vehicleIndex = vehicles.findIndex(
    (vehicle) => vehicle.id === vehicleId,
  );

  if (vehicleIndex === -1) {
    throw new Error("Vehicle not found.");
  }

  const existingVehicle = vehicles[vehicleIndex];

  const formattedVehicleNumber = normalizeVehicleNumber(
    vehicleData.vehicleNumber,
  );

  const updatedVehicle = {
    ...existingVehicle,
    ...vehicleData,
    vehicleNumber: formattedVehicleNumber || existingVehicle.vehicleNumber,

    // These must never change during an edit.
    id: existingVehicle.id,
    vehicleCode: existingVehicle.vehicleCode,

    // Preserve original creation time.
    createdAt: existingVehicle.createdAt,

    // Update modification time.
    updatedAt: new Date().toISOString(),
  };

  vehicles[vehicleIndex] = updatedVehicle;

  try {
    localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(vehicles));
  } catch (error) {
    console.error("Failed to update vehicle:", error);
    throw new Error("Unable to update vehicle.", { cause: error });
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
