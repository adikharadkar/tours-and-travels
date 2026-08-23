import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import DriverCard from "./DriverCard";

import { getDriverLicenseStatus } from "../../utils/driverLicenseStatus";

vi.mock("../../utils/driverLicenseStatus", () => ({
  getDriverLicenseStatus: vi.fn(),
}));

const driver = {
  id: "driver-1",
  driverCode: "DRV-0001",

  prefix: "mr",
  name: "Rajesh Patil",

  driverType: "own",

  mobile: "9876543210",

  licenseNumber: "MH2020001234567",
  licenseType: "transport",

  isActive: true,
};

const inactiveDriver = {
  ...driver,
  id: "driver-2",
  driverCode: "DRV-0002",
  name: "Amit Sharma",
  isActive: false,
};

const driverWithoutPrefix = {
  ...driver,
  id: "driver-3",
  driverCode: "DRV-0003",
  prefix: "",
  name: "Suresh Pawar",
};

describe("DriverCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getDriverLicenseStatus.mockReturnValue({
      value: "valid",
      label: "Valid",
      message: "License is valid.",
    });
  });

  it("renders the driver name with prefix", () => {
    render(
      <DriverCard
        driver={driver}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Mr. Rajesh Patil",
      }),
    ).toBeInTheDocument();
  });

  it("renders the driver name without prefix when prefix is empty", () => {
    render(
      <DriverCard
        driver={driverWithoutPrefix}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Suresh Pawar",
      }),
    ).toBeInTheDocument();
  });

  it("renders the driver code and driver type", () => {
    render(
      <DriverCard
        driver={driver}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText(/DRV-0001/)).toBeInTheDocument();

    expect(screen.getByText(/Own/)).toBeInTheDocument();
  });

  it("renders the active status for an active driver", () => {
    render(
      <DriverCard
        driver={driver}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders the inactive status for an inactive driver", () => {
    render(
      <DriverCard
        driver={inactiveDriver}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("renders the mobile number", () => {
    render(
      <DriverCard
        driver={driver}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("9876543210")).toBeInTheDocument();
  });

  it("renders an em dash when mobile number is missing", () => {
    const driverWithoutMobile = {
      ...driver,
      mobile: "",
    };

    render(
      <DriverCard
        driver={driverWithoutMobile}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders the license number and license type", () => {
    render(
      <DriverCard
        driver={driver}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("MH2020001234567")).toBeInTheDocument();

    expect(screen.getByText("(Transport)")).toBeInTheDocument();
  });

  it("renders the license status", () => {
    render(
      <DriverCard
        driver={driver}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Valid")).toBeInTheDocument();

    expect(getDriverLicenseStatus).toHaveBeenCalledWith(driver);
  });

  it("renders expiring soon license status", () => {
    getDriverLicenseStatus.mockReturnValue({
      value: "expiring_soon",
      label: "Expiring Soon",
      message: "License expires in 10 days.",
    });

    render(
      <DriverCard
        driver={driver}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const status = screen.getByText("Expiring Soon");

    expect(status).toBeInTheDocument();

    expect(status).toHaveAttribute("title", "License expires in 10 days.");
  });

  it("renders expired license status", () => {
    getDriverLicenseStatus.mockReturnValue({
      value: "expired",
      label: "Expired",
      message: "License has expired.",
    });

    render(
      <DriverCard
        driver={driver}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Expired")).toBeInTheDocument();
  });

  it("adds highlight styles when highlighted is true", () => {
    const { container } = render(
      <DriverCard
        driver={driver}
        highlighted
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const card = container.firstElementChild;

    expect(card).toHaveClass("ring-2", "ring-primary/40", "shadow-sm");
  });

  it("does not add highlight styles by default", () => {
    const { container } = render(
      <DriverCard
        driver={driver}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const card = container.firstElementChild;

    expect(card).not.toHaveClass("ring-2");
  });

  it("calls onView with the driver when View is clicked", () => {
    const onView = vi.fn();

    render(
      <DriverCard
        driver={driver}
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

    expect(onView).toHaveBeenCalledWith(driver);
  });

  it("calls onEdit with the driver when Edit is clicked", () => {
    const onEdit = vi.fn();

    render(
      <DriverCard
        driver={driver}
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

    expect(onEdit).toHaveBeenCalledWith(driver);
  });

  it("calls onDelete with the driver when Delete is clicked", () => {
    const onDelete = vi.fn();

    render(
      <DriverCard
        driver={driver}
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

    expect(onDelete).toHaveBeenCalledWith(driver);
  });
});
