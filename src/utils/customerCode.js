const CUSTOMER_CODE_PREFIX = "CUS";
const CUSTOMER_CODE_PADDING = 4;

export function generateCustomerCode(sequenceNumber) {
  if (!Number.isInteger(sequenceNumber) || sequenceNumber < 1) {
    throw new Error("Sequence number must be a positive integer.");
  }

  return `${CUSTOMER_CODE_PREFIX}-${String(sequenceNumber).padStart(
    CUSTOMER_CODE_PADDING,
    "0",
  )}`;
}
