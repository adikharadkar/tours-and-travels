import { getNextCustomerCode } from "./customerCodeService";

const CUSTOMERS_STORAGE_KEY = "customers";

const DEFAULT_CUSTOMERS = [
  {
    id: "cust_apex_1",
    customerCode: "CUST-8902A",
    name: "Apex Corporation",
    customerType: "company",
    contactPerson: "J. Smith",
    mobile1: "+1 (555) 019-2834",
    mobile2: "",
    email: "j.smith@apex.com",
    gstNumber: "27AAACA8902A1Z5",
    gstin: "27AAACA8902A1Z5",
    pan: "AAACA8902A",
    address: "100 Pine Street, Suite 2400",
    city: "San Francisco",
    state: "CA",
    postalCode: "94105",
    billingAddress: "100 Pine Street, Suite 2400",
    billingCity: "San Francisco",
    billingState: "CA",
    billingPincode: "94105",
    creditDays: 30,
    creditLimit: 500000,
    openingBalance: 0,
    outstandingAmount: 0.0,
    financialStatus: "healthy",
    paymentStatus: "Net 30 (Current)",
    isActive: true,
    createdAt: "2026-01-10T10:00:00.000Z",
    updatedAt: "2026-01-10T10:00:00.000Z",
  },
  {
    id: "cust_gt_2",
    customerCode: "CUST-4491X",
    name: "Global Transit",
    customerType: "company",
    contactPerson: "Billing Dept",
    mobile1: "+1 (312) 555-8821",
    mobile2: "",
    email: "billing@globaltransit.net",
    gstNumber: "29AABCG4491X1Z2",
    gstin: "29AABCG4491X1Z2",
    pan: "AABCG4491X",
    address: "300 S Riverside Plaza",
    city: "Chicago",
    state: "IL",
    postalCode: "60601",
    billingAddress: "300 S Riverside Plaza",
    billingCity: "Chicago",
    billingState: "IL",
    billingPincode: "60601",
    creditDays: 15,
    creditLimit: 150000,
    openingBalance: 12450.0,
    outstandingAmount: 12450.0,
    financialStatus: "warning",
    paymentStatus: "14 Days Overdue",
    isActive: true,
    createdAt: "2026-02-05T09:30:00.000Z",
    updatedAt: "2026-02-05T09:30:00.000Z",
  },
  {
    id: "cust_dot_3",
    customerCode: "GOV-0019B",
    name: "Dept. of Transportation",
    customerType: "company",
    contactPerson: "Sarah Jenkins",
    mobile1: "+1 (800) 555-1212",
    mobile2: "",
    email: "logistics@dot.gov",
    gstNumber: "07AAACD0019B1Z0",
    gstin: "07AAACD0019B1Z0",
    pan: "AAACD0019B",
    address: "1200 New Jersey Ave SE",
    city: "Washington",
    state: "DC",
    postalCode: "20590",
    billingAddress: "1200 New Jersey Ave SE",
    billingCity: "Washington",
    billingState: "DC",
    billingPincode: "20590",
    creditDays: 60,
    creditLimit: 1000000,
    openingBalance: 0,
    outstandingAmount: 0.0,
    financialStatus: "healthy",
    paymentStatus: "Net 60 (Processing)",
    isActive: true,
    createdAt: "2026-02-14T14:15:00.000Z",
    updatedAt: "2026-02-14T14:15:00.000Z",
  },
  {
    id: "cust_nexus_4",
    customerCode: "CUST-1188C",
    name: "Nexus Logistics",
    customerType: "company",
    contactPerson: "David Vance",
    mobile1: "+1 (214) 555-0987",
    mobile2: "",
    email: "finance@nexus.log",
    gstNumber: "27AABCN1188C1Z8",
    gstin: "27AABCN1188C1Z8",
    pan: "AABCN1188C",
    address: "2100 Ross Avenue, Suite 1800",
    city: "Dallas",
    state: "TX",
    postalCode: "75201",
    billingAddress: "2100 Ross Avenue, Suite 1800",
    billingCity: "Dallas",
    billingState: "TX",
    billingPincode: "75201",
    creditDays: 30,
    creditLimit: 250000,
    openingBalance: 48900.0,
    outstandingAmount: 48900.0,
    financialStatus: "critical",
    paymentStatus: "Collections - Hold",
    isActive: true,
    createdAt: "2026-03-01T11:00:00.000Z",
    updatedAt: "2026-03-01T11:00:00.000Z",
  },
  {
    id: "cust_horizon_5",
    customerCode: "CUST-0002",
    name: "Horizon Escapes Tours",
    customerType: "company",
    contactPerson: "Pooja Verma",
    mobile1: "9845012345",
    mobile2: "",
    email: "bookings@horizontours.com",
    gstNumber: "29AABCH5678B1Z2",
    gstin: "29AABCH5678B1Z2",
    pan: "AABCH5678B",
    address: "12, MG Road, Brigade Junction",
    city: "Bengaluru",
    state: "Karnataka",
    postalCode: "560001",
    billingAddress: "12, MG Road, Brigade Junction",
    billingCity: "Bengaluru",
    billingState: "Karnataka",
    billingPincode: "560001",
    creditDays: 15,
    creditLimit: 100000,
    openingBalance: 0,
    outstandingAmount: 0.0,
    financialStatus: "healthy",
    paymentStatus: "Net 15 (Current)",
    isActive: true,
    createdAt: "2026-02-05T09:30:00.000Z",
    updatedAt: "2026-02-05T09:30:00.000Z",
  },
  {
    id: "cust_zenith_6",
    customerCode: "CUST-0004",
    name: "Zenith Software Solutions",
    customerType: "enterprise",
    contactPerson: "Ananya Iyer",
    mobile1: "9766554433",
    mobile2: "",
    email: "corporate.admin@zenithsoft.io",
    gstNumber: "27AABCZ9988C1Z8",
    gstin: "27AABCZ9988C1Z8",
    pan: "AABCZ9988C",
    address: "Level 6, Tech Park, Hinjawadi Phase 2",
    city: "Pune",
    state: "Maharashtra",
    postalCode: "411057",
    billingAddress: "Level 6, Tech Park, Hinjawadi Phase 2",
    billingCity: "Pune",
    billingState: "Maharashtra",
    billingPincode: "411057",
    creditDays: 45,
    creditLimit: 300000,
    openingBalance: 8200.0,
    outstandingAmount: 8200.0,
    financialStatus: "warning",
    paymentStatus: "7 Days Overdue",
    isActive: true,
    createdAt: "2026-03-01T11:00:00.000Z",
    updatedAt: "2026-03-01T11:00:00.000Z",
  },
  {
    id: "cust_vikram_7",
    customerCode: "CUST-0003",
    name: "Dr. Vikram Sethi",
    customerType: "individual",
    contactPerson: "Dr. Vikram Sethi",
    mobile1: "9811223344",
    mobile2: "",
    email: "vikram.sethi@gmail.com",
    gstNumber: "",
    gstin: "",
    pan: "ABCPS9876K",
    address: "B-24, Greater Kailash 1",
    city: "New Delhi",
    state: "Delhi",
    postalCode: "110048",
    billingAddress: "B-24, Greater Kailash 1",
    billingCity: "New Delhi",
    billingState: "Delhi",
    billingPincode: "110048",
    creditDays: 0,
    creditLimit: 50000,
    openingBalance: 0,
    outstandingAmount: 0.0,
    financialStatus: "healthy",
    paymentStatus: "Immediate (Paid)",
    isActive: true,
    createdAt: "2026-02-14T14:15:00.000Z",
    updatedAt: "2026-02-14T14:15:00.000Z",
  },
];

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getStoredCustomers = () => {
  try {
    const storedCustomers = localStorage.getItem(CUSTOMERS_STORAGE_KEY);

    if (!storedCustomers) {
      localStorage.setItem(
        CUSTOMERS_STORAGE_KEY,
        JSON.stringify(DEFAULT_CUSTOMERS),
      );
      return DEFAULT_CUSTOMERS;
    }

    const customers = JSON.parse(storedCustomers);

    if (!Array.isArray(customers)) {
      throw new Error("Stored customer data is invalid.");
    }

    let needsResave = false;
    const normalized = customers.map((c, index) => {
      let updated = { ...c };
      if (!updated.id) {
        needsResave = true;
        updated.id = `cust_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 8)}`;
      }
      if (updated.gstin === undefined) {
        updated.gstin = updated.gstNumber || "";
        needsResave = true;
      }
      if (updated.city === undefined) {
        updated.city = updated.billingCity || "";
        needsResave = true;
      }
      if (updated.state === undefined) {
        updated.state = updated.billingState || "";
        needsResave = true;
      }
      if (updated.postalCode === undefined) {
        updated.postalCode = updated.pinCode || updated.billingPincode || "";
        needsResave = true;
      }
      if (updated.financialStatus === undefined) {
        const amt = Number(
          updated.outstandingAmount ?? updated.openingBalance ?? 0,
        );
        updated.financialStatus =
          amt > 20000 ? "critical" : amt > 0 ? "warning" : "healthy";
        needsResave = true;
      }
      if (updated.outstandingAmount === undefined) {
        updated.outstandingAmount = Number(updated.openingBalance ?? 0);
        needsResave = true;
      }
      if (updated.paymentStatus === undefined) {
        updated.paymentStatus =
          updated.financialStatus === "critical"
            ? "Collections - Hold"
            : updated.financialStatus === "warning"
              ? "14 Days Overdue"
              : updated.paymentTerms
                ? `Net ${String(updated.paymentTerms).replace("_days", "")} (Current)`
                : "Net 30 (Current)";
        needsResave = true;
      }
      return updated;
    });

    if (needsResave) {
      localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(normalized));
    }

    return normalized;
  } catch (error) {
    console.error("Failed to read customers from localStorage:", error);

    throw new Error("Unable to load customer data.", { cause: error });
  }
};

