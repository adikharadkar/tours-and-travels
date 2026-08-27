import getToday from "../utils/getToday";

export const CUSTOMER_TYPE_OPTIONS = [
  { label: "All Customer Types", value: "all" },
  { label: "Company", value: "company" },
  { label: "Individual", value: "individual" },
];

export const STATUS_CLASSES = {
  active: "bg-success/10 text-success",
  inactive: "bg-muted/20 text-muted",

  no_dues: "bg-success/10 text-success",
  due: "bg-warning/10 text-warning",
  overdue: "bg-error/10 text-error",
  credit: "bg-primary/10 text-primary",
};

export const PAYMENT_STATUS_OPTIONS = [
  { label: "All Payment Statuses", value: "all" },
  { label: "Healthy (Current)", value: "healthy" },
  { label: "Warning (Overdue)", value: "warning" },
  { label: "Critical (Collections)", value: "critical" },
];

export const PAYMENT_TERMS = [
  { label: "Immediate", value: "immediate" },
  { label: "Net 15 Days", value: "15_days" },
  { label: "Net 30 Days", value: "30_days" },
  { label: "Net 45 Days", value: "45_days" },
  { label: "Net 60 Days", value: "60_days" },
];

export const BILLING_CYCLES = [
  { label: "Per Trip / Invoice", value: "per_trip" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

export const OPENING_BALANCE_TYPES = [
  { label: "Debit (Dr)", value: "debit" },
  { label: "Credit (Cr)", value: "credit" },
];

export const PREFIXES = [
  { label: "Mr.", value: "mr" },
  { label: "Mrs.", value: "mrs" },
  { label: "Ms.", value: "ms" },
  { label: "Dr.", value: "dr" },
];

export const INITIAL_FORM_DATA = {
  customerCode: "Will be generated automatically",
  registrationDate: getToday(),

  prefix: "",
  name: "",
  customerType: "company",
  contactPerson: "",

  mobile1: "",
  mobile2: "",
  email: "",
  alternateEmail: "",

  address: "",
  city: "",
  state: "",
  stateCode: "",
  pinCode: "",

  gstNumber: "",
  pan: "",
  vendorCode: "",
  billingName: "",
  billingSameAsAddress: true,
  billingAddress: "",
  billingCity: "",
  billingState: "",
  billingStateCode: "",
  billingPinCode: "",

  openingBalance: "0.00",
  openingBalanceType: "debit",
  creditLimit: "",
  paymentTerms: "30_days",
  billingCycle: "monthly",

  dateOfBirth: "",
  marriageDate: "",
  notes: "",

  isActive: true,
};
