/**
 * Derives billable line items from a Trip record.
 */
export function populateBillableItemsFromTrip(trip) {
  if (!trip) return [];

  const items = [];
  const defaultTaxRate =
    trip.taxApplicable === false
      ? 0
      : Number(trip.taxRate !== undefined ? trip.taxRate : 18);

  // 1. Base Package / Transit Charge
  const baseRate = Number(trip.baseRate || trip.totalAmount || 0);
  let baseDescription = "Standard Freight Package";
  if (trip.tripType === "package") {
    baseDescription = "Standard Package Tour / Logistics";
  } else if (trip.tripType === "outstation") {
    baseDescription = "Intercity Outstation Transit";
  } else if (trip.tripType === "airport_transfer") {
    baseDescription = "Airport Transfer Fleet Service";
  } else if (trip.tripType === "round_trip") {
    baseDescription = "Round Trip Corridor Fleet Service";
  } else if (trip.tripType === "local") {
    baseDescription = "Local City Transit Service";
  }

  let baseSubtitle = "Base charge for route";
  if (trip.pickupLocation && trip.dropLocation) {
    baseSubtitle = `Base charge for ${trip.pickupLocation} → ${trip.dropLocation}`;
  }

  items.push({
    id: `item_base_${Date.now()}_1`,
    description: baseDescription,
    subtitle: baseSubtitle,
    quantity: 1,
    rate: baseRate,
    taxRate: defaultTaxRate,
    amount: baseRate,
    category: "base_package",
    isDerived: true,
  });

  // 2. Excess Mileage / Extra KM Charges
  const extraKmAmt = Number(trip.extraKmCharges || 0);
  if (extraKmAmt > 0) {
    const ratePerKm = Number(trip.ratePerKm || 25);
    const qty =
      ratePerKm > 0
        ? Math.round(extraKmAmt / ratePerKm)
        : Number(trip.totalKm || 1);

    items.push({
      id: `item_km_${Date.now()}_2`,
      description: "Excess Mileage",
      subtitle: `Additional ${qty}km beyond standard route`,
      quantity: qty,
      rate: ratePerKm,
      taxRate: defaultTaxRate,
      amount: extraKmAmt,
      category: "extra_km",
      isDerived: true,
    });
  }

  // 3. Extra Duration / Hour Charges
  const extraHourAmt = Number(trip.extraHourCharges || 0);
  if (extraHourAmt > 0) {
    const ratePerHour = Number(trip.ratePerHour || 300);
    const qty = ratePerHour > 0 ? Math.round(extraHourAmt / ratePerHour) : 1;

    items.push({
      id: `item_hr_${Date.now()}_3`,
      description: "Excess Duration / Detention",
      subtitle: `Additional ${qty} hrs beyond scheduled time`,
      quantity: qty,
      rate: ratePerHour,
      taxRate: defaultTaxRate,
      amount: extraHourAmt,
      category: "extra_hours",
      isDerived: true,
    });
  }

  // 4. Toll Charges (At Actuals - typically 0% tax)
  const tollAmt = Number(trip.tollCharges || 0);
  if (tollAmt > 0) {
    items.push({
      id: `item_toll_${Date.now()}_4`,
      description: "Toll Charges",
      subtitle: trip.stops
        ? `${trip.stops} Tolls (At Actuals)`
        : "National Highway Tolls (At Actuals)",
      quantity: 1,
      rate: tollAmt,
      taxRate: 0,
      amount: tollAmt,
      category: "tolls",
      isDerived: true,
    });
  }

  // 5. Driver Allowance & Night Charges (0% tax at actuals)
  const driverAmt = Number(trip.driverCharges || 0);
  if (driverAmt > 0) {
    const daysCount =
      trip.duration && trip.duration.includes("Day")
        ? parseInt(trip.duration) || 1
        : 1;

    items.push({
      id: `item_drv_${Date.now()}_5`,
      description: "Driver Allowance",
      subtitle: "Overnight stay / driver transit allowance",
      quantity: daysCount > 1 ? daysCount : 1,
      rate:
        daysCount > 1 ? Number((driverAmt / daysCount).toFixed(2)) : driverAmt,
      taxRate: 0,
      amount: driverAmt,
      category: "driver_allowance",
      isDerived: true,
    });
  }

  // 6. Parking Charges (At Actuals)
  const parkingAmt = Number(trip.parkingCharges || 0);
  if (parkingAmt > 0) {
    items.push({
      id: `item_prk_${Date.now()}_6`,
      description: "Parking & Entry Charges",
      subtitle: "Terminal and parking access fees (At Actuals)",
      quantity: 1,
      rate: parkingAmt,
      taxRate: 0,
      amount: parkingAmt,
      category: "parking",
      isDerived: true,
    });
  }

  // 7. Other Charges
  const otherAmt = Number(trip.otherCharges || 0);
  if (otherAmt > 0) {
    items.push({
      id: `item_oth_${Date.now()}_7`,
      description: "Other Operational Charges",
      subtitle: "Authorized incidental transit expenses",
      quantity: 1,
      rate: otherAmt,
      taxRate: defaultTaxRate,
      amount: otherAmt,
      category: "other",
      isDerived: true,
    });
  }

  // 8. Discount line item if applicable
  const discountAmt = Number(trip.discountAmount || 0);
  if (discountAmt > 0) {
    items.push({
      id: `item_dsc_${Date.now()}_8`,
      description: "Agreed Concession / Discount",
      subtitle:
        trip.discountType === "percentage"
          ? `${trip.discountValue}% special discount`
          : "Special customer rebate",
      quantity: 1,
      rate: -discountAmt,
      taxRate: 0,
      amount: -discountAmt,
      category: "discount",
      isDerived: true,
    });
  }

  return items;
}

