import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CorporateCustomerDrawer from "./CorporateCustomerDrawer";

describe("CorporateCustomerDrawer", () => {
  const mockCustomers = [
    {
      id: "cust_1",
      name: "Tata Motors Fleet",
      companyName: "Tata Motors Limited",
      customerType: "company",
      customerCode: "CUST-001",
      gstin: "27AAACT2727Q1ZB",
      billingState: "Maharashtra",
      creditLimit: 500000,
      outstandingAmount: 120000,
      paymentTerms: "Net 30",
    },
    {
      id: "cust_2",
      name: "Reliance Retail",
      companyName: "Reliance Retail Ventures",
      customerType: "company",
      customerCode: "CUST-002",
      gstin: "27AABCR1234F1Z9",
      billingState: "Maharashtra",
      creditLimit: 200000,
      outstandingAmount: 180000,
      paymentTerms: "Net 15",
    },
    {
      id: "cust_3",
      name: "Individual Traveler",
      customerCode: "CUST-003",
      customerType: "individual",
      creditLimit: 0,
      outstandingAmount: 0,
    },
  ];

  const mockTrips = [
    {
      id: "trip_1",
      customerId: "cust_1",
      customerName: "Tata Motors Fleet",
      status: "completed",
      totalAmount: 15000,
      invoiceId: null,
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    customers: mockCustomers,
    trips: mockTrips,
    invoices: [],
    selectedCustomerId: "",
    onSelectCustomer: vi.fn(),
  };

  const renderDrawer = (props = {}) => {
    return render(<CorporateCustomerDrawer {...defaultProps} {...props} />);
  };

  it("renders when isOpen is true", () => {
    renderDrawer();

    expect(
      screen.getByRole("heading", {
        name: "Select Corporate Customer",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText(/Search by company name, code/i),
    ).toBeInTheDocument();

    expect(screen.getByText("Tata Motors Fleet")).toBeInTheDocument();

    expect(screen.getByText("Reliance Retail")).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    renderDrawer({
      isOpen: false,
    });

    expect(
      screen.queryByRole("heading", {
        name: "Select Corporate Customer",
      }),
    ).not.toBeInTheDocument();
  });

  it("filters customers when typing in the search box", () => {
    renderDrawer();

    const searchInput = screen.getByPlaceholderText(
      /Search by company name, code/i,
    );

    fireEvent.change(searchInput, {
      target: {
        value: "Reliance",
      },
    });

    expect(screen.getByText("Reliance Retail")).toBeInTheDocument();

    expect(screen.queryByText("Tata Motors Fleet")).not.toBeInTheDocument();
  });

  it("triggers onSelectCustomer and onClose when a customer is clicked", () => {
    const handleSelect = vi.fn();
    const handleClose = vi.fn();

    renderDrawer({
      onSelectCustomer: handleSelect,
      onClose: handleClose,
    });

    const customer = screen.getByText("Tata Motors Fleet");

    fireEvent.click(customer);

    expect(handleSelect).toHaveBeenCalledTimes(1);
    expect(handleSelect).toHaveBeenCalledWith("cust_1");

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("shows unbilled trip information for customers with completed unbilled trips", () => {
    renderDrawer();

    expect(
      screen.getByText(/1 Unbilled Trip \(₹15,000\)/i),
    ).toBeInTheDocument();
  });

  it("shows outstanding balance for customers", () => {
    renderDrawer();

    expect(screen.getByText("₹1,20,000")).toBeInTheDocument();

    expect(screen.getByText("₹1,80,000")).toBeInTheDocument();
  });

  it("filters customers with unbilled trips", () => {
    renderDrawer();

    fireEvent.click(
      screen.getByRole("button", {
        name: /With Unbilled Trips/i,
      }),
    );

    expect(screen.getByText("Tata Motors Fleet")).toBeInTheDocument();

    expect(screen.queryByText("Reliance Retail")).not.toBeInTheDocument();

    expect(screen.queryByText("Individual Traveler")).not.toBeInTheDocument();
  });

  it("filters customers with outstanding balances", () => {
    renderDrawer();

    fireEvent.click(
      screen.getByRole("button", {
        name: /With Outstanding/i,
      }),
    );

    expect(screen.getByText("Tata Motors Fleet")).toBeInTheDocument();

    expect(screen.getByText("Reliance Retail")).toBeInTheDocument();

    expect(screen.queryByText("Individual Traveler")).not.toBeInTheDocument();
  });

  it("filters to corporate and enterprise customers", () => {
    renderDrawer();

    fireEvent.click(
      screen.getByRole("button", {
        name: /Corporate \/ Enterprise/i,
      }),
    );

    expect(screen.getByText("Tata Motors Fleet")).toBeInTheDocument();

    expect(screen.getByText("Reliance Retail")).toBeInTheDocument();

    expect(screen.queryByText("Individual Traveler")).not.toBeInTheDocument();
  });

  it("sorts customers by company name", () => {
    renderDrawer();

    const sortSelect = screen.getByRole("combobox");

    fireEvent.change(sortSelect, {
      target: {
        value: "name",
      },
    });

    const customerNames = screen.getAllByRole("heading", {
      level: 3,
    });

    expect(customerNames[0]).toHaveTextContent("Individual Traveler");

    expect(customerNames[1]).toHaveTextContent("Reliance Retail");

    expect(customerNames[2]).toHaveTextContent("Tata Motors Fleet");
  });

  it("calls onClose when the close button is clicked", () => {
    const handleClose = vi.fn();

    renderDrawer({
      onClose: handleClose,
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Close drawer",
      }),
    );

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Done is clicked", () => {
    const handleClose = vi.fn();

    renderDrawer({
      onClose: handleClose,
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Done",
      }),
    );

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("marks the selected customer", () => {
    renderDrawer({
      selectedCustomerId: "cust_1",
    });

    expect(screen.getByText("Tata Motors Fleet")).toBeInTheDocument();

    expect(screen.getByText("check")).toBeInTheDocument();
  });

  it("shows no matching customers when search returns no results", () => {
    renderDrawer();

    const searchInput = screen.getByPlaceholderText(
      /Search by company name, code/i,
    );

    fireEvent.change(searchInput, {
      target: {
        value: "Nonexistent Customer",
      },
    });

    expect(
      screen.getByText("No matching corporate customers found"),
    ).toBeInTheDocument();
  });
});
