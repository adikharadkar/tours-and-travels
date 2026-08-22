import { getNextCustomerCode } from "./customerCodeService";

const CUSTOMERS_STORAGE_KEY = "customers";

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getStoredCustomers = () => {
  try {
    const storedCustomers = localStorage.getItem(CUSTOMERS_STORAGE_KEY);

    if (!storedCustomers) {
      return [];
    }

    const customers = JSON.parse(storedCustomers);

    if (!Array.isArray(customers)) {
      throw new Error("Stored customer data is invalid.");
    }

    return customers;
  } catch (error) {
    console.error("Failed to read customers from localStorage:", error);

    throw new Error("Unable to load customer data.");
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

    throw new Error("Unable to delete customer.");
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

    throw new Error("Unable to update customer.");
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

  const customer = {
    ...customerData,
    customerCode: getNextCustomerCode(),
  };

  const updatedCustomers = [...customers, customer];

  try {
    localStorage.setItem(
      CUSTOMERS_STORAGE_KEY,
      JSON.stringify(updatedCustomers),
    );
  } catch (error) {
    console.error("Failed to save customer to localStorage:", error);

    throw new Error("Unable to save customer.");
  }

  return customer;
}