export function getCustomers() {
  return getStoredCustomers();
}

export function getCustomerById(customerId) {
  if (!customerId) {
    return null;
  }

  const customers = getStoredCustomers();

  return customers.find((customer) => customer.id === customerId) ?? null;
}

export function deleteCustomer(customerId) {
  if (!customerId) {
    throw new Error("Customer ID is required.");
  }

  const customers = getStoredCustomers();

  const customerExists = customers.some(
    (customer) => customer.id === customerId,
  );

  if (!customerExists) {
    throw new Error("Customer not found.");
  }

  const updatedCustomers = customers.filter(
    (customer) => customer.id !== customerId,
  );

  try {
    localStorage.setItem(
      CUSTOMERS_STORAGE_KEY,
      JSON.stringify(updatedCustomers),
    );
  } catch (error) {
    console.error("Failed to delete customer from localStorage:", error);

    throw new Error("Unable to delete customer.", { cause: error });
  }

  return true;
}

const findDuplicateCustomer = (
  customerData,
  customers,
  excludedCustomerId = null,
) => {
  const gstNumber = normalize(customerData.gstNumber);

  const pan = normalize(customerData.pan);

  const name = normalize(customerData.name);

  const mobile1 = String(customerData.mobile1 ?? "").trim();

  const existingCustomers = customers.filter(
    (customer) => customer.id !== excludedCustomerId,
  );

  if (gstNumber) {
    const gstMatch = existingCustomers.find(
      (customer) => normalize(customer.gstNumber) === gstNumber,
    );

    if (gstMatch) {
      return gstMatch;
    }
  }

  if (pan) {
    const panMatch = existingCustomers.find(
      (customer) => normalize(customer.pan) === pan,
    );

    if (panMatch) {
      return panMatch;
    }
  }

  if (name && mobile1) {
    const nameAndMobileMatch = existingCustomers.find(
      (customer) =>
        normalize(customer.name) === name &&
        String(customer.mobile1 ?? "").trim() === mobile1,
    );

    if (nameAndMobileMatch) {
      return nameAndMobileMatch;
    }
  }

  return null;
};

