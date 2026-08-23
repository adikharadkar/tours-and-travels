import { generateCustomerCode } from "../utils/customerCode";

const CUSTOMER_SEQUENCE_KEY = "customer_sequence";

export function getNextCustomerCode() {
  let currentSequence = Number(
    localStorage.getItem(CUSTOMER_SEQUENCE_KEY) ?? "0",
  );

  if (currentSequence === 0) {
    try {
      const stored = localStorage.getItem("customers");
      if (stored) {
        currentSequence = JSON.parse(stored).length;
      }
    } catch (error) {
      console.warn("Failed to parse existing customers count:", error);
    }
  }

  const nextSequence = currentSequence + 1;

  localStorage.setItem(CUSTOMER_SEQUENCE_KEY, String(nextSequence));

  return generateCustomerCode(nextSequence);
}
