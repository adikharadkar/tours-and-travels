import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import TripActionsDrawer from "./TripActionsDrawer";

const mockTrip = {
  id: "trip_1",
  tripCode: "TRP-0101",
  tripType: "outstation",
  status: "confirmed",
  paymentStatus: "partially_paid",
  customerId: "cust_1",
  vehicleId: "veh_1",
  driverId: "drv_1",
  pickupLocation: "Chhatrapati Sambhajinagar",
  dropLocation: "Pune",
  startDateTime: "2026-08-27T08:30:00",
  totalAmount: 24500,
};

const mockCustomer = {
  id: "cust_1",
  name: "Perkins India Pvt Ltd",
};

const mockVehicle = {
  id: "veh_1",
  vehicleNumber: "MH20 AB 1234",
  make: "Tata",
  model: "Starbus",
};

const mockDriver = {
  id: "drv_1",
  name: "Rajesh Patil",
  mobile: "9876543210",
};

describe("TripActionsDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when open is false", () => {
    const { container } = render(
      <TripActionsDrawer
        open={false}
        onClose={vi.fn()}
        trip={mockTrip}
        customer={mockCustomer}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders trip header and summary when open", () => {
    render(
      <TripActionsDrawer
        open={true}
        onClose={vi.fn()}
        trip={mockTrip}
        customer={mockCustomer}
        vehicle={mockVehicle}
        driver={mockDriver}
      />,
    );

    expect(screen.getByText("TRP-0101")).toBeInTheDocument();
    expect(screen.getByText("Perkins India Pvt Ltd")).toBeInTheDocument();
    expect(screen.getByText("Chhatrapati Sambhajinagar")).toBeInTheDocument();
    expect(screen.getByText("Pune")).toBeInTheDocument();
    expect(screen.getByText("MH20 AB 1234")).toBeInTheDocument();
    expect(screen.getByText("Rajesh Patil")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <TripActionsDrawer
        open={true}
        onClose={onClose}
        trip={mockTrip}
        customer={mockCustomer}
      />,
    );

    fireEvent.click(screen.getByLabelText("Close actions drawer"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("triggers onStart when Start Journey is clicked on confirmed trip", () => {
    const onStart = vi.fn();
    const onClose = vi.fn();
    render(
      <TripActionsDrawer
        open={true}
        onClose={onClose}
        trip={mockTrip}
        customer={mockCustomer}
        onStart={onStart}
      />,
    );

    const startBtn = screen.getByRole("button", { name: /Start Journey/i });
    fireEvent.click(startBtn);

    expect(onClose).toHaveBeenCalled();
    expect(onStart).toHaveBeenCalledWith(mockTrip);
  });

  it("triggers onComplete when Complete Trip is clicked on in_progress trip", () => {
    const onComplete = vi.fn();
    const onClose = vi.fn();
    const inProgressTrip = { ...mockTrip, status: "in_progress" };

    render(
      <TripActionsDrawer
        open={true}
        onClose={onClose}
        trip={inProgressTrip}
        customer={mockCustomer}
        onComplete={onComplete}
      />,
    );

    const completeBtn = screen.getByRole("button", { name: /Complete Trip/i });
    fireEvent.click(completeBtn);

    expect(onClose).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledWith(inProgressTrip);
  });

  it("triggers onGenerateInvoice when Generate Tax Invoice is clicked on completed trip", () => {
    const onGenerateInvoice = vi.fn();
    const onClose = vi.fn();
    const completedTrip = { ...mockTrip, status: "completed" };

    render(
      <TripActionsDrawer
        open={true}
        onClose={onClose}
        trip={completedTrip}
        customer={mockCustomer}
        invoice={null}
        onGenerateInvoice={onGenerateInvoice}
      />,
    );

    const generateBtn = screen.getAllByRole("button", {
      name: /Generate Tax Invoice/i,
    })[0];
    fireEvent.click(generateBtn);

    expect(onClose).toHaveBeenCalled();
    expect(onGenerateInvoice).toHaveBeenCalledWith(completedTrip);
  });

  it("triggers onViewDetails when View Full Trip Details is clicked", () => {
    const onViewDetails = vi.fn();
    const onClose = vi.fn();

    render(
      <TripActionsDrawer
        open={true}
        onClose={onClose}
        trip={mockTrip}
        customer={mockCustomer}
        onViewDetails={onViewDetails}
      />,
    );

    const viewDetailsBtn = screen.getByRole("button", {
      name: /View Full Trip Details/i,
    });
    fireEvent.click(viewDetailsBtn);

    expect(onClose).toHaveBeenCalled();
    expect(onViewDetails).toHaveBeenCalledWith(mockTrip);
  });

  it("triggers onCancel when Cancel Trip is clicked", () => {
    const onCancel = vi.fn();
    const onClose = vi.fn();

    render(
      <TripActionsDrawer
        open={true}
        onClose={onClose}
        trip={mockTrip}
        customer={mockCustomer}
        onCancel={onCancel}
      />,
    );

    const cancelBtn = screen.getByRole("button", { name: /Cancel Trip/i });
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledWith(mockTrip);
  });
});
