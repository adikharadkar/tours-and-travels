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

  it("renders Active/Edit actions for confirmed trips", () => {
    render(<TripCard {...defaultProps} />);

    expect(
      screen.getByRole("button", {
        name: "View",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Edit",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Start",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Cancel",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Confirm",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Complete",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Delete",
      }),
    ).not.toBeInTheDocument();
  });

  it("renders Confirm and Delete actions for draft trips", () => {
    const draftTrip = {
      ...trip,
      status: "draft",
    };

    render(<TripCard {...defaultProps} trip={draftTrip} />);

    expect(
      screen.getByRole("button", {
        name: "Confirm",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Delete",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Edit",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Cancel",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Start",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Complete",
      }),
    ).not.toBeInTheDocument();
  });

  it("renders Complete action for in-progress trips", () => {
    const inProgressTrip = {
      ...trip,
      status: "in_progress",
    };

    render(<TripCard {...defaultProps} trip={inProgressTrip} />);

    expect(
      screen.getByRole("button", {
        name: "Complete",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Edit",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Start",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Confirm",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Delete",
      }),
    ).not.toBeInTheDocument();
  });

  it("hides Edit and lifecycle actions for completed trips", () => {
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
      screen.queryByRole("button", {
        name: "Edit",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Confirm",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Start",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Complete",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Cancel",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Delete",
      }),
    ).not.toBeInTheDocument();
  });

  it("hides Edit and lifecycle actions for cancelled trips", () => {
    const cancelledTrip = {
      ...trip,
      status: "cancelled",
    };

    render(<TripCard {...defaultProps} trip={cancelledTrip} />);

    expect(
      screen.getByRole("button", {
        name: "View",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Edit",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Confirm",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Start",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Complete",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Cancel",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Delete",
      }),
    ).not.toBeInTheDocument();
  });

  it("does not render optional action buttons when callbacks are missing", () => {
    const draftTrip = {
      ...trip,
      status: "draft",
    };

    render(
      <TripCard
        trip={draftTrip}
        customer={customer}
        vehicle={vehicle}
        driver={driver}
        onView={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", {
        name: "Confirm",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Cancel",
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Delete",
      }),
    ).not.toBeInTheDocument();
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

  it("calls onEdit with the trip when Edit is clicked", () => {
    const onEdit = vi.fn();

    render(<TripCard {...defaultProps} onEdit={onEdit} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit",
      }),
    );

    expect(onEdit).toHaveBeenCalledTimes(1);

    expect(onEdit).toHaveBeenCalledWith(trip);
  });

  it("calls onConfirm with the trip when Confirm is clicked", () => {
    const onConfirm = vi.fn();

    const draftTrip = {
      ...trip,
      status: "draft",
    };

    render(
      <TripCard {...defaultProps} trip={draftTrip} onConfirm={onConfirm} />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Confirm",
      }),
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);

    expect(onConfirm).toHaveBeenCalledWith(draftTrip);
  });

  it("calls onStart with the trip when Start is clicked", () => {
    const onStart = vi.fn();

    render(<TripCard {...defaultProps} onStart={onStart} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Start",
      }),
    );

    expect(onStart).toHaveBeenCalledTimes(1);

    expect(onStart).toHaveBeenCalledWith(trip);
  });

  it("calls onComplete with the trip when Complete is clicked", () => {
    const onComplete = vi.fn();

    const inProgressTrip = {
      ...trip,
      status: "in_progress",
    };

    render(
      <TripCard
        {...defaultProps}
        trip={inProgressTrip}
        onComplete={onComplete}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Complete",
      }),
    );

    expect(onComplete).toHaveBeenCalledTimes(1);

    expect(onComplete).toHaveBeenCalledWith(inProgressTrip);
  });

  it("calls onCancel with the trip when Cancel is clicked", () => {
    const onCancel = vi.fn();

    render(<TripCard {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Cancel",
      }),
    );

    expect(onCancel).toHaveBeenCalledTimes(1);

    expect(onCancel).toHaveBeenCalledWith(trip);
  });

  it("calls onDelete with the trip when Delete is clicked", () => {
    const onDelete = vi.fn();

    const draftTrip = {
      ...trip,
      status: "draft",
    };

    render(<TripCard {...defaultProps} trip={draftTrip} onDelete={onDelete} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Delete",
      }),
    );

    expect(onDelete).toHaveBeenCalledTimes(1);

    expect(onDelete).toHaveBeenCalledWith(draftTrip);
  });
});
