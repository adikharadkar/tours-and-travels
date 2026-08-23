const TRIP_CODE_PREFIX = "TRP";
const TRIP_CODE_PADDING = 4;

export function generateTripCode(sequenceNumber) {
  if (!Number.isInteger(sequenceNumber) || sequenceNumber < 1) {
    throw new Error("Sequence number must be a positive integer.");
  }

  return `${TRIP_CODE_PREFIX}-${String(sequenceNumber).padStart(
    TRIP_CODE_PADDING,
    "0",
  )}`;
}
