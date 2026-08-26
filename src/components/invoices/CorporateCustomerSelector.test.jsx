import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import CorporateCustomerSelector from "./CorporateCustomerSelector";

describe("CorporateCustomerSelector", () => {
  const mockCustomers = [
    {
      id: "cust_1",
      name: "Tata Motors Fleet",
      companyName: "Tata Motors Limited",
      customerType: "company",
      gstin: "27AAACT2727Q1ZB",
      billingState: "Maharashtra",
      creditLimit: 500000,
      outstandingAmount: 120000,
      paymentTerms: "Net 30",
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

  it("renders with initial empty state prompt", () => {
    render(
      <CorporateCustomerSelector
        customers={mockCustomers}
        trips={mockTrips}
        selectedCustomerId=""
        onSelectCustomer={() => {}}
      />,
    );

    expect(screen.getByText("Target Corporate Customer *")).toBeInTheDocument();
    expect(screen.getByText(/Browse All/)).toBeInTheDocument();
  });

  it("renders selected customer summary card with GSTIN and billing info", () => {
    render(
      <CorporateCustomerSelector
        customers={mockCustomers}
        trips={mockTrips}
        selectedCustomerId="cust_1"
        onSelectCustomer={() => {}}
      />,
    );

    expect(screen.getByText("Tata Motors Fleet")).toBeInTheDocument();
    expect(screen.getByText(/27AAACT2727Q1ZB/i)).toBeInTheDocument();
  });

  it("opens drawer when directory trigger button is clicked", () => {
    render(
      <CorporateCustomerSelector
        customers={mockCustomers}
        trips={mockTrips}
        selectedCustomerId=""
        onSelectCustomer={() => {}}
      />,
    );

    const browseBtn = screen.getByRole("button", {
      name: /Browse All/i,
    });
    fireEvent.click(browseBtn);

    expect(
      screen.getByText(
        "Choose a corporate client to aggregate trips and generate batch invoices.",
      ),
    ).toBeInTheDocument();
  });
});
