import { generateCustomerCode } from "../utils/customerCode";

const CUSTOMER_SEQUENCE_KEY = "customer_sequence";

export function getNextCustomerCode() {
  const currentSequence = Number(
    localStorage.getItem(CUSTOMER_SEQUENCE_KEY) ?? "0",
  );

  const nextSequence = currentSequence + 1;

  localStorage.setItem(CUSTOMER_SEQUENCE_KEY, String(nextSequence));

  return generateCustomerCode(nextSequence);
}
