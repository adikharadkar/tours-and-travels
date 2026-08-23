const VEHICLE_CODE_PREFIX = "VEH";
const VEHICLE_CODE_PADDING = 4;

export function generateVehicleCode(sequenceNumber) {
  if (!Number.isInteger(sequenceNumber) || sequenceNumber < 1) {
    throw new Error("Sequence number must be a positive integer.");
  }

  return `${VEHICLE_CODE_PREFIX}-${String(sequenceNumber).padStart(
    VEHICLE_CODE_PADDING,
    "0",
  )}`;
}