export function updateCustomer(customerId, customerData) {
  if (!customerId) {
    throw new Error("Customer ID is required.");
  }

  if (!customerData || typeof customerData !== "object") {
    throw new Error("Invalid customer data.");
  }

  const customers = getStoredCustomers();

  const duplicateCustomer = findDuplicateCustomer(
    customerData,
    customers,
    customerId,
  );

  if (duplicateCustomer) {
    throw new Error(
      `Another customer already exists with code ${duplicateCustomer.customerCode}.`,
    );
  }

  const customerIndex = customers.findIndex(
    (customer) => customer.id === customerId,
  );

  if (customerIndex === -1) {
    throw new Error("Customer not found.");
  }

  const existingCustomer = customers[customerIndex];

  const updatedCustomer = {
    ...existingCustomer,
    ...customerData,

    // These must never change during an edit.
    id: existingCustomer.id,
    customerCode: existingCustomer.customerCode,

    // Preserve original creation time.
    createdAt: existingCustomer.createdAt,

    // Update modification time.
    updatedAt: new Date().toISOString(),
  };

  customers[customerIndex] = updatedCustomer;

  try {
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
  } catch (error) {
    console.error("Failed to update customer:", error);

    throw new Error("Unable to update customer.", { cause: error });
  }

  return updatedCustomer;
}

export function saveCustomer(customerData) {
  if (!customerData || typeof customerData !== "object") {
    throw new Error("Invalid customer data.");
  }

  const customers = getStoredCustomers();

  const duplicateCustomer = findDuplicateCustomer(customerData, customers);

  if (duplicateCustomer) {
    throw new Error(
      `Customer already exists with code ${duplicateCustomer.customerCode}.`,
    );
  }

  const newId =
    customerData.id ||
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `cust_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

  const now = new Date().toISOString();

  const customer = {
    ...customerData,
    id: newId,
    customerCode: customerData.customerCode || getNextCustomerCode(),
    createdAt: customerData.createdAt || now,
    updatedAt: customerData.updatedAt || now,
  };

  const updatedCustomers = [...customers, customer];

  try {
    localStorage.setItem(
      CUSTOMERS_STORAGE_KEY,
      JSON.stringify(updatedCustomers),
    );
  } catch (error) {
    console.error("Failed to save customer to localStorage:", error);

    throw new Error("Unable to save customer.", { cause: error });
  }

  return customer;
}
