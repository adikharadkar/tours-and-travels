import { EXPIRING_SOON_THRESHOLD_DAYS } from "../constants/drivers";

function parseDateOnly(dateString) {
  if (!dateString) return null;
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function getDaysDifference(targetDate) {
  if (!targetDate) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates the status of a driver's driving license.
 * @param {Object} driver
 * @returns {{ value: 'valid' | 'expiring_soon' | 'expired' | 'not_provided', label: string, daysLeft: number | null, message: string }}
 */
export function getDriverLicenseStatus(driver) {
  const expiryDate = driver?.licenseExpiryDate || driver?.licenseExpiry;

  if (!expiryDate) {
    return {
      value: "not_provided",
      label: "Not Provided",
      daysLeft: null,
      message: "License expiry date is missing",
    };
  }

  const parsedDate = parseDateOnly(expiryDate);
  if (!parsedDate || isNaN(parsedDate.getTime())) {
    return {
      value: "expired",
      label: "Invalid Date",
      daysLeft: null,
      message: "Invalid license expiry date format",
    };
  }

  const daysLeft = getDaysDifference(parsedDate);

  if (daysLeft < 0) {
    const daysAgo = Math.abs(daysLeft);
    return {
      value: "expired",
      label: "Expired",
      daysLeft,
      message: `License expired ${daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`}`,
    };
  }

  if (daysLeft <= EXPIRING_SOON_THRESHOLD_DAYS) {
    return {
      value: "expiring_soon",
      label: "Expiring Soon",
      daysLeft,
      message: `License expires ${daysLeft === 0 ? "today" : `in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`}`,
    };
  }

  return {
    value: "valid",
    label: "Valid",
    daysLeft,
    message: `License is valid for ${daysLeft} days`,
  };
}

/**
 * Determines whether a driver is eligible for trip assignment.
 * Rule: Driver must be active AND driving license must NOT be expired.
 * @param {Object} driver
 * @returns {boolean}
 */
export function isDriverEligible(driver) {
  if (!driver) return false;
  if (driver.isActive === false) return false;

  const licenseStatus = getDriverLicenseStatus(driver);
  return (
    licenseStatus.value !== "expired" && licenseStatus.value !== "not_provided"
  );
}
