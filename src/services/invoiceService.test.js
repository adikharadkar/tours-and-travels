import { describe, it, expect, beforeEach } from "vitest";
import {
  getInvoices,
  getInvoiceById,
  saveInvoice,
  updateInvoice,
  deleteInvoice,
  recordPayment,
  markInvoiceIssued,
  cancelInvoice,
  getInvoiceKPIs,
} from "./invoiceService";

describe("invoiceService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns default invoices if localStorage is empty", () => {
    const list = getInvoices();
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty("invoiceNumber");
    expect(list[0]).toHaveProperty("documentType");
    expect(list[0]).toHaveProperty("documentStatus");
    expect(list[0]).toHaveProperty("paymentStatus");
  });

  it("can find an invoice by id", () => {
    const list = getInvoices();
    const first = list[0];
    const found = getInvoiceById(first.id);
    expect(found).toBeDefined();
    expect(found.invoiceNumber).toBe(first.invoiceNumber);
  });

  it("can create and save a new invoice", () => {
    const newInv = saveInvoice({
      customerName: "Acme Logistics",
      customerId: "cust_acme_1",
      documentType: "tax_invoice",
      documentStatus: "issued",
      totalAmount: 50000,
      paidAmount: 0,
      issueDate: "2026-08-25",
      dueDate: "2026-09-10",
    });

    expect(newInv.id).toBeDefined();
    expect(newInv.invoiceNumber).toBeDefined();
    expect(newInv.outstandingAmount).toBe(50000);
    expect(newInv.paymentStatus).toBe("unpaid");

    const found = getInvoiceById(newInv.id);
    expect(found).not.toBeNull();
    expect(found.customerName).toBe("Acme Logistics");
  });

  it("can update an existing invoice", () => {
    const list = getInvoices();
    const first = list[0];

    const updated = updateInvoice(first.id, {
      notes: "Updated delivery note",
    });

    expect(updated.notes).toBe("Updated delivery note");
    expect(getInvoiceById(first.id).notes).toBe("Updated delivery note");
  });

  it("can delete an invoice", () => {
    const newInv = saveInvoice({
      customerName: "Temporary Corp",
      totalAmount: 15000,
      documentStatus: "draft",
    });

    expect(getInvoiceById(newInv.id)).not.toBeNull();
    deleteInvoice(newInv.id);
    expect(getInvoiceById(newInv.id)).toBeNull();
  });

  it("records payment properly and adjusts status to paid/partially_paid", () => {
    const newInv = saveInvoice({
      customerName: "Payment Test Corp",
      totalAmount: 10000,
      paidAmount: 0,
      documentStatus: "issued",
    });

    // 1. Partial payment
    const partial = recordPayment(newInv.id, {
      amount: 4000,
      paymentMode: "upi",
      referenceNumber: "UPI-9921",
    });

    expect(partial.paidAmount).toBe(4000);
    expect(partial.outstandingAmount).toBe(6000);
    expect(partial.paymentStatus).toBe("partially_paid");
    expect(partial.paymentHistory.length).toBe(1);

    // 2. Remaining payment
    const full = recordPayment(newInv.id, {
      amount: 6000,
      paymentMode: "bank_transfer",
      referenceNumber: "NEFT-1123",
    });

    expect(full.paidAmount).toBe(10000);
    expect(full.outstandingAmount).toBe(0);
    expect(full.paymentStatus).toBe("paid");
    expect(full.paymentHistory.length).toBe(2);
  });

  it("marks a draft invoice as issued with formal invoice number", () => {
    const draft = saveInvoice({
      customerName: "Draft Customer",
      totalAmount: 25000,
      documentStatus: "draft",
    });

    expect(draft.documentStatus).toBe("draft");

    const issued = markInvoiceIssued(draft.id);
    expect(issued.documentStatus).toBe("issued");
    expect(issued.invoiceNumber.startsWith("INV-")).toBe(true);
  });

  it("cancels an invoice properly", () => {
    const list = getInvoices();
    const first = list[0];

    const cancelled = cancelInvoice(
      first.id,
      "Customer requested cancellation",
    );
    expect(cancelled.documentStatus).toBe("cancelled");
    expect(cancelled.cancelReason).toBe("Customer requested cancellation");
  });

  it("calculates accurate KPIs across datasets", () => {
    const kpis = getInvoiceKPIs();
    expect(kpis).toHaveProperty("totalOutstanding");
    expect(kpis).toHaveProperty("overdueAmount");
    expect(kpis).toHaveProperty("overdueCount");
    expect(kpis).toHaveProperty("draftCount");
    expect(kpis).toHaveProperty("paidThisMonth");
    expect(kpis.totalOutstanding).toBeGreaterThan(0);
  });
});
