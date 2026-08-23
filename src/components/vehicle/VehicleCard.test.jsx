import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import VehicleCard from "./VehicleCard";

import { getVehicleDocumentStatus } from "../../utils/vehicleDocumentStatus";

vi.mock("../../utils/vehicleDocumentStatus", () => ({
  getVehicleDocumentStatus: vi.fn(),
}));

const vehicle = {
  id: "vehicle-1",
  vehicleCode: "VEH-0001",
  vehicleNumber: "MH20AB1234",

  vehicleType: "bus",

  make: "Tata",
  model: "Starbus",

  seatingCapacity: 45,
  fuelType: "diesel",

  ownershipType: "own",
  ownerName: "",

  isActive: true,
};

const attachedVehicle = {
  ...vehicle,

  id: "vehicle-2",
  vehicleCode: "VEH-0002",
  vehicleNumber: "MH20CD5678",

  ownershipType: "attached",
  ownerName: "ABC Travels",
};

describe("VehicleCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getVehicleDocumentStatus.mockReturnValue({
      value: "valid",
      label: "Valid",
      summary: "All vehicle documents are valid.",
    });
  });

  it("renders the vehicle number and vehicle code", () => {
    const { container } = render(
      <VehicleCard
        vehicle={vehicle}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "MH20AB1234",
      }),
    ).toBeInTheDocument();

    expect(container.textContent).toContain("VEH-0001");
  });

  it("renders the vehicle type", () => {
    render(
      <VehicleCard
        vehicle={vehicle}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText(/VEH-0001 · Bus/)).toBeInTheDocument();
  });

  it("renders make and model", () => {
    render(
      <VehicleCard
        vehicle={vehicle}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Tata Starbus")).toBeInTheDocument();
  });

  it("renders seating capacity and fuel type", () => {
    render(
      <VehicleCard
        vehicle={vehicle}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("45 Seats · Diesel")).toBeInTheDocument();
  });

  it("renders ownership type for an owned vehicle", () => {
    render(
      <VehicleCard
        vehicle={vehicle}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Own")).toBeInTheDocument();
  });

  it("renders owner name for attached vehicles", () => {
    render(
      <VehicleCard
        vehicle={attachedVehicle}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Attached (ABC Travels)")).toBeInTheDocument();
  });

  it("does not render owner name for owned vehicles", () => {
    render(
      <VehicleCard
        vehicle={vehicle}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.queryByText(/\(ABC Travels\)/)).not.toBeInTheDocument();
  });

  it("renders Active status for an active vehicle", () => {
    render(
      <VehicleCard
        vehicle={vehicle}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders Inactive status for an inactive vehicle", () => {
    const inactiveVehicle = {
      ...vehicle,
      isActive: false,
    };

    render(
      <VehicleCard
        vehicle={inactiveVehicle}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("renders the document status", () => {
    render(
      <VehicleCard
        vehicle={vehicle}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Valid")).toBeInTheDocument();

    expect(getVehicleDocumentStatus).toHaveBeenCalledWith(vehicle);
  });

  it("renders expiring soon document status", () => {
    getVehicleDocumentStatus.mockReturnValue({
      value: "expiring_soon",
      label: "Expiring Soon",
      summary: "Insurance expires in 10 days.",
    });

    render(
      <VehicleCard
        vehicle={vehicle}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const status = screen.getByText("Expiring Soon");

    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute("title", "Insurance expires in 10 days.");
  });

  it("renders expired document status", () => {
    getVehicleDocumentStatus.mockReturnValue({
      value: "expired",
      label: "Expired",
      summary: "Fitness certificate has expired.",
    });

    render(
      <VehicleCard
        vehicle={vehicle}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Expired")).toBeInTheDocument();
  });

  it("adds highlight styles when highlighted is true", () => {
    const { container } = render(
      <VehicleCard
        vehicle={vehicle}
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
      <VehicleCard
        vehicle={vehicle}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const card = container.firstElementChild;

    expect(card).not.toHaveClass("ring-2");
  });

  it("calls onView with the vehicle when View is clicked", () => {
    const onView = vi.fn();

    render(
      <VehicleCard
        vehicle={vehicle}
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
    expect(onView).toHaveBeenCalledWith(vehicle);
  });

  it("calls onEdit with the vehicle when Edit is clicked", () => {
    const onEdit = vi.fn();

    render(
      <VehicleCard
        vehicle={vehicle}
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
    expect(onEdit).toHaveBeenCalledWith(vehicle);
  });

  it("calls onDelete with the vehicle when Delete is clicked", () => {
    const onDelete = vi.fn();

    render(
      <VehicleCard
        vehicle={vehicle}
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
    expect(onDelete).toHaveBeenCalledWith(vehicle);
  });
});
