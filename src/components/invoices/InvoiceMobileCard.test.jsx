import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import InvoiceMobileCard from "./InvoiceMobileCard";

const mockInvoice = {
  invoiceNumber: "INV-2026-0001",
  documentType: "tax_invoice",
  documentStatus: "issued",
  paymentStatus: "pending",
  customerName: "Shree Logistics Pvt. Ltd.",
  customerCode: "CUST-001",
  tripCode: "TRIP-2026-1042",
  route: "Nagpur → Pune",
  issueDate: "2026-08-05",
  dueDate: "2026-09-07",
  totalAmount: 54280,
  paidAmount: 20000,
  isConsolidated: false,
};

const createProps = (overrides = {}) => ({
  invoice: mockInvoice,
  onViewInvoice: vi.fn(),
  onRecordPayment: vi.fn(),
  ...overrides,
});

describe("InvoiceMobileCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the invoice number", () => {
    render(<InvoiceMobileCard {...createProps()} />);

    expect(screen.getByText("INV-2026-0001")).toBeInTheDocument();
  });

  it("renders customer information", () => {
    render(<InvoiceMobileCard {...createProps()} />);

    expect(screen.getByText("Shree Logistics Pvt. Ltd.")).toBeInTheDocument();

    expect(screen.getByText("CUST-001")).toBeInTheDocument();
  });

  it("renders trip reference and route", () => {
    render(<InvoiceMobileCard {...createProps()} />);

    expect(screen.getByText("TRIP-2026-1042")).toBeInTheDocument();

    expect(screen.getByText("Nagpur → Pune")).toBeInTheDocument();
  });

  it("renders the invoice total", () => {
    render(<InvoiceMobileCard {...createProps()} />);

    expect(screen.getByText(/54,280/)).toBeInTheDocument();
  });

  it("shows the paid and due amounts for a partially paid invoice", () => {
    render(<InvoiceMobileCard {...createProps()} />);

    expect(screen.getByText("₹20k paid · ₹34k due")).toBeInTheDocument();
  });

  it("shows Unpaid when no payment has been made", () => {
    const invoice = {
      ...mockInvoice,
      paidAmount: 0,
      paymentStatus: "pending",
    };

    render(<InvoiceMobileCard {...createProps({ invoice })} />);

    expect(screen.getByText("Unpaid")).toBeInTheDocument();
  });

  it("shows Fully Paid for a paid invoice", () => {
    const invoice = {
      ...mockInvoice,
      paymentStatus: "paid",
      paidAmount: 54280,
    };

    render(<InvoiceMobileCard {...createProps({ invoice })} />);

    expect(screen.getByText("Fully Paid")).toBeInTheDocument();
  });

  it("shows Record Payment for an active unpaid invoice", () => {
    render(<InvoiceMobileCard {...createProps()} />);

    expect(
      screen.getByRole("button", {
        name: /Record Payment/,
      }),
    ).toBeInTheDocument();
  });

  it("calls onRecordPayment when Record Payment is clicked", () => {
    const props = createProps();

    render(<InvoiceMobileCard {...props} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Record Payment/,
      }),
    );

    expect(props.onRecordPayment).toHaveBeenCalledTimes(1);

    expect(props.onRecordPayment).toHaveBeenCalledWith(mockInvoice);

    expect(props.onViewInvoice).not.toHaveBeenCalled();
  });

  it("shows View button", () => {
    render(<InvoiceMobileCard {...createProps()} />);

    expect(
      screen.getByRole("button", {
        name: /View/,
      }),
    ).toBeInTheDocument();
  });

  it("calls onViewInvoice when View is clicked", () => {
    const props = createProps();

    render(<InvoiceMobileCard {...props} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /View/,
      }),
    );

    expect(props.onViewInvoice).toHaveBeenCalledTimes(1);

    expect(props.onViewInvoice).toHaveBeenCalledWith(mockInvoice);
  });

  it("calls onViewInvoice when the card itself is clicked", () => {
    const props = createProps();

    const { container } = render(<InvoiceMobileCard {...props} />);

    const card = container.firstChild;

    fireEvent.click(card);

    expect(props.onViewInvoice).toHaveBeenCalledTimes(1);

    expect(props.onViewInvoice).toHaveBeenCalledWith(mockInvoice);
  });

  it("does not trigger card click when Record Payment is clicked", () => {
    const props = createProps();

    fireEvent.click(
      screen.getByRole("button", {
        name: /Record Payment/,
      }),
    );

    expect(props.onRecordPayment).toHaveBeenCalledWith(mockInvoice);

    expect(props.onViewInvoice).not.toHaveBeenCalled();
  });

  it("does not trigger card click when View is clicked", () => {
    const props = createProps();

    fireEvent.click(
      screen.getByRole("button", {
        name: /View/,
      }),
    );

    expect(props.onViewInvoice).toHaveBeenCalledTimes(1);
  });

  it("does not show Record Payment for a draft invoice", () => {
    const invoice = {
      ...mockInvoice,
      documentStatus: "draft",
    };

    render(<InvoiceMobileCard {...createProps({ invoice })} />);

    expect(
      screen.queryByRole("button", {
        name: "Record Payment",
      }),
    ).not.toBeInTheDocument();
  });

  it("does not show Record Payment for a cancelled invoice", () => {
    const invoice = {
      ...mockInvoice,
      documentStatus: "cancelled",
    };

    render(<InvoiceMobileCard {...createProps({ invoice })} />);

    expect(
      screen.queryByRole("button", {
        name: "Record Payment",
      }),
    ).not.toBeInTheDocument();
  });

  it("does not show Record Payment for a fully paid invoice", () => {
    const invoice = {
      ...mockInvoice,
      paymentStatus: "paid",
      paidAmount: 54280,
    };

    render(<InvoiceMobileCard {...createProps({ invoice })} />);

    expect(
      screen.queryByRole("button", {
        name: "Record Payment",
      }),
    ).not.toBeInTheDocument();
  });

  it("does not show Record Payment when total is fully covered by paid amount", () => {
    const invoice = {
      ...mockInvoice,
      paymentStatus: "pending",
      totalAmount: 54280,
      paidAmount: 54280,
    };

    render(<InvoiceMobileCard {...createProps({ invoice })} />);

    expect(
      screen.queryByRole("button", {
        name: "Record Payment",
      }),
    ).not.toBeInTheDocument();

    expect(screen.getByText("Fully Paid")).toBeInTheDocument();
  });

  it("does not show payment status pill for a draft invoice", () => {
    const invoice = {
      ...mockInvoice,
      documentStatus: "draft",
    };

    render(<InvoiceMobileCard {...createProps({ invoice })} />);

    expect(screen.queryByText("pending")).not.toBeInTheDocument();
  });

  it("shows Direct Bill when trip code is missing", () => {
    const invoice = {
      ...mockInvoice,
      tripCode: "",
    };

    render(<InvoiceMobileCard {...createProps({ invoice })} />);

    expect(screen.getByText("Direct Bill")).toBeInTheDocument();
  });

  it("shows an em dash when customer code is missing", () => {
    const invoice = {
      ...mockInvoice,
      customerCode: "",
    };

    render(<InvoiceMobileCard {...createProps({ invoice })} />);

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("shows an em dash when route is missing", () => {
    const invoice = {
      ...mockInvoice,
      route: "",
    };

    render(<InvoiceMobileCard {...createProps({ invoice })} />);

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders consolidated trip information", () => {
    const invoice = {
      ...mockInvoice,
      isConsolidated: true,
      consolidatedTripsCount: 3,
      tripCode: "",
    };

    render(<InvoiceMobileCard {...createProps({ invoice })} />);

    expect(screen.getByText("Consolidated (3 Trips)")).toBeInTheDocument();
  });

  it("uses one trip when consolidatedTripsCount is missing", () => {
    const invoice = {
      ...mockInvoice,
      isConsolidated: true,
      consolidatedTripsCount: undefined,
      tripCode: "",
    };

    render(<InvoiceMobileCard {...createProps({ invoice })} />);

    expect(screen.getByText("Consolidated (1 Trips)")).toBeInTheDocument();
  });

  it("shows overdue information for an overdue invoice", () => {
    const invoice = {
      ...mockInvoice,
      paymentStatus: "pending",
      dueDate: "2020-01-01",
    };

    render(<InvoiceMobileCard {...createProps({ invoice })} />);

    expect(screen.queryByText(/Due:/)).not.toBeInTheDocument();

    expect(screen.getAllByText(/overdue/i).length).toBeGreaterThan(0);
  });

  it("shows due date for a non-overdue invoice", () => {
    const invoice = {
      ...mockInvoice,
      paymentStatus: "pending",
      dueDate: "2099-12-31",
    };

    render(<InvoiceMobileCard {...createProps({ invoice })} />);

    expect(screen.getByText(/Due:/)).toBeInTheDocument();
  });

  it("renders a progress bar for an active invoice", () => {
    const invoice = {
      ...mockInvoice,
      documentStatus: "issued",
      documentType: "tax_invoice",
      totalAmount: 100000,
      paidAmount: 25000,
    };

    const { container } = render(
      <InvoiceMobileCard {...createProps({ invoice })} />,
    );

    const progressBar = container.querySelector('[style="width: 25%;"]');

    expect(progressBar).toBeInTheDocument();
  });

  it("does not render a progress bar for a draft invoice", () => {
    const invoice = {
      ...mockInvoice,
      documentStatus: "draft",
      totalAmount: 100000,
      paidAmount: 25000,
    };

    const { container } = render(
      <InvoiceMobileCard {...createProps({ invoice })} />,
    );

    expect(
      container.querySelector('[style="width: 25%;"]'),
    ).not.toBeInTheDocument();
  });

  it("does not render a progress bar for a cancelled invoice", () => {
    const invoice = {
      ...mockInvoice,
      documentStatus: "cancelled",
      totalAmount: 100000,
      paidAmount: 25000,
    };

    const { container } = render(
      <InvoiceMobileCard {...createProps({ invoice })} />,
    );

    expect(
      container.querySelector('[style="width: 25%;"]'),
    ).not.toBeInTheDocument();
  });

  it("does not render a progress bar when total amount is zero", () => {
    const invoice = {
      ...mockInvoice,
      totalAmount: 0,
      paidAmount: 0,
    };

    const { container } = render(
      <InvoiceMobileCard {...createProps({ invoice })} />,
    );

    const progressBar = container.querySelector(".w-full.h-1\\.5.rounded-full");

    expect(progressBar).not.toBeInTheDocument();
  });

  it("caps progress at 100 percent", () => {
    const invoice = {
      ...mockInvoice,
      totalAmount: 10000,
      paidAmount: 15000,
    };

    const { container } = render(
      <InvoiceMobileCard {...createProps({ invoice })} />,
    );

    expect(
      container.querySelector('[style="width: 100%;"]'),
    ).toBeInTheDocument();
  });

  it("handles missing paidAmount as zero", () => {
    const invoice = {
      ...mockInvoice,
      paidAmount: undefined,
      paymentStatus: "pending",
    };

    render(<InvoiceMobileCard {...createProps({ invoice })} />);

    expect(screen.getByText("Unpaid")).toBeInTheDocument();
  });
});
