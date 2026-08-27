export const buildCustomerPayload = (data) => {
  // If billing same as address is true, ensure billing name is present
  const resolvedBillingName = data.billingSameAsAddress
    ? (data.billingName || data.name).trim()
    : data.billingName.trim();

  const resolvedBillingAddress = data.billingSameAsAddress
    ? data.address.trim()
    : data.billingAddress.trim();

  const resolvedBillingCity = data.billingSameAsAddress
    ? data.city
    : data.billingCity;

  const resolvedBillingState = data.billingSameAsAddress
    ? data.state
    : data.billingState;

  const resolvedBillingStateCode = data.billingSameAsAddress
    ? data.stateCode
    : data.billingStateCode;

  const resolvedBillingPinCode = data.billingSameAsAddress
    ? data.pinCode
    : data.billingPinCode;

  return {
    registrationDate: data.registrationDate,
    customerType: data.customerType,
    prefix: data.prefix,
    name: data.name.trim(),
    contactPerson: data.contactPerson.trim(),
    mobile1: data.mobile1.trim(),
    mobile2: data.mobile2.trim(),
    email: data.email.trim().toLowerCase(),
    alternateEmail: data.alternateEmail.trim().toLowerCase(),
    address: data.address.trim(),
    city: data.city,
    state: data.state,
    stateCode: data.stateCode,
    pinCode: data.pinCode,
    gstNumber: data.gstNumber.trim().toUpperCase(),
    pan: data.pan.trim().toUpperCase(),
    vendorCode: data.vendorCode.trim(),
    customerVendorCode: data.vendorCode.trim(),
    billingName: resolvedBillingName,
    billingSameAsAddress: data.billingSameAsAddress,
    billingAddress: resolvedBillingAddress,
    billingCity: resolvedBillingCity,
    billingState: resolvedBillingState,
    billingStateCode: resolvedBillingStateCode,
    billingPinCode: resolvedBillingPinCode,
    openingBalance: Number(data.openingBalance) || 0,
    openingBalanceType: data.openingBalanceType || "debit",
    creditLimit: data.creditLimit === "" ? 0 : Number(data.creditLimit),
    paymentTerms: data.paymentTerms,
    billingCycle: data.billingCycle,
    dateOfBirth: data.dateOfBirth || null,
    marriageDate: data.marriageDate || null,
    notes: data.notes.trim(),
    isActive: data.isActive,
  };
};

export function formatFinancialAmount(amount) {
  const num = Number(amount || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function getAvatarColor(name, type, financialStatus) {
  if (financialStatus === "critical") {
    return "bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700/50";
  }

  const normalizedType = String(type || "").toLowerCase();
  if (normalizedType === "individual") {
    // Distinct Amber/Teal/Indigo contrast for Individual
    return "bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700/50";
  }

  // Default Company avatar: Crisp indigo/violet with high contrast in light & dark mode
  return "bg-indigo-100 text-indigo-900 border border-indigo-300 dark:bg-indigo-950/70 dark:text-indigo-200 dark:border-indigo-700/50";
}

export function getCustomerInitials(name) {
  if (!name) return "CU";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export const formatCustomerType = (value) => {
  if (value === "company") {
    return "Company";
  }
  if (value === "individual") {
    return "Individual";
  }
  return "—";
};

export const formatPaymentTerms = (value) => {
  const labels = {
    immediate: "Immediate",
    "15_days": "15 Days",
    "30_days": "30 Days",
    "45_days": "45 Days",
    "60_days": "60 Days",
  };
  return labels[value] ?? "—";
};

export const formatBillingCycle = (value) => {
  const labels = {
    per_trip: "Per Trip",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
  };
  return labels[value] ?? "—";
};

export const formatOpeningBalanceType = (value) => {
  if (value === "debit") {
    return "Debit";
  }
  if (value === "credit") {
    return "Credit";
  }
  return "—";
};

export const formatDate = (value) => {
  if (!value) {
    return "—";
  }
  const dateOnly = String(value).split("T")[0];
  const [year, month, day] = dateOnly.split("-");
  if (!year || !month || !day) {
    return value;
  }
  return `${day}/${month}/${year}`;
};

export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return value;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};
