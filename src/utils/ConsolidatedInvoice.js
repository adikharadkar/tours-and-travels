import { calculateInvoiceTaxes } from "./taxCalculation";

export const BILLING_PERIOD_PRESETS = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "last_week", label: "Last Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_quarter", label: "This Quarter" },
  { value: "custom", label: "Custom" },
];

/**
 * Calculates start and end dates based on the chosen preset.
 * Reference date defaults to the workspace's simulated date (Aug 25, 2026).
 */
export function getBillingPeriodDates(
  preset = "this_month",
  customStartDate = "",
  customEndDate = "",
  referenceDateStr = "2026-08-25",
) {
  const refDate = new Date(referenceDateStr || "2026-08-25");
  const year = refDate.getFullYear();
  const month = refDate.getMonth(); // 0-indexed (7 for Aug)

  const formatDate = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  switch (preset) {
    case "today": {
      const todayStr = formatDate(refDate);
      return {
        startDate: todayStr,
        endDate: todayStr,
        label: "Today",
      };
    }
    case "this_week": {
      // Find Monday of the reference week
      const currentDay = refDate.getDay(); // 0 is Sunday
      const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(refDate);
      monday.setDate(refDate.getDate() + diffToMonday);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      return {
        startDate: formatDate(monday),
        endDate: formatDate(sunday),
        label: "This Week",
      };
    }
    case "last_week": {
      const currentDay = refDate.getDay();
      const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const mondayThisWeek = new Date(refDate);
      mondayThisWeek.setDate(refDate.getDate() + diffToMonday);

      const mondayLastWeek = new Date(mondayThisWeek);
      mondayLastWeek.setDate(mondayThisWeek.getDate() - 7);

      const sundayLastWeek = new Date(mondayLastWeek);
      sundayLastWeek.setDate(mondayLastWeek.getDate() + 6);

      return {
        startDate: formatDate(mondayLastWeek),
        endDate: formatDate(sundayLastWeek),
        label: "Last Week",
      };
    }
    case "this_month": {
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      return {
        startDate: formatDate(firstDay),
        endDate: formatDate(lastDay),
        label: "This Month",
      };
    }
    case "last_month": {
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      return {
        startDate: formatDate(firstDay),
        endDate: formatDate(lastDay),
        label: "Last Month",
      };
    }
    case "this_quarter": {
      const quarterIndex = Math.floor(month / 3);
      const firstMonth = quarterIndex * 3;
      const firstDay = new Date(year, firstMonth, 1);
      const lastDay = new Date(year, firstMonth + 3, 0);
      return {
        startDate: formatDate(firstDay),
        endDate: formatDate(lastDay),
        label: "This Quarter",
      };
    }
    case "custom":
    default: {
      return {
        startDate: customStartDate || "2026-08-01",
        endDate: customEndDate || "2026-08-31",
        label: "Custom Range",
      };
    }
  }
}

/**
 * Checks whether a customer ID matches another customer ID (taking into account aliases like cust_1 vs cust_apex_1).
 */
export function isCustomerMatch(tripCustId, selectedCustId) {
  if (!tripCustId || !selectedCustId) return false;
  if (tripCustId === selectedCustId) return true;

  // Normalization for aliases
  const t = String(tripCustId).toLowerCase();
  const s = String(selectedCustId).toLowerCase();
  if (t === s) return true;

  if (
    (t === "cust_1" && s.includes("apex")) ||
    (s === "cust_1" && t.includes("apex"))
  )
    return true;
  if (
    (t === "cust_2" && s.includes("gt")) ||
    (s === "cust_2" && t.includes("gt")) ||
    (t === "cust_2" && s.includes("global"))
  )
    return true;
  if (
    (t === "cust_3" && s.includes("vikram")) ||
    (s === "cust_3" && t.includes("vikram"))
  )
    return true;
  if (
    (t === "cust_4" && s.includes("nexus")) ||
    (s === "cust_4" && t.includes("nexus"))
  )
    return true;

  return false;
}

/**
 * Evaluates trip eligibility for consolidated invoicing.
 */
