export const LICENSE_TYPES = [
  { label: "LMV (Light Motor Vehicle)", value: "lmv" },
  { label: "HMV (Heavy Motor Vehicle)", value: "hmv" },
  { label: "Transport Vehicle", value: "transport" },
  { label: "Commercial Vehicle", value: "commercial" },
  { label: "Other", value: "other" },
];

export const LICENSE_TYPE_LABELS = {
  lmv: "LMV",
  hmv: "HMV",
  transport: "Transport",
  commercial: "Commercial",
  other: "Other",
};

export const DRIVER_TYPES = [
  { label: "Own", value: "own" },
  { label: "Contract", value: "contract" },
  { label: "Attached", value: "attached" },
];

export const DRIVER_TYPE_LABELS = {
  own: "Own",
  contract: "Contract",
  attached: "Attached",
};

export const DRIVER_PREFIXES = [
  { label: "Mr.", value: "mr" },
  { label: "Mrs.", value: "mrs" },
  { label: "Ms.", value: "ms" },
  { label: "Dr.", value: "dr" },
];

export const PREFIX_LABELS = {
  mr: "Mr.",
  mrs: "Mrs.",
  ms: "Ms.",
  dr: "Dr.",
};

export const DRIVER_STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export const LICENSE_STATUS_OPTIONS = [
  { label: "All License Statuses", value: "all" },
  { label: "Valid", value: "valid" },
  { label: "Expiring Soon (30d)", value: "expiring_soon" },
  { label: "Expired", value: "expired" },
];

export const DRIVER_TYPE_FILTER_OPTIONS = [
  { label: "All Driver Types", value: "all" },
  ...DRIVER_TYPES,
];

export const EXPIRING_SOON_THRESHOLD_DAYS = 30;
