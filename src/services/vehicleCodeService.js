import { generateVehicleCode } from "../utils/vehicleCode";

const VEHICLE_SEQUENCE_KEY = "vehicle_sequence";

export function getNextVehicleCode() {
  let currentSequence = Number(
    localStorage.getItem(VEHICLE_SEQUENCE_KEY) ?? "0",
  );

  if (currentSequence === 0) {
    try {
      const stored = localStorage.getItem("vehicles");
      if (stored) {
        currentSequence = JSON.parse(stored).length;
      }
    } catch (error) {
      console.warn("Failed to parse existing vehicles count:", error);
    }
  }

  const nextSequence = currentSequence + 1;

  localStorage.setItem(VEHICLE_SEQUENCE_KEY, String(nextSequence));

  return generateVehicleCode(nextSequence);
}
