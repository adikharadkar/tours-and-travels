import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InvoiceExportMenu from "./InvoiceExportMenu";

describe("InvoiceExportMenu Component", () => {
  const sampleInvoice = {
    id: "inv-test-menu",
    invoiceNumber: "INV-2026-8888",
    documentType: "tax_invoice",
    documentStatus: "issued",
    paymentStatus: "paid",
    totalAmount: 10000,
    paidAmount: 10000,
    customerName: "Test Customer",
    issueDate: "2026-03-15",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders export button trigger and toggles menu open/close", () => {
    render(<InvoiceExportMenu invoice={sampleInvoice} />);

    const triggerBtn = screen.getByRole("button", { name: "Export Invoice" });
    expect(triggerBtn).toBeInTheDocument();

    fireEvent.click(triggerBtn);
    expect(screen.getByText("Select Export Format")).toBeInTheDocument();
    expect(screen.getByText("PDF Document")).toBeInTheDocument();
    expect(screen.getByText("Excel Workbook")).toBeInTheDocument();
    expect(screen.getByText("CSV Spreadsheet")).toBeInTheDocument();
  });

  it("triggers CSV export when clicked", async () => {
    const onSuccess = vi.fn();
    const clickSpy = vi.fn();
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      const el = origCreateElement(tag);
      if (tag === "a") el.click = clickSpy;
      return el;
    });

    render(
      <InvoiceExportMenu invoice={sampleInvoice} onExportSuccess={onSuccess} />,
    );

    const triggerBtn = screen.getByRole("button", { name: "Export Invoice" });
    fireEvent.click(triggerBtn);

    const csvOption = screen.getByRole("menuitem", {
      name: /CSV Spreadsheet/i,
    });
    fireEvent.click(csvOption);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith("csv", sampleInvoice);
    });
  });

  it("renders with dropup positioning when direction is up", () => {
    render(<InvoiceExportMenu invoice={sampleInvoice} direction="up" />);

    const triggerBtn = screen.getByRole("button", { name: "Export Invoice" });
    fireEvent.click(triggerBtn);

    const menu = screen.getByRole("menu");
    expect(menu.className).toContain("bottom-full");
  });
});
