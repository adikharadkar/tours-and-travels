import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Calendar from "./Calendar";
import * as tripService from "../services/tripService";
import * as customerService from "../services/customerService";
import * as vehicleService from "../services/vehicleService";
import * as driverService from "../services/driverService";
import * as invoiceService from "../services/invoiceService";

const today = new Date();
const todayStr = today.toISOString().slice(0, 10);

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
    startDateTime: `${todayStr}T08:30:00`,
    endDateTime: `${todayStr}T20:30:00`,
    totalAmount: 24500,
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
    startDateTime: `${todayStr}T09:00:00`,
    endDateTime: `${todayStr}T18:00:00`,
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
    startDateTime: `${todayStr}T07:00:00`,
    endDateTime: `${todayStr}T19:00:00`,
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
    startDateTime: `${todayStr}T14:00:00`, // Overlaps with trip_1 on veh_1 and drv_1 (conflict)
    endDateTime: `${todayStr}T16:00:00`,
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
    makeModel: "Tata Starbus",
  },
  {
    id: "veh_2",
    vehicleNumber: "MH20 CD 5678",
    vehicleCode: "VEH-0002",
    makeModel: "Force Traveller",
  },
];

const mockDrivers = [
  { id: "drv_1", name: "Rajesh Patil", phone: "9876543210" },
  { id: "drv_2", name: "Suresh Shinde", phone: "9876543211" },
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

describe("Dedicated Calendar Workspace Page (/calendar)", () => {
  beforeEach(() => {
    vi.spyOn(tripService, "getTrips").mockReturnValue(mockTrips);
    vi.spyOn(customerService, "getCustomers").mockReturnValue(mockCustomers);
    vi.spyOn(vehicleService, "getVehicles").mockReturnValue(mockVehicles);
    vi.spyOn(driverService, "getDrivers").mockReturnValue(mockDrivers);
    vi.spyOn(invoiceService, "getInvoices").mockReturnValue(mockInvoices);
  });

  it("renders the Calendar header with title and badges", () => {
    renderWithRouter(<Calendar />);

    expect(screen.getByText("Trip Calendar")).toBeInTheDocument();
    expect(
      screen.getByText("Dispatch & Resource Planning"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /View Trips Schedule/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /View Vehicles Schedule/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /View Drivers Schedule/i }),
    ).toBeInTheDocument();
  });

  it("renders Schedule Health summary metric cards", () => {
    renderWithRouter(<Calendar />);

    expect(screen.getByText("Scheduled Today")).toBeInTheDocument();
    expect(screen.getAllByText("In Progress").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Unassigned").length).toBeGreaterThan(0);
    expect(screen.getByText("Conflicts")).toBeInTheDocument();
  });

  it("switches schedule modes to Vehicles and displays vehicle grid", () => {
    renderWithRouter(<Calendar />);

    const vehiclesBtn = screen.getByRole("button", {
      name: /View Vehicles Schedule/i,
    });
    fireEvent.click(vehiclesBtn);

    expect(screen.getAllByText("MH20 AB 1234").length).toBeGreaterThan(0);
    expect(screen.getAllByText("MH20 CD 5678").length).toBeGreaterThan(0);
  });

  it("switches schedule modes to Drivers and displays driver grid", () => {
    renderWithRouter(<Calendar />);

    const driversBtn = screen.getByRole("button", {
      name: /View Drivers Schedule/i,
    });
    fireEvent.click(driversBtn);

    expect(screen.getAllByText("Rajesh Patil").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Suresh Shinde").length).toBeGreaterThan(0);
  });

  it("switches view modes between Day, Week, and Month", () => {
    renderWithRouter(<Calendar />);

    const dayBtn = screen.getByRole("button", { name: /Day view/i });
    fireEvent.click(dayBtn);

    const monthBtn = screen.getByRole("button", { name: /Month view/i });
    fireEvent.click(monthBtn);

    const weekBtn = screen.getByRole("button", { name: /Week view/i });
    fireEvent.click(weekBtn);
  });

  it("displays conflict warnings and unassigned trips in Needs Attention section", () => {
    renderWithRouter(<Calendar />);

    expect(screen.getByText("Needs Operational Attention")).toBeInTheDocument();
  });

  it("opens trip details modal when clicking a trip in the calendar", () => {
    renderWithRouter(<Calendar />);

    const tripCodes = screen.getAllByText("TRP-0101");
    expect(tripCodes.length).toBeGreaterThan(0);

    fireEvent.click(tripCodes[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
