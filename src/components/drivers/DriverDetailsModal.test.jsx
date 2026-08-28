import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isDriverEligible } from "../../utils/driverLicenseStatus";

import DriverDetailsModal from "./DriverDetailsModal";

vi.mock("../../utils/driverLicenseStatus", () => ({
  getDriverLicenseStatus: vi.fn(() => ({
    value: "valid",
    label: "Valid",
    message: "Driving license is valid.",
  })),
  isDriverEligible: vi.fn(() => true),
}));

describe("DriverDetailsModal", () => {
  const driver = {
    id: "driver-1",
    driverCode: "DRV-0002",
    prefix: "mr",
    name: "Amit Sharma",
    driverType: "contract",
    isActive: true,

    dateOfBirth: "1992-11-20",

    licenseNumber: "MH4320140098765",
    licenseType: "commercial",
    licenseIssueDate: "2014-09-08",
    licenseExpiryDate: "2027-09-08",
    issuingAuthority: "RTO Navi Mumbai (MH-43)",

    mobile: "9823012345",
    alternateMobile: "9876543210",
    email: "amit.sharma92@yahoo.com",
    address: "B-14, Sector 18, Vashi",
    city: "navi_mumbai",
    state: "MH",
    pinCode: "400703",

    joiningDate: "2024-01-15",
    employeeReferenceId: "EMP-002",
    dailyRate: 2500,

    notes: "Experienced commercial driver.",
    createdAt: "2026-01-10T10:30:00",
    updatedAt: "2026-08-20T14:45:00",
  };

  const vehicle = {
    id: "vehicle-1",
    vehicleNumber: "MH-12-AB-1234",
    model: "Prima",
  };

  const activeTrip = {
    id: "trip-active",
    tripCode: "TRP-2026-0100",
    driverId: "driver-1",
    driverName: "Amit Sharma",
    vehicleId: "vehicle-1",
    vehicleNumber: "MH-12-AB-1234",
    status: "in_progress",
    pickupLocation: "Pune",
    dropLocation: "Mumbai",
    startDateTime: "2026-08-29T09:00:00",
  };

  const upcomingTrip = {
    id: "trip-upcoming",
    tripCode: "TRP-2026-0101",
    driverId: "driver-1",
    driverName: "Amit Sharma",
    status: "confirmed",
    pickupLocation: "Mumbai",
    dropLocation: "Nashik",
    startDateTime: "2099-09-10T10:00:00",
  };

  const recentTrip = {
    id: "trip-recent",
    tripCode: "TRP-2026-0099",
    driverId: "driver-1",
    driverName: "Amit Sharma",
    status: "completed",
    pickupLocation: "Pune",
    dropLocation: "Satara",
    startDateTime: "2026-08-20T10:00:00",
  };

  const defaultProps = {
    open: true,
    driver,
    trips: [],
    vehicles: [],
    onClose: vi.fn(),
    onEdit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <MemoryRouter>
        <DriverDetailsModal {...defaultProps} {...props} />
      </MemoryRouter>,
    );
  };

  it("renders the modal when open", () => {
    renderComponent();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Mr\. Amit Sharma/i }),
    ).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    renderComponent({
      open: false,
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not render when driver is missing", () => {
    render(
      <MemoryRouter>
        <DriverDetailsModal {...defaultProps} driver={null} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders driver header information", () => {
    renderComponent();

    expect(
      screen.getByRole("heading", { name: /Mr\. Amit Sharma/i }),
    ).toBeInTheDocument();

    expect(screen.getByText(/ID: DRV-0002/i)).toBeInTheDocument();
    expect(screen.getByText("Fleet Driver Profile")).toBeInTheDocument();

    expect(screen.getAllByText("Active").length).toEqual(2);
    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.getByText("License: Valid")).toBeInTheDocument();
  });

  it("renders the trip assignment status banner", () => {
    renderComponent();

    expect(
      screen.getByText("Trip Assignment Status: Eligible"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Driver is active with a valid driving license."),
    ).toBeInTheDocument();

    expect(screen.getByText("Ready For Trips")).toBeInTheDocument();
  });

  it("renders personal information", () => {
    renderComponent();

    expect(screen.getByText("1. Personal Information")).toBeInTheDocument();

    expect(screen.getByText("Driver Code")).toBeInTheDocument();
    expect(screen.getByText("DRV-0002")).toBeInTheDocument();

    expect(screen.getByText("Driver Name")).toBeInTheDocument();
    expect(screen.getAllByText("Mr. Amit Sharma").length).toBeGreaterThan(0);

    expect(screen.getByText("Date of Birth")).toBeInTheDocument();
    expect(screen.getByText("20/11/1992")).toBeInTheDocument();

    expect(screen.getByText("Master Status")).toBeInTheDocument();
  });

  it("renders driving license information", () => {
    renderComponent();

    expect(
      screen.getByText("2. Driving License Information"),
    ).toBeInTheDocument();

    expect(screen.getByText("License Number")).toBeInTheDocument();
    expect(screen.getByText("MH4320140098765")).toBeInTheDocument();

    expect(screen.getByText("License Type")).toBeInTheDocument();
    expect(screen.getByText("Commercial")).toBeInTheDocument();

    expect(screen.getByText("License Issue Date")).toBeInTheDocument();
    expect(screen.getByText("08/09/2014")).toBeInTheDocument();

    expect(screen.getByText("License Expiry Date")).toBeInTheDocument();
    expect(screen.getByText("08/09/2027")).toBeInTheDocument();

    expect(screen.getByText("Issuing Authority / RTO")).toBeInTheDocument();

    expect(screen.getByText("RTO Navi Mumbai (MH-43)")).toBeInTheDocument();

    expect(screen.getByText("License Status Notice")).toBeInTheDocument();
    expect(screen.getByText("Driving license is valid.")).toBeInTheDocument();
  });

  it("renders contact information", () => {
    renderComponent();

    expect(screen.getByText("3. Contact Information")).toBeInTheDocument();

    expect(screen.getByText("Primary Mobile")).toBeInTheDocument();
    expect(screen.getByText("9823012345")).toBeInTheDocument();

    expect(screen.getByText("Alternate Mobile")).toBeInTheDocument();
    expect(screen.getByText("9876543210")).toBeInTheDocument();

    expect(screen.getByText("Email Address")).toBeInTheDocument();
    expect(screen.getByText("amit.sharma92@yahoo.com")).toBeInTheDocument();

    expect(screen.getByText("Residential Address")).toBeInTheDocument();
    expect(screen.getByText("B-14, Sector 18, Vashi")).toBeInTheDocument();

    expect(screen.getByText("City")).toBeInTheDocument();
    expect(screen.getByText("Navi Mumbai")).toBeInTheDocument();

    expect(screen.getByText("State")).toBeInTheDocument();
    expect(screen.getByText("Maharashtra")).toBeInTheDocument();

    expect(screen.getByText("PIN Code")).toBeInTheDocument();
    expect(screen.getByText("400703")).toBeInTheDocument();
  });

  it("renders employment information", () => {
    renderComponent();

    expect(screen.getByText("4. Employment Information")).toBeInTheDocument();

    expect(screen.getByText("Driver Type")).toBeInTheDocument();
    expect(screen.getByText(/Contract/)).toBeInTheDocument();

    expect(screen.getByText("Joining Date")).toBeInTheDocument();
    expect(screen.getByText("15/01/2024")).toBeInTheDocument();

    expect(screen.getByText("Employee / Reference ID")).toBeInTheDocument();

    expect(screen.getByText("EMP-002")).toBeInTheDocument();

    expect(screen.getByText("Daily Rate")).toBeInTheDocument();
    expect(screen.getByText("₹2,500 / day")).toBeInTheDocument();
  });

  it("renders notes and audit information", () => {
    renderComponent();

    expect(
      screen.getByText("5. Additional Notes & System Audit"),
    ).toBeInTheDocument();

    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(
      screen.getByText("Experienced commercial driver."),
    ).toBeInTheDocument();

    expect(screen.getByText("Record Created")).toBeInTheDocument();
    expect(screen.getByText("Last Updated")).toBeInTheDocument();
  });

  it("renders the available-for-assignment state when there is no active trip", () => {
    renderComponent({
      trips: [],
      vehicles: [],
    });

    expect(screen.getByText("Current Assignment")).toBeInTheDocument();

    expect(screen.getByText("Available for Assignment")).toBeInTheDocument();

    expect(
      screen.getByText("No active trip in progress for this driver."),
    ).toBeInTheDocument();
  });

  it("renders the current assignment when the driver has an active trip", () => {
    renderComponent({
      trips: [activeTrip],
      vehicles: [vehicle],
    });

    expect(screen.getByText("Current Assignment")).toBeInTheDocument();
    expect(screen.getByText("TRP-2026-0100")).toBeInTheDocument();

    expect(screen.getByText("Pune")).toBeInTheDocument();
    expect(screen.getByText("Mumbai")).toBeInTheDocument();

    expect(screen.getByText("Assigned Vehicle")).toBeInTheDocument();

    expect(screen.getByText("MH-12-AB-1234 · Prima")).toBeInTheDocument();

    expect(screen.getByText("in progress")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "View Trip" }),
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Available for Assignment"),
    ).not.toBeInTheDocument();
  });

  it("renders the next upcoming trip", () => {
    renderComponent({
      trips: [upcomingTrip],
      vehicles: [],
    });

    expect(screen.getByText("Next Trip")).toBeInTheDocument();
    expect(screen.getByText("TRP-2026-0101")).toBeInTheDocument();

    expect(screen.getByText(/Mumbai → Nashik/)).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /View Details/ }),
    ).toBeInTheDocument();
  });

  it("renders recent trips", () => {
    renderComponent({
      trips: [recentTrip],
      vehicles: [],
    });

    expect(screen.getByText("Recent Trips")).toBeInTheDocument();
    expect(screen.getByText("TRP-2026-0099")).toBeInTheDocument();

    expect(screen.getByText(/Pune → Satara/)).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "View All" }),
    ).toBeInTheDocument();
  });

  it("calls onClose when the top close button is clicked", () => {
    const onClose = vi.fn();

    renderComponent({
      onClose,
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Close modal",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the footer Close button is clicked", () => {
    const onClose = vi.fn();

    renderComponent({
      onClose,
    });

    const closeButtons = screen.getAllByRole("button", {
      name: "Close",
    });

    expect(closeButtons.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(closeButtons[closeButtons.length - 1]);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when clicking the backdrop", () => {
    const onClose = vi.fn();

    const { container } = renderComponent({
      onClose,
    });

    const backdrop = container.firstElementChild;

    expect(backdrop).toBeInTheDocument();

    fireEvent.mouseDown(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when clicking inside the dialog", () => {
    const onClose = vi.fn();

    renderComponent({
      onClose,
    });

    fireEvent.mouseDown(screen.getByRole("dialog"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onEdit with the driver when Edit Driver is clicked", () => {
    const onClose = vi.fn();
    const onEdit = vi.fn();

    renderComponent({
      onClose,
      onEdit,
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit Driver",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(driver);
  });

  it("copies the driver code when Copy Driver Code is clicked", () => {
    const writeText = navigator.clipboard.writeText;

    renderComponent();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Copy Driver Code",
      }),
    );

    expect(writeText).toHaveBeenCalledWith("DRV-0002");
  });

  it("copies the license number when Copy License Number is clicked", () => {
    const writeText = navigator.clipboard.writeText;

    renderComponent();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Copy License Number",
      }),
    );

    expect(writeText).toHaveBeenCalledWith("MH4320140098765");
  });

  it("copies the mobile number when Copy Mobile is clicked", () => {
    const writeText = navigator.clipboard.writeText;

    renderComponent();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Copy Mobile",
      }),
    );

    expect(writeText).toHaveBeenCalledWith("9823012345");
  });

  it("renders the Call Driver link when mobile is available", () => {
    renderComponent();

    const callLink = screen.getByRole("link", {
      name: /Call Driver/i,
    });

    expect(callLink).toHaveAttribute("href", "tel:9823012345");
  });

  it("does not render Call Driver when mobile is missing", () => {
    renderComponent({
      driver: {
        ...driver,
        mobile: "",
      },
    });

    expect(
      screen.queryByRole("link", {
        name: /Call Driver/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("calls onClose and navigates to the trips page when View All Trips is clicked", () => {
    const onClose = vi.fn();

    function LocationObserver() {
      const location = useLocation();

      return (
        <div data-testid="location">
          {location.pathname}
          {location.state?.search}
          {location.state?.driverFilter}
        </div>
      );
    }

    render(
      <MemoryRouter>
        <DriverDetailsModal {...defaultProps} onClose={onClose} />
        <LocationObserver />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "View All Trips",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);

    expect(screen.getByTestId("location")).toHaveTextContent("/trips");
    expect(screen.getByTestId("location")).toHaveTextContent("Amit Sharma");
    expect(screen.getByTestId("location")).toHaveTextContent("driver-1");
  });

  it("navigates to the selected active trip when View Trip is clicked", () => {
    const onClose = vi.fn();

    function LocationObserver() {
      const location = useLocation();

      return (
        <div data-testid="location">
          {location.pathname}
          {location.state?.search}
          {location.state?.highlightedTripId}
        </div>
      );
    }

    render(
      <MemoryRouter>
        <DriverDetailsModal
          {...defaultProps}
          trips={[activeTrip]}
          vehicles={[vehicle]}
          onClose={onClose}
        />
        <LocationObserver />
      </MemoryRouter>,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "View Trip",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);

    expect(screen.getByTestId("location")).toHaveTextContent("/trips");
    expect(screen.getByTestId("location")).toHaveTextContent("TRP-2026-0100");
    expect(screen.getByTestId("location")).toHaveTextContent("trip-active");
  });

  it("navigates when a recent trip row is clicked", () => {
    const onClose = vi.fn();

    function LocationObserver() {
      const location = useLocation();

      return (
        <div data-testid="location">
          {location.pathname}
          {location.state?.search}
          {location.state?.highlightedTripId}
        </div>
      );
    }

    render(
      <MemoryRouter>
        <DriverDetailsModal
          {...defaultProps}
          trips={[recentTrip]}
          onClose={onClose}
        />
        <LocationObserver />
      </MemoryRouter>,
    );

    const recentTripRow = screen.getByText("TRP-2026-0099");

    fireEvent.click(recentTripRow);

    expect(onClose).toHaveBeenCalledTimes(1);

    expect(screen.getByTestId("location")).toHaveTextContent("/trips");
    expect(screen.getByTestId("location")).toHaveTextContent("TRP-2026-0099");
    expect(screen.getByTestId("location")).toHaveTextContent("trip-recent");
  });

  it("uses the vehicle ID to resolve the active vehicle", () => {
    renderComponent({
      trips: [activeTrip],
      vehicles: [vehicle],
    });

    expect(screen.getByText("MH-12-AB-1234 · Prima")).toBeInTheDocument();
  });

  it("falls back to the trip vehicle number when the vehicle is not found", () => {
    renderComponent({
      trips: [activeTrip],
      vehicles: [],
    });

    expect(screen.getByText("MH-12-AB-1234")).toBeInTheDocument();
  });

  it("shows inactive status when the driver is inactive", () => {
    isDriverEligible.mockReturnValue(false);

    renderComponent({
      driver: {
        ...driver,
        isActive: false,
      },
    });

    expect(screen.getAllByText("Inactive").length).toBeGreaterThan(0);

    expect(
      screen.getByText("Trip Assignment Status: Not Eligible"),
    ).toBeInTheDocument();

    expect(screen.getByText("Ineligible")).toBeInTheDocument();

    expect(
      screen.getByText("Driver is set to Inactive master status."),
    ).toBeInTheDocument();
  });

  it("shows fallback values for missing optional information", () => {
    const minimalDriver = {
      id: "driver-minimal",
      driverCode: "DRV-0099",
      name: "Test Driver",
      isActive: true,
      dateOfBirth: "",
      licenseNumber: "",
      licenseIssueDate: "",
      licenseExpiryDate: "",
      issuingAuthority: "",
      mobile: "",
      alternateMobile: "",
      email: "",
      address: "",
      city: "",
      state: "",
      pinCode: "",
      joiningDate: "",
      employeeReferenceId: "",
      dailyRate: "",
      notes: "",
      createdAt: "",
      updatedAt: "",
    };

    renderComponent({
      driver: minimalDriver,
    });

    expect(
      screen.getByText("No additional notes entered."),
    ).toBeInTheDocument();

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);

    expect(
      screen.queryByRole("link", {
        name: /Call Driver/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("renders the View All Trips action when recent trips exist", () => {
    renderComponent({
      trips: [recentTrip],
    });

    expect(
      screen.getByRole("button", {
        name: "View All",
      }),
    ).toBeInTheDocument();
  });

  it("does not render View All when there are no recent trips", () => {
    renderComponent({
      trips: [],
    });

    expect(
      screen.queryByRole("button", {
        name: "View All",
      }),
    ).not.toBeInTheDocument();
  });
});
