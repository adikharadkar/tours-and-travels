import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import TripForm from "./TripForm";
import * as tripService from "../../services/tripService";
import * as customerService from "../../services/customerService";
import * as vehicleService from "../../services/vehicleService";
import * as driverService from "../../services/driverService";

const mockCustomers = [
  {
    id: "cust_1",
    name: "Acme Logistics Ltd",
    customerCode: "CUST-001",
    mobile1: "9876543210",
    email: "contact@acme.com",
    openingBalance: 5000, // Has pending dues
    creditDays: 30,
    isActive: true,
  },
  {
    id: "cust_2",
    name: "Beta Global Inc",
    customerCode: "CUST-002",
    mobile1: "9123456780",
    email: "info@beta.com",
    openingBalance: 0, // No dues
    creditDays: 15,
    isActive: true,
  },
];

const mockVehicles = [
  {
    id: "veh_1",
    vehicleNumber: "MH 12 AB 1234",
    vehicleCode: "VEH-001",
    make: "Toyota",
    model: "Innova Crysta",
    vehicleType: "suv",
    seatingCapacity: 7,
    insuranceExpiry: "2027-12-31",
    fitnessExpiry: "2027-12-31",
    pucExpiry: "2027-12-31",
    isActive: true,
  },
  {
    id: "veh_2",
    vehicleNumber: "MH 14 DE 5678",
    vehicleCode: "VEH-002",
    make: "Force",
    model: "Urbania",
    vehicleType: "van",
    seatingCapacity: 17,
    insuranceExpiry: "2025-01-01", // Expired
    fitnessExpiry: "2025-01-01",
    pucExpiry: "2025-01-01",
    isActive: true,
  },
];

const mockDrivers = [
  {
    id: "drv_1",
    name: "Rajesh Patil",
    driverCode: "DRV-001",
    mobile: "9822011223",
    dailyRate: 800,
    licenseExpiryDate: "2028-10-15", // Valid
    isActive: true,
  },
  {
    id: "drv_2",
    name: "Suresh Expired",
    driverCode: "DRV-002",
    mobile: "9822099887",
    dailyRate: 700,
    licenseExpiryDate: "2025-01-01", // Expired
    isActive: true,
  },
];

const mockExistingTrip = {
  id: "trp_edit_1",
  tripCode: "TRP-0101",
  bookingDate: "2026-08-27",
  tripType: "outstation",
  status: "confirmed",
  customerId: "cust_1",
  vehicleId: "veh_1",
  driverId: "drv_1",
  referenceNumber: "PO-991",
  pickupLocation: "Mumbai HQ",
  dropLocation: "Pune Plant",
  stops: "Navi Mumbai",
  pickupInstructions: "Gate 2 reporting",
  startDateTime: "2026-08-28T09:00",
  endDateTime: "2026-08-28T18:00",
  openingKm: 45000,
  closingKm: 45350,
  rateType: "per_day",
  baseRate: 6000,
  ratePerDay: 6000,
  driverCharges: 500,
  tollCharges: 300,
  parkingCharges: 100,
  otherCharges: 0,
  discountType: "fixed",
  discountValue: 0,
  taxApplicable: true,
  taxType: "gst_12",
  taxRate: 12,
  advanceAmount: 2000,
  advancePaymentMode: "bank_transfer",
  advancePaymentReference: "UTR12345",
  advancePaymentDate: "2026-08-27",
  notes: "VIP guests",
};

