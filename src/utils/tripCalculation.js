/**
 * Helper to safely convert values to finite numbers (defaults to 0).
 */
export function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * Calculates human-readable and structured duration between two date-time strings.
 * @param {string} startDateTime - e.g. "2026-08-23T08:00" or ISO string
 * @param {string} endDateTime - e.g. "2026-08-25T18:00" or ISO string
 * @returns {{ text: string, days: number, hours: number, minutes: number, totalHours: number, totalDays: number }}
 */
export function calculateTripDuration(startDateTime, endDateTime) {
  if (!startDateTime || !endDateTime) {
    return {
      text: "—",
      days: 0,
      hours: 0,
      minutes: 0,
      totalHours: 0,
      totalDays: 0,
    };
  }

  const start = new Date(startDateTime);
  const end = new Date(endDateTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return {
      text: "Invalid duration",
      days: 0,
      hours: 0,
      minutes: 0,
      totalHours: 0,
      totalDays: 0,
    };
  }

  const diffMs = end.getTime() - start.getTime();
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
  const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  const parts = [];
  if (days > 0) {
    parts.push(`${days} ${days === 1 ? "Day" : "Days"}`);
  }
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? "Hour" : "Hours"}`);
  }
  if (minutes > 0 && days === 0) {
    parts.push(`${minutes} ${minutes === 1 ? "Min" : "Mins"}`);
  }

  const text = parts.length > 0 ? parts.join(" ") : "0 Hours";

  return {
    text,
    days,
    hours,
    minutes,
    totalHours,
    totalDays: totalDays || 1,
  };
}

/**
 * Calculates total kilometers from opening and closing KM readings.
 * @param {number|string|null} openingKm
 * @param {number|string|null} closingKm
 * @returns {number|null}
 */
export function calculateTotalKm(openingKm, closingKm) {
  if (
    openingKm === null ||
    openingKm === undefined ||
    openingKm === "" ||
    closingKm === null ||
    closingKm === undefined ||
    closingKm === ""
  ) {
    return null;
  }

  const open = Number(openingKm);
  const close = Number(closingKm);

  if (!Number.isFinite(open) || !Number.isFinite(close)) {
    return null;
  }

  if (close < open) {
    return 0;
  }

  return Math.round((close - open) * 100) / 100;
}

/**
 * Calculates payment status based on totalAmount and advanceAmount.
 * @param {number} totalAmount
 * @param {number} advanceAmount
 * @returns {"unpaid" | "partially_paid" | "paid" | "overpaid"}
 */
export function calculatePaymentStatus(totalAmount, advanceAmount) {
  const total = Math.max(0, toNumber(totalAmount));
  const advance = Math.max(0, toNumber(advanceAmount));

  if (total === 0 && advance === 0) {
    return "unpaid";
  }
  if (advance === 0) {
    return "unpaid";
  }
  if (advance > total) {
    return "overpaid";
  }
  if (advance === total) {
    return "paid";
  }
  return "partially_paid";
}

/**
 * Computes all financial fields: Subtotal, Discount, Taxable Amount, Tax, Total, Balance, and Payment Status.
 * @param {Object} data
 * @returns {Object}
 */
export function calculateTripAmount(data = {}) {
  const baseRate = Math.max(0, toNumber(data.baseRate));
  const extraKmCharges = Math.max(0, toNumber(data.extraKmCharges));
  const extraHourCharges = Math.max(0, toNumber(data.extraHourCharges));
  const driverCharges = Math.max(0, toNumber(data.driverCharges));
  const tollCharges = Math.max(0, toNumber(data.tollCharges));
  const parkingCharges = Math.max(0, toNumber(data.parkingCharges));
  const otherCharges = Math.max(0, toNumber(data.otherCharges));

  const subtotal =
    baseRate +
    extraKmCharges +
    extraHourCharges +
    driverCharges +
    tollCharges +
    parkingCharges +
    otherCharges;

  // Discount calculation
  const discountType = data.discountType || "fixed";
  const discountValue = Math.max(0, toNumber(data.discountValue));

  const discountAmount =
    discountType === "percentage"
      ? Math.round(((subtotal * Math.min(100, discountValue)) / 100) * 100) /
        100
      : Math.min(subtotal, Math.round(discountValue * 100) / 100);

  const taxableAmount = Math.max(
    0,
    Math.round((subtotal - discountAmount) * 100) / 100,
  );

  // Tax calculation
  let taxAmount = 0;
  const taxApplicable = Boolean(data.taxApplicable);
  const taxRate = Math.max(0, toNumber(data.taxRate));

  if (taxApplicable && taxRate > 0) {
    taxAmount = Math.round(((taxableAmount * taxRate) / 100) * 100) / 100;
  }

  const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

  // Advance and Balance
  const advanceAmount = Math.max(0, toNumber(data.advanceAmount));
  const balanceAmount = Math.max(
    0,
    Math.round((totalAmount - advanceAmount) * 100) / 100,
  );
  const paymentStatus = calculatePaymentStatus(totalAmount, advanceAmount);

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount,
    taxableAmount,
    taxAmount,
    totalAmount,
    advanceAmount,
    balanceAmount,
    paymentStatus,
  };
}
