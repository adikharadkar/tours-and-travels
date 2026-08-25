import { states } from "../constants/india";

// Default operating company state code (FleetCore HQ: Maharashtra, State Code 27)
export const DEFAULT_COMPANY_STATE_CODE = "27";
export const DEFAULT_COMPANY_STATE_NAME = "Maharashtra";
export const DEFAULT_COMPANY_GSTIN = "27AABCF1234F1Z9";

/**
 * Extracts a 2-digit Indian GST state code from a GSTIN or state name / abbreviation.
 */
export function extractStateCode(gstin, stateNameOrCode) {
  if (gstin && typeof gstin === "string" && gstin.trim().length >= 2) {
    const prefix = gstin.trim().substring(0, 2);
    if (/^\d{2}$/.test(prefix)) {
      return prefix;
    }
  }

  if (stateNameOrCode && typeof stateNameOrCode === "string") {
    const trimmed = stateNameOrCode.trim().toLowerCase();
    const matchedState = states.find(
      (s) =>
        s.stateCode === trimmed ||
        s.value.toLowerCase() === trimmed ||
        s.label.toLowerCase() === trimmed,
    );
    if (matchedState) {
      return matchedState.stateCode;
    }
  }

  return null;
}

/**
 * Determines whether a transaction is intra-state (CGST + SGST) or inter-state (IGST).
 */
export function isInterStateSupply(
  customerGstin,
  customerState,
  companyStateCode = DEFAULT_COMPANY_STATE_CODE,
) {
  const custCode = extractStateCode(customerGstin, customerState);
  if (!custCode) {
    // If no state detected, default to intra-state unless customer state explicitly indicates otherwise
    return false;
  }
  return custCode !== companyStateCode;
}

/**
 * Calculates complete subtotal, tax breakdown (CGST + SGST vs IGST), round-off, and grand total.
 */
export function calculateInvoiceTaxes({
  items = [],
  customer = null,
  customerGstin = "",
  customerState = "",
  companyStateCode = DEFAULT_COMPANY_STATE_CODE,
  applyRoundOff = false,
}) {
  const gstin = customerGstin || customer?.gstin || customer?.gstNumber || "";
  const state =
    customerState ||
    customer?.billingState ||
    customer?.state ||
    customer?.billingStateCode ||
    "";

  const isInterState = isInterStateSupply(gstin, state, companyStateCode);

  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  // Group taxes by rate for detailed breakdown if needed
  const taxRateBreakdown = {};

  items.forEach((item) => {
    const qty = Number(item.quantity || 0);
    const rate = Number(item.rate || item.unitRate || 0);
    const amount = item.amount !== undefined ? Number(item.amount) : qty * rate;
    const taxRate = Number(item.taxRate || item.taxPercent || 0);

    subtotal += amount;

    if (amount > 0 && taxRate > 0) {
      const taxAmount = (amount * taxRate) / 100;

      if (!taxRateBreakdown[taxRate]) {
        taxRateBreakdown[taxRate] = {
          rate: taxRate,
          taxableAmount: 0,
          taxAmount: 0,
        };
      }
      taxRateBreakdown[taxRate].taxableAmount += amount;
      taxRateBreakdown[taxRate].taxAmount += taxAmount;

      if (isInterState) {
        totalIgst += taxAmount;
      } else {
        totalCgst += taxAmount / 2;
        totalSgst += taxAmount / 2;
      }
    }
  });

  const totalTax = isInterState ? totalIgst : totalCgst + totalSgst;
  const rawTotal = subtotal + totalTax;

  let roundOff = 0;
  let grandTotal = Number(rawTotal.toFixed(2));

  if (applyRoundOff) {
    grandTotal = Math.round(rawTotal);
    roundOff = Number((grandTotal - rawTotal).toFixed(2));
  }

  // Generate structured summary rows for UI display
  const taxRows = [];
  if (isInterState) {
    if (totalIgst > 0 || Object.keys(taxRateBreakdown).length > 0) {
      const effectiveRate =
        subtotal > 0 ? ((totalIgst / subtotal) * 100).toFixed(0) : 18;
      taxRows.push({
        name: `IGST (${effectiveRate}%)`,
        rate: Number(effectiveRate),
        amount: totalIgst,
        type: "igst",
      });
    }
  } else {
    if (totalCgst > 0 || Object.keys(taxRateBreakdown).length > 0) {
      const effectiveRateHalf =
        subtotal > 0
          ? (((totalCgst + totalSgst) / subtotal / 2) * 100).toFixed(0)
          : 9;
      taxRows.push({
        name: `CGST (${effectiveRateHalf}%)`,
        rate: Number(effectiveRateHalf),
        amount: totalCgst,
        type: "cgst",
      });
      taxRows.push({
        name: `SGST (${effectiveRateHalf}%)`,
        rate: Number(effectiveRateHalf),
        amount: totalSgst,
        type: "sgst",
      });
    }
  }

  return {
    subtotal: Number(subtotal.toFixed(2)),
    isInterState,
    taxRows,
    totalCgst: Number(totalCgst.toFixed(2)),
    totalSgst: Number(totalSgst.toFixed(2)),
    totalIgst: Number(totalIgst.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    roundOff,
    grandTotal,
    taxRateBreakdown,
  };
}
