export const VEHICLE_TYPES = [
  { label: "Bus", value: "bus" },
  { label: "Mini Bus", value: "mini_bus" },
  { label: "Car", value: "car" },
  { label: "Tempo", value: "tempo" },
  { label: "Truck", value: "truck" },
  { label: "Traveller", value: "traveller" },
  { label: "Other", value: "other" },
];

export const FUEL_TYPES = [
  { label: "Diesel", value: "diesel" },
  { label: "Petrol", value: "petrol" },
  { label: "CNG", value: "cng" },
  { label: "Electric", value: "electric" },
  { label: "Hybrid", value: "hybrid" },
  { label: "Other", value: "other" },
];

export const OWNERSHIP_TYPES = [
  { label: "Own", value: "own" },
  { label: "Attached", value: "attached" },
  { label: "Leased", value: "leased" },
];

export const VEHICLE_STATUS_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export const DOCUMENT_STATUS_OPTIONS = [
  { label: "All Documents", value: "all" },
  { label: "Valid", value: "valid" },
  { label: "Expiring Soon", value: "expiring_soon" },
  { label: "Expired", value: "expired" },
];

export const VEHICLE_TYPE_LABELS = Object.fromEntries(
  VEHICLE_TYPES.map((item) => [item.value, item.label]),
);

export const FUEL_TYPE_LABELS = Object.fromEntries(
  FUEL_TYPES.map((item) => [item.value, item.label]),
);

export const OWNERSHIP_TYPE_LABELS = Object.fromEntries(
  OWNERSHIP_TYPES.map((item) => [item.value, item.label]),
);