describe("TripForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(customerService, "getCustomers").mockReturnValue(mockCustomers);
    vi.spyOn(vehicleService, "getVehicles").mockReturnValue(mockVehicles);
    vi.spyOn(driverService, "getDrivers").mockReturnValue(mockDrivers);
    vi.spyOn(tripService, "getTrips").mockReturnValue([]);
    vi.spyOn(tripService, "saveTrip").mockImplementation((data) => ({
      ...data,
      id: "trp_created",
      tripCode: "TRP-9999",
    }));
    vi.spyOn(tripService, "updateTrip").mockImplementation((id, data) => ({
      ...data,
      id,
    }));
  });

  const renderNewTripForm = () => {
    return render(
      <MemoryRouter initialEntries={["/trips/new"]}>
        <Routes>
          <Route path="/trips/new" element={<TripForm />} />
          <Route path="/trips" element={<div>Trip List Page</div>} />
        </Routes>
      </MemoryRouter>,
    );
  };

  const renderEditTripForm = (trip = mockExistingTrip) => {
    vi.spyOn(tripService, "getTripById").mockReturnValue(trip);
    return render(
      <MemoryRouter initialEntries={[`/trips/${trip.id}/edit`]}>
        <Routes>
          <Route path="/trips/:tripId/edit" element={<TripForm />} />
          <Route path="/trips" element={<div>Trip List Page</div>} />
        </Routes>
      </MemoryRouter>,
    );
  };

  it("renders Create New Trip header, steps, and default values", () => {
    renderNewTripForm();

    expect(
      screen.getByRole("heading", { name: /Create New Trip \/ Booking/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("TRP-NEW")).toBeInTheDocument();
    expect(screen.getByText("Booking Information")).toBeInTheDocument();
    expect(screen.getByText("Customer")).toBeInTheDocument();
    expect(screen.getByText("Journey & Schedule")).toBeInTheDocument();
    expect(screen.getByText("Vehicle & Driver Assignment")).toBeInTheDocument();
    expect(screen.getByText("Pricing & Charges")).toBeInTheDocument();
    expect(screen.getByText("Advance Payment & Remarks")).toBeInTheDocument();
  });

  it("displays customer snapshot and dues warning when customer with balance is selected", async () => {
    renderNewTripForm();

    const customerSelect = screen.getByLabelText(/Select Customer/i);
    fireEvent.change(customerSelect, { target: { value: "cust_1" } });

    expect(screen.getByText("Acme Logistics Ltd")).toBeInTheDocument();
    expect(screen.getByText("CUST-001")).toBeInTheDocument();
    expect(screen.getByText("9876543210")).toBeInTheDocument();
    expect(screen.getByText(/ACCOUNT: DUE/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Customer currently has pending dues/i),
    ).toBeInTheDocument();
  });

  it("calculates duration and total km correctly", () => {
    renderNewTripForm();

    const startInput = screen.getByLabelText(/Start Date & Time/i);
    const endInput = screen.getByLabelText(/End Date & Time/i);

    fireEvent.change(startInput, { target: { value: "2026-08-28T08:00" } });
    fireEvent.change(endInput, { target: { value: "2026-08-28T18:00" } });

    expect(screen.getByText("10 Hours")).toBeInTheDocument();

    const openKm = screen.getByLabelText(/Opening KM/i);
    const closeKm = screen.getByLabelText(/Closing KM/i);

    fireEvent.change(openKm, { target: { value: "45000" } });
    fireEvent.change(closeKm, { target: { value: "45320" } });

    expect(screen.getByText("320 km")).toBeInTheDocument();
  });

  it("shows vehicle and driver snapshot cards with availability and compliance badges", () => {
    renderNewTripForm();

    const vehicleSelect = screen.getByLabelText(/Assign Vehicle/i);
    fireEvent.change(vehicleSelect, { target: { value: "veh_1" } });

    expect(screen.getByText("Toyota Innova Crysta")).toBeInTheDocument();
    expect(screen.getAllByText(/MH 12 AB 1234/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/7 Seats/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Valid")).toBeInTheDocument();

    const driverSelect = screen.getByLabelText(/Assign Driver/i);
    fireEvent.change(driverSelect, { target: { value: "drv_1" } });

    expect(screen.getByText("Rajesh Patil")).toBeInTheDocument();
    expect(screen.getByText("₹800/day")).toBeInTheDocument();
  });

  it("calculates live financial totals and balance accurately", () => {
    renderNewTripForm();

    const baseRateInput = screen.getByLabelText(/Base Rate \/ Tariff/i);
    fireEvent.change(baseRateInput, { target: { value: "10000" } });

    const toggleBtn = screen.getByRole("button", {
      name: /Show All Fields|Hide Details/i,
    });
    fireEvent.click(toggleBtn);

    const driverAllowance = screen.getByLabelText(/Driver Allowance/i);
    const tollCharges = screen.getByLabelText(/Toll Charges/i);
    fireEvent.change(driverAllowance, { target: { value: "1000" } });
    fireEvent.change(tollCharges, { target: { value: "500" } });

    // Discount
    const discountInput = screen.getByPlaceholderText(/₹ Amount/i);
    fireEvent.change(discountInput, { target: { value: "500" } });

    // Advance
    const advanceInput = screen.getByLabelText(/Advance Amount/i);
    fireEvent.change(advanceInput, { target: { value: "4000" } });

    // Check Grand Total: (10000 + 1000 + 500) - 500 = 11000
    // Advance = 4000 -> Balance Due = 7000
    expect(screen.getByText("₹11,000")).toBeInTheDocument();
    expect(screen.getByText("₹7,000")).toBeInTheDocument();
    expect(screen.getByText(/PARTIALLY PAID/i)).toBeInTheDocument();
  });

  it("updates live booking readiness checklist dynamically", () => {
    renderNewTripForm();

    // Initially Incomplete
    expect(screen.getByText("Incomplete")).toBeInTheDocument();

    // Fill customer
    fireEvent.change(screen.getByLabelText(/Select Customer/i), {
      target: { value: "cust_1" },
    });

    // Fill route
    fireEvent.change(screen.getByLabelText(/Pickup Location/i), {
      target: { value: "Mumbai" },
    });
    fireEvent.change(screen.getByLabelText(/Drop-off Location/i), {
      target: { value: "Pune" },
    });

    // Fill vehicle and driver
    fireEvent.change(screen.getByLabelText(/Assign Vehicle/i), {
      target: { value: "veh_1" },
    });
    fireEvent.change(screen.getByLabelText(/Assign Driver/i), {
      target: { value: "drv_1" },
    });

    // Pricing base rate is already 5000 by default
    expect(screen.getByText("Ready to Confirm")).toBeInTheDocument();
  });

  it("loads existing trip in Edit mode with title and prefilled values", () => {
    renderEditTripForm();

    expect(
      screen.getByRole("heading", { name: /Edit Trip: TRP-0101/i }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("PO-991")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Mumbai HQ")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Pune Plant")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Navi Mumbai")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Gate 2 reporting")).toBeInTheDocument();
  });

  it("successfully saves as draft and confirms", async () => {
    renderNewTripForm();

    // Fill minimal valid data
    fireEvent.change(screen.getByLabelText(/Select Customer/i), {
      target: { value: "cust_1" },
    });
    fireEvent.change(screen.getByLabelText(/Pickup Location/i), {
      target: { value: "Mumbai Airport" },
    });
    fireEvent.change(screen.getByLabelText(/Drop-off Location/i), {
      target: { value: "Hotel Grand" },
    });
    fireEvent.change(screen.getByLabelText(/Assign Vehicle/i), {
      target: { value: "veh_1" },
    });
    fireEvent.change(screen.getByLabelText(/Assign Driver/i), {
      target: { value: "drv_1" },
    });

    const saveDraftBtn = screen.getByRole("button", { name: "Save Draft" });
    fireEvent.click(saveDraftBtn);

    expect(tripService.saveTrip).toHaveBeenCalledWith(
      expect.objectContaining({
        customerId: "cust_1",
        pickupLocation: "Mumbai Airport",
        dropLocation: "Hotel Grand",
        vehicleId: "veh_1",
        driverId: "drv_1",
        status: "draft",
      }),
    );
  });
});
