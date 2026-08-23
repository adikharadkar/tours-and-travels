import { getNextCustomerCode } from "./customerCodeService";

const CUSTOMERS_STORAGE_KEY = "customers";

const DEFAULT_CUSTOMERS = [
  {
    id: "cust_1",
    customerCode: "CUST-0001",
    name: "Apex Global Logistics Ltd",
    customerType: "company",
    contactPerson: "Rajesh Sharma",
    mobile1: "9820198201",
    mobile2: "9820198202",
    email: "travel@apexlogistics.in",
    gstNumber: "27AAACA1234A1Z5",
    pan: "AAACA1234A",
    billingAddress: "402, Business Bay, Andheri East",
    billingCity: "Mumbai",
    billingState: "Maharashtra",
    billingPincode: "400069",
    creditDays: 30,
    isActive: true,
    createdAt: "2026-01-10T10:00:00.000Z",
    updatedAt: "2026-01-10T10:00:00.000Z",
  },
  {
    id: "cust_2",
    customerCode: "CUST-0002",
    name: "Horizon Escapes Tours",
    customerType: "company",
    contactPerson: "Pooja Verma",
    mobile1: "9845012345",
    email: "bookings@horizontours.com",
    gstNumber: "29AABCH5678B1Z2",
    pan: "AABCH5678B",
    billingAddress: "12, MG Road, Brigade Junction",
    billingCity: "Bengaluru",
    billingState: "Karnataka",
    billingPincode: "560001",
    creditDays: 15,
    isActive: true,
    createdAt: "2026-02-05T09:30:00.000Z",
    updatedAt: "2026-02-05T09:30:00.000Z",
  },
  {
    id: "cust_3",
    customerCode: "CUST-0003",
    name: "Dr. Vikram Sethi",
    customerType: "individual",
    contactPerson: "Dr. Vikram Sethi",
    mobile1: "9811223344",
    email: "vikram.sethi@gmail.com",
    pan: "ABCPS9876K",
    billingAddress: "B-24, Greater Kailash 1",
    billingCity: "New Delhi",
    billingState: "Delhi",
    billingPincode: "110048",
    creditDays: 0,
    isActive: true,
    createdAt: "2026-02-14T14:15:00.000Z",
    updatedAt: "2026-02-14T14:15:00.000Z",
  },
  {
    id: "cust_4",
    customerCode: "CUST-0004",
    name: "Zenith Software Solutions",
    customerType: "company",
    contactPerson: "Ananya Iyer",
    mobile1: "9766554433",
    email: "corporate.admin@zenithsoft.io",
    gstNumber: "27AABCZ9988C1Z8",
    pan: "AABCZ9988C",
    billingAddress: "Level 6, Tech Park, Hinjawadi Phase 2",
    billingCity: "Pune",
    billingState: "Maharashtra",
    billingPincode: "411057",
    creditDays: 45,
    isActive: true,
    createdAt: "2026-03-01T11:00:00.000Z",
    updatedAt: "2026-03-01T11:00:00.000Z",
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
      if (!c.id) {
        needsResave = true;
        return {
          ...c,
          id: `cust_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 8)}`,
        };
      }
      return c;
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