export function getTripEligibility(
  trip,
  invoices = [],
  customerId = null,
  startDate = null,
  endDate = null,
) {
  if (!trip) {
    return {
      isEligible: false,
      reason: "Invalid trip record",
      reasonCode: "INVALID_TRIP",
    };
  }

  // 1. Customer check
  if (customerId && !isCustomerMatch(trip.customerId, customerId)) {
    return {
      isEligible: false,
      reason: "Belongs to a different customer",
      reasonCode: "CUSTOMER_MISMATCH",
    };
  }

  // 2. Cancellation check
  if (trip.status === "cancelled") {
    return {
      isEligible: false,
      reason: "Trip was cancelled",
      reasonCode: "CANCELLED",
    };
  }

  // 3. Completion check
  if (trip.status !== "completed") {
    const statusLabel =
      trip.status === "in_progress"
        ? "in progress"
        : trip.status === "confirmed"
          ? "scheduled/confirmed"
          : trip.status || "pending";
    return {
      isEligible: false,
      reason: `Trip is not completed (${statusLabel})`,
      reasonCode: "NOT_COMPLETED",
    };
  }

  // 4. Date range check
  const tripDateStr = (
    trip.startDateTime ||
    trip.bookingDate ||
    trip.createdAt ||
    ""
  ).split("T")[0];
  if (startDate && endDate && tripDateStr) {
    if (tripDateStr < startDate || tripDateStr > endDate) {
      return {
        isEligible: false,
        reason: `Outside billing period (${tripDateStr})`,
        reasonCode: "DATE_OUT_OF_RANGE",
      };
    }
  }

  // 5. Already Invoiced check (Prevent Duplicate Billing)
  const activeInvoices = Array.isArray(invoices)
    ? invoices.filter((inv) => inv && inv.documentStatus !== "cancelled")
    : [];

  const matchedInvoice = activeInvoices.find((inv) => {
    // Single-trip invoice matching
    if (inv.tripId && (inv.tripId === trip.id || inv.tripId === trip.tripCode))
      return true;
    if (inv.tripCode && inv.tripCode === trip.tripCode) return true;

    // Consolidated invoice matching
    if (Array.isArray(inv.tripIds) && inv.tripIds.includes(trip.id))
      return true;
    if (
      Array.isArray(inv.trips) &&
      inv.trips.some((t) => t.id === trip.id || t.tripCode === trip.tripCode)
    ) {
      return true;
    }

    return false;
  });

  if (matchedInvoice) {
    const isDraft = matchedInvoice.documentStatus === "draft";
    return {
      isEligible: false,
      reason: isDraft
        ? `Included in Draft (${matchedInvoice.invoiceNumber})`
        : `Already invoiced (${matchedInvoice.invoiceNumber})`,
      reasonCode: isDraft ? "ALREADY_INVOICED_DRAFT" : "ALREADY_INVOICED",
      linkedInvoiceNumber: matchedInvoice.invoiceNumber,
      linkedInvoiceId: matchedInvoice.id,
    };
  }

  // 6. Zero billable amount check
  const totalAmt = Number(trip.totalAmount ?? trip.baseRate ?? 0);
  if (totalAmt <= 0) {
    return {
      isEligible: false,
      reason: "No billable charges recorded for this trip",
      reasonCode: "ZERO_AMOUNT",
    };
  }

  return {
    isEligible: true,
    reason: null,
    reasonCode: "ELIGIBLE",
  };
}

/**
 * Aggregates all billable items, metrics, taxes, and totals from selected trips.
 */