/**
 * Calculates due date from issue date and customer payment terms.
 */
export function calculateDueDate(issueDateStr, paymentTerms = "30_days") {
  const baseDate = issueDateStr ? new Date(issueDateStr) : new Date();
  if (isNaN(baseDate.getTime())) {
    return new Date().toISOString().split("T")[0];
  }

  const terms = String(paymentTerms || "").toLowerCase();
  let daysToAdd = 30; // default Net 30

  if (terms === "immediate" || terms.includes("immediate")) {
    daysToAdd = 0;
  } else if (terms === "15_days" || terms.includes("15")) {
    daysToAdd = 15;
  } else if (terms === "30_days" || terms.includes("30")) {
    daysToAdd = 30;
  } else if (terms === "45_days" || terms.includes("45")) {
    daysToAdd = 45;
  } else if (terms === "60_days" || terms.includes("60")) {
    daysToAdd = 60;
  }

  const dueDate = new Date(baseDate);
  dueDate.setDate(dueDate.getDate() + daysToAdd);
  return dueDate.toISOString().split("T")[0];
}

/**
 * Format Payment Terms for display (e.g., "Net 30", "Net 15", "Immediate")
 */
export function formatPaymentTerms(paymentTerms) {
  if (!paymentTerms) return "Net 30";
  const str = String(paymentTerms).trim();
  if (str.toLowerCase() === "immediate") return "Immediate";
  if (str.toLowerCase() === "15_days" || str === "Net 15") return "Net 15";
  if (str.toLowerCase() === "30_days" || str === "Net 30") return "Net 30";
  if (str.toLowerCase() === "45_days" || str === "Net 45") return "Net 45";
  if (str.toLowerCase() === "60_days" || str === "Net 60") return "Net 60";
  return str;
}

/**
 * Validates critical customer billing information.
 */
export function checkCustomerBillingValidation(
  customer,
  documentType = "tax_invoice",
) {
  const missing = [];

  if (!customer) {
    missing.push({
      key: "customer",
      title: "Missing Customer Record",
      description: "No valid customer profile is linked to this trip.",
      isCritical: true,
    });
    return { hasCriticalMissing: true, missing };
  }

  const gstin = customer.gstin || customer.gstNumber || "";
  const isCompany =
    customer.customerType === "company" ||
    customer.customerType === "enterprise";
  const isTaxInvoice =
    documentType === "tax_invoice" || documentType === "consolidated";

  // Check GSTIN for corporate/enterprise customers issuing tax invoices
  if (isTaxInvoice && isCompany && !gstin.trim()) {
    missing.push({
      key: "gstin",
      title: "Missing Critical Billing Information",
      description:
        "The customer profile is missing a valid GSTIN. This is required for generating tax-compliant invoices.",
      isCritical: true,
    });
  }

  // Check Billing Address
  const fullAddress = [
    customer.billingAddress || customer.address,
    customer.billingCity || customer.city,
    customer.billingState || customer.state,
  ]
    .filter(Boolean)
    .join(", ");

  if (!fullAddress.trim()) {
    missing.push({
      key: "billingAddress",
      title: "Missing Billing Address",
      description:
        "A complete billing address is required on issued tax documents.",
      isCritical: true,
    });
  }

  const hasCriticalMissing = missing.some((item) => item.isCritical);

  return {
    hasCriticalMissing,
    missing,
  };
}
