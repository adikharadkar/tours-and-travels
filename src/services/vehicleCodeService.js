import { generateVehicleCode } from "../utils/vehicleCode";

const VEHICLE_SEQUENCE_KEY = "vehicle_sequence";

export function getNextVehicleCode() {
  const currentSequence = Number(
    localStorage.getItem(VEHICLE_SEQUENCE_KEY) ?? "0",
  );

  const nextSequence = currentSequence + 1;

  localStorage.setItem(VEHICLE_SEQUENCE_KEY, String(nextSequence));

  return generateVehicleCode(nextSequence);
}
