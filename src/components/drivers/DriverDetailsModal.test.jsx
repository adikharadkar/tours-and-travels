import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import DriverDetailsModal from "./DriverDetailsModal";

import {
  getDriverLicenseStatus,
  isDriverEligible,
} from "../../utils/driverLicenseStatus";

vi.mock("../../utils/driverLicenseStatus", () => ({
  getDriverLicenseStatus: vi.fn(),
  isDriverEligible: vi.fn(),
}));

const driver = {
  id: "driver-1",
  driverCode: "DRV-0001",

  prefix: "mr",
  name: "Rajesh Patil",

  dateOfBirth: "1985-05-15",

  driverType: "own",

  mobile: "9876543210",
  alternateMobile: "9876543211",
  email: "rajesh@example.com",

  address: "Plot No. 12, MIDC Area",
  city: "Test City",
  state: "Test State",
  pinCode: "431001",

  licenseNumber: "MH2020001234567",
  licenseType: "transport",
  licenseIssueDate: "2020-06-15",
  licenseExpiryDate: "2027-06-15",
  issuingAuthority: "RTO Maharashtra",

  joiningDate: "2021-01-10",
  employeeReferenceId: "EMP-001",
  dailyRate: 1500,

  notes: "Experienced long-route driver.",

  isActive: true,

  createdAt: "2026-08-19T10:30:00.000Z",
  updatedAt: "2026-08-20T15:45:00.000Z",
};

const inactiveDriver = {
  ...driver,
  id: "driver-2",
  driverCode: "DRV-0002",
  name: "Amit Sharma",
  isActive: false,
};

const noPrefixDriver = {
  ...driver,
  prefix: "",
  name: "Suresh Pawar",
};

const validLicenseStatus = {
  value: "valid",
  label: "Valid",
  message: "Driving license is valid.",
};

