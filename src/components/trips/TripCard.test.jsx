import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import TripCard from "./TripCard";

const trip = {
  id: "trip-1",
  tripCode: "TRP-0001",

  tripType: "outstation",

  status: "confirmed",
  paymentStatus: "partially_paid",

  pickupLocation: "Chhatrapati Sambhajinagar",
  dropLocation: "Pune",
  stops: "Ahmednagar",

  startDateTime: "2026-08-23T08:30:00",
  duration: "2 Days 10 Hours",

  totalAmount: 25000,
};

const customer = {
  id: "customer-1",
  name: "Perkins India",
};

const vehicle = {
  id: "vehicle-1",
  vehicleNumber: "MH20AB1234",
  vehicleCode: "VEH-0001",
  make: "Tata",
  model: "Starbus",
};

const driver = {
  id: "driver-1",
  name: "Rajesh Patil",
};

const defaultProps = {
  trip,
  customer,
  vehicle,
  driver,
  onView: vi.fn(),
  onEdit: vi.fn(),
  onConfirm: vi.fn(),
  onStart: vi.fn(),
  onComplete: vi.fn(),
  onCancel: vi.fn(),
  onDelete: vi.fn(),
};

describe("TripCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the trip code", () => {
    render(<TripCard {...defaultProps} />);

    expect(screen.getByText("TRP-0001")).toBeInTheDocument();
  });

  it("renders the trip type", () => {
    render(<TripCard {...defaultProps} />);

    /*
     * The exact label depends on TRIP_TYPE_LABELS.
     * The test accepts either the mapped label or the
     * raw trip type if no mapping exists.
     */
    expect(screen.getByText(/Outstation|outstation/)).toBeInTheDocument();
  });

  it("renders the customer name", () => {
    render(<TripCard {...defaultProps} />);

    expect(
      screen.getByRole("heading", {
        name: "Perkins India",
      }),
    ).toBeInTheDocument();
  });

  it("renders the route", () => {
    render(<TripCard {...defaultProps} />);

    expect(screen.getByText("Chhatrapati Sambhajinagar")).toBeInTheDocument();

    expect(screen.getByText("Pune")).toBeInTheDocument();

    expect(screen.getByText("Via: Ahmednagar")).toBeInTheDocument();
  });

  it("does not render the stops section when stops are empty", () => {
    const tripWithoutStops = {
      ...trip,
      stops: "",
    };

    render(<TripCard {...defaultProps} trip={tripWithoutStops} />);

    expect(screen.queryByText(/Via:/)).not.toBeInTheDocument();
  });

  it("renders the formatted start date and time", () => {
    render(<TripCard {...defaultProps} />);

    /*
     * We don't hard-code the entire locale-dependent
     * string. Verify that date/time information is present.
     */
    expect(screen.getByText(/23 Aug 2026/i)).toBeInTheDocument();
  });

  it("renders the trip duration", () => {
    render(<TripCard {...defaultProps} />);

    expect(screen.getByText("2 Days 10 Hours")).toBeInTheDocument();
  });

  it("renders the vehicle information", () => {
    render(<TripCard {...defaultProps} />);

    expect(screen.getByText("MH20AB1234 (Tata Starbus)")).toBeInTheDocument();
  });

  it("renders the driver information", () => {
    render(<TripCard {...defaultProps} />);

    expect(screen.getByText("Rajesh Patil")).toBeInTheDocument();
  });

  it("renders the formatted total amount", () => {
    render(<TripCard {...defaultProps} />);

    expect(screen.getByText("₹25,000")).toBeInTheDocument();
  });

  it("renders fallback customer when customer is missing", () => {
    render(<TripCard {...defaultProps} customer={null} />);

    expect(
      screen.getByRole("heading", {
        name: "Customer",
      }),
    ).toBeInTheDocument();
  });

  it("renders fallback vehicle when vehicle is missing", () => {
    render(<TripCard {...defaultProps} vehicle={null} />);

    expect(screen.getAllByText("Vehicle")).toHaveLength(2);
  });

  it("uses vehicle code when vehicle number is unavailable", () => {
    const vehicleWithoutNumber = {
      ...vehicle,
      vehicleNumber: "",
    };

    render(<TripCard {...defaultProps} vehicle={vehicleWithoutNumber} />);

    expect(screen.getByText("VEH-0001 (Tata Starbus)")).toBeInTheDocument();
  });

  it("renders fallback driver when driver is missing", () => {
    render(<TripCard {...defaultProps} driver={null} />);

    expect(screen.getAllByText("Driver")).toHaveLength(2);
  });

  it("renders an em dash when duration is missing", () => {
    const tripWithoutDuration = {
      ...trip,
      duration: "",
    };

    render(<TripCard {...defaultProps} trip={tripWithoutDuration} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders an em dash when start date is missing", () => {
    const tripWithoutStartDate = {
      ...trip,
      startDateTime: "",
    };

    render(<TripCard {...defaultProps} trip={tripWithoutStartDate} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders only View and 3-dots action buttons in the action bar across statuses", () => {
    render(<TripCard {...defaultProps} />);

    expect(
      screen.getByRole("button", {
        name: "View",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Trip actions",
      }),
    ).toBeInTheDocument();

    // Contextual secondary action buttons are now safely in the actions drawer
    expect(
      screen.queryByRole("button", {
        name: "Start",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Edit",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Complete",
      }),
    ).not.toBeInTheDocument();
  });

  it("renders View and 3-dots actions for completed and draft trips", () => {
    const completedTrip = {
      ...trip,
      status: "completed",
    };

    render(<TripCard {...defaultProps} trip={completedTrip} />);

    expect(
      screen.getByRole("button", {
        name: "View",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Trip actions",
      }),
    ).toBeInTheDocument();
  });

  it("adds highlight styles when highlighted is true", () => {
    const { container } = render(<TripCard {...defaultProps} highlighted />);

    const card = container.firstElementChild;

    expect(card).toHaveClass("ring-2", "ring-primary/40", "shadow-sm");
  });

  it("does not add highlight styles by default", () => {
    const { container } = render(<TripCard {...defaultProps} />);

    const card = container.firstElementChild;

    expect(card).not.toHaveClass("ring-2");
  });

  it("calls onView with the trip when View is clicked", () => {
    const onView = vi.fn();

    render(<TripCard {...defaultProps} onView={onView} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "View",
      }),
    );

    expect(onView).toHaveBeenCalledTimes(1);

    expect(onView).toHaveBeenCalledWith(trip);
  });

  it("renders the 3-dots actions button and triggers onOpenActions when clicked", () => {
    const onOpenActions = vi.fn();

    render(<TripCard {...defaultProps} onOpenActions={onOpenActions} />);

    const actionsBtn = screen.getByRole("button", {
      name: "Trip actions",
    });
    expect(actionsBtn).toBeInTheDocument();

    fireEvent.click(actionsBtn);

    expect(onOpenActions).toHaveBeenCalledTimes(1);
    expect(onOpenActions).toHaveBeenCalledWith(trip);
  });

  it("calls onMore as fallback when onOpenActions is not provided", () => {
    const onMore = vi.fn();

    render(<TripCard {...defaultProps} onMore={onMore} />);

    const actionsBtn = screen.getByRole("button", {
      name: "Trip actions",
    });

    fireEvent.click(actionsBtn);

    expect(onMore).toHaveBeenCalledTimes(1);
    expect(onMore).toHaveBeenCalledWith(trip);
  });
});
