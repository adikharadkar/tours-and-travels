import { describe, it, expect } from "vitest";
import {
  populateBillableItemsFromTrip,
  calculateDueDate,
  checkCustomerBillingValidation,
} from "./tripToInvoice";

describe("tripToInvoice", () => {
  it("populates line items from trip data", () => {
    const mockTrip = {
      tripCode: "TRP-8821",
      tripType: "package",
      pickupLocation: "Mumbai",
      dropLocation: "Delhi",
      baseRate: 45000,
      extraKmCharges: 1250,
      ratePerKm: 25,
      tollCharges: 3450,
      driverCharges: 1000,
      parkingCharges: 0,
      taxApplicable: true,
      taxRate: 18,
    };

    const items = populateBillableItemsFromTrip(mockTrip);
    expect(items.length).toBe(4);

    // Base package
    expect(items[0].description).toContain("Standard Package");
    expect(items[0].amount).toBe(45000);
    expect(items[0].taxRate).toBe(18);

    // Extra KM
    expect(items[1].description).toBe("Excess Mileage");
    expect(items[1].quantity).toBe(50); // 1250 / 25
    expect(items[1].amount).toBe(1250);

    // Tolls (0% tax at actuals)
    expect(items[2].description).toBe("Toll Charges");
    expect(items[2].amount).toBe(3450);
    expect(items[2].taxRate).toBe(0);

    // Driver allowance (0% tax at actuals)
    expect(items[3].description).toBe("Driver Allowance");
    expect(items[3].amount).toBe(1000);
    expect(items[3].taxRate).toBe(0);
  });

  it("calculates due dates based on payment terms", () => {
    const baseDate = "2026-08-25";
    expect(calculateDueDate(baseDate, "immediate")).toBe("2026-08-25");
    expect(calculateDueDate(baseDate, "15_days")).toBe("2026-09-09");
    expect(calculateDueDate(baseDate, "30_days")).toBe("2026-09-24");
    expect(calculateDueDate(baseDate, "60_days")).toBe("2026-10-24");
  });

  it("validates missing critical customer billing info", () => {
    const invalidCustomer = {
      name: "Acme Logistics Corp",
      customerType: "company",
      gstin: "",
      address: "",
    };

    const validation = checkCustomerBillingValidation(invalidCustomer);
    expect(validation.hasCriticalMissing).toBe(true);
    expect(validation.missing.some((m) => m.key === "gstin")).toBe(true);
  });

  it("passes validation when customer has complete billing profile", () => {
    const validCustomer = {
      name: "Acme Logistics Corp",
      customerType: "company",
      gstin: "27AAACA8902A1Z5",
      billingAddress: "123 Supply Chain Blvd",
      billingCity: "Mumbai",
      billingState: "Maharashtra",
    };

    const validation = checkCustomerBillingValidation(validCustomer);
    expect(validation.hasCriticalMissing).toBe(false);
  });
});
