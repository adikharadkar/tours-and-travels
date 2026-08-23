import { generateTripCode } from "../utils/tripCode";

const TRIP_SEQUENCE_KEY = "trip_sequence";

export function getNextTripCode() {
  let currentSequence = Number(localStorage.getItem(TRIP_SEQUENCE_KEY) ?? "0");

  if (currentSequence === 0) {
    try {
      const stored = localStorage.getItem("trips");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          currentSequence = parsed.length;
        }
      }
    } catch (error) {
      console.warn("Failed to parse existing trips count:", error);
    }
  }

  const nextSequence = currentSequence + 1;
  localStorage.setItem(TRIP_SEQUENCE_KEY, String(nextSequence));

  return generateTripCode(nextSequence);
}
