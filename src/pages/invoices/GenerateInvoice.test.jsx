import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import GenerateInvoice from "./GenerateInvoice";

import * as tripService from "../../services/tripService";
import * as customerService from "../../services/customerService";
import * as vehicleService from "../../services/vehicleService";
import * as driverService from "../../services/driverService";
import * as invoiceService from "../../services/invoiceService";

const mockCustomer = {
  id: "cust-1",
  customerCode: "CUST-001",
  name: "Acme Logistics Corp",
  customerType: "company",
  gstin: "27AAACA8902A1Z5",
  pan: "AAACA8902A",
  billingAddress: "123 Supply Chain Blvd, Suite 400",
  billingCity: "Mumbai",
  billingState: "Maharashtra",
  billingPinCode: "400001",
  paymentTerms: "30_days",
};

const mockTrip = {
  id: "trip-1",
  tripCode: "TRP-8821",
  customerId: "cust-1",
  vehicleId: "veh-1",
  driverId: "drv-1",
  status: "completed",
  tripType: "package",
  pickupLocation: "Mumbai (BOM)",
  dropLocation: "Delhi (DEL)",
  startDateTime: "2026-08-20T08:00",
  endDateTime: "2026-08-21T16:00",
  duration: "32 hrs",
  openingKm: 45000,
  closingKm: 46450,
  totalKm: 1450,
  baseRate: 45000,
  extraKmCharges: 1250,
  ratePerKm: 25,
  tollCharges: 3450,
  driverCharges: 1000,
  parkingCharges: 0,
  taxApplicable: true,
  taxRate: 18,
  totalAmount: 50700,
  paymentStatus: "unpaid",
};

const mockVehicle = {
  id: "veh-1",
  vehicleNumber: "MH-01-AB-1234",
  make: "Tata Prima",
};

const mockDriver = {
  id: "drv-1",
  name: "Ramesh Kumar",
};

describe("GenerateInvoice Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(tripService, "getTrips").mockReturnValue([mockTrip]);
    vi.spyOn(tripService, "getTripById").mockReturnValue(mockTrip);

    vi.spyOn(customerService, "getCustomers").mockReturnValue([mockCustomer]);
    vi.spyOn(customerService, "getCustomerById").mockReturnValue(mockCustomer);

    vi.spyOn(vehicleService, "getVehicles").mockReturnValue([mockVehicle]);
    vi.spyOn(vehicleService, "getVehicleById").mockReturnValue(mockVehicle);

    vi.spyOn(driverService, "getDrivers").mockReturnValue([mockDriver]);
    vi.spyOn(driverService, "getDriverById").mockReturnValue(mockDriver);

    vi.spyOn(invoiceService, "getInvoices").mockReturnValue([]);
    vi.spyOn(invoiceService, "saveInvoice").mockImplementation((data) => ({
      ...data,
      id: "inv-created-1",
      invoiceNumber: data.invoiceNumber || "INV-2026-086",
    }));
  });

  const renderComponent = (tripId = "trip-1") => {
    return render(
      <MemoryRouter initialEntries={[`/invoices/generate?tripId=${tripId}`]}>
        <Routes>
          <Route path="/invoices/generate" element={<GenerateInvoice />} />
        </Routes>
      </MemoryRouter>,
    );
  };

  it("renders the main page header, DRAFT badge, and action buttons", async () => {
    renderComponent();

    expect(screen.getByText("Generate Invoice")).toBeInTheDocument();
    expect(screen.getByText("DRAFT")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Save Draft/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Preview/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Issue Invoice/i }),
    ).toBeInTheDocument();
  });

  it("pre-populates Customer Billing Profile and Trip Summary matching Stitch design", async () => {
    renderComponent();

    // Customer card
    expect(screen.getByText("CUSTOMER BILLING PROFILE")).toBeInTheDocument();
    expect(screen.getByText("Acme Logistics Corp")).toBeInTheDocument();
    expect(screen.getByText("27AAACA8902A1Z5")).toBeInTheDocument();

    // Trip card
    expect(screen.getByText("TRIP SUMMARY")).toBeInTheDocument();
    expect(screen.getByText("TRP-8821")).toBeInTheDocument();
    expect(screen.getByText("Mumbai (BOM) → Delhi (DEL)")).toBeInTheDocument();
    expect(screen.getByText("Ramesh Kumar")).toBeInTheDocument();
    expect(screen.getByText("1,450 km")).toBeInTheDocument();
    expect(screen.getByText("32 hrs")).toBeInTheDocument();
  });

  it("populates and calculates billable items and taxes", async () => {
    renderComponent();

    expect(screen.getByText("BILLABLE ITEMS")).toBeInTheDocument();
    expect(screen.getByText("INVOICE SUMMARY")).toBeInTheDocument();

    // Items table should have base package, excess mileage, toll charges, driver allowance
    expect(screen.getByText("Excess Mileage")).toBeInTheDocument();
    expect(screen.getByText("Toll Charges")).toBeInTheDocument();
    expect(screen.getByText("Driver Allowance")).toBeInTheDocument();

    // Summary should show Grand Total
    expect(screen.getByText("Grand Total")).toBeInTheDocument();
    expect(screen.getByText(/Amount in words:/i)).toBeInTheDocument();
  });

  it("displays missing critical info alert banner when customer lacks GSTIN", async () => {
    const customerWithoutGstin = {
      ...mockCustomer,
      gstin: "",
      gstNumber: "",
    };
    vi.spyOn(customerService, "getCustomers").mockReturnValue([
      customerWithoutGstin,
    ]);
    vi.spyOn(customerService, "getCustomerById").mockReturnValue(
      customerWithoutGstin,
    );

    renderComponent();

    expect(
      screen.getByText("Missing Critical Billing Information"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Fix/i })).toBeInTheDocument();
  });

  it("allows saving draft invoice", async () => {
    renderComponent();

    const saveDraftBtn = screen.getByRole("button", { name: /Save Draft/i });
    fireEvent.click(saveDraftBtn);

    await waitFor(() => {
      expect(invoiceService.saveInvoice).toHaveBeenCalled();
    });
  });

  it("opens Preview Modal on clicking preview button", async () => {
    renderComponent();

    const previewBtn = screen.getByRole("button", { name: /Preview/i });
    fireEvent.click(previewBtn);

    expect(screen.getByText("Invoice Preview")).toBeInTheDocument();
    expect(screen.getByText("TAX INVOICE")).toBeInTheDocument();
  });
});
