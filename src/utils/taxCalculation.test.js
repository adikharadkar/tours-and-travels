import { describe, it, expect } from "vitest";
import {
  extractStateCode,
  isInterStateSupply,
  calculateInvoiceTaxes,
} from "./taxCalculation";

describe("taxCalculation", () => {
  it("extracts state code from GSTIN properly", () => {
    expect(extractStateCode("27AAACA8902A1Z5")).toBe("27");
    expect(extractStateCode("29BBBCB1234C1Z2")).toBe("29");
    expect(extractStateCode("07ABCDE1234F1Z5")).toBe("07");
  });

  it("extracts state code from state name", () => {
    expect(extractStateCode("", "Maharashtra")).toBe("27");
    expect(extractStateCode("", "Karnataka")).toBe("29");
  });

  it("detects intra-state vs inter-state supply", () => {
    // Company HQ is 27 (Maharashtra)
    expect(isInterStateSupply("27AAACA8902A1Z5", "Maharashtra", "27")).toBe(
      false,
    );
    expect(isInterStateSupply("29BBBCB1234C1Z2", "Karnataka", "27")).toBe(true);
  });

  it("calculates intra-state taxes with CGST and SGST split equally", () => {
    const items = [
      { amount: 45000, taxRate: 18 },
      { amount: 5000, taxRate: 18 },
    ];
    const result = calculateInvoiceTaxes({
      items,
      customerGstin: "27AAACA8902A1Z5",
      customerState: "Maharashtra",
      companyStateCode: "27",
    });

    expect(result.subtotal).toBe(50000);
    expect(result.isInterState).toBe(false);
    expect(result.totalCgst).toBe(4500); // 9% of 50000
    expect(result.totalSgst).toBe(4500); // 9% of 50000
    expect(result.totalTax).toBe(9000);
    expect(result.grandTotal).toBe(59000);
    expect(result.taxRows.length).toBe(2);
    expect(result.taxRows[0].name).toContain("CGST");
    expect(result.taxRows[1].name).toContain("SGST");
  });

  it("calculates inter-state taxes with IGST", () => {
    const items = [{ amount: 50000, taxRate: 18 }];
    const result = calculateInvoiceTaxes({
      items,
      customerGstin: "29BBBCB1234C1Z2",
      customerState: "Karnataka",
      companyStateCode: "27",
    });

    expect(result.subtotal).toBe(50000);
    expect(result.isInterState).toBe(true);
    expect(result.totalIgst).toBe(9000);
    expect(result.totalTax).toBe(9000);
    expect(result.grandTotal).toBe(59000);
    expect(result.taxRows.length).toBe(1);
    expect(result.taxRows[0].name).toContain("IGST");
  });
});
