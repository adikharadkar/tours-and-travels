import { describe, it, expect } from "vitest";
import {
  BILLING_PERIOD_PRESETS,
  getBillingPeriodDates,
  getTripEligibility,
  aggregateTripCharges,
  getCustomerBillingContext,
  isCustomerMatch,
} from "./ConsolidatedInvoice";

describe("consolidatedInvoice utility", () => {
  describe("getBillingPeriodDates", () => {
    it("returns correct start and end dates for this_month", () => {
      const { startDate, endDate } = getBillingPeriodDates("this_month");
      expect(startDate).toMatch(/^\d{4}-\d{2}-01$/);
      expect(endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("returns valid dates for all defined presets", () => {
      BILLING_PERIOD_PRESETS.forEach((preset) => {
        const { startDate, endDate } = getBillingPeriodDates(preset.value);
        expect(startDate).toBeDefined();
        expect(endDate).toBeDefined();
        expect(new Date(startDate).getTime()).toBeLessThanOrEqual(
          new Date(endDate).getTime(),
        );
      });
    });
  });

  describe("isCustomerMatch", () => {
    it("matches identical IDs and known aliases", () => {
      expect(isCustomerMatch("cust_1", "cust_1")).toBe(true);
      expect(isCustomerMatch("cust_1", "cust_apex_1")).toBe(true);
      expect(isCustomerMatch("cust_1", "cust_other")).toBe(false);
    });
  });

  describe("getTripEligibility", () => {
    const customerId = "cust_1";

    it("marks completed unbilled trip as eligible", () => {
      const trip = {
        id: "trip_1",
        status: "completed",
        customerId: "cust_1",
        totalAmount: 5000,
      };
      const result = getTripEligibility(trip, [], customerId);
      expect(result.isEligible).toBe(true);
      expect(result.reasonCode).toBe("ELIGIBLE");
    });

    it("flags already invoiced trips as ineligible", () => {
      const trip = {
        id: "trip_2",
        status: "completed",
        customerId: "cust_1",
        totalAmount: 5000,
      };
      const existingInvoices = [
        {
          id: "inv_1",
          invoiceNumber: "INV-2026-0001",
          tripId: "trip_2",
          documentStatus: "issued",
        },
      ];
      const result = getTripEligibility(trip, existingInvoices, customerId);
      expect(result.isEligible).toBe(false);
      expect(result.reasonCode).toBe("ALREADY_INVOICED");
      expect(result.reason).toContain("Already invoiced (INV-2026-0001)");
    });

    it("flags cancelled trips as ineligible", () => {
      const trip = {
        id: "trip_3",
        status: "cancelled",
        customerId: "cust_1",
        totalAmount: 5000,
      };
      const result = getTripEligibility(trip, [], customerId);
      expect(result.isEligible).toBe(false);
      expect(result.reasonCode).toBe("CANCELLED");
    });

    it("flags active / in-progress trips as not yet completed", () => {
      const trip = {
        id: "trip_4",
        status: "in_progress",
        customerId: "cust_1",
        totalAmount: 5000,
      };
      const result = getTripEligibility(trip, [], customerId);
      expect(result.isEligible).toBe(false);
      expect(result.reasonCode).toBe("NOT_COMPLETED");
    });
  });

  describe("aggregateTripCharges & GST Tax calculation", () => {
    const intraStateCustomer = {
      id: "cust_intra",
      name: "Tata Motors Pune",
      billingState: "Maharashtra",
      billingStateCode: "27",
      gstin: "27AAACT2727Q1ZB",
    };

    const interStateCustomer = {
      id: "cust_inter",
      name: "Infosys Bengaluru",
      billingState: "Karnataka",
      billingStateCode: "29",
      gstin: "29AABCU9603R1ZX",
    };

    const mockTrips = [
      {
        id: "trip_101",
        tripCode: "TRP-101",
        customerId: "cust_intra",
        customerName: "Tata Motors Pune",
        startDate: "2026-08-05",
        pickupLocation: "Pune",
        dropLocation: "Mumbai",
        vehicleNumber: "MH-12-AB-1234",
        driverName: "Ramesh Pawar",
        baseRate: 5000,
        tollCharges: 400,
        parkingCharges: 100,
        extraKmCharges: 500,
        driverCharges: 300,
        discountAmount: 0,
        totalKm: 160,
      },
      {
        id: "trip_102",
        tripCode: "TRP-102",
        customerId: "cust_intra",
        customerName: "Tata Motors Pune",
        startDate: "2026-08-10",
        pickupLocation: "Pune",
        dropLocation: "Nashik",
        vehicleNumber: "MH-12-CD-5678",
        driverName: "Suresh Patil",
        baseRate: 7000,
        tollCharges: 250,
        parkingCharges: 50,
        extraKmCharges: 0,
        driverCharges: 0,
        discountAmount: 500,
        totalKm: 210,
      },
    ];

    it("calculates intra-state supply with exact CGST (6%) and SGST (6%) split", () => {
      const summary = aggregateTripCharges(mockTrips, [], intraStateCustomer);

      expect(summary.tripsCount).toBe(2);
      expect(summary.vehiclesUsedCount).toBe(2);
      expect(summary.isInterState).toBe(false);

      expect(summary.subtotal).toBeGreaterThan(0);
      expect(summary.totalCgst).toBeGreaterThan(0);
      expect(summary.totalSgst).toBeGreaterThan(0);
      expect(summary.totalCgst).toEqual(summary.totalSgst); // 50:50 equal split
      expect(summary.totalIgst).toBe(0);
      expect(summary.grandTotal).toBe(
        summary.subtotal +
          summary.totalCgst +
          summary.totalSgst +
          summary.roundOff,
      );
    });

    it("calculates inter-state supply with IGST (12%)", () => {
      const summary = aggregateTripCharges(mockTrips, [], interStateCustomer);

      expect(summary.isInterState).toBe(true);
      expect(summary.totalIgst).toBeGreaterThan(0);
      expect(summary.totalCgst).toBe(0);
      expect(summary.totalSgst).toBe(0);
    });

    it("incorporates custom billing adjustments / credits", () => {
      const adjustments = [
        {
          id: "adj_1",
          description: "Corporate Monthly Volume Rebate",
          amount: -1000,
          taxRate: 12,
        },
      ];

      const summaryWithoutAdj = aggregateTripCharges(
        mockTrips,
        [],
        intraStateCustomer,
      );
      const summaryWithAdj = aggregateTripCharges(
        mockTrips,
        adjustments,
        intraStateCustomer,
      );

      expect(summaryWithAdj.subtotal).toBeLessThan(summaryWithoutAdj.subtotal);
      expect(summaryWithAdj.grandTotal).toBeLessThan(
        summaryWithoutAdj.grandTotal,
      );
    });
  });

  describe("getCustomerBillingContext", () => {
    it("returns warning flags for corporate accounts without GSTIN", () => {
      const customer = {
        id: "c_warn",
        customerType: "company",
        name: "No GST Corp",
        gstin: "",
        creditLimit: 50000,
        outstandingAmount: 60000,
      };

      const ctx = getCustomerBillingContext(customer, 10000);
      expect(ctx.hasMissingGstin).toBe(true);
      expect(ctx.isCreditWarning).toBe(true);
    });
  });
});
