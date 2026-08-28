import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import InvoiceTable from "./InvoiceTable";

const mockInvoice = {
  id: "invoice-001",
  invoiceNumber: "INV-2026-0001",
  documentType: "tax_invoice",
  documentStatus: "issued",
  paymentStatus: "pending",
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

const createProps = (overrides = {}) => ({
  invoices: [mockInvoice],
  sortField: undefined,
  sortDirection: "asc",
  onSort: vi.fn(),
  onViewInvoice: vi.fn(),
  onRecordPayment: vi.fn(),
  ...overrides,
});

describe("InvoiceTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the table headers", () => {
    render(<InvoiceTable {...createProps()} />);

    expect(screen.getByText("Invoice")).toBeInTheDocument();
    expect(screen.getByText("Customer")).toBeInTheDocument();
    expect(screen.getByText("Trip Reference")).toBeInTheDocument();
    expect(screen.getByText("Dates")).toBeInTheDocument();
    expect(screen.getByText("Amount & Progress")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("renders invoice information", () => {
    render(<InvoiceTable {...createProps()} />);

    expect(screen.getByText("INV-2026-0001")).toBeInTheDocument();

    expect(screen.getByText("Shree Logistics Pvt. Ltd.")).toBeInTheDocument();

    expect(screen.getByText("CUST-001")).toBeInTheDocument();

    expect(screen.getByText("TRIP-2026-1042")).toBeInTheDocument();

    expect(screen.getByText("Nagpur → Pune")).toBeInTheDocument();
  });

  it("renders the formatted invoice amount", () => {
    render(<InvoiceTable {...createProps()} />);

    expect(screen.getByText("₹54,280")).toBeInTheDocument();
  });

  it("renders the paid amount for a partially paid invoice", () => {
    render(<InvoiceTable {...createProps()} />);

    expect(screen.getByText("₹20k paid")).toBeInTheDocument();
  });

  it("renders the document status", () => {
    render(<InvoiceTable {...createProps()} />);

    expect(screen.getByText("Issued")).toBeInTheDocument();
  });

  it("renders the payment status", () => {
    render(<InvoiceTable {...createProps()} />);

    expect(screen.getByText("pending")).toBeInTheDocument();
  });

  it("calls onViewInvoice when a table row is clicked", () => {
    const props = createProps();

    render(<InvoiceTable {...props} />);

    fireEvent.click(screen.getByText("INV-2026-0001"));

    expect(props.onViewInvoice).toHaveBeenCalledTimes(1);

    expect(props.onViewInvoice).toHaveBeenCalledWith(mockInvoice);
  });

  it("calls onViewInvoice when the View Details button is clicked", () => {
    const props = createProps();

    render(<InvoiceTable {...props} />);

    const viewButton = screen.getByTitle("View Details");

    fireEvent.click(viewButton);

    expect(props.onViewInvoice).toHaveBeenCalledTimes(1);

    expect(props.onViewInvoice).toHaveBeenCalledWith(mockInvoice);
  });

  it("does not trigger the row click twice when View Details is clicked", () => {
    const props = createProps();

    render(<InvoiceTable {...props} />);

    fireEvent.click(screen.getByTitle("View Details"));

    expect(props.onViewInvoice).toHaveBeenCalledTimes(1);
  });

  it("renders the 3-dots actions button", () => {
    render(<InvoiceTable {...createProps()} />);

    expect(screen.getByTitle("Invoice Actions")).toBeInTheDocument();
  });

  it("calls onOpenActionsDrawer when 3-dots actions button is clicked", () => {
    const onOpenActionsDrawer = vi.fn();
    const props = createProps({ onOpenActionsDrawer });

    render(<InvoiceTable {...props} />);

    fireEvent.click(screen.getByTitle("Invoice Actions"));

    expect(onOpenActionsDrawer).toHaveBeenCalledTimes(1);
    expect(onOpenActionsDrawer).toHaveBeenCalledWith(mockInvoice);
  });

  it("does not trigger row click when 3-dots actions button is clicked", () => {
    const onOpenActionsDrawer = vi.fn();
    const props = createProps({ onOpenActionsDrawer });

    render(<InvoiceTable {...props} />);

    fireEvent.click(screen.getByTitle("Invoice Actions"));

    expect(onOpenActionsDrawer).toHaveBeenCalledTimes(1);
    expect(props.onViewInvoice).not.toHaveBeenCalled();
  });

  it("shows only the document status for a draft invoice", () => {
    const invoice = {
      ...mockInvoice,
      documentStatus: "draft",
      paymentStatus: "pending",
    };

    render(
      <InvoiceTable
        {...createProps({
          invoices: [invoice],
        })}
      />,
    );

    expect(screen.getByText("Draft")).toBeInTheDocument();

    expect(screen.queryByText("pending")).not.toBeInTheDocument();
  });

  it("renders DIRECT-BILL when trip code is missing", () => {
    const invoice = {
      ...mockInvoice,
      tripCode: "",
    };

    render(
      <InvoiceTable
        {...createProps({
          invoices: [invoice],
        })}
      />,
    );

    expect(screen.getByText("DIRECT-BILL")).toBeInTheDocument();
  });

  it("renders the default route when route is missing", () => {
    const invoice = {
      ...mockInvoice,
      route: "",
    };

    render(
      <InvoiceTable
        {...createProps({
          invoices: [invoice],
        })}
      />,
    );

    expect(screen.getByText("Point to Point Transit")).toBeInTheDocument();
  });

  it("renders consolidated trip information", () => {
    const invoice = {
      ...mockInvoice,
      isConsolidated: true,
      consolidatedTripsCount: 3,
      tripCode: "",
    };

    render(
      <InvoiceTable
        {...createProps({
          invoices: [invoice],
        })}
      />,
    );

    expect(screen.getByText("Multi (3)")).toBeInTheDocument();
  });

  it("uses one trip for a consolidated invoice when count is missing", () => {
    const invoice = {
      ...mockInvoice,
      isConsolidated: true,
      consolidatedTripsCount: undefined,
      tripCode: "",
    };

    render(
      <InvoiceTable
        {...createProps({
          invoices: [invoice],
        })}
      />,
    );

    expect(screen.getByText("Multi (1)")).toBeInTheDocument();
  });

  it("uses consolidated period when route is missing", () => {
    const invoice = {
      ...mockInvoice,
      isConsolidated: true,
      consolidatedTripsCount: 2,
      route: "",
      consolidatedPeriod: "August 2026",
    };

    render(
      <InvoiceTable
        {...createProps({
          invoices: [invoice],
        })}
      />,
    );

    expect(screen.getByText("August 2026")).toBeInTheDocument();
  });

  it("shows a dash for draft invoice due date", () => {
    const invoice = {
      ...mockInvoice,
      documentStatus: "draft",
    };

    render(
      <InvoiceTable
        {...createProps({
          invoices: [invoice],
        })}
      />,
    );

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("shows due date for a normal invoice", () => {
    render(<InvoiceTable {...createProps()} />);

    expect(screen.getByText(/Due:/)).toBeInTheDocument();
  });

  it("shows overdue due date for an overdue invoice", () => {
    const invoice = {
      ...mockInvoice,
      paymentStatus: "pending",
      dueDate: "2020-01-01",
    };

    render(
      <InvoiceTable
        {...createProps({
          invoices: [invoice],
        })}
      />,
    );

    expect(screen.getByText(/Due:/)).toBeInTheDocument();
  });

  it("renders a progress bar for an active invoice", () => {
    const invoice = {
      ...mockInvoice,
      documentStatus: "issued",
      totalAmount: 100000,
      paidAmount: 25000,
    };

    const { container } = render(
      <InvoiceTable
        {...createProps({
          invoices: [invoice],
        })}
      />,
    );

    expect(
      container.querySelector('[style="width: 25%;"]'),
    ).toBeInTheDocument();
  });

  it("does not render a progress bar for a draft invoice", () => {
    const invoice = {
      ...mockInvoice,
      documentStatus: "draft",
      totalAmount: 100000,
      paidAmount: 25000,
    };

    const { container } = render(
      <InvoiceTable
        {...createProps({
          invoices: [invoice],
        })}
      />,
    );

    expect(container.querySelector(".w-24")).not.toBeInTheDocument();
  });

  it("does not render a progress bar for a cancelled invoice", () => {
    const invoice = {
      ...mockInvoice,
      documentStatus: "cancelled",
      totalAmount: 100000,
      paidAmount: 25000,
    };

    const { container } = render(
      <InvoiceTable
        {...createProps({
          invoices: [invoice],
        })}
      />,
    );

    expect(container.querySelector(".w-24")).not.toBeInTheDocument();
  });

  it("does not render a progress bar when total amount is zero", () => {
    const invoice = {
      ...mockInvoice,
      totalAmount: 0,
      paidAmount: 0,
    };

    const { container } = render(
      <InvoiceTable
        {...createProps({
          invoices: [invoice],
        })}
      />,
    );

    expect(container.querySelector(".w-24")).not.toBeInTheDocument();
  });

  it("shows Fully Paid for a fully paid invoice", () => {
    const invoice = {
      ...mockInvoice,
      paymentStatus: "paid",
      totalAmount: 54280,
      paidAmount: 54280,
    };

    render(
      <InvoiceTable
        {...createProps({
          invoices: [invoice],
        })}
      />,
    );

    expect(screen.getByText("Fully Paid")).toBeInTheDocument();
  });

  it("shows Unpaid when no amount has been paid", () => {
    const invoice = {
      ...mockInvoice,
      paymentStatus: "pending",
      totalAmount: 54280,
      paidAmount: 0,
    };

    render(
      <InvoiceTable
        {...createProps({
          invoices: [invoice],
        })}
      />,
    );

    expect(screen.getByText("Unpaid")).toBeInTheDocument();
  });

  it("calls onSort with invoiceNumber when Invoice header is clicked", () => {
    const props = createProps();

    render(<InvoiceTable {...props} />);

    fireEvent.click(screen.getByText("Invoice"));

    expect(props.onSort).toHaveBeenCalledWith("invoiceNumber");
  });

  it("calls onSort with customerName when Customer header is clicked", () => {
    const props = createProps();

    render(<InvoiceTable {...props} />);

    fireEvent.click(screen.getByText("Customer"));

    expect(props.onSort).toHaveBeenCalledWith("customerName");
  });

  it("calls onSort with issueDate when Dates header is clicked", () => {
    const props = createProps();

    render(<InvoiceTable {...props} />);

    fireEvent.click(screen.getByText("Dates"));

    expect(props.onSort).toHaveBeenCalledWith("issueDate");
  });

  it("calls onSort with totalAmount when Amount & Progress header is clicked", () => {
    const props = createProps();

    render(<InvoiceTable {...props} />);

    fireEvent.click(screen.getByText("Amount & Progress"));

    expect(props.onSort).toHaveBeenCalledWith("totalAmount");
  });

  it("shows ascending sort icon for the active invoice sort", () => {
    render(
      <InvoiceTable
        {...createProps({
          sortField: "invoiceNumber",
          sortDirection: "asc",
        })}
      />,
    );

    expect(screen.getByText("arrow_upward")).toBeInTheDocument();
  });

  it("shows descending sort icon for the active invoice sort", () => {
    render(
      <InvoiceTable
        {...createProps({
          sortField: "invoiceNumber",
          sortDirection: "desc",
        })}
      />,
    );

    expect(screen.getByText("arrow_downward")).toBeInTheDocument();
  });

  it("shows ascending sort icon for customer sorting", () => {
    render(
      <InvoiceTable
        {...createProps({
          sortField: "customerName",
          sortDirection: "asc",
        })}
      />,
    );

    expect(screen.getByText("arrow_upward")).toBeInTheDocument();
  });

  it("shows descending sort icon for amount sorting", () => {
    render(
      <InvoiceTable
        {...createProps({
          sortField: "totalAmount",
          sortDirection: "desc",
        })}
      />,
    );

    expect(screen.getByText("arrow_downward")).toBeInTheDocument();
  });

  it("renders multiple invoices", () => {
    const secondInvoice = {
      ...mockInvoice,
      id: "invoice-002",
      invoiceNumber: "INV-2026-0002",
      customerName: "ABC Transport Pvt. Ltd.",
      customerCode: "CUST-002",
    };

    render(
      <InvoiceTable
        {...createProps({
          invoices: [mockInvoice, secondInvoice],
        })}
      />,
    );

    expect(screen.getByText("INV-2026-0001")).toBeInTheDocument();

    expect(screen.getByText("INV-2026-0002")).toBeInTheDocument();

    expect(screen.getByText("ABC Transport Pvt. Ltd.")).toBeInTheDocument();
  });

  it("renders an empty table when invoices array is empty", () => {
    render(
      <InvoiceTable
        {...createProps({
          invoices: [],
        })}
      />,
    );

    expect(screen.getByText("Invoice")).toBeInTheDocument();

    expect(screen.queryByText("INV-2026-0001")).not.toBeInTheDocument();
  });

  it("uses customer GSTIN when customer code is unavailable", () => {
    const invoice = {
      ...mockInvoice,
      customerCode: "",
    };

    render(
      <InvoiceTable
        {...createProps({
          invoices: [invoice],
        })}
      />,
    );

    expect(screen.getByText("27AABCS1234A1Z5")).toBeInTheDocument();
  });

  it("uses a dash when both customer code and GSTIN are unavailable", () => {
    const invoice = {
      ...mockInvoice,
      customerCode: "",
      customerGstin: "",
    };

    render(
      <InvoiceTable
        {...createProps({
          invoices: [invoice],
        })}
      />,
    );

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("handles missing total amount", () => {
    const invoice = {
      ...mockInvoice,
      totalAmount: undefined,
      paidAmount: undefined,
    };

    render(
      <InvoiceTable
        {...createProps({
          invoices: [invoice],
        })}
      />,
    );

    expect(screen.getByText("₹0")).toBeInTheDocument();
  });

  it("caps progress at 100 percent when paid amount exceeds total", () => {
    const invoice = {
      ...mockInvoice,
      totalAmount: 10000,
      paidAmount: 15000,
    };

    const { container } = render(
      <InvoiceTable
        {...createProps({
          invoices: [invoice],
        })}
      />,
    );

    expect(
      container.querySelector('[style="width: 100%;"]'),
    ).toBeInTheDocument();
  });
});
