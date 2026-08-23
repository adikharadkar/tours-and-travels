export const TRIP_TYPES = [
  { value: "local", label: "Local" },
  { value: "one_way", label: "One Way" },
  { value: "round_trip", label: "Round Trip" },
  { value: "outstation", label: "Outstation" },
  { value: "package", label: "Package" },
  { value: "airport_transfer", label: "Airport Transfer" },
  { value: "other", label: "Other" },
];

export const TRIP_TYPE_LABELS = Object.fromEntries(
  TRIP_TYPES.map((t) => [t.value, t.label]),
);

export const TRIP_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const TRIP_STATUS_LABELS = Object.fromEntries(
  TRIP_STATUSES.map((s) => [s.value, s.label]),
);

export const PAYMENT_STATUSES = [
  { value: "unpaid", label: "Unpaid" },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "paid", label: "Paid" },
  { value: "overpaid", label: "Overpaid" },
];

export const PAYMENT_STATUS_LABELS = Object.fromEntries(
  PAYMENT_STATUSES.map((p) => [p.value, p.label]),
);

export const RATE_TYPES = [
  { value: "per_day", label: "Per Day" },
  { value: "per_hour", label: "Per Hour" },
  { value: "per_km", label: "Per KM" },
  { value: "per_trip", label: "Per Trip (Flat)" },
  { value: "package", label: "Package Deal" },
];

export const RATE_TYPE_LABELS = Object.fromEntries(
  RATE_TYPES.map((r) => [r.value, r.label]),
);

export const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer (NEFT/RTGS/IMPS)" },
  { value: "card", label: "Credit / Debit Card" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

export const PAYMENT_MODE_LABELS = Object.fromEntries(
  PAYMENT_MODES.map((m) => [m.value, m.label]),
);

export const DISCOUNT_TYPES = [
  { value: "fixed", label: "Fixed Amount (₹)" },
  { value: "percentage", label: "Percentage (%)" },
];

export const TAX_TYPES = [
  { value: "gst_5", label: "GST 5% (RCM/Transport)", rate: 5 },
  { value: "gst_12", label: "GST 12% (Standard Transport)", rate: 12 },
  { value: "gst_18", label: "GST 18% (Luxury/Tour Operator)", rate: 18 },
  { value: "gst_28", label: "GST 28%", rate: 28 },
  { value: "custom", label: "Custom Rate", rate: 0 },
];
