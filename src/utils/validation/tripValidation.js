import { calculateTripAmount } from "../tripCalculation";

export function validateTrip(data = {}) {
  const errors = {};

  // 1. Required References
  if (!data.customerId || !String(data.customerId).trim()) {
    errors.customerId = "Customer selection is required.";
  }

  if (!data.vehicleId || !String(data.vehicleId).trim()) {
    errors.vehicleId = "Vehicle assignment is required.";
  }

  if (!data.driverId || !String(data.driverId).trim()) {
    errors.driverId = "Driver assignment is required.";
  }

  // 2. Booking Information
  if (!data.bookingDate || !String(data.bookingDate).trim()) {
    errors.bookingDate = "Booking date is required.";
  }

  if (!data.tripType || !String(data.tripType).trim()) {
    errors.tripType = "Trip type is required.";
  }

  // 3. Journey Locations
  if (!data.pickupLocation || !String(data.pickupLocation).trim()) {
    errors.pickupLocation = "Pickup location is required.";
  }

  if (!data.dropLocation || !String(data.dropLocation).trim()) {
    errors.dropLocation = "Drop location is required.";
  }

  // 4. Timing & Dates
  if (!data.startDateTime) {
    errors.startDateTime = "Trip start date and time is required.";
  }

  if (!data.endDateTime) {
    errors.endDateTime = "Trip end date and time is required.";
  }

  if (data.startDateTime && data.endDateTime) {
    const start = new Date(data.startDateTime);
    const end = new Date(data.endDateTime);

    if (isNaN(start.getTime())) {
      errors.startDateTime = "Invalid start date and time format.";
    }
    if (isNaN(end.getTime())) {
      errors.endDateTime = "Invalid end date and time format.";
    }

    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
      errors.endDateTime =
        "End date and time must be after start date and time.";
    }
  }

  // 5. Kilometers
  if (
    data.openingKm !== undefined &&
    data.openingKm !== null &&
    data.openingKm !== ""
  ) {
    const open = Number(data.openingKm);
    if (isNaN(open) || open < 0) {
      errors.openingKm = "Opening KM must be a non-negative number.";
    }
  }

  if (
    data.closingKm !== undefined &&
    data.closingKm !== null &&
    data.closingKm !== ""
  ) {
    const close = Number(data.closingKm);
    if (isNaN(close) || close < 0) {
      errors.closingKm = "Closing KM must be a non-negative number.";
    }
  }

  if (
    data.openingKm !== undefined &&
    data.openingKm !== null &&
    data.openingKm !== "" &&
    data.closingKm !== undefined &&
    data.closingKm !== null &&
    data.closingKm !== ""
  ) {
    const open = Number(data.openingKm);
    const close = Number(data.closingKm);
    if (!isNaN(open) && !isNaN(close) && close < open) {
      errors.closingKm = "Closing KM cannot be less than opening KM.";
    }
  }

  // 6. Pricing & Rate
  if (!data.rateType || !String(data.rateType).trim()) {
    errors.rateType = "Rate type is required.";
  }

  if (
    data.baseRate !== undefined &&
    data.baseRate !== null &&
    data.baseRate !== ""
  ) {
    const base = Number(data.baseRate);
    if (isNaN(base) || base < 0) {
      errors.baseRate = "Base rate must be a non-negative number.";
    }
  } else {
    errors.baseRate = "Base rate is required.";
  }

  // Numeric checks on optional charges
  const optionalNumberFields = [
    ["ratePerKm", "Rate per KM"],
    ["ratePerHour", "Rate per hour"],
    ["ratePerDay", "Rate per day"],
    ["extraKmCharges", "Extra KM charges"],
    ["extraHourCharges", "Extra hour charges"],
    ["driverCharges", "Driver charges"],
    ["tollCharges", "Toll charges"],
    ["parkingCharges", "Parking charges"],
    ["otherCharges", "Other charges"],
  ];

  optionalNumberFields.forEach(([field, label]) => {
    if (
      data[field] !== undefined &&
      data[field] !== null &&
      data[field] !== ""
    ) {
      const val = Number(data[field]);
      if (isNaN(val) || val < 0) {
        errors[field] = `${label} must be a non-negative number.`;
      }
    }
  });

  // 7. Discount
  if (
    data.discountValue !== undefined &&
    data.discountValue !== null &&
    data.discountValue !== ""
  ) {
    const disc = Number(data.discountValue);
    if (isNaN(disc) || disc < 0) {
      errors.discountValue = "Discount must be a non-negative number.";
    } else if (data.discountType === "percentage" && disc > 100) {
      errors.discountValue = "Discount percentage cannot exceed 100%.";
    }
  }

  // 8. Tax
  if (data.taxApplicable) {
    if (
      data.taxRate !== undefined &&
      data.taxRate !== null &&
      data.taxRate !== ""
    ) {
      const rate = Number(data.taxRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        errors.taxRate = "Tax rate must be between 0% and 100%.";
      }
    }
  }

  // 9. Advance Payment
  const calculated = calculateTripAmount(data);

  if (
    data.advanceAmount !== undefined &&
    data.advanceAmount !== null &&
    data.advanceAmount !== ""
  ) {
    const adv = Number(data.advanceAmount);
    if (isNaN(adv) || adv < 0) {
      errors.advanceAmount = "Advance amount must be a non-negative number.";
    } else if (adv > calculated.totalAmount && calculated.totalAmount > 0) {
      errors.advanceAmount = `Advance payment (₹${adv}) cannot exceed total trip amount (₹${calculated.totalAmount}).`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
