import { generateDriverCode } from "../utils/driverCode";

const DRIVER_SEQUENCE_KEY = "driver_sequence";

export function getNextDriverCode() {
  let currentSequence = Number(
    localStorage.getItem(DRIVER_SEQUENCE_KEY) ?? "0",
  );

  if (currentSequence === 0) {
    try {
      const stored = localStorage.getItem("drivers");
      if (stored) {
        currentSequence = JSON.parse(stored).length;
      }
    } catch (error) {
      console.warn("Failed to parse existing drivers count:", error);
    }
  }

  const nextSequence = currentSequence + 1;

  localStorage.setItem(DRIVER_SEQUENCE_KEY, String(nextSequence));

  return generateDriverCode(nextSequence);
}