describe("DriverDetailsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getDriverLicenseStatus.mockReturnValue(validLicenseStatus);

    isDriverEligible.mockReturnValue(true);
  });

  it("renders nothing when driver is not provided", () => {
    const { container } = render(
      <DriverDetailsModal
        open
        driver={null}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when modal is closed", () => {
    render(
      <DriverDetailsModal
        open={false}
        driver={driver}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the driver header information", () => {
    render(
      <DriverDetailsModal
        open
        driver={driver}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Mr. Rajesh Patil",
      }),
    ).toBeInTheDocument();

    expect(screen.getAllByText("DRV-0001").length).toBeGreaterThan(0);

    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
  });

  it("renders the driver without a prefix", () => {
    render(
      <DriverDetailsModal
        open
        driver={noPrefixDriver}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Suresh Pawar",
      }),
    ).toBeInTheDocument();
  });

  it("renders eligible trip assignment status", () => {
    isDriverEligible.mockReturnValue(true);

    render(
      <DriverDetailsModal
        open
        driver={driver}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Trip Assignment Status: Eligible"),
    ).toBeInTheDocument();

    expect(screen.getByText("Ready For Trips")).toBeInTheDocument();

    expect(
      screen.getByText("Driver is active with a valid driving license."),
    ).toBeInTheDocument();

    expect(isDriverEligible).toHaveBeenCalledWith(driver);
  });

  it("renders not eligible status when driver is not eligible", () => {
    isDriverEligible.mockReturnValue(false);

    render(
      <DriverDetailsModal
        open
        driver={driver}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Trip Assignment Status: Not Eligible"),
    ).toBeInTheDocument();

    expect(screen.getByText("Ineligible")).toBeInTheDocument();
  });

  it("shows inactive status message when driver is inactive", () => {
    isDriverEligible.mockReturnValue(false);

    render(
      <DriverDetailsModal
        open
        driver={inactiveDriver}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Driver is set to Inactive master status."),
    ).toBeInTheDocument();

    expect(screen.getAllByText("Inactive").length).toBeGreaterThan(0);
  });

  it("shows expired-license message when the license is expired", () => {
    isDriverEligible.mockReturnValue(false);

    getDriverLicenseStatus.mockReturnValue({
      value: "expired",
      label: "Expired",
      message: "Driving license expired on 10/08/2026.",
    });

    render(
      <DriverDetailsModal
        open
        driver={driver}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        "Driving license is expired. Cannot be assigned to new trips.",
      ),
    ).toBeInTheDocument();

    expect(screen.getByText("License: Expired")).toBeInTheDocument();
  });

  it("renders personal information", () => {
    render(
      <DriverDetailsModal
        open
        driver={driver}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("1. Personal Information")).toBeInTheDocument();

    expect(screen.getByText("DRV-0001")).toBeInTheDocument();

    expect(screen.getAllByText("Mr. Rajesh Patil").length).toBeGreaterThan(0);

    expect(screen.getByText("15/05/1985")).toBeInTheDocument();

    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
  });

  it("renders the calculated age", () => {
    render(
      <DriverDetailsModal
        open
        driver={driver}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText(/\(\d+ years\)/)).toBeInTheDocument();
  });

  it("renders driving license information", () => {
    render(
      <DriverDetailsModal
        open
        driver={driver}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(
      screen.getByText("2. Driving License Information"),
    ).toBeInTheDocument();

    expect(screen.getByText("MH2020001234567")).toBeInTheDocument();

    expect(screen.getByText("Transport")).toBeInTheDocument();

    expect(screen.getByText("15/06/2020")).toBeInTheDocument();

    expect(screen.getByText("15/06/2027")).toBeInTheDocument();

    expect(screen.getByText("RTO Maharashtra")).toBeInTheDocument();

    expect(screen.getByText("License Status Notice")).toBeInTheDocument();

    expect(screen.getByText("Driving license is valid.")).toBeInTheDocument();
  });

  it("renders contact information", () => {
    render(
      <DriverDetailsModal
        open
        driver={driver}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("3. Contact Information")).toBeInTheDocument();

    expect(screen.getByText("9876543210")).toBeInTheDocument();

    expect(screen.getByText("9876543211")).toBeInTheDocument();

    expect(screen.getByText("rajesh@example.com")).toBeInTheDocument();

    expect(screen.getByText("Plot No. 12, MIDC Area")).toBeInTheDocument();

    expect(screen.getByText("Test City")).toBeInTheDocument();

    expect(screen.getByText("Test State")).toBeInTheDocument();

    expect(screen.getByText("431001")).toBeInTheDocument();
  });

  it("renders employment information", () => {
    render(
      <DriverDetailsModal
        open
        driver={driver}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("4. Employment Information")).toBeInTheDocument();

    expect(screen.getAllByText("Own").length).toBeGreaterThan(0);

    expect(screen.getByText("10/01/2021")).toBeInTheDocument();

    expect(screen.getByText("EMP-001")).toBeInTheDocument();

    expect(screen.getByText("₹1,500 / day")).toBeInTheDocument();
  });

  it("renders a dash when daily rate is not provided", () => {
    const driverWithoutRate = {
      ...driver,
      dailyRate: "",
    };

    render(
      <DriverDetailsModal
        open
        driver={driverWithoutRate}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders notes", () => {
    render(
      <DriverDetailsModal
        open
        driver={driver}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(
      screen.getByText("5. Additional Notes & System Audit"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Experienced long-route driver."),
    ).toBeInTheDocument();
  });

  it("renders fallback text when notes are empty", () => {
    const driverWithoutNotes = {
      ...driver,
      notes: "",
    };

    render(
      <DriverDetailsModal
        open
        driver={driverWithoutNotes}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(
      screen.getByText("No additional notes entered."),
    ).toBeInTheDocument();
  });

  it("renders audit information", () => {
    render(
      <DriverDetailsModal
        open
        driver={driver}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("Record Created")).toBeInTheDocument();

    expect(screen.getByText("Last Updated")).toBeInTheDocument();
  });

  it("renders em dash for missing values", () => {
    const incompleteDriver = {
      ...driver,
      dateOfBirth: "",
      alternateMobile: "",
      email: "",
      address: "",
      pinCode: "",
      licenseIssueDate: "",
      issuingAuthority: "",
      joiningDate: "",
      employeeReferenceId: "",
      dailyRate: "",
      notes: "",
      createdAt: "",
      updatedAt: "",
    };

    render(
      <DriverDetailsModal
        open
        driver={incompleteDriver}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("calls onClose when the Close button is clicked", () => {
    const onClose = vi.fn();

    render(
      <DriverDetailsModal
        open
        driver={driver}
        onClose={onClose}
        onEdit={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Close",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the modal close button is clicked", () => {
    const onClose = vi.fn();

    render(
      <DriverDetailsModal
        open
        driver={driver}
        onClose={onClose}
        onEdit={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Close modal",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes the modal and calls onEdit with the driver", () => {
    const onClose = vi.fn();
    const onEdit = vi.fn();

    render(
      <DriverDetailsModal
        open
        driver={driver}
        onClose={onClose}
        onEdit={onEdit}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit Driver",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);

    expect(onEdit).toHaveBeenCalledTimes(1);

    expect(onEdit).toHaveBeenCalledWith(driver);
  });
});
