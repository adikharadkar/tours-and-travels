import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import CustomerDetailsModal from "./CustomerDetailsModal";

const companyCustomer = {
  id: "customer-1",
  customerCode: "CUS-0001",
  registrationDate: "2026-08-19",

  customerType: "company",
  prefix: "",
  name: "Perkins India",
  contactPerson: "John Doe",

  mobile1: "9876543210",
  mobile2: "9878654321",
  email: "abc@gmail.com",
  alternateEmail: "ews@gmail.com",

  address: "Plot No. 12, MIDC Area",
  city: "Chhatrapati Sambhajinagar",
  state: "Maharashtra",
  stateCode: "27",
  pinCode: "431001",

  gstNumber: "27ABCDE1234F1Z5",
  pan: "ABCDE1234F",

  billingName: "Perkins India Pvt Ltd",
  billingAddress: "Billing address",
  billingCity: "Chhatrapati Sambhajinagar",
  billingState: "Maharashtra",
  billingStateCode: "27",
  billingPinCode: "431001",

  openingBalance: 25000,
  openingBalanceType: "debit",
  creditLimit: 100000,
  paymentTerms: "30_days",
  billingCycle: "monthly",

  dateOfBirth: null,
  marriageDate: null,

  notes: "Prefers Innova vehicles",
  isActive: true,
};

const individualCustomer = {
  ...companyCustomer,

  id: "customer-2",
  customerCode: "CUS-0002",

  customerType: "individual",
  prefix: "mr",
  name: "John Doe",
  contactPerson: "",

  dateOfBirth: "1985-05-15",
  marriageDate: "2010-02-20",

  openingBalance: 0,
  openingBalanceType: "credit",
  creditLimit: 50000,
  paymentTerms: "15_days",
  billingCycle: "per_trip",

  notes: "",
  isActive: false,
};

describe("CustomerDetailsModal", () => {
  it("renders nothing when customer is not provided", () => {
    const { container } = render(
      <CustomerDetailsModal
        open
        customer={null}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when modal is closed", () => {
    render(
      <CustomerDetailsModal
        open={false}
        customer={companyCustomer}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders company customer details", () => {
    render(
      <CustomerDetailsModal
        open
        customer={companyCustomer}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Perkins India",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("CUS-0001 · Company")).toBeInTheDocument();

    expect(screen.getByText("19/08/2026")).toBeInTheDocument();

    // Appears in modal title and Company Name field.
    expect(screen.getAllByText("Perkins India")).toHaveLength(2);

    expect(screen.getByText("John Doe")).toBeInTheDocument();

    expect(screen.getByText("9876543210")).toBeInTheDocument();

    expect(screen.getByText("9878654321")).toBeInTheDocument();

    expect(screen.getByText("abc@gmail.com")).toBeInTheDocument();

    expect(screen.getByText("ews@gmail.com")).toBeInTheDocument();

    // Appears as City and Billing City.
    expect(screen.getAllByText("Chhatrapati Sambhajinagar")).toHaveLength(2);

    // Appears as State and Billing State.
    expect(screen.getAllByText("Maharashtra")).toHaveLength(2);

    // Appears as State Code and Billing State Code.
    expect(screen.getAllByText("27")).toHaveLength(2);

    // Appears as PIN Code and Billing PIN Code.
    expect(screen.getAllByText("431001")).toHaveLength(2);

    expect(screen.getByText("27ABCDE1234F1Z5")).toBeInTheDocument();

    expect(screen.getByText("ABCDE1234F")).toBeInTheDocument();

    expect(screen.getByText("Perkins India Pvt Ltd")).toBeInTheDocument();

    expect(screen.getByText("Billing address")).toBeInTheDocument();

    expect(screen.getByText("₹25,000.00")).toBeInTheDocument();

    expect(screen.getByText("Debit")).toBeInTheDocument();

    expect(screen.getByText("₹1,00,000.00")).toBeInTheDocument();

    expect(screen.getByText("30 Days")).toBeInTheDocument();

    expect(screen.getByText("Monthly")).toBeInTheDocument();

    expect(screen.getByText("Prefers Innova vehicles")).toBeInTheDocument();

    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders individual-specific details", () => {
    render(
      <CustomerDetailsModal
        open
        customer={individualCustomer}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("CUS-0002 · Individual")).toBeInTheDocument();

    // Appears in the modal title and Customer Name field.
    expect(screen.getAllByText("John Doe")).toHaveLength(2);

    expect(screen.getByText("Date of Birth")).toBeInTheDocument();

    expect(screen.getByText("15/05/1985")).toBeInTheDocument();

    expect(screen.getByText("Marriage Date")).toBeInTheDocument();

    expect(screen.getByText("20/02/2010")).toBeInTheDocument();

    expect(screen.getByText("Inactive")).toBeInTheDocument();

    expect(screen.getByText("Prefix")).toBeInTheDocument();

    expect(screen.getByText("mr")).toBeInTheDocument();
  });

  it("shows prefix for individual customers", () => {
    render(
      <CustomerDetailsModal
        open
        customer={individualCustomer}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("Prefix")).toBeInTheDocument();

    expect(screen.getByText("mr")).toBeInTheDocument();
  });

  it("does not show prefix for company customers", () => {
    render(
      <CustomerDetailsModal
        open
        customer={companyCustomer}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.queryByText("Prefix")).not.toBeInTheDocument();
  });

  it("does not show individual-specific dates for company customers", () => {
    render(
      <CustomerDetailsModal
        open
        customer={companyCustomer}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.queryByText("Date of Birth")).not.toBeInTheDocument();

    expect(screen.queryByText("Marriage Date")).not.toBeInTheDocument();
  });

  it("uses an em dash for empty values", () => {
    const customer = {
      ...companyCustomer,
      mobile2: "",
      alternateEmail: "",
      notes: "",
      billingAddress: "",
    };

    render(
      <CustomerDetailsModal
        open
        customer={customer}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders fallback values for unknown enum values", () => {
    const customer = {
      ...companyCustomer,
      customerType: "unknown",
      openingBalanceType: "unknown",
      paymentTerms: "unknown",
      billingCycle: "unknown",
    };

    render(
      <CustomerDetailsModal
        open
        customer={customer}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("CUS-0001 · —")).toBeInTheDocument();

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("calls onClose when Close button is clicked", () => {
    const onClose = vi.fn();

    render(
      <CustomerDetailsModal
        open
        customer={companyCustomer}
        onClose={onClose}
        onEdit={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Close",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when modal close button is clicked", () => {
    const onClose = vi.fn();

    render(
      <CustomerDetailsModal
        open
        customer={companyCustomer}
        onClose={onClose}
        onEdit={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Close modal",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onEdit with the customer when Edit Customer is clicked", () => {
    const onEdit = vi.fn();

    render(
      <CustomerDetailsModal
        open
        customer={companyCustomer}
        onClose={vi.fn()}
        onEdit={onEdit}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit Customer",
      }),
    );

    expect(onEdit).toHaveBeenCalledTimes(1);

    expect(onEdit).toHaveBeenCalledWith(companyCustomer);
  });
});
