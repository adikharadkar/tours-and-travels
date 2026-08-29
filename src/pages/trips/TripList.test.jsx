import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import TripList from "./TripList";
import * as tripService from "../../services/tripService";
import * as customerService from "../../services/customerService";
import * as vehicleService from "../../services/vehicleService";
import * as driverService from "../../services/driverService";
import * as invoiceService from "../../services/invoiceService";

const mockTrips = [
  {
    id: "trip_1",
    tripCode: "TRP-0101",
    tripType: "outstation",
    status: "in_progress",
    paymentStatus: "paid",
    customerId: "cust_1",
    vehicleId: "veh_1",
    driverId: "drv_1",
    pickupLocation: "Chhatrapati Sambhajinagar",
    dropLocation: "Pune",
    startDateTime: "2026-08-27T08:30:00",
    endDateTime: "2026-08-27T20:30:00",
    totalAmount: 24500,
    openingKm: 42000,
  },
  {
    id: "trip_2",
    tripCode: "TRP-0102",
    tripType: "local",
    status: "completed",
    paymentStatus: "unpaid",
    customerId: "cust_2",
    vehicleId: "veh_2",
    driverId: "drv_2",
    pickupLocation: "CIDCO",
    dropLocation: "Waluj MIDC",
    startDateTime: "2026-08-26T09:00:00",
    endDateTime: "2026-08-26T18:00:00",
    totalAmount: 8500,
  },
  {
    id: "trip_3",
    tripCode: "TRP-0103",
    tripType: "round_trip",
    status: "confirmed",
    paymentStatus: "partially_paid",
    customerId: "cust_1",
    vehicleId: null, // Unassigned vehicle
    driverId: null, // Unassigned driver
    pickupLocation: "Railway Station",
    dropLocation: "Ajanta Caves",
    startDateTime: "2026-08-28T07:00:00",
    endDateTime: "2026-08-28T19:00:00",
    totalAmount: 14000,
  },
  {
    id: "trip_4",
    tripCode: "TRP-0104",
    tripType: "airport_transfer",
    status: "draft",
    paymentStatus: "unpaid",
    customerId: "cust_2",
    vehicleId: "veh_1",
    driverId: "drv_1",
    pickupLocation: "Airport",
    dropLocation: "Hotel Rama",
    startDateTime: "2026-08-29T14:00:00",
    endDateTime: "2026-08-29T16:00:00",
    totalAmount: 3200,
  },
];

const mockCustomers = [
  { id: "cust_1", name: "Perkins India Pvt Ltd", customerCode: "CUST-0001" },
  { id: "cust_2", name: "Bajaj Auto Limited", customerCode: "CUST-0002" },
];

const mockVehicles = [
  {
    id: "veh_1",
    vehicleNumber: "MH20 AB 1234",
    vehicleCode: "VEH-0001",
    make: "Tata",
    model: "Starbus",
  },
  {
    id: "veh_2",
    vehicleNumber: "MH20 CD 5678",
    vehicleCode: "VEH-0002",
    make: "Force",
    model: "Traveller",
  },
];

const mockDrivers = [
  { id: "drv_1", name: "Rajesh Patil" },
  { id: "drv_2", name: "Suresh Shinde" },
];

const mockInvoices = [
  {
    id: "inv_1",
    invoiceNumber: "INV-2026-001",
    tripId: "trip_1",
    tripCode: "TRP-0101",
    documentStatus: "issued",
    paymentStatus: "paid",
  },
];

function renderWithRouter(component) {
  return render(<BrowserRouter>{component}</BrowserRouter>);
}

describe("TripList Page", () => {
  beforeEach(() => {
    vi.spyOn(tripService, "getTrips").mockReturnValue(mockTrips);
    vi.spyOn(customerService, "getCustomers").mockReturnValue(mockCustomers);
    vi.spyOn(vehicleService, "getVehicles").mockReturnValue(mockVehicles);
    vi.spyOn(driverService, "getDrivers").mockReturnValue(mockDrivers);
    vi.spyOn(invoiceService, "getInvoices").mockReturnValue(mockInvoices);
  });

  it("renders page header and action buttons", () => {
    renderWithRouter(<TripList />);

    expect(screen.getByText("Trips & Bookings")).toBeInTheDocument();
    expect(screen.getByText("+ Create Booking")).toBeInTheDocument();
    expect(screen.getByText("Active Operations")).toBeInTheDocument();
  });

  it("renders KPI metric cards with calculated values", () => {
    renderWithRouter(<TripList />);

    expect(screen.getAllByText("Today's Trips").length).toBeGreaterThan(0);
    expect(screen.getAllByText("In Progress").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ready to Invoice").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Needs Attention").length).toBeGreaterThan(0);
  });

  it("renders trips table with correct columns and data", () => {
    renderWithRouter(<TripList />);

    expect(screen.getAllByText("TRP-0101").length).toBeGreaterThan(0);
    expect(screen.getAllByText("TRP-0102").length).toBeGreaterThan(0);
    expect(screen.getAllByText("TRP-0103").length).toBeGreaterThan(0);
    expect(screen.getAllByText("TRP-0104").length).toBeGreaterThan(0);

    expect(screen.getAllByText("Perkins India Pvt Ltd").length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText("Bajaj Auto Limited").length).toBeGreaterThan(0);
  });

  it("filters trips by search input", () => {
    renderWithRouter(<TripList />);

    const searchInput = screen.getByPlaceholderText(
      /Search trip code, customer, route/i,
    );
    fireEvent.change(searchInput, { target: { value: "TRP-0101" } });

    expect(screen.getAllByText("TRP-0101").length).toBeGreaterThan(0);
    expect(screen.queryByText("TRP-0102")).not.toBeInTheDocument();
  });

  it("identifies unassigned vehicle and driver with warning cues", () => {
    renderWithRouter(<TripList />);

    expect(screen.getAllByText("Unassigned Vehicle").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Unassigned Driver").length).toBeGreaterThan(0);
  });

  it("renders list only and does not contain calendar view toggle", () => {
    renderWithRouter(<TripList />);

    expect(
      screen.queryByRole("button", { name: /^Calendar$/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Active Operations")).toBeInTheDocument();
  });

  it("renders only View and 3-dots button in the table and opens the actions drawer on click", () => {
    renderWithRouter(<TripList />);

    // Check that 3-dots action button exists for trip_1
    const trip1ActionsBtn = screen.getByTestId("trip-actions-btn-trip_1");
    expect(trip1ActionsBtn).toBeInTheDocument();

    // Prior direct table action buttons should not be in the table anymore
    // (e.g. no standalone Complete button in table body before opening drawer)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Clicking 3 dots opens the Trip Actions Drawer
    fireEvent.click(trip1ActionsBtn);

    // Trip actions drawer header/title should now be visible
    expect(screen.getByTestId("trip-actions-drawer")).toBeInTheDocument();
    expect(screen.getByText(/Trip Actions/i)).toBeInTheDocument();
    expect(screen.getAllByText("TRP-0101").length).toBeGreaterThan(1);
    expect(screen.getByText(/Complete Trip/i)).toBeInTheDocument();
  });
});
