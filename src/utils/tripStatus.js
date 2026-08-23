import { TRIP_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "../constants/trips";

const ALLOWED_TRANSITIONS = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed"],
  completed: [],
  cancelled: [],
};

/**
 * Checks if a status transition is permitted by business rules.
 * @param {string} currentStatus
 * @param {string} targetStatus
 * @returns {boolean}
 */
export function canTransitionStatus(currentStatus, targetStatus) {
  if (!currentStatus || !targetStatus) return false;
  if (currentStatus === targetStatus) return true;

  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

/**
 * Returns array of allowed target statuses from the current status.
 * @param {string} currentStatus
 * @returns {string[]}
 */
export function getAllowedStatusTransitions(currentStatus) {
  return ALLOWED_TRANSITIONS[currentStatus] || [];
}

/**
 * Returns badge info for a trip status.
 * @param {string} status
 * @returns {{ value: string, label: string, variant: 'default'|'primary'|'success'|'warning'|'error' }}
 */
export function getTripStatusBadgeInfo(status) {
  const normalized = (status || "draft").toLowerCase();
  const label = TRIP_STATUS_LABELS[normalized] || "Draft";

  switch (normalized) {
    case "draft":
      return { value: "draft", label, variant: "default" };
    case "confirmed":
      return { value: "confirmed", label, variant: "primary" };
    case "in_progress":
      return { value: "in_progress", label, variant: "warning" };
    case "completed":
      return { value: "completed", label, variant: "success" };
    case "cancelled":
      return { value: "cancelled", label, variant: "error" };
    default:
      return { value: normalized, label, variant: "default" };
  }
}

/**
 * Returns badge info for a payment status.
 * @param {string} paymentStatus
 * @returns {{ value: string, label: string, variant: 'default'|'primary'|'success'|'warning'|'error' }}
 */
export function getPaymentStatusBadgeInfo(paymentStatus) {
  const normalized = (paymentStatus || "unpaid").toLowerCase();
  const label = PAYMENT_STATUS_LABELS[normalized] || "Unpaid";

  switch (normalized) {
    case "paid":
      return { value: "paid", label, variant: "success" };
    case "partially_paid":
      return { value: "partially_paid", label, variant: "warning" };
    case "overpaid":
      return { value: "overpaid", label, variant: "primary" };
    case "unpaid":
    default:
      return { value: "unpaid", label, variant: "error" };
  }
}
