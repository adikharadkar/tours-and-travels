import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import InvoiceActionsDrawer from "./InvoiceActionsDrawer";

const mockInvoice = {
  id: "inv-12345678",
  invoiceNumber: "INV-2026-0001",
  documentType: "tax_invoice",
  documentStatus: "issued",
  paymentStatus: "partially_paid",
  customerName: "Shree Logistics Pvt. Ltd.",
  customerCode: "CUST-001",
  customerGstin: "27AABCS1234A1Z5",
  tripCode: "TRIP-2026-1042",
  route: "Nagpur → Pune",
  issueDate: "2026-08-05",
  dueDate: "2026-09-07",
  totalAmount: 54280,
  paidAmount: 20000,
  isConsolidated: false,
};

const mockCustomer = {
  id: "cust-001",
  name: "Shree Logistics Pvt. Ltd.",
  customerCode: "CUST-001",
  gstin: "27AABCS1234A1Z5",
  phone: "+91 98765 43210",
};

const mockTrip = {
  id: "trip-001",
  tripCode: "TRIP-2026-1042",
};

describe("InvoiceActionsDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when open is false", () => {
    const { container } = render(
      <InvoiceActionsDrawer
        open={false}
        onClose={vi.fn()}
        invoice={mockInvoice}
        customer={mockCustomer}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders invoice header, customer details and financial info when open", () => {
    render(
      <InvoiceActionsDrawer
        open={true}
        onClose={vi.fn()}
        invoice={mockInvoice}
        customer={mockCustomer}
        trip={mockTrip}
      />,
    );

    expect(screen.getByText("INV-2026-0001")).toBeInTheDocument();
    expect(screen.getByText("Tax Invoice")).toBeInTheDocument();
    expect(screen.getByText("Shree Logistics Pvt. Ltd.")).toBeInTheDocument();
    expect(screen.getByText("Code: CUST-001")).toBeInTheDocument();
    expect(screen.getByText("GSTIN: 27AABCS1234A1Z5")).toBeInTheDocument();
    expect(screen.getByText("TRIP-2026-1042")).toBeInTheDocument();
    expect(screen.getByText("Nagpur → Pune")).toBeInTheDocument();
    expect(screen.getByText("₹54,280")).toBeInTheDocument();
    expect(screen.getByText("₹34,280")).toBeInTheDocument(); // Balance due
  });

  it("calls onClose when close icon is clicked", () => {
    const onClose = vi.fn();
    render(
      <InvoiceActionsDrawer
        open={true}
        onClose={onClose}
        invoice={mockInvoice}
        customer={mockCustomer}
      />,
    );

    fireEvent.click(screen.getByLabelText("Close actions drawer"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Close Drawer button in footer is clicked", () => {
    const onClose = vi.fn();
    render(
      <InvoiceActionsDrawer
        open={true}
        onClose={onClose}
        invoice={mockInvoice}
        customer={mockCustomer}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close Drawer" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("triggers onRecordPayment when Record Payment hero action is clicked", () => {
    const onRecordPayment = vi.fn();
    const onClose = vi.fn();

    render(
      <InvoiceActionsDrawer
        open={true}
        onClose={onClose}
        invoice={mockInvoice}
        customer={mockCustomer}
        onRecordPayment={onRecordPayment}
      />,
    );

    const recordPaymentButtons = screen.getAllByRole("button", {
      name: /Record Payment/i,
    });
    fireEvent.click(recordPaymentButtons[0]);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onRecordPayment).toHaveBeenCalledWith(mockInvoice);
  });

  it("triggers onIssueInvoice when Issue Tax Invoice is clicked on draft invoice", () => {
    const onIssueInvoice = vi.fn();
    const onClose = vi.fn();
    const draftInvoice = {
      ...mockInvoice,
      documentStatus: "draft",
      paymentStatus: "unpaid",
    };

    render(
      <InvoiceActionsDrawer
        open={true}
        onClose={onClose}
        invoice={draftInvoice}
        customer={mockCustomer}
        onIssueInvoice={onIssueInvoice}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Issue Tax Invoice/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onIssueInvoice).toHaveBeenCalledWith(draftInvoice);
  });

  it("triggers onViewDetails when View Full Invoice Details is clicked", () => {
    const onViewDetails = vi.fn();
    const onClose = vi.fn();

    render(
      <InvoiceActionsDrawer
        open={true}
        onClose={onClose}
        invoice={mockInvoice}
        customer={mockCustomer}
        onViewDetails={onViewDetails}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /View Full Invoice Details/i }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onViewDetails).toHaveBeenCalledWith(mockInvoice);
  });

  it("triggers onCancelInvoice when Cancel Invoice is clicked in danger zone", () => {
    const onCancelInvoice = vi.fn();
    const onClose = vi.fn();

    render(
      <InvoiceActionsDrawer
        open={true}
        onClose={onClose}
        invoice={mockInvoice}
        customer={mockCustomer}
        onCancelInvoice={onCancelInvoice}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Cancel Invoice/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onCancelInvoice).toHaveBeenCalledWith(mockInvoice);
  });

  it("triggers onDeleteInvoice for a draft invoice when delete is available", () => {
    const onDeleteInvoice = vi.fn();
    const onClose = vi.fn();
    const draftInvoice = {
      ...mockInvoice,
      documentStatus: "draft",
    };

    render(
      <InvoiceActionsDrawer
        open={true}
        onClose={onClose}
        invoice={draftInvoice}
        customer={mockCustomer}
        onDeleteInvoice={onDeleteInvoice}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Delete Draft Invoice/i }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onDeleteInvoice).toHaveBeenCalledWith(draftInvoice);
  });

  it("copies summary to clipboard when Copy Invoice Summary is clicked", () => {
    const originalClipboard = navigator.clipboard;
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <InvoiceActionsDrawer
        open={true}
        onClose={vi.fn()}
        invoice={mockInvoice}
        customer={mockCustomer}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Copy Invoice Summary/i }),
    );

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock.mock.calls[0][0]).toContain("INV-2026-0001");
    expect(writeTextMock.mock.calls[0][0]).toContain(
      "Shree Logistics Pvt. Ltd.",
    );

    Object.assign(navigator, { clipboard: originalClipboard });
  });
});
