import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import TripCalendar from "./TripCalendar";

const customers = [
  {
    id: "customer-1",
    name: "Perkins India",
  },
  {
    id: "customer-2",
    name: "ABC Travels",
  },
];

const vehicles = [
  {
    id: "vehicle-1",
    vehicleNumber: "MH20AB1234",
    makeModel: "Tata 407",
  },
  {
    id: "vehicle-2",
    vehicleNumber: "MH20CD5678",
    makeModel: "Eicher Pro",
  },
];

const drivers = [
  {
    id: "driver-1",
    name: "Rajesh Patil",
    phone: "+91 98765 43210",
  },
  {
    id: "driver-2",
    name: "Amit Sharma",
    phone: "+91 98765 12345",
  },
];

const trips = [
  {
    id: "trip-1",
    tripCode: "TRP-0001",
    customerId: "customer-1",
    vehicleId: "vehicle-1",
    driverId: "driver-1",
    startDateTime: "2026-08-15T08:00:00",
    endDateTime: "2026-08-15T18:00:00",
    pickupLocation: "Chhatrapati Sambhajinagar",
    dropLocation: "Pune",
    totalAmount: 25000,
    status: "confirmed",
  },
  {
    id: "trip-2",
    tripCode: "TRP-0002",
    customerId: "customer-2",
    vehicleId: "vehicle-2",
    driverId: "driver-2",
    startDateTime: "2026-08-20T09:00:00",
    endDateTime: "2026-08-22T18:00:00",
    pickupLocation: "Pune",
    dropLocation: "Mumbai",
    totalAmount: 18000,
    status: "in_progress",
  },
  {
    id: "trip-3",
    tripCode: "TRP-0003",
    customerId: "customer-1",
    vehicleId: "vehicle-1",
    driverId: "driver-1",
    startDateTime: "2026-08-20T10:00:00",
    endDateTime: "2026-08-20T20:00:00",
    pickupLocation: "Mumbai",
    dropLocation: "Nashik",
    totalAmount: 12000,
    status: "completed",
  },
  {
    id: "trip-conflict-1",
    tripCode: "TRP-0004",
    customerId: "customer-1",
    vehicleId: "vehicle-1",
    driverId: "driver-1",
    startDateTime: "2026-08-15T10:00:00",
    endDateTime: "2026-08-15T14:00:00",
    pickupLocation: "Pune",
    dropLocation: "Mumbai",
    totalAmount: 15000,
    status: "confirmed",
  },
  {
    id: "trip-unassigned",
    tripCode: "TRP-0005",
    customerId: "customer-2",
    vehicleId: null,
    driverId: null,
    startDateTime: "2026-08-15T09:00:00",
    endDateTime: "2026-08-15T17:00:00",
    pickupLocation: "Nashik",
    dropLocation: "Thane",
    totalAmount: 10000,
    status: "draft",
  },
];

describe("TripCalendar - Workspace & Views", () => {
  const onSelectTrip = vi.fn();
  const onEditTrip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders calendar header with title and planning subtitle", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    expect(screen.getByText("Trip Calendar")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Plan trips, resource schedules and operational conflicts.",
      ),
    ).toBeInTheDocument();
  });

  it("defaults to Week view for transport operations planning", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Week view" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Aug 9 – 15, 2026")).toBeInTheDocument();
  });

  it("renders Schedule Health summary metrics", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    expect(screen.getByText("Schedule Health")).toBeInTheDocument();
    expect(screen.getByText("Scheduled Today")).toBeInTheDocument();
    expect(screen.getAllByText("In Progress").length).toBeGreaterThan(0);
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
    expect(screen.getByText("Conflicts")).toBeInTheDocument();
  });

  it("detects and highlights scheduling conflicts in Needs Attention banner", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
        onEditTrip={onEditTrip}
      />,
    );

    expect(screen.getByText("Needs Operational Attention")).toBeInTheDocument();
    expect(screen.getAllByText(/schedule conflicts/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/unassigned trips/).length).toBeGreaterThan(0);
  });

  it("calls onSelectTrip when clicking trip in Week view", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    const tripPills = screen.getAllByText("TRP-0001");
    fireEvent.click(tripPills[0]);

    expect(onSelectTrip).toHaveBeenCalledWith(trips[0]);
  });

  it("switches to Day view and displays chronological dispatch timeline", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Day view" }));

    expect(screen.getByText(/Day Dispatch Timeline/)).toBeInTheDocument();
    expect(screen.getByText("Active / In Progress")).toBeInTheDocument();
    expect(screen.getByText("Upcoming Today")).toBeInTheDocument();
  });

  it("switches to Month view and displays 42-day matrix", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Month view" }));

    expect(screen.getByText("August 2026")).toBeInTheDocument();
    expect(screen.getByText("Sun")).toBeInTheDocument();
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Sat")).toBeInTheDocument();
  });

  it("opens selected day details panel when a month day cell is clicked", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        initialView="month"
        onSelectTrip={onSelectTrip}
      />,
    );

    const tripPills = screen.getAllByText("TRP-0001");
    const dayButton = tripPills[0].closest("button");
    fireEvent.click(dayButton);

    expect(screen.getByText(/Trips for .*15.*August 2026/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Close Details" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close Details" }));
    expect(
      screen.queryByText(/Trips for .*15.*August 2026/),
    ).not.toBeInTheDocument();
  });

  it("switches to Vehicles resource schedule view", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "View Vehicles Schedule" }),
    );

    expect(screen.getAllByText("MH20AB1234").length).toBeGreaterThan(0);
    expect(screen.getAllByText("MH20CD5678").length).toBeGreaterThan(0);
  });

  it("switches to Drivers resource schedule view", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "View Drivers Schedule" }),
    );

    expect(screen.getAllByText("Rajesh Patil").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Amit Sharma").length).toBeGreaterThan(0);
  });

  it("filters trips using search bar", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    const searchInput = screen.getByLabelText("Search trips");
    fireEvent.change(searchInput, { target: { value: "TRP-0001" } });

    expect(screen.getAllByText("TRP-0001").length).toBeGreaterThan(0);
  });

  it("filters by status dropdown", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    const statusSelect = screen.getByLabelText("Filter by status");
    fireEvent.change(statusSelect, { target: { value: "draft" } });

    expect(screen.getAllByText("TRP-0005").length).toBeGreaterThan(0);
  });

  it("supports date navigation with previous and next buttons", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        initialView="week"
        onSelectTrip={onSelectTrip}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next week" }));
    expect(screen.getByText("Aug 16 – 22, 2026")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
    expect(screen.getByText("Aug 9 – 15, 2026")).toBeInTheDocument();
  });

  it("supports clicking metric card in Schedule Health to filter", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    const conflictMetric = screen.getByLabelText(/Conflicts:/i);
    fireEvent.click(conflictMetric);

    expect(screen.getByText("Clear Metric Filter")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Clear Metric Filter"));
    expect(screen.queryByText("Clear Metric Filter")).not.toBeInTheDocument();
  });

  it("shows loading indicator when isLoading is true", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        isLoading={true}
        onSelectTrip={onSelectTrip}
      />,
    );

    expect(
      screen.getByText("Loading operational calendar data..."),
    ).toBeInTheDocument();
  });

  it("allows assigning fleet on unassigned trip in Needs Attention section", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
        onEditTrip={onEditTrip}
      />,
    );

    const assignButtons = screen.getAllByRole("button", {
      name: "Assign Fleet",
    });
    expect(assignButtons.length).toBeGreaterThan(0);
    fireEvent.click(assignButtons[0]);

    expect(onEditTrip).toHaveBeenCalled();
  });
});
