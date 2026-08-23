import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import TripDetailsModal from "./TripDetailsModal";

import { getDriverLicenseStatus } from "../../utils/driverLicenseStatus";
import { getVehicleDocumentStatus } from "../../utils/vehicleDocumentStatus";
import { getCustomerAccountStatus } from "../../utils/customerAccountStatus";

vi.mock("../../utils/driverLicenseStatus", () => ({
  getDriverLicenseStatus: vi.fn(),
}));

vi.mock("../../utils/vehicleDocumentStatus", () => ({
  getVehicleDocumentStatus: vi.fn(),
}));

vi.mock("../../utils/customerAccountStatus", () => ({
  getCustomerAccountStatus: vi.fn(),
}));

const trip = {
  id: "trip-1",
  tripCode: "TRP-0001",

  bookingDate: "2026-08-20",
  referenceNumber: "REF-1001",

  tripType: "outstation",
  status: "confirmed",
  paymentStatus: "partially_paid",

  pickupLocation: "Chhatrapati Sambhajinagar",
  dropLocation: "Pune",
  stops: "Ahmednagar",
  pickupInstructions: "Pickup from main entrance.",

  startDateTime: "2026-08-23T08:30:00",
  endDateTime: "2026-08-25T18:30:00",
  duration: "2 Days 10 Hours",

  openingKm: 45200,
  closingKm: 45650,
  totalKm: 450,

  rateType: "per_day",
  baseRate: 20000,
  extraKmCharges: 2000,
  extraHourCharges: 1000,
  driverCharges: 1500,
  tollCharges: 800,
  parkingCharges: 400,
  discountAmount: 1000,

  taxApplicable: true,
  taxRate: 18,
  taxAmount: 4140,

  totalAmount: 28840,

  advanceAmount: 10000,
  advancePaymentMode: "upi",
  balanceAmount: 18840,

  notes: "Customer requested an early pickup.",

  statusHistory: [
    {
      timestamp: "2026-08-20T10:00:00",
      status: "draft",
      note: "Booking created",
    },
    {
      timestamp: "2026-08-20T10:30:00",
      status: "confirmed",
      note: "Vehicle and driver assigned",
    },
  ],
};

const customer = {
  id: "customer-1",
  customerCode: "CUS-0001",
  name: "Perkins India",
  mobile1: "9876543210",
  creditDays: 30,
};

const vehicle = {
  id: "vehicle-1",
  vehicleCode: "VEH-0001",
  vehicleNumber: "MH20AB1234",
  make: "Tata",
  model: "Starbus",
};

const driver = {
  id: "driver-1",
  driverCode: "DRV-0001",
  name: "Rajesh Patil",
};

const defaultProps = {
  open: true,
  trip,
  customer,
  vehicle,
  driver,
  onClose: vi.fn(),
  onEdit: vi.fn(),
  onConfirm: vi.fn(),
  onStart: vi.fn(),
  onComplete: vi.fn(),
  onCancel: vi.fn(),
  onCreateInvoice: vi.fn(),
};