export function aggregateTripCharges(
  selectedTrips = [],
  adjustments = [],
  customer = null,
) {
  let baseChargesSum = 0;
  let extraKmChargesSum = 0;
  let extraHourChargesSum = 0;
  let driverChargesSum = 0;
  let tollChargesSum = 0;
  let parkingChargesSum = 0;
  let otherChargesSum = 0;
  let tripDiscountsSum = 0;
  let totalDistanceKm = 0;

  const vehicleSet = new Set();
  const driverSet = new Set();

  const lineItems = [];

  selectedTrips.forEach((trip, index) => {
    if (trip.vehicleId || trip.vehicleNumber) {
      vehicleSet.add(trip.vehicleId || trip.vehicleNumber);
    }
    if (trip.driverId || trip.driverName) {
      driverSet.add(trip.driverId || trip.driverName);
    }
    if (trip.totalKm) {
      totalDistanceKm += Number(trip.totalKm);
    }

    const baseRate = Number(trip.baseRate || trip.totalAmount || 0);
    const extraKm = Number(trip.extraKmCharges || 0);
    const extraHours = Number(trip.extraHourCharges || 0);
    const driverAmt = Number(trip.driverCharges || 0);
    const tollAmt = Number(trip.tollCharges || 0);
    const parkingAmt = Number(trip.parkingCharges || 0);
    const otherAmt = Number(trip.otherCharges || 0);
    const discountAmt = Number(trip.discountAmount || 0);

    baseChargesSum += baseRate;
    extraKmChargesSum += extraKm;
    extraHourChargesSum += extraHours;
    driverChargesSum += driverAmt;
    tollChargesSum += tollAmt;
    parkingChargesSum += parkingAmt;
    otherChargesSum += otherAmt;
    tripDiscountsSum += discountAmt;

    const defaultTaxRate =
      trip.taxApplicable === false ? 0 : Number(trip.taxRate ?? 12);

    // Create itemized trip summary line for the consolidated bill
    const tripDate = (trip.startDateTime || trip.bookingDate || "").split(
      "T",
    )[0];
    const routeDesc = `${trip.pickupLocation || "Origin"} → ${trip.dropLocation || "Destination"}`;

    lineItems.push({
      id: `item_trip_${trip.id || index}_${Date.now()}`,
      tripId: trip.id,
      tripCode: trip.tripCode,
      date: tripDate,
      route: routeDesc,
      description: `${trip.tripCode}: ${routeDesc} (${tripDate})`,
      subtitle: trip.vehicleNumber
        ? `Vehicle: ${trip.vehicleNumber}`
        : "Fleet Transit Service",
      quantity: 1,
      rate: baseRate,
      amount: baseRate,
      taxRate: defaultTaxRate,
      category: "trip_base",
    });

    if (extraKm > 0) {
      lineItems.push({
        id: `item_extra_km_${trip.id}_${Date.now()}`,
        tripId: trip.id,
        tripCode: trip.tripCode,
        description: `${trip.tripCode}: Extra KM / Excess Mileage`,
        subtitle: `Excess distance on ${tripDate}`,
        quantity: 1,
        rate: extraKm,
        amount: extraKm,
        taxRate: defaultTaxRate,
        category: "extra_km",
      });
    }

    if (extraHours > 0) {
      lineItems.push({
        id: `item_extra_hr_${trip.id}_${Date.now()}`,
        tripId: trip.id,
        tripCode: trip.tripCode,
        description: `${trip.tripCode}: Extra Hours / Detention`,
        subtitle: `Detention charges on ${tripDate}`,
        quantity: 1,
        rate: extraHours,
        amount: extraHours,
        taxRate: defaultTaxRate,
        category: "extra_hours",
      });
    }

    if (driverAmt > 0) {
      lineItems.push({
        id: `item_driver_${trip.id}_${Date.now()}`,
        tripId: trip.id,
        tripCode: trip.tripCode,
        description: `${trip.tripCode}: Driver Allowance & Night Charges`,
        subtitle: "Driver transit allowance (At Actuals)",
        quantity: 1,
        rate: driverAmt,
        amount: driverAmt,
        taxRate: 0, // at actuals
        category: "driver_allowance",
      });
    }

    if (tollAmt > 0) {
      lineItems.push({
        id: `item_toll_${trip.id}_${Date.now()}`,
        tripId: trip.id,
        tripCode: trip.tripCode,
        description: `${trip.tripCode}: Toll Charges`,
        subtitle: "Highway tolls (At Actuals)",
        quantity: 1,
        rate: tollAmt,
        amount: tollAmt,
        taxRate: 0,
        category: "tolls",
      });
    }

    if (parkingAmt > 0) {
      lineItems.push({
        id: `item_parking_${trip.id}_${Date.now()}`,
        tripId: trip.id,
        tripCode: trip.tripCode,
        description: `${trip.tripCode}: Parking & Entry Fees`,
        subtitle: "Terminal access charges (At Actuals)",
        quantity: 1,
        rate: parkingAmt,
        amount: parkingAmt,
        taxRate: 0,
        category: "parking",
      });
    }

    if (otherAmt > 0) {
      lineItems.push({
        id: `item_other_${trip.id}_${Date.now()}`,
        tripId: trip.id,
        tripCode: trip.tripCode,
        description: `${trip.tripCode}: Incidental Operational Charges`,
        quantity: 1,
        rate: otherAmt,
        amount: otherAmt,
        taxRate: defaultTaxRate,
        category: "other",
      });
    }

    if (discountAmt > 0) {
      lineItems.push({
        id: `item_discount_${trip.id}_${Date.now()}`,
        tripId: trip.id,
        tripCode: trip.tripCode,
        description: `${trip.tripCode}: Agreed Discount / Rebate`,
        quantity: 1,
        rate: -discountAmt,
        amount: -discountAmt,
        taxRate: 0,
        category: "discount",
      });
    }
  });

  // Include user custom adjustments if any
  if (Array.isArray(adjustments)) {
    adjustments.forEach((adj, idx) => {
      const amt = Number(adj.amount || 0);
      lineItems.push({
        id: `item_adj_${idx}_${Date.now()}`,
        description: adj.description || "Invoice Adjustment",
        subtitle: "Consolidated Billing Adjustment",
        quantity: 1,
        rate: amt,
        amount: amt,
        taxRate: Number(adj.taxRate ?? 12),
        category: "adjustment",
      });
    });
  }

  const tollAndMiscChargesSum =
    extraKmChargesSum +
    extraHourChargesSum +
    driverChargesSum +
    tollChargesSum +
    parkingChargesSum +
    otherChargesSum;

  const taxes = calculateInvoiceTaxes({
    items: lineItems,
    customer,
  });

  return {
    tripsCount: selectedTrips.length,
    vehiclesUsedCount: vehicleSet.size,
    driversCount: driverSet.size,
    totalDistanceKm,
    baseChargesSum: Number(baseChargesSum.toFixed(2)),
    extraKmChargesSum: Number(extraKmChargesSum.toFixed(2)),
    extraHourChargesSum: Number(extraHourChargesSum.toFixed(2)),
    driverChargesSum: Number(driverChargesSum.toFixed(2)),
    tollChargesSum: Number(tollChargesSum.toFixed(2)),
    parkingChargesSum: Number(parkingChargesSum.toFixed(2)),
    otherChargesSum: Number(otherChargesSum.toFixed(2)),
    tripDiscountsSum: Number(tripDiscountsSum.toFixed(2)),
    tollAndMiscChargesSum: Number(tollAndMiscChargesSum.toFixed(2)),
    subtotal: taxes.subtotal,
    isInterState: taxes.isInterState,
    taxRows: taxes.taxRows,
    totalCgst: taxes.totalCgst,
    totalSgst: taxes.totalSgst,
    totalIgst: taxes.totalIgst,
    totalTax: taxes.totalTax,
    roundOff: taxes.roundOff,
    grandTotal: taxes.grandTotal,
    lineItems,
  };
}

