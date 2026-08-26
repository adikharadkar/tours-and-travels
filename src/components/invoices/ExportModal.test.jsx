import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ExportModal from "./ExportModal";

import {
  exportInvoicesToCsv,
  exportInvoicesToExcel,
} from "../../services/invoiceExportService";

vi.mock("../../services/invoiceExportService", () => ({
  exportInvoicesToCsv: vi.fn(),
  exportInvoicesToExcel: vi.fn(),
}));

describe("ExportModal Component", () => {
  const sampleInvoices = [
    {
      id: "inv-1",
      invoiceNumber: "INV-2026-0001",
      documentType: "tax_invoice",
      documentStatus: "issued",
      paymentStatus: "paid",
      issueDate: "2026-03-01",
      customerName: "Acme Corp",
      totalAmount: 15000,
      paidAmount: 15000,
    },
    {
      id: "inv-2",
      invoiceNumber: "INV-2026-0002",
      documentType: "proforma",
      documentStatus: "draft",
      paymentStatus: "unpaid",
      issueDate: "2026-03-05",
      customerName: "Global Tech",
      totalAmount: 25000,
      paidAmount: 0,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderModal = (props = {}) => {
    return render(
      <ExportModal
        isOpen={true}
        onClose={vi.fn()}
        invoices={sampleInvoices}
        filteredInvoices={sampleInvoices}
        {...props}
      />,
    );
  };

  it("renders the export modal with title and description", () => {
    renderModal();

    expect(
      screen.getByRole("heading", { name: "Export Invoices" }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Download high-fidelity financial data formatted for accounting/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders the data scope options", () => {
    renderModal();

    expect(screen.getByText("Select Data Scope")).toBeInTheDocument();

    expect(screen.getByText("Current Filtered View")).toBeInTheDocument();

    expect(screen.getByText("All Recorded Invoices")).toBeInTheDocument();

    expect(screen.getByText("2 invoices (₹40,000)")).toBeInTheDocument();

    expect(screen.getByText("2 invoices total")).toBeInTheDocument();
  });

  it("uses filtered invoices by default", () => {
    const filteredInvoices = [sampleInvoices[0]];

    renderModal({
      filteredInvoices,
    });

    expect(screen.getByText("1 Invoice")).toBeInTheDocument();
    expect(screen.getByText("₹15,000")).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /Export 1 Invoice/i,
      }),
    ).toBeInTheDocument();
  });

  it("switches to all recorded invoices when All Recorded Invoices is selected", () => {
    const filteredInvoices = [sampleInvoices[0]];

    renderModal({
      filteredInvoices,
    });

    expect(screen.getByText("1 Invoice")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /All Recorded Invoices/i,
      }),
    );

    expect(screen.getByText("2 Invoices")).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /Export 2 Invoices/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("₹40,000")).toBeInTheDocument();
  });

  it("renders all export format options", () => {
    renderModal();

    expect(screen.getByText("CSV Spreadsheet (.csv)")).toBeInTheDocument();

    expect(screen.getByText("Excel Workbook (.xlsx)")).toBeInTheDocument();

    expect(screen.getByText("JSON Data Backup (.json)")).toBeInTheDocument();

    expect(screen.getByText("Print / Browser PDF Summary")).toBeInTheDocument();
  });

  it("selects CSV export format by default", () => {
    renderModal();

    const csvRadio = screen.getByRole("radio", {
      name: /CSV Spreadsheet/i,
    });

    expect(csvRadio).toBeChecked();
  });

  it("allows selecting Excel export format", () => {
    renderModal();

    const excelRadio = screen.getByRole("radio", {
      name: /Excel Workbook/i,
    });

    fireEvent.click(excelRadio);

    expect(excelRadio).toBeChecked();

    expect(
      screen.getByRole("radio", {
        name: /CSV Spreadsheet/i,
      }),
    ).not.toBeChecked();
  });

  it("allows selecting JSON export format", () => {
    renderModal();

    const jsonRadio = screen.getByRole("radio", {
      name: /JSON Data Backup/i,
    });

    fireEvent.click(jsonRadio);

    expect(jsonRadio).toBeChecked();
  });

  it("allows selecting Print / Browser PDF format", () => {
    renderModal();

    const printRadio = screen.getByRole("radio", {
      name: /Print \/ Browser PDF Summary/i,
    });

    fireEvent.click(printRadio);

    expect(printRadio).toBeChecked();
  });

  it("displays correct summary metrics for filtered invoices", () => {
    renderModal();

    expect(screen.getByText("Total Records to Export")).toBeInTheDocument();
    expect(screen.getByText("Total Value (INR)")).toBeInTheDocument();
    expect(screen.getByText("Pending Balance")).toBeInTheDocument();

    expect(screen.getByText("2 Invoices")).toBeInTheDocument();
    expect(screen.getByText("₹40,000")).toBeInTheDocument();
    expect(screen.getByText("₹25,000")).toBeInTheDocument();
  });

  it("calculates pending balance correctly", () => {
    const invoices = [
      {
        ...sampleInvoices[0],
        totalAmount: 10000,
        paidAmount: 3000,
      },
      {
        ...sampleInvoices[1],
        totalAmount: 20000,
        paidAmount: 5000,
      },
    ];

    renderModal({
      invoices,
      filteredInvoices: invoices,
    });

    expect(screen.getByText("₹30,000")).toBeInTheDocument();
    expect(screen.getByText("₹22,000")).toBeInTheDocument();
  });

  it("exports filtered invoices to CSV", async () => {
    const onClose = vi.fn();

    renderModal({
      onClose,
    });

    const exportButton = screen.getByRole("button", {
      name: /Export 2 Invoices/i,
    });

    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(exportInvoicesToCsv).toHaveBeenCalledTimes(1);
    });

    expect(exportInvoicesToCsv).toHaveBeenCalledWith(
      sampleInvoices,
      expect.objectContaining({
        filenamePrefix: expect.stringMatching(
          /^fleetcore_invoices_\d{4}-\d{2}-\d{2}$/,
        ),
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("exports invoices to Excel when Excel format is selected", async () => {
    const onClose = vi.fn();

    renderModal({
      onClose,
    });

    fireEvent.click(
      screen.getByRole("radio", {
        name: /Excel Workbook/i,
      }),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Export 2 Invoices/i,
      }),
    );

    await waitFor(() => {
      expect(exportInvoicesToExcel).toHaveBeenCalledTimes(1);
    });

    expect(exportInvoicesToExcel).toHaveBeenCalledWith(
      sampleInvoices,
      expect.objectContaining({
        filenamePrefix: expect.stringMatching(
          /^fleetcore_invoices_\d{4}-\d{2}-\d{2}$/,
        ),
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not export when there are no active invoices", () => {
    const onClose = vi.fn();

    renderModal({
      invoices: [],
      filteredInvoices: [],
      onClose,
    });

    const exportButton = screen.getByRole("button", {
      name: /Export 0 Invoices/i,
    });

    expect(exportButton).toBeDisabled();

    fireEvent.click(exportButton);

    expect(exportInvoicesToCsv).not.toHaveBeenCalled();
    expect(exportInvoicesToExcel).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls window.print and closes the modal for print export", async () => {
    const onClose = vi.fn();
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    renderModal({
      onClose,
    });

    fireEvent.click(
      screen.getByRole("radio", {
        name: /Print \/ Browser PDF Summary/i,
      }),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Export 2 Invoices/i,
      }),
    );

    await waitFor(() => {
      expect(printSpy).toHaveBeenCalledTimes(1);
    });

    expect(onClose).toHaveBeenCalledTimes(1);

    printSpy.mockRestore();
  });

  it("exports JSON data and closes the modal", async () => {
    const onClose = vi.fn();
    const clickSpy = vi.fn();

    const originalCreateElement = document.createElement.bind(document);

    vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      const element = originalCreateElement(tagName);

      if (tagName === "a") {
        element.click = clickSpy;
      }

      return element;
    });

    renderModal({
      onClose,
    });

    fireEvent.click(
      screen.getByRole("radio", {
        name: /JSON Data Backup/i,
      }),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Export 2 Invoices/i,
      }),
    );

    await waitFor(() => {
      expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    expect(onClose).toHaveBeenCalledTimes(1);

    vi.restoreAllMocks();
  });

  it("calls onClose when Cancel is clicked", () => {
    const onClose = vi.fn();

    renderModal({
      onClose,
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Cancel",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not render the modal when isOpen is false", () => {
    render(
      <ExportModal
        isOpen={false}
        onClose={vi.fn()}
        invoices={sampleInvoices}
        filteredInvoices={sampleInvoices}
      />,
    );

    expect(
      screen.queryByRole("heading", {
        name: "Export Invoices",
      }),
    ).not.toBeInTheDocument();
  });

  it("supports the open prop as an alternative to isOpen", () => {
    render(
      <ExportModal
        open={true}
        onClose={vi.fn()}
        invoices={sampleInvoices}
        filteredInvoices={sampleInvoices}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Export Invoices",
      }),
    ).toBeInTheDocument();
  });
});
