import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import CustomerCard from "./CustomerCard";

import { getCustomerAccountStatus } from "../../utils/customerAccountStatus";

vi.mock("../../utils/customerAccountStatus", () => ({
  getCustomerAccountStatus: vi.fn(),
}));

const companyCustomer = {
  id: "customer-1",
  customerCode: "CUS-0001",
  name: "Perkins India",
  customerType: "company",
  contactPerson: "John Doe",
  mobile1: "9876543210",
  isActive: true,
};

const individualCustomer = {
  id: "customer-2",
  customerCode: "CUS-0002",
  name: "Jane Doe",
  customerType: "individual",
  contactPerson: "",
  mobile1: "9876543211",
  isActive: true,
};

describe("CustomerCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getCustomerAccountStatus.mockReturnValue({
      value: "no_dues",
      label: "No Dues",
    });
  });

  it("renders the company customer information", () => {
    render(
      <CustomerCard
        customer={companyCustomer}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Perkins India",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("CUS-0001 · Company")).toBeInTheDocument();

    expect(screen.getByText("John Doe")).toBeInTheDocument();

    expect(screen.getByText("9876543210")).toBeInTheDocument();
  });

  it("renders an individual customer correctly", () => {
    render(
      <CustomerCard
        customer={individualCustomer}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Jane Doe",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("CUS-0002 · Individual")).toBeInTheDocument();

    expect(screen.getByText("9876543211")).toBeInTheDocument();

    expect(screen.queryByText("Contact Person")).not.toBeInTheDocument();
  });

  it("does not render contact person when it is empty", () => {
    render(
      <CustomerCard
        customer={individualCustomer}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.queryByText("Contact Person")).not.toBeInTheDocument();
  });

  it("renders Active status for an active customer", () => {
    render(
      <CustomerCard
        customer={companyCustomer}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders Inactive status for an inactive customer", () => {
    const inactiveCustomer = {
      ...companyCustomer,
      isActive: false,
    };

    render(
      <CustomerCard
        customer={inactiveCustomer}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("renders the account status returned by the utility", () => {
    getCustomerAccountStatus.mockReturnValue({
      value: "due",
      label: "Due",
    });

    render(
      <CustomerCard
        customer={companyCustomer}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Due")).toBeInTheDocument();

    expect(getCustomerAccountStatus).toHaveBeenCalledWith(companyCustomer);
  });

  it("renders overdue account status", () => {
    getCustomerAccountStatus.mockReturnValue({
      value: "overdue",
      label: "Overdue",
    });

    render(
      <CustomerCard
        customer={companyCustomer}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Overdue")).toBeInTheDocument();
  });

  it("renders credit account status", () => {
    getCustomerAccountStatus.mockReturnValue({
      value: "credit",
      label: "Credit",
    });

    render(
      <CustomerCard
        customer={companyCustomer}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Credit")).toBeInTheDocument();
  });

  it("renders no-dues account status", () => {
    getCustomerAccountStatus.mockReturnValue({
      value: "no_dues",
      label: "No Dues",
    });

    render(
      <CustomerCard
        customer={companyCustomer}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("No Dues")).toBeInTheDocument();
  });

  it("renders a dash when mobile number is empty", () => {
    const customer = {
      ...companyCustomer,
      mobile1: "",
    };

    render(
      <CustomerCard
        customer={customer}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("adds highlight styles when highlighted is true", () => {
    const { container } = render(
      <CustomerCard
        customer={companyCustomer}
        highlighted
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const card = container.firstElementChild;

    expect(card).toHaveClass("ring-2", "ring-primary/30");
  });

  it("does not add highlight styles by default", () => {
    const { container } = render(
      <CustomerCard
        customer={companyCustomer}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const card = container.firstElementChild;

    expect(card).not.toHaveClass("ring-2");
  });

  it("calls onView with the customer when View is clicked", () => {
    const onView = vi.fn();

    render(
      <CustomerCard
        customer={companyCustomer}
        onView={onView}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "View",
      }),
    );

    expect(onView).toHaveBeenCalledTimes(1);

    expect(onView).toHaveBeenCalledWith(companyCustomer);
  });

  it("calls onEdit with the customer when Edit is clicked", () => {
    const onEdit = vi.fn();

    render(
      <CustomerCard
        customer={companyCustomer}
        onView={vi.fn()}
        onEdit={onEdit}
        onDelete={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit",
      }),
    );

    expect(onEdit).toHaveBeenCalledTimes(1);

    expect(onEdit).toHaveBeenCalledWith(companyCustomer);
  });

  it("calls onDelete with the customer when Delete is clicked", () => {
    const onDelete = vi.fn();

    render(
      <CustomerCard
        customer={companyCustomer}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Delete",
      }),
    );

    expect(onDelete).toHaveBeenCalledTimes(1);

    expect(onDelete).toHaveBeenCalledWith(companyCustomer);
  });
});
