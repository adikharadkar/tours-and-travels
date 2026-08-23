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
  },
  {
    id: "vehicle-2",
    vehicleNumber: "MH20CD5678",
  },
];

const drivers = [
  {
    id: "driver-1",
    name: "Rajesh Patil",
  },
  {
    id: "driver-2",
    name: "Amit Sharma",
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
];

/**
 * Find the calendar day button containing a trip.
 *
 * A multi-day trip appears multiple times, so the
 * occurrence parameter lets us choose which appearance.
 *
 * 0 = first day
 * 1 = second day
 * 2 = third day
 */
const getDayButtonContainingTrip = (tripCode, occurrence = 0) => {
  const tripElements = screen.getAllByText(tripCode);

  const tripElement = tripElements[occurrence];

  if (!tripElement) {
    throw new Error(`Could not find occurrence ${occurrence} of ${tripCode}.`);
  }

  const dayButton = tripElement.closest("button");

  if (!dayButton) {
    throw new Error(
      `Could not find calendar day button containing ${tripCode}.`,
    );
  }

  return dayButton;
};

/**
 * Find a calendar day button by day number.
 *
 * This is mainly used for days that don't contain trips.
 */
const getDayButtonByNumber = (dayNumber) => {
  const buttons = screen.getAllByRole("button");

  const matchingButton = buttons.find((button) => {
    const text = button.textContent?.trim() ?? "";

    return text === String(dayNumber) || text.startsWith(`${dayNumber} `);
  });

  if (!matchingButton) {
    throw new Error(`Could not find calendar day button for day ${dayNumber}.`);
  }

  return matchingButton;
};

describe("TripCalendar", () => {
  const onSelectTrip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the month of the first trip", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    expect(screen.getByText("August 2026")).toBeInTheDocument();
  });

  it("renders days of the week", () => {
    render(
      <TripCalendar
        trips={[]}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    expect(screen.getByText("Sun")).toBeInTheDocument();

    expect(screen.getByText("Mon")).toBeInTheDocument();

    expect(screen.getByText("Tue")).toBeInTheDocument();

    expect(screen.getByText("Wed")).toBeInTheDocument();

    expect(screen.getByText("Thu")).toBeInTheDocument();

    expect(screen.getByText("Fri")).toBeInTheDocument();

    expect(screen.getByText("Sat")).toBeInTheDocument();
  });

  it("renders the first trip on its scheduled date", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    expect(screen.getByText("TRP-0001")).toBeInTheDocument();
  });

  it("renders the trip count for a day with multiple trips", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    const dayButton = getDayButtonContainingTrip("TRP-0002", 0);

    expect(dayButton).toBeInTheDocument();

    expect(dayButton.textContent).toContain("2");
  });

  it("includes a multi-day trip on every day it spans", () => {
    render(
      <TripCalendar
        trips={[trips[1]]}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    expect(screen.getAllByText("TRP-0002")).toHaveLength(3);
  });

  it("selects a day when a calendar day is clicked", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    const dayButton = getDayButtonContainingTrip("TRP-0001");

    fireEvent.click(dayButton);

    expect(screen.getByText(/Trips for .*15.*August 2026/)).toBeInTheDocument();
  });

  it("shows trips in the selected day details panel", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    const dayButton = getDayButtonContainingTrip("TRP-0001");

    fireEvent.click(dayButton);

    expect(screen.getAllByText("TRP-0001").length).toBeGreaterThan(0);

    expect(screen.getAllByText("Perkins India").length).toBeGreaterThan(0);

    expect(
      screen.getByText("Chhatrapati Sambhajinagar → Pune"),
    ).toBeInTheDocument();

    expect(screen.getAllByText("MH20AB1234").length).toBeGreaterThan(0);

    expect(screen.getAllByText("Rajesh Patil").length).toBeGreaterThan(0);

    expect(screen.getByText("₹25,000")).toBeInTheDocument();
  });

  it("shows the empty state for a selected day without trips", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    const dayButton = getDayButtonByNumber(10);

    fireEvent.click(dayButton);

    expect(
      screen.getByText("No trips scheduled for this date."),
    ).toBeInTheDocument();
  });

  it("calls onSelectTrip when a trip pill is clicked", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    fireEvent.click(screen.getByText("TRP-0001"));

    expect(onSelectTrip).toHaveBeenCalledTimes(1);

    expect(onSelectTrip).toHaveBeenCalledWith(trips[0]);
  });

  it("calls onSelectTrip when a trip in the selected-day panel is clicked", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    const dayButton = getDayButtonContainingTrip("TRP-0001");

    fireEvent.click(dayButton);

    onSelectTrip.mockClear();

    const tripElements = screen.getAllByText("TRP-0001");

    /*
     * The last occurrence is the one rendered
     * inside the selected-day panel.
     */
    const detailsTrip = tripElements[tripElements.length - 1];

    fireEvent.click(detailsTrip);

    expect(onSelectTrip).toHaveBeenCalledTimes(1);

    expect(onSelectTrip).toHaveBeenCalledWith(trips[0]);
  });

  it("closes the selected day details panel", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    const dayButton = getDayButtonContainingTrip("TRP-0001");

    fireEvent.click(dayButton);

    expect(screen.getByText(/Trips for .*15.*August 2026/)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Close Details",
      }),
    );

    expect(
      screen.queryByText(/Trips for .*15.*August 2026/),
    ).not.toBeInTheDocument();
  });

  it("navigates to the previous month", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    expect(screen.getByText("August 2026")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Previous month",
      }),
    );

    expect(screen.getByText("July 2026")).toBeInTheDocument();
  });

  it("navigates to the next month", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    expect(screen.getByText("August 2026")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Next month",
      }),
    );

    expect(screen.getByText("September 2026")).toBeInTheDocument();
  });

  it("clears the selected day when navigating months", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    const dayButton = getDayButtonContainingTrip("TRP-0001");

    fireEvent.click(dayButton);

    expect(screen.getByText(/Trips for .*15.*August 2026/)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Next month",
      }),
    );

    expect(
      screen.queryByText(/Trips for .*15.*August 2026/),
    ).not.toBeInTheDocument();
  });

  it("returns to the current month when Today is clicked", () => {
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
      screen.getByRole("button", {
        name: "Next month",
      }),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Today",
      }),
    );

    const today = new Date();

    const expectedMonth = today.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    expect(screen.getByText(expectedMonth)).toBeInTheDocument();
  });

  it("selects today when Today is clicked", () => {
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
      screen.getByRole("button", {
        name: "Today",
      }),
    );

    const today = new Date();

    const expectedDate = today.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    expect(screen.getByText(`Trips for ${expectedDate}`)).toBeInTheDocument();
  });

  it("uses fallback labels when related records cannot be found", () => {
    const tripWithMissingRelations = {
      ...trips[0],
      customerId: "missing-customer",
      vehicleId: "missing-vehicle",
      driverId: "missing-driver",
    };

    render(
      <TripCalendar
        trips={[tripWithMissingRelations]}
        customers={[]}
        vehicles={[]}
        drivers={[]}
        onSelectTrip={onSelectTrip}
      />,
    );

    const dayButton = getDayButtonContainingTrip("TRP-0001");

    fireEvent.click(dayButton);

    expect(screen.getByText("Customer")).toBeInTheDocument();

    expect(screen.getByText("Vehicle")).toBeInTheDocument();

    expect(screen.getByText("Driver")).toBeInTheDocument();
  });

  it("renders the vehicle, driver and amount in the details panel", () => {
    render(
      <TripCalendar
        trips={[trips[0]]}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    const dayButton = getDayButtonContainingTrip("TRP-0001");

    fireEvent.click(dayButton);

    expect(screen.getAllByText("MH20AB1234").length).toBeGreaterThan(0);

    expect(screen.getAllByText("Rajesh Patil").length).toBeGreaterThan(0);

    expect(screen.getByText("₹25,000")).toBeInTheDocument();
  });

  it("renders trips with different statuses in the selected-day panel", () => {
    render(
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        onSelectTrip={onSelectTrip}
      />,
    );

    /*
     * TRP-0002 occurs on August 20, 21 and 22.
     * The first occurrence is August 20, where
     * TRP-0003 is also scheduled.
     */
    const dayButton = getDayButtonContainingTrip("TRP-0002", 0);

    fireEvent.click(dayButton);

    expect(screen.getAllByText("TRP-0002").length).toBeGreaterThan(0);

    expect(screen.getAllByText("TRP-0003").length).toBeGreaterThan(0);
  });
});
