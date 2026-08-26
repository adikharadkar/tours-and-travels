import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import ConsolidatedInvoiceModal from "./ConsolidatedInvoiceModal";

describe("ConsolidatedInvoiceModal", () => {
  const mockCustomers = [
    {
      id: "cust_1",
      customerCode: "CUST-001",
      name: "Tata Motors Fleet",
      companyName: "Tata Motors Limited",
      customerType: "company",
      gstin: "27AAACT2727Q1ZB",
      billingState: "Maharashtra",
      billingStateCode: "27",
      creditLimit: 500000,
      outstandingAmount: 120000,
      paymentTerms: "Net 30",
    },
  ];

  const mockTrips = [
    {
      id: "trip_1",
      tripCode: "TRP-2026-001",
      customerId: "cust_1",
      customerName: "Tata Motors Fleet",
      startDate: "2026-08-05",
      startDateTime: "2026-08-05T09:00:00",
      pickupLocation: "Pune",
      dropLocation: "Mumbai",
      vehicleNumber: "MH-12-AB-1234",
      status: "completed",
      tripStatus: "completed",
      baseRate: 5000,
      tollCharges: 300,
      parkingCharges: 100,
      totalAmount: 5400,
      invoiceId: null,
      duration: "1 Day",
      totalKm: 150,
    },
  ];

  const createProps = (overrides = {}) => ({
    open: true,
    onClose: vi.fn(),
    customers: mockCustomers,
    trips: mockTrips,
    invoices: [],
    initialCustomerId: "cust_1",
    onSaveInvoice: vi.fn(),
    ...overrides,
  });

  it("renders when open is true", () => {
    render(<ConsolidatedInvoiceModal {...createProps()} />);

    expect(
      screen.getByText("Generate Consolidated Invoice"),
    ).toBeInTheDocument();

    expect(screen.getByText("Multi-Trip Batch")).toBeInTheDocument();

    expect(screen.getByText("Billing Period *")).toBeInTheDocument();

    expect(screen.getByText("Financial Breakdown & GST")).toBeInTheDocument();

    expect(screen.getByText("Central GST (6%)")).toBeInTheDocument();
    expect(screen.getByText("State GST (6%)")).toBeInTheDocument();

    expect(
      screen.getByText("Invoice Details & Payment Terms"),
    ).toBeInTheDocument();
  });

  it("renders the selected customer and eligible trip", () => {
    render(<ConsolidatedInvoiceModal {...createProps()} />);

    expect(screen.getByText("Tata Motors Fleet")).toBeInTheDocument();
    expect(screen.getByText("TRP-2026-001")).toBeInTheDocument();
    expect(screen.getByText("Pune → Mumbai")).toBeInTheDocument();
  });

  it("automatically selects eligible trips", () => {
    render(<ConsolidatedInvoiceModal {...createProps()} />);

    expect(screen.getByText(/1 of 1 Eligible Selected/i)).toBeInTheDocument();

    const tripCheckbox = screen.getByRole("checkbox", {
      name: "Select trip TRP-2026-001",
    });

    expect(tripCheckbox).toBeChecked();
  });

  it("shows the consolidated trip financial summary", () => {
    render(<ConsolidatedInvoiceModal {...createProps()} />);

    expect(screen.getByText("Trips Included")).toBeInTheDocument();
    expect(screen.getByText("Vehicles Used")).toBeInTheDocument();
    expect(screen.getByText("Total Distance")).toBeInTheDocument();

    expect(screen.getByText("Base Trip Fares (1 trips):")).toBeInTheDocument();

    expect(screen.getByText("Consolidated Grand Total")).toBeInTheDocument();

    expect(
      screen.getByText("Includes all applicable taxes & adjustments"),
    ).toBeInTheDocument();
  });

  it("allows switching between trip filter tabs", () => {
    render(<ConsolidatedInvoiceModal {...createProps()} />);

    expect(
      screen.getAllByRole("button", { name: /All \(1\)/i }).length,
    ).toBeGreaterThan(0);

    expect(
      screen.getByRole("button", { name: /Eligible \(1\)/i }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /Ineligible \(0\)/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Eligible \(1\)/i }));

    expect(screen.getByText("TRP-2026-001")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Ineligible \(0\)/i }));

    expect(
      screen.getByText(
        /No completed trips found for the selected customer and billing period/i,
      ),
    ).toBeInTheDocument();
  });

  it("toggles an eligible trip selection", () => {
    render(<ConsolidatedInvoiceModal {...createProps()} />);

    const tripCheckbox = screen.getByRole("checkbox", {
      name: "Select trip TRP-2026-001",
    });

    expect(tripCheckbox).toBeChecked();

    fireEvent.click(tripCheckbox);

    expect(tripCheckbox).not.toBeChecked();

    expect(screen.getByText(/0 of 1 Eligible Selected/i)).toBeInTheDocument();
  });

  it("can select all eligible trips", () => {
    render(<ConsolidatedInvoiceModal {...createProps()} />);

    const selectAllCheckbox = screen.getByRole("checkbox", {
      name: "Select all eligible trips",
    });

    expect(selectAllCheckbox).toBeChecked();

    fireEvent.click(selectAllCheckbox);

    expect(selectAllCheckbox).not.toBeChecked();

    expect(screen.getByText(/0 of 1 Eligible Selected/i)).toBeInTheDocument();

    fireEvent.click(selectAllCheckbox);

    expect(selectAllCheckbox).toBeChecked();

    expect(screen.getByText(/1 of 1 Eligible Selected/i)).toBeInTheDocument();
  });

  it("allows adding a credit or adjustment line", () => {
    render(<ConsolidatedInvoiceModal {...createProps()} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Add Credit \/ Adjustment Line/i,
      }),
    );

    expect(
      screen.getByPlaceholderText("e.g. Corporate Discount"),
    ).toBeInTheDocument();

    expect(screen.getByPlaceholderText("Amount (₹)")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("e.g. Corporate Discount"), {
      target: {
        value: "Corporate Discount",
      },
    });

    fireEvent.change(screen.getByPlaceholderText("Amount (₹)"), {
      target: {
        value: "500",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByText("Corporate Discount:")).toBeInTheDocument();
  });

  it("closes when Cancel is clicked", () => {
    const props = createProps();

    render(<ConsolidatedInvoiceModal {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the close button is clicked", () => {
    const props = createProps();

    render(<ConsolidatedInvoiceModal {...props} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Close dialog",
      }),
    );

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("does not submit when no trips are selected", () => {
    const props = createProps();

    render(<ConsolidatedInvoiceModal {...props} />);

    const selectAllCheckbox = screen.getByRole("checkbox", {
      name: "Select all eligible trips",
    });

    fireEvent.click(selectAllCheckbox);

    const submitButton = screen.getByRole("button", {
      name: /Generate & Issue Invoice/i,
    });

    expect(submitButton).toBeDisabled();

    expect(props.onSaveInvoice).not.toHaveBeenCalled();
  });

  it("calculates and submits a consolidated invoice", () => {
    const props = createProps();

    render(<ConsolidatedInvoiceModal {...props} />);

    const submitButton = screen.getByRole("button", {
      name: /Generate & Issue Invoice/i,
    });

    expect(submitButton).toBeEnabled();

    fireEvent.click(submitButton);

    expect(props.onSaveInvoice).toHaveBeenCalledTimes(1);

    expect(props.onSaveInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: "cust_1",
        customerName: "Tata Motors Fleet",
        documentType: "consolidated",
        documentStatus: "issued",
        isConsolidated: true,
        consolidatedTripsCount: 1,
        tripIds: ["trip_1"],
        paymentStatus: "unpaid",
        paidAmount: 0,
      }),
    );

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("saves the consolidated invoice as a draft", () => {
    const props = createProps();

    render(<ConsolidatedInvoiceModal {...props} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Save as Draft",
      }),
    );

    expect(props.onSaveInvoice).toHaveBeenCalledTimes(1);

    expect(props.onSaveInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        documentType: "consolidated",
        documentStatus: "draft",
        isConsolidated: true,
        consolidatedTripsCount: 1,
        tripIds: ["trip_1"],
      }),
    );

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("supports custom billing period dates", () => {
    render(<ConsolidatedInvoiceModal {...createProps()} />);

    fireEvent.click(
      screen.getAllByRole("button", {
        name: /Custom/i,
      })[0],
    );

    const dateInputs = screen.getAllByDisplayValue(/2026-08-/);

    expect(dateInputs.length).toBeGreaterThanOrEqual(1);

    const customDateInputs = screen.getAllByRole("textbox");

    expect(customDateInputs.length).toBeGreaterThan(0);
  });

  it("updates invoice notes", () => {
    render(<ConsolidatedInvoiceModal {...createProps()} />);

    const notesInput = screen.getByPlaceholderText(
      /Consolidated corporate monthly logistics bill/i,
    );

    fireEvent.change(notesInput, {
      target: {
        value: "Monthly corporate billing for Tata Motors",
      },
    });

    expect(notesInput).toHaveValue("Monthly corporate billing for Tata Motors");
  });
});
