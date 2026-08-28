import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TripDetailsModal from "./TripDetailsModal";

vi.mock("../../utils/driverLicenseStatus", () => ({
  getDriverLicenseStatus: vi.fn(),
}));

vi.mock("../../utils/vehicleDocumentStatus", () => ({
  getVehicleDocumentStatus: vi.fn(),
}));

vi.mock("../../utils/customerAccountStatus", () => ({
  getCustomerAccountStatus: vi.fn(),
}));

import { getDriverLicenseStatus } from "../../utils/driverLicenseStatus";
import { getVehicleDocumentStatus } from "../../utils/vehicleDocumentStatus";
import { getCustomerAccountStatus } from "../../utils/customerAccountStatus";

describe("TripDetailsModal", () => {
  const vehicle = {
    id: "vehicle-1",
    vehicleCode: "VEH-0001",
    vehicleNumber: "MH-12-AB-1234",
    vehicleType: "Truck",
    make: "Tata",
    model: "Prima",
  };

  const driver = {
    id: "driver-1",
    driverCode: "DRV-0001",
    name: "Rajesh Kumar",
    phone: "+91 9876543210",
    licenseNumber: "MH123456789",
  };

  const customer = {
    id: "customer-1",
    customerCode: "CUS-0001",
    name: "Tata Motors Fleet",
    companyName: "Tata Motors Limited",
    mobile1: "+91 9876500000",
    email: "fleet@tatamotors.com",
    creditDays: 30,
  };

  const defaultProps = {
    open: true,
    onClose: vi.fn(),

    trip: {
      id: "trip-1",
      tripCode: "TRP-2026-001",

      bookingDate: "2026-08-20",
      referenceNumber: "REF-1001",

      tripType: "outstation",
      status: "completed",
      paymentStatus: "unpaid",

      startDateTime: "2026-08-05T09:00:00",
      endDateTime: "2026-08-05T18:00:00",
      duration: "1 Day",

      pickupLocation: "Pune",
      dropLocation: "Mumbai",
      stops: "",
      pickupInstructions: "",

      openingKm: 45200,
      closingKm: 45650,
      totalKm: 450,

      rateType: "per_day",
      baseRate: 10000,
      extraKmCharges: 0,
      extraHourCharges: 0,
      driverCharges: 0,
      tollCharges: 500,
      parkingCharges: 200,
      discountAmount: 0,

      taxApplicable: true,
      taxRate: 18,
      taxAmount: 1926,

      totalAmount: 12626,

      advanceAmount: 0,
      advancePaymentMode: "",
      balanceAmount: 12626,

      notes: "",

      statusHistory: [],
    },

    customer,
    vehicle,
    driver,

    onViewCustomer: vi.fn(),
    onViewVehicle: vi.fn(),
    onViewDriver: vi.fn(),

    onEdit: vi.fn(),
    onConfirm: vi.fn(),
    onStart: vi.fn(),
    onComplete: vi.fn(),
    onCancel: vi.fn(),
    onCreateInvoice: vi.fn(),
    onViewInvoice: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    getCustomerAccountStatus.mockReturnValue({
      value: "no_dues",
      label: "No Dues",
    });

    getVehicleDocumentStatus.mockReturnValue({
      value: "valid",
      label: "Valid",
      summary: "Vehicle documents are valid.",
    });

    getDriverLicenseStatus.mockReturnValue({
      value: "valid",
      label: "Valid",
      message: "Driving license is valid.",
    });
  });

  it("renders the modal when open", () => {
    render(<TripDetailsModal {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    render(<TripDetailsModal {...defaultProps} open={false} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not render when trip is not provided", () => {
    const { container } = render(
      <TripDetailsModal {...defaultProps} trip={null} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders trip header information", () => {
    render(<TripDetailsModal {...defaultProps} />);

    expect(screen.getByText("TRP-2026-001")).toBeInTheDocument();
    expect(screen.getByText(/Booked on/i)).toBeInTheDocument();
    expect(screen.getByText(/Ref: REF-1001/i)).toBeInTheDocument();
  });

  it("renders customer information", () => {
    render(<TripDetailsModal {...defaultProps} />);

    expect(screen.getByText("Customer Information")).toBeInTheDocument();

    expect(screen.getByText("Tata Motors Fleet")).toBeInTheDocument();
    expect(screen.getByText(/CUS-0001/)).toBeInTheDocument();
    expect(screen.getByText("+91 9876500000")).toBeInTheDocument();

    expect(getCustomerAccountStatus).toHaveBeenCalledWith(customer);
  });

  it("calls onViewCustomer when customer View is clicked", () => {
    const onViewCustomer = vi.fn();

    render(
      <TripDetailsModal {...defaultProps} onViewCustomer={onViewCustomer} />,
    );

    const customerName = screen.getByText("Tata Motors Fleet");

    const customerCard = customerName.closest(".rounded-xl");

    expect(customerCard).not.toBeNull();

    const viewButton = within(customerCard).getByRole("button", {
      name: "View",
    });

    fireEvent.click(viewButton);

    expect(onViewCustomer).toHaveBeenCalledTimes(1);
    expect(onViewCustomer).toHaveBeenCalledWith(customer);
  });

  it("renders vehicle information", () => {
    render(<TripDetailsModal {...defaultProps} />);

    expect(screen.getByText("Vehicle & Driver Assignment")).toBeInTheDocument();

    expect(screen.getByText("MH-12-AB-1234")).toBeInTheDocument();
    expect(screen.getByText("Tata Prima")).toBeInTheDocument();
    expect(screen.getByText(/VEH-0001/)).toBeInTheDocument();

    expect(screen.getByText("Assigned")).toBeInTheDocument();
    expect(screen.getByText("Docs: Valid")).toBeInTheDocument();

    expect(getVehicleDocumentStatus).toHaveBeenCalledWith(vehicle);
  });

  it("calls onViewVehicle when vehicle View is clicked", () => {
    const onViewVehicle = vi.fn();

    render(
      <TripDetailsModal {...defaultProps} onViewVehicle={onViewVehicle} />,
    );

    const vehicleHeading = screen.getByText("Vehicle & Driver Assignment");

    const vehicleCard = vehicleHeading.closest(".rounded-xl");

    expect(vehicleCard).not.toBeNull();

    const viewButton = within(vehicleCard).getByRole("button", {
      name: "View",
    });

    fireEvent.click(viewButton);

    expect(onViewVehicle).toHaveBeenCalledTimes(1);
    expect(onViewVehicle).toHaveBeenCalledWith(vehicle);
  });

  it("does not render vehicle View action when onViewVehicle is not provided", () => {
    render(<TripDetailsModal {...defaultProps} onViewVehicle={undefined} />);

    // Vehicle information itself should still be visible.
    expect(screen.getByText("MH-12-AB-1234")).toBeInTheDocument();

    const vehicleHeading = screen.getByText("Vehicle & Driver Assignment");

    const vehicleCard = vehicleHeading.closest(".rounded-xl");

    expect(vehicleCard).not.toBeNull();

    // Only check inside the vehicle card because the customer and
    // driver cards may still contain their own View buttons.
    expect(
      within(vehicleCard).queryByRole("button", {
        name: "View",
      }),
    ).not.toBeInTheDocument();
  });

  it("renders driver information", () => {
    render(<TripDetailsModal {...defaultProps} />);

    expect(screen.getByText("Driver")).toBeInTheDocument();
    expect(screen.getByText("Rajesh Kumar")).toBeInTheDocument();
    expect(screen.getByText("DRV-0001")).toBeInTheDocument();

    expect(getDriverLicenseStatus).toHaveBeenCalledWith(driver);
  });

  it("calls onViewDriver when driver View is clicked", () => {
    const onViewDriver = vi.fn();

    render(<TripDetailsModal {...defaultProps} onViewDriver={onViewDriver} />);

    const driverName = screen.getByText("Rajesh Kumar");

    const driverCard = driverName.closest(".rounded-xl");

    expect(driverCard).not.toBeNull();

    const viewButton = within(driverCard).getByRole("button", {
      name: "View",
    });

    fireEvent.click(viewButton);

    expect(onViewDriver).toHaveBeenCalledTimes(1);
    expect(onViewDriver).toHaveBeenCalledWith(driver);
  });

  it("does not render driver View action when onViewDriver is not provided", () => {
    render(<TripDetailsModal {...defaultProps} onViewDriver={undefined} />);

    // Driver information should still be rendered.
    expect(screen.getByText("Rajesh Kumar")).toBeInTheDocument();

    const driverCard = screen.getByText("Rajesh Kumar").closest(".rounded-xl");

    expect(driverCard).not.toBeNull();

    expect(
      within(driverCard).queryByRole("button", {
        name: "View",
      }),
    ).not.toBeInTheDocument();
  });

  it("renders the journey and route information", () => {
    render(<TripDetailsModal {...defaultProps} />);

    expect(screen.getByText("Journey & Route")).toBeInTheDocument();
    expect(screen.getByText("Pune")).toBeInTheDocument();
    expect(screen.getByText("Mumbai")).toBeInTheDocument();
  });

  it("renders schedule and kilometer information", () => {
    render(<TripDetailsModal {...defaultProps} />);

    expect(screen.getByText("Schedule & Kilometers")).toBeInTheDocument();

    expect(screen.getByText("450 KM")).toBeInTheDocument();
    expect(screen.getByText("45200")).toBeInTheDocument();
    expect(screen.getByText("45650")).toBeInTheDocument();
    expect(screen.getByText("1 Day")).toBeInTheDocument();
  });

  it("renders fallback values when kilometer data is missing", () => {
    const tripWithoutKm = {
      ...defaultProps.trip,
      totalKm: null,
      openingKm: null,
      closingKm: null,
      duration: "",
    };

    render(<TripDetailsModal {...defaultProps} trip={tripWithoutKm} />);

    expect(screen.getAllByText("Not recorded")).toHaveLength(2);
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders pricing and financial information", () => {
    render(<TripDetailsModal {...defaultProps} />);

    expect(screen.getByText("Pricing & Breakdown")).toBeInTheDocument();

    expect(screen.getByText(/Base Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Tolls/i)).toBeInTheDocument();
    expect(screen.getByText(/Parking/i)).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();

    render(<TripDetailsModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /close modal/i,
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
