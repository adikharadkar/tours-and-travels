import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import InvoiceMobileFilterDrawer from "./InvoiceMobileFilterDrawer";

const mockCustomers = [
  { id: "cust-1", customerCode: "CUST-001", name: "Apex Logistics" },
  { id: "cust-2", customerCode: "CUST-002", name: "Global Freight" },
];

const createProps = (overrides = {}) => ({
  isOpen: true,
  onClose: vi.fn(),
  documentType: "all",
  onDocumentTypeChange: vi.fn(),
  paymentStatus: "all",
  onPaymentStatusChange: vi.fn(),
  documentStatus: "all",
  onDocumentStatusChange: vi.fn(),
  datePreset: "all",
  onDatePresetChange: vi.fn(),
  customStartDate: "",
  onCustomStartDateChange: vi.fn(),
  customEndDate: "",
  onCustomEndDateChange: vi.fn(),
  customerFilter: "all",
  onCustomerFilterChange: vi.fn(),
  customers: mockCustomers,
  onResetFilters: vi.fn(),
  activeFilterCount: 0,
  resultCount: 14,
  ...overrides,
});

describe("InvoiceMobileFilterDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when isOpen is false", () => {
    const props = createProps({ isOpen: false });
    const { container } = render(<InvoiceMobileFilterDrawer {...props} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the drawer title and result count when isOpen is true", () => {
    const props = createProps({ resultCount: 14 });
    render(<InvoiceMobileFilterDrawer {...props} />);

    expect(screen.getByText("Filter Invoices")).toBeInTheDocument();
    expect(screen.getByText(/Apply Filters \(14\)/i)).toBeInTheDocument();
  });

  it("renders active filter count badge when activeFilterCount > 0", () => {
    const props = createProps({ activeFilterCount: 3 });
    render(<InvoiceMobileFilterDrawer {...props} />);

    expect(screen.getByText("3 Active")).toBeInTheDocument();
    expect(screen.getByText("Reset All")).toBeInTheDocument();
  });

  it("calls onClose when close button or backdrop is clicked", () => {
    const props = createProps();
    render(<InvoiceMobileFilterDrawer {...props} />);

    // Click close icon button
    fireEvent.click(screen.getByLabelText("Close filter drawer"));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onDocumentTypeChange when a document type option is selected", () => {
    const props = createProps();
    render(<InvoiceMobileFilterDrawer {...props} />);

    const taxInvoiceBtn = screen.getByRole("button", { name: "Tax Invoice" });
    fireEvent.click(taxInvoiceBtn);

    expect(props.onDocumentTypeChange).toHaveBeenCalledWith("tax_invoice");
  });

  it("calls onPaymentStatusChange when a payment status option is selected", () => {
    const props = createProps();
    render(<InvoiceMobileFilterDrawer {...props} />);

    const paidBtn = screen.getByRole("button", { name: "Paid" });
    fireEvent.click(paidBtn);

    expect(props.onPaymentStatusChange).toHaveBeenCalledWith("paid");
  });

  it("calls onDocumentStatusChange when a document status option is selected", () => {
    const props = createProps();
    render(<InvoiceMobileFilterDrawer {...props} />);

    const draftBtn = screen.getByRole("button", { name: "Draft" });
    fireEvent.click(draftBtn);

    expect(props.onDocumentStatusChange).toHaveBeenCalledWith("draft");
  });

  it("calls onCustomerFilterChange when a customer is selected from dropdown", () => {
    const props = createProps();
    render(<InvoiceMobileFilterDrawer {...props} />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "cust-1" } });

    expect(props.onCustomerFilterChange).toHaveBeenCalledWith("cust-1");
  });

  it("calls onDatePresetChange when a date preset button is clicked", () => {
    const props = createProps();
    render(<InvoiceMobileFilterDrawer {...props} />);

    const thisMonthBtn = screen.getByRole("button", { name: "This Month" });
    fireEvent.click(thisMonthBtn);

    expect(props.onDatePresetChange).toHaveBeenCalledWith("this_month");
  });

  it("renders custom date inputs when datePreset is 'custom'", () => {
    const props = createProps({ datePreset: "custom" });
    render(<InvoiceMobileFilterDrawer {...props} />);

    expect(screen.getByText("Start Date")).toBeInTheDocument();
    expect(screen.getByText("End Date")).toBeInTheDocument();
  });

  it("calls onResetFilters and onClose when Clear All is clicked", () => {
    const props = createProps();
    render(<InvoiceMobileFilterDrawer {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Clear All" }));
    expect(props.onResetFilters).toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalled();
  });

  it("closes when Escape key is pressed", () => {
    const props = createProps();
    render(<InvoiceMobileFilterDrawer {...props} />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
