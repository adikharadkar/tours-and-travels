import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import InvoiceDetailsModal from "./InvoiceDetailsModal";

const mockInvoice = {
  invoiceNumber: "INV-2026-0001",
  documentType: "tax_invoice",
  documentStatus: "issued",
  paymentStatus: "pending",
  customerName: "Shree Logistics Pvt. Ltd.",
  customerCode: "CUST-001",
  customerGstin: "27AABCS1234A1Z5",
  tripCode: "TRIP-2026-1042",
  route: "Nagpur → Pune",
  createdAt: "2026-08-05T10:30:00",
  issueDate: "2026-08-05",
  dueDate: "2026-09-07",
  paymentTerms: "30 Days",
  paymentReference: "",
  isConsolidated: false,
  items: [
    {
      description: "Full Truck Load Transportation",
      quantity: 1,
      unitRate: 45000,
      amount: 45000,
    },
    {
      description: "Loading & Unloading Charges",
      quantity: 1,
      unitRate: 2500,
      amount: 2500,
    },
  ],
  subtotal: 47500,
  discountAmount: 1500,
  taxRate: 18,
  taxAmount: 8280,
  totalAmount: 54280,
  paidAmount: 20000,
  outstandingAmount: 34280,
  notes: "Payment due within 30 days from invoice date.",
  paymentHistory: [
    {
      id: "PMT-0001",
      amount: 20000,
      paymentMode: "bank_transfer",
      referenceNumber: "UTR20260818001234",
      paymentDate: "2026-08-18",
    },
  ],
};

const createProps = (overrides = {}) => ({
  isOpen: true,
  onClose: vi.fn(),
  onRecordPayment: vi.fn(),
  onIssueInvoice: vi.fn(),
  onCancelInvoice: vi.fn(),
  invoice: mockInvoice,
  ...overrides,
});

describe("InvoiceDetailsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "print").mockImplementation(() => {});
  });

  it("renders nothing when there is no invoice", () => {
    const props = createProps({ invoice: null });

    const { container } = render(<InvoiceDetailsModal {...props} />);

    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when the modal is closed", () => {
    const props = createProps({ isOpen: false });

    const { container } = render(<InvoiceDetailsModal {...props} />);

    expect(container.firstChild).toBeNull();
  });

  it("renders the invoice details", () => {
    render(<InvoiceDetailsModal {...createProps()} />);

    expect(screen.getByText("INV-2026-0001")).toBeInTheDocument();
    expect(screen.getByText("Shree Logistics Pvt. Ltd.")).toBeInTheDocument();
    expect(screen.getByText(/Code:\s*CUST-001/)).toBeInTheDocument();
    expect(screen.getByText(/GSTIN:\s*27AABCS1234A1Z5/)).toBeInTheDocument();
    expect(screen.getByText("TRIP-2026-1042")).toBeInTheDocument();
    expect(screen.getByText("Nagpur → Pune")).toBeInTheDocument();
    expect(screen.getByText("30 Days")).toBeInTheDocument();
  });

  it("renders all invoice line items", () => {
    render(<InvoiceDetailsModal {...createProps()} />);

    expect(
      screen.getByText("Full Truck Load Transportation"),
    ).toBeInTheDocument();

    expect(screen.getByText("Loading & Unloading Charges")).toBeInTheDocument();
  });

  it("renders discount and GST when applicable", () => {
    render(<InvoiceDetailsModal {...createProps()} />);

    expect(screen.getByText("Discount:")).toBeInTheDocument();
    expect(screen.getByText("GST (18%):")).toBeInTheDocument();
  });

  it("renders payment history", () => {
    render(<InvoiceDetailsModal {...createProps()} />);

    expect(screen.getByText("Payment Receipts (1)")).toBeInTheDocument();
    expect(screen.getByText(/BANK TRANSFER/)).toBeInTheDocument();
    expect(screen.getByText(/UTR20260818001234/)).toBeInTheDocument();
  });

  it("calls onRecordPayment for an issued invoice that is not fully paid", () => {
    const props = createProps();

    render(<InvoiceDetailsModal {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Record Payment" }));

    expect(props.onRecordPayment).toHaveBeenCalledWith(mockInvoice);
    expect(props.onClose).toHaveBeenCalled();
  });

  it("calls onCancelInvoice when cancelling an active invoice", () => {
    const props = createProps();

    render(<InvoiceDetailsModal {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel Invoice" }));

    expect(props.onCancelInvoice).toHaveBeenCalledWith(mockInvoice);
    expect(props.onClose).toHaveBeenCalled();
  });

  it("does not show Record Payment for a fully paid invoice", () => {
    const invoice = {
      ...mockInvoice,
      paymentStatus: "paid",
      paidAmount: 54280,
      outstandingAmount: 0,
    };

    render(<InvoiceDetailsModal {...createProps({ invoice })} />);

    expect(
      screen.queryByRole("button", { name: "Record Payment" }),
    ).not.toBeInTheDocument();
  });

  it("does not show Cancel Invoice for a cancelled invoice", () => {
    const invoice = {
      ...mockInvoice,
      documentStatus: "cancelled",
    };

    render(<InvoiceDetailsModal {...createProps({ invoice })} />);

    expect(
      screen.queryByRole("button", { name: "Cancel Invoice" }),
    ).not.toBeInTheDocument();
  });

  it("shows Issue Invoice for a draft invoice", () => {
    const invoice = {
      ...mockInvoice,
      documentStatus: "draft",
      paymentStatus: "pending",
    };

    render(<InvoiceDetailsModal {...createProps({ invoice })} />);

    expect(
      screen.getByRole("button", { name: "Issue Invoice" }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Record Payment" }),
    ).not.toBeInTheDocument();
  });

  it("calls onIssueInvoice for a draft invoice", () => {
    const invoice = {
      ...mockInvoice,
      documentStatus: "draft",
    };

    const props = createProps({ invoice });

    render(<InvoiceDetailsModal {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Issue Invoice" }));

    expect(props.onIssueInvoice).toHaveBeenCalledWith(invoice);
    expect(props.onClose).toHaveBeenCalled();
  });

  it("calls window.print when Print is clicked", () => {
    render(<InvoiceDetailsModal {...createProps()} />);

    const printText = screen.getByText("Print");
    const printButton = printText.closest("button");

    expect(printButton).toBeInTheDocument();

    fireEvent.click(printButton);

    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Close is clicked", () => {
    const props = createProps();

    render(<InvoiceDetailsModal {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(props.onClose).toHaveBeenCalled();
  });

  it("supports the open prop instead of isOpen", () => {
    const props = createProps({
      isOpen: undefined,
      open: true,
    });

    render(<InvoiceDetailsModal {...props} />);

    expect(screen.getByText("INV-2026-0001")).toBeInTheDocument();
  });

  it("renders the fallback line item when invoice.items is empty", () => {
    const invoice = {
      ...mockInvoice,
      items: [],
    };

    render(<InvoiceDetailsModal {...createProps({ invoice })} />);

    expect(screen.getAllByText("Nagpur → Pune").length).toBeGreaterThan(0);
  });

  it("renders consolidated trip information", () => {
    const invoice = {
      ...mockInvoice,
      isConsolidated: true,
      consolidatedTripsCount: 3,
      tripCode: "",
    };

    render(<InvoiceDetailsModal {...createProps({ invoice })} />);

    expect(screen.getByText("Consolidated Contract")).toBeInTheDocument();

    expect(screen.getByText("3 Trips")).toBeInTheDocument();
  });
});