/**
 * Derives comprehensive customer billing and credit metadata.
 */
export function getCustomerBillingContext(customer, grandTotal = 0) {
  if (!customer) {
    return {
      hasMissingGstin: true,
      hasMissingAddress: true,
      hasWarning: true,
      creditLimit: 0,
      outstandingAmount: 0,
      projectedAmount: grandTotal,
      isCreditWarning: false,
      billingCycle: "Per Trip",
      isPerTripCycle: true,
      paymentTerms: "Net 30",
    };
  }

  const gstin = customer.gstin || customer.gstNumber || "";
  const isCorporate =
    customer.customerType === "company" ||
    customer.customerType === "enterprise";
  const hasMissingGstin = isCorporate && !gstin.trim();

  const fullAddress = [
    customer.billingAddress || customer.address,
    customer.billingCity || customer.city,
    customer.billingState || customer.state,
  ]
    .filter(Boolean)
    .join(", ");
  const hasMissingAddress = !fullAddress.trim();

  const creditLimit = Number(customer.creditLimit || 500000);
  const outstandingAmount = Number(
    customer.outstandingAmount ?? customer.openingBalance ?? 0,
  );
  const projectedAmount = outstandingAmount + grandTotal;
  const isCreditWarning = creditLimit > 0 && projectedAmount > creditLimit;

  // Determine billing cycle from customer data or defaults
  const billingCycle =
    customer.billingCycle || (isCorporate ? "Monthly (1st-30th)" : "Per Trip");
  const isPerTripCycle = billingCycle.toLowerCase().includes("per trip");

  return {
    customer,
    gstin,
    pan: customer.pan || (gstin.length >= 12 ? gstin.substring(2, 12) : "—"),
    billingAddress: fullAddress,
    hasMissingGstin,
    hasMissingAddress,
    hasWarning: hasMissingGstin || hasMissingAddress,
    creditLimit,
    outstandingAmount,
    projectedAmount,
    isCreditWarning,
    billingCycle,
    isPerTripCycle,
    paymentTerms:
      customer.paymentTerms ||
      (customer.creditDays ? `Net ${customer.creditDays}` : "Net 30"),
  };
}
