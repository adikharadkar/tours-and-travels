const DRIVER_CODE_PREFIX = "DRV";
const DRIVER_CODE_PADDING = 4;

export function generateDriverCode(sequenceNumber) {
  if (!Number.isInteger(sequenceNumber) || sequenceNumber < 1) {
    throw new Error("Sequence number must be a positive integer.");
  }

  return `${DRIVER_CODE_PREFIX}-${String(sequenceNumber).padStart(
    DRIVER_CODE_PADDING,
    "0",
  )}`;
}
