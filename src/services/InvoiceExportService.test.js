import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  normalizeInvoiceForExport,
  exportInvoiceToPdf,
  exportInvoiceToExcel,
  exportInvoiceToCsv,
  exportInvoicesToCsv,
  exportInvoicesToExcel,
} from "./invoiceExportService";

describe("invoiceExportService", () => {
  const sampleInvoice = {
    id: "inv-test-1",
    invoiceNumber: "INV-2026-9999",
    documentType: "tax_invoice",
    documentStatus: "issued",
    paymentStatus: "partially_paid",

    issueDate: "2026-03-15",
    dueDate: "2026-04-15",

    paymentTerms: "Net 30",

    customerName: "Acme Logistics Ltd",
    customerEmail: "finance@acme.com",
    customerPhone: "+91 9876543210",
    customerGstin: "27AAACA1234A1Z5",
    customerBillingAddress: "123 Business Park, Andheri East",
    customerCity: "Mumbai",
    customerState: "Maharashtra",
    customerPinCode: "400069",

    companyName: "Tours & Travels Fleet",
    companyGstin: "27AAAAA0000A1Z5",

    subtotal: 10000,
    taxRate: 5,
    taxAmount: 500,
    discountAmount: 0,

    totalAmount: 10500,
    paidAmount: 5000,

    lineItems: [
      {
        id: "item-1",
        description: "Mumbai to Pune Luxury Sedan Trip",
        hsnSac: "9966",
        quantity: 1,
        unit: "Trip",
        unitPrice: 10000,
        taxRate: 5,
        taxAmount: 500,
        totalAmount: 10500,
      },
    ],

    paymentHistory: [
      {
        id: "pay-1",
        paymentDate: "2026-03-20",
        paymentMode: "neft",
        referenceNumber: "UTR12345678",
        amount: 5000,
        notes: "Advance 50%",
      },
    ],

    termsAndConditions: "Payment due within 30 days.",

    bankDetails: {
      accountName: "Tours & Travels Operations",
      accountNumber: "123456789012",
      ifscCode: "HDFC0001234",
      bankName: "HDFC Bank",
      branch: "Mumbai Main",
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("normalizeInvoiceForExport", () => {
    it("normalizes invoice identity and customer information", () => {
      const normalized = normalizeInvoiceForExport(sampleInvoice);

      expect(normalized).toBeDefined();

      expect(normalized.invoiceNumber).toBe("INV-2026-9999");
      expect(normalized.documentType).toBe("tax_invoice");
      expect(normalized.documentStatus).toBe("issued");
      expect(normalized.paymentStatus).toBe("partially_paid");

      expect(normalized.customerName).toBe("Acme Logistics Ltd");
      expect(normalized.customerGstin).toBe("27AAACA1234A1Z5");
      expect(normalized.contactEmail).toBe("finance@acme.com");
      expect(normalized.contactPhone).toBe("+91 9876543210");

      expect(normalized.issueDate).toBe("2026-03-15");
      expect(normalized.dueDate).toBe("2026-04-15");
      expect(normalized.paymentTerms).toBe("Net 30");
    });

    it("normalizes financial values using the current export field names", () => {
      const normalized = normalizeInvoiceForExport(sampleInvoice);

      expect(normalized.subtotal).toBe(10000);
      expect(normalized.discountAmount).toBe(0);

      expect(normalized.taxAmount).toBe(500);
      expect(normalized.cgstAmount).toBe(250);
      expect(normalized.sgstAmount).toBe(250);
      expect(normalized.igstAmount).toBe(0);

      // normalizeInvoiceForExport exposes this as grandTotal.
      expect(normalized.grandTotal).toBe(10500);

      expect(normalized.paidAmount).toBe(5000);

      // normalizeInvoiceForExport exposes this as outstandingAmount.
      expect(normalized.outstandingAmount).toBe(5500);
    });

    it("does not use the old totalAmount and dueAmount property names", () => {
      const normalized = normalizeInvoiceForExport(sampleInvoice);

      expect(normalized.totalAmount).toBeUndefined();
      expect(normalized.dueAmount).toBeUndefined();

      expect(normalized.grandTotal).toBe(10500);
      expect(normalized.outstandingAmount).toBe(5500);
    });

    it("creates the expected CGST and SGST tax rows", () => {
      const normalized = normalizeInvoiceForExport(sampleInvoice);

      expect(normalized.taxRows).toHaveLength(2);

      expect(normalized.taxRows[0]).toEqual({
        name: "CGST (3%)",
        amount: 250,
      });

      expect(normalized.taxRows[1]).toEqual({
        name: "SGST (3%)",
        amount: 250,
      });
    });

    it("normalizes line items and payment history", () => {
      const normalized = normalizeInvoiceForExport(sampleInvoice);

      expect(normalized.items).toHaveLength(1);

      expect(normalized.items[0]).toEqual({
        amount: 10000,
        description: "Freight Transportation Service",
        quantity: 1,
        unitRate: 10000,
      });

      expect(normalized.paymentHistory).toHaveLength(1);

      expect(normalized.paymentHistory[0]).toEqual(
        expect.objectContaining({
          paymentDate: "2026-03-20",
          paymentMode: "neft",
          referenceNumber: "UTR12345678",
          amount: 5000,
        }),
      );
    });

    it("calculates the outstanding amount without allowing it to go below zero", () => {
      const fullyPaidInvoice = {
        ...sampleInvoice,
        paidAmount: 10500,
      };

      const overpaidInvoice = {
        ...sampleInvoice,
        paidAmount: 12000,
      };

      expect(
        normalizeInvoiceForExport(fullyPaidInvoice).outstandingAmount,
      ).toBe(0);

      expect(normalizeInvoiceForExport(overpaidInvoice).outstandingAmount).toBe(
        0,
      );
    });

    it("generates amount in words from the grand total", () => {
      const normalized = normalizeInvoiceForExport(sampleInvoice);

      expect(normalized.amountInWords).toBeDefined();
      expect(typeof normalized.amountInWords).toBe("string");
    });
  });

  describe("CSV export", () => {
    it("exports a single invoice to CSV without throwing", () => {
      const clickSpy = vi.fn();

      const originalCreateElement = document.createElement.bind(document);

      vi.spyOn(document, "createElement").mockImplementation((tag) => {
        const element = originalCreateElement(tag);

        if (tag === "a") {
          element.click = clickSpy;
        }

        return element;
      });

      expect(() => exportInvoiceToCsv(sampleInvoice)).not.toThrow();

      expect(clickSpy).toHaveBeenCalled();
    });

    it("exports multiple invoices to CSV without throwing", () => {
      const clickSpy = vi.fn();

      const originalCreateElement = document.createElement.bind(document);

      vi.spyOn(document, "createElement").mockImplementation((tag) => {
        const element = originalCreateElement(tag);

        if (tag === "a") {
          element.click = clickSpy;
        }

        return element;
      });

      expect(() => exportInvoicesToCsv([sampleInvoice])).not.toThrow();

      expect(clickSpy).toHaveBeenCalled();
    });

    it("returns a CSV blob when returnBlob is enabled", () => {
      const result = exportInvoiceToCsv(sampleInvoice, {
        returnBlob: true,
      });

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toContain("text/csv");
    });

    it("returns a CSV blob for bulk export when returnBlob is enabled", () => {
      const result = exportInvoicesToCsv([sampleInvoice], {
        returnBlob: true,
      });

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toContain("text/csv");
    });
  });

  describe("Excel export", () => {
    it("exports a single invoice to Excel without throwing", async () => {
      await expect(exportInvoiceToExcel(sampleInvoice)).resolves.not.toThrow();
    });

    it("exports bulk invoices to Excel without throwing", () => {
      expect(() => exportInvoicesToExcel([sampleInvoice])).not.toThrow();
    });

    it("rejects an invalid invoice for single Excel export", async () => {
      await expect(exportInvoiceToExcel(null)).rejects.toThrow(
        "Invalid invoice data provided for export.",
      );
    });

    it("rejects an empty bulk Excel export", () => {
      expect(() => exportInvoicesToExcel([])).toThrow(
        "No invoices selected for bulk export.",
      );
    });

    it("rejects non-array bulk Excel input", () => {
      expect(() => exportInvoicesToExcel(null)).toThrow(
        "No invoices selected for bulk export.",
      );
    });
  });

  describe("PDF export", () => {
    it("exports an invoice to PDF without throwing", async () => {
      await expect(exportInvoiceToPdf(sampleInvoice)).resolves.not.toThrow();
    });

    it("returns a PDF Blob when returnBlob is enabled", async () => {
      const result = await exportInvoiceToPdf(sampleInvoice, {
        returnBlob: true,
      });

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe("application/pdf");
    });

    it("rejects an invalid invoice for PDF export", async () => {
      await expect(exportInvoiceToPdf(null)).rejects.toThrow(
        "Invalid invoice data provided for export.",
      );
    });
  });
});