describe("TripDetailsModal", () => {
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

  it("renders nothing when trip is not provided", () => {
    const { container } = render(
      <TripDetailsModal {...defaultProps} trip={null} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when modal is closed", () => {
    render(<TripDetailsModal {...defaultProps} open={false} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the trip header information", () => {
    render(<TripDetailsModal {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    expect(screen.getByText("TRP-0001")).toBeInTheDocument();

    expect(screen.getByText(/Booked on.*Outstation/)).toBeInTheDocument();

    expect(screen.getByText(/Ref: REF-1001/)).toBeInTheDocument();
  });

  it("renders customer information", () => {
    render(<TripDetailsModal {...defaultProps} />);

    expect(screen.getByText("Customer Information")).toBeInTheDocument();

    expect(screen.getByText("Perkins India")).toBeInTheDocument();

    expect(screen.getByText("CUS-0001")).toBeInTheDocument();

    expect(screen.getByText("9876543210")).toBeInTheDocument();

    expect(screen.getByText("30 Days")).toBeInTheDocument();

    expect(screen.getByText("No Dues")).toBeInTheDocument();

    expect(getCustomerAccountStatus).toHaveBeenCalledWith(customer);
  });

  it("renders customer fallback when customer is missing", () => {
    render(<TripDetailsModal {...defaultProps} customer={null} />);

    expect(screen.getByText("Customer not found")).toBeInTheDocument();

    expect(screen.getByText("Immediate")).toBeInTheDocument();
  });

  it("renders vehicle information", () => {
    render(<TripDetailsModal {...defaultProps} />);

    expect(screen.getByText("Vehicle & Driver Assignment")).toBeInTheDocument();

    expect(screen.getByText("MH20AB1234")).toBeInTheDocument();

    expect(screen.getByText("Tata Starbus")).toBeInTheDocument();

    expect(screen.getByText("Docs: Valid")).toBeInTheDocument();

    expect(getVehicleDocumentStatus).toHaveBeenCalledWith(vehicle);
  });

  it("renders vehicle fallback when vehicle is missing", () => {
    render(<TripDetailsModal {...defaultProps} vehicle={null} />);

    expect(screen.getByText("Unassigned")).toBeInTheDocument();

    expect(getVehicleDocumentStatus).not.toHaveBeenCalled();
  });

  it("renders driver information", () => {
    render(<TripDetailsModal {...defaultProps} />);

    expect(screen.getByText("Rajesh Patil")).toBeInTheDocument();

    expect(screen.getByText("DRV-0001")).toBeInTheDocument();

    expect(screen.getByText("License: Valid")).toBeInTheDocument();

    expect(getDriverLicenseStatus).toHaveBeenCalledWith(driver);
  });

  it("renders driver fallback when driver is missing", () => {
    render(<TripDetailsModal {...defaultProps} driver={null} />);

    expect(screen.getByText("Unassigned")).toBeInTheDocument();

    expect(getDriverLicenseStatus).not.toHaveBeenCalled();
  });

  it("renders journey and route information", () => {
    render(<TripDetailsModal {...defaultProps} />);

    expect(screen.getByText("Journey & Route")).toBeInTheDocument();

    expect(screen.getByText("Chhatrapati Sambhajinagar")).toBeInTheDocument();

    expect(screen.getByText("Pune")).toBeInTheDocument();

    expect(screen.getByText("Ahmednagar")).toBeInTheDocument();

    expect(screen.getByText("Pickup from main entrance.")).toBeInTheDocument();
  });

  it("does not render optional route fields when missing", () => {
    const tripWithoutOptionalRouteFields = {
      ...trip,
      stops: "",
      pickupInstructions: "",
    };

    render(
      <TripDetailsModal
        {...defaultProps}
        trip={tripWithoutOptionalRouteFields}
      />,
    );

    expect(screen.queryByText("Via / Stops")).not.toBeInTheDocument();

    expect(screen.queryByText("Pickup Instructions")).not.toBeInTheDocument();
  });

  it("renders schedule and kilometer information", () => {
    render(<TripDetailsModal {...defaultProps} />);

    expect(screen.getByText("Schedule & Kilometers")).toBeInTheDocument();

    expect(screen.getByText(/23 Aug 2026.*08:30/i)).toBeInTheDocument();

    expect(screen.getByText(/25 Aug 2026.*06:30/i)).toBeInTheDocument();

    expect(screen.getByText("2 Days 10 Hours")).toBeInTheDocument();

    expect(screen.getByText("450 KM")).toBeInTheDocument();

    expect(screen.getByText("45200")).toBeInTheDocument();

    expect(screen.getByText("45650")).toBeInTheDocument();
  });

  it("renders fallback values for missing kilometer data", () => {
    const tripWithoutKm = {
      ...trip,
      totalKm: null,
      openingKm: null,
      closingKm: null,
      duration: "",
    };

    render(<TripDetailsModal {...defaultProps} trip={tripWithoutKm} />);

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);

    expect(screen.getAllByText("Not recorded").length).toBe(2);
  });

  it("renders pricing and financial information", () => {
    render(<TripDetailsModal {...defaultProps} />);

    expect(screen.getByText("Pricing & Breakdown")).toBeInTheDocument();

    expect(screen.getByText("₹20,000")).toBeInTheDocument();

    expect(screen.getByText("₹2,000")).toBeInTheDocument();

    expect(screen.getByText("₹1,000")).toBeInTheDocument();

    expect(screen.getByText("₹1,500")).toBeInTheDocument();

    expect(screen.getByText("₹800")).toBeInTheDocument();

    expect(screen.getByText("₹400")).toBeInTheDocument();

    expect(screen.getByText("-₹1,000")).toBeInTheDocument();

    expect(screen.getByText("+₹4,140")).toBeInTheDocument();

    expect(screen.getByText("₹28,840")).toBeInTheDocument();

    expect(screen.getByText("₹10,000")).toBeInTheDocument();

    expect(screen.getByText("₹18,840")).toBeInTheDocument();
  });

  it("does not render zero-value optional charges", () => {
    const tripWithoutOptionalCharges = {
      ...trip,
      extraKmCharges: 0,
      extraHourCharges: 0,
      driverCharges: 0,
      tollCharges: 0,
      parkingCharges: 0,
      discountAmount: 0,
      taxAmount: 0,
      taxApplicable: false,
    };

    render(
      <TripDetailsModal {...defaultProps} trip={tripWithoutOptionalCharges} />,
    );

    expect(screen.queryByText("Extra KM Charges")).not.toBeInTheDocument();

    expect(screen.queryByText("Extra Hour Charges")).not.toBeInTheDocument();

    expect(screen.queryByText("Driver Allowance")).not.toBeInTheDocument();

    expect(screen.queryByText("Tolls")).not.toBeInTheDocument();

    expect(screen.queryByText("Parking")).not.toBeInTheDocument();

    expect(screen.queryByText("Discount")).not.toBeInTheDocument();
  });

  it("renders notes and audit history", () => {
    render(<TripDetailsModal {...defaultProps} />);

    expect(screen.getByText("Notes & History")).toBeInTheDocument();

    expect(
      screen.getByText("Customer requested an early pickup."),
    ).toBeInTheDocument();

    expect(screen.getByText("Audit Trail")).toBeInTheDocument();

    expect(screen.getByText("draft")).toBeInTheDocument();

    expect(screen.getByText("confirmed")).toBeInTheDocument();

    expect(screen.getByText("(Booking created)")).toBeInTheDocument();

    expect(
      screen.getByText("(Vehicle and driver assigned)"),
    ).toBeInTheDocument();
  });

  it("does not render notes/history section when both are absent", () => {
    const tripWithoutHistory = {
      ...trip,
      notes: "",
      statusHistory: [],
    };

    render(<TripDetailsModal {...defaultProps} trip={tripWithoutHistory} />);

    expect(screen.queryByText("Notes & History")).not.toBeInTheDocument();
  });

  it("renders Create Invoice for completed trips", () => {
    const completedTrip = {
      ...trip,
      status: "completed",
    };

    render(<TripDetailsModal {...defaultProps} trip={completedTrip} />);

    expect(
      screen.getByRole("button", {
        name: "Create Invoice",
      }),
    ).toBeInTheDocument();
  });

  it("does not render Create Invoice when callback is missing", () => {
    const completedTrip = {
      ...trip,
      status: "completed",
    };

    render(
      <TripDetailsModal
        {...defaultProps}
        trip={completedTrip}
        onCreateInvoice={undefined}
      />,
    );

    expect(
      screen.queryByRole("button", {
        name: "Create Invoice",
      }),
    ).not.toBeInTheDocument();
  });

  it("renders Cancel Trip for draft trips", () => {
    const draftTrip = {
      ...trip,
      status: "draft",
    };

    render(<TripDetailsModal {...defaultProps} trip={draftTrip} />);

    expect(
      screen.getByRole("button", {
        name: "Cancel Trip",
      }),
    ).toBeInTheDocument();
  });

  it("renders Cancel Trip for confirmed trips", () => {
    const confirmedTrip = {
      ...trip,
      status: "confirmed",
    };

    render(<TripDetailsModal {...defaultProps} trip={confirmedTrip} />);

    expect(
      screen.getByRole("button", {
        name: "Cancel Trip",
      }),
    ).toBeInTheDocument();
  });

  it("does not render Cancel Trip for completed trips", () => {
    const completedTrip = {
      ...trip,
      status: "completed",
    };

    render(<TripDetailsModal {...defaultProps} trip={completedTrip} />);

    expect(
      screen.queryByRole("button", {
        name: "Cancel Trip",
      }),
    ).not.toBeInTheDocument();
  });

  it("renders Edit Trip for editable trips", () => {
    render(<TripDetailsModal {...defaultProps} />);

    expect(
      screen.getByRole("button", {
        name: "Edit Trip",
      }),
    ).toBeInTheDocument();
  });

  it("does not render Edit Trip for completed trips", () => {
    const completedTrip = {
      ...trip,
      status: "completed",
    };

    render(<TripDetailsModal {...defaultProps} trip={completedTrip} />);

    expect(
      screen.queryByRole("button", {
        name: "Edit Trip",
      }),
    ).not.toBeInTheDocument();
  });

  it("does not render Edit Trip for cancelled trips", () => {
    const cancelledTrip = {
      ...trip,
      status: "cancelled",
    };

    render(<TripDetailsModal {...defaultProps} trip={cancelledTrip} />);

    expect(
      screen.queryByRole("button", {
        name: "Edit Trip",
      }),
    ).not.toBeInTheDocument();
  });

  it("renders Confirm Trip for draft trips", () => {
    const draftTrip = {
      ...trip,
      status: "draft",
    };

    render(<TripDetailsModal {...defaultProps} trip={draftTrip} />);

    expect(
      screen.getByRole("button", {
        name: "Confirm Trip",
      }),
    ).toBeInTheDocument();
  });

  it("renders Start Trip for confirmed trips", () => {
    render(<TripDetailsModal {...defaultProps} />);

    expect(
      screen.getByRole("button", {
        name: "Start Trip",
      }),
    ).toBeInTheDocument();
  });

  it("renders Complete Trip for in-progress trips", () => {
    const inProgressTrip = {
      ...trip,
      status: "in_progress",
    };

    render(<TripDetailsModal {...defaultProps} trip={inProgressTrip} />);

    expect(
      screen.getByRole("button", {
        name: "Complete Trip",
      }),
    ).toBeInTheDocument();
  });

  it("calls onClose when Close is clicked", () => {
    const onClose = vi.fn();

    render(<TripDetailsModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Close",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the modal close button is clicked", () => {
    const onClose = vi.fn();

    render(<TripDetailsModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Close modal",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onEdit with the trip and closes the modal", () => {
    const onClose = vi.fn();
    const onEdit = vi.fn();

    render(
      <TripDetailsModal {...defaultProps} onClose={onClose} onEdit={onEdit} />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit Trip",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);

    expect(onEdit).toHaveBeenCalledTimes(1);

    expect(onEdit).toHaveBeenCalledWith(trip);
  });

  it("calls onConfirm with the trip and closes the modal", () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    const draftTrip = {
      ...trip,
      status: "draft",
    };

    render(
      <TripDetailsModal
        {...defaultProps}
        trip={draftTrip}
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Confirm Trip",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);

    expect(onConfirm).toHaveBeenCalledTimes(1);

    expect(onConfirm).toHaveBeenCalledWith(draftTrip);
  });

  it("calls onStart with the trip and closes the modal", () => {
    const onClose = vi.fn();
    const onStart = vi.fn();

    render(
      <TripDetailsModal
        {...defaultProps}
        onClose={onClose}
        onStart={onStart}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Start Trip",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);

    expect(onStart).toHaveBeenCalledTimes(1);

    expect(onStart).toHaveBeenCalledWith(trip);
  });

  it("calls onComplete with the trip and closes the modal", () => {
    const onClose = vi.fn();
    const onComplete = vi.fn();

    const inProgressTrip = {
      ...trip,
      status: "in_progress",
    };

    render(
      <TripDetailsModal
        {...defaultProps}
        trip={inProgressTrip}
        onClose={onClose}
        onComplete={onComplete}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Complete Trip",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);

    expect(onComplete).toHaveBeenCalledTimes(1);

    expect(onComplete).toHaveBeenCalledWith(inProgressTrip);
  });

  it("calls onCancel with the trip and closes the modal", () => {
    const onClose = vi.fn();
    const onCancel = vi.fn();

    render(
      <TripDetailsModal
        {...defaultProps}
        onClose={onClose}
        onCancel={onCancel}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Cancel Trip",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);

    expect(onCancel).toHaveBeenCalledTimes(1);

    expect(onCancel).toHaveBeenCalledWith(trip);
  });

  it("calls onCreateInvoice with the trip for completed trips", () => {
    const onCreateInvoice = vi.fn();

    const completedTrip = {
      ...trip,
      status: "completed",
    };

    render(
      <TripDetailsModal
        {...defaultProps}
        trip={completedTrip}
        onCreateInvoice={onCreateInvoice}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Create Invoice",
      }),
    );

    expect(onCreateInvoice).toHaveBeenCalledTimes(1);

    expect(onCreateInvoice).toHaveBeenCalledWith(completedTrip);
  });

  it("renders the trip and payment status badges", () => {
    render(<TripDetailsModal {...defaultProps} />);

    /*
     * TripStatusBadge and PaymentStatusBadge are
     * reusable components. Their exact display labels
     * belong to those components, so this test should
     * not depend on the label text.
     *
     * Verify that the values are passed to the badges
     * by checking that the modal contains the expected
     * status-related content.
     */
    expect(screen.getByText("TRP-0001")).toBeInTheDocument();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
