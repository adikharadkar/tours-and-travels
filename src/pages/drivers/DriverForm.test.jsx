import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import DriverForm from "./DriverForm";

import {
  saveDriver,
  updateDriver,
  getDriverById,
} from "../../services/driverService";
import { getTrips } from "../../services/tripService";
import { validateDriver } from "../../utils/validation/driverValidation";
import { getDriverLicenseStatus } from "../../utils/driverLicenseStatus";

vi.mock("../../services/driverService", () => ({
  saveDriver: vi.fn(),
  updateDriver: vi.fn(),
  getDriverById: vi.fn(),
}));

vi.mock("../../services/tripService", () => ({
  getTrips: vi.fn(),
}));

vi.mock("../../utils/validation/driverValidation", () => ({
  validateDriver: vi.fn(),
}));

vi.mock("../../utils/driverLicenseStatus", () => ({
  getDriverLicenseStatus: vi.fn(),
}));

vi.mock("../../components/ui/Toast", () => ({
  default: ({ title, message }) => (
    <div role="alert">
      <span>{title}</span>
      <span>{message}</span>
    </div>
  ),
}));

const validDriver = {
  id: "driver-1",
  driverCode: "DRV-2026-001",
  prefix: "mr",
  name: "Rajesh Kumar",
  dateOfBirth: "1990-05-15",

  mobile: "9876543210",
  alternateMobile: "9876543211",
  email: "rajesh@example.com",
  address: "Pune, Maharashtra",
  state: "MH",
  city: "Pune",
  pinCode: "411038",

  licenseNumber: "MH1220100012345",
  licenseType: "commercial",
  licenseIssueDate: "2020-06-01",
  licenseExpiryDate: "2030-06-01",
  issuingAuthority: "RTO Pune",

  driverType: "own",
  joiningDate: "2024-01-10",
  employeeReferenceId: "EMP-DRV-01",
  dailyRate: 850,

  isActive: true,
  notes: "Experienced driver",
};

const successfulValidation = () => ({
  isValid: true,
  errors: {},
});

const renderAddForm = () =>
  render(
    <MemoryRouter initialEntries={["/drivers/new"]}>
      <Routes>
        <Route path="/drivers/new" element={<DriverForm />} />
        <Route path="/drivers" element={<div>Drivers Page</div>} />
      </Routes>
    </MemoryRouter>,
  );

const renderEditForm = (driverId = "driver-1") =>
  render(
    <MemoryRouter initialEntries={[`/drivers/${driverId}/edit`]}>
      <Routes>
        <Route path="/drivers/:driverId/edit" element={<DriverForm />} />
        <Route path="/drivers" element={<div>Drivers Page</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe("DriverForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getTrips.mockReturnValue([]);

    validateDriver.mockImplementation(successfulValidation);

    getDriverLicenseStatus.mockReturnValue({
      value: "valid",
      label: "License Valid",
      message: "License is valid for dispatch.",
    });

    saveDriver.mockReturnValue({
      ...validDriver,
      id: "driver-new",
      driverCode: "DRV-2026-002",
    });

    updateDriver.mockReturnValue(validDriver);

    getDriverById.mockReturnValue(validDriver);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders Add Driver mode", () => {
    renderAddForm();

    expect(
      screen.getByRole("heading", { name: "Add Driver" }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Create a new driver profile and license record."),
    ).toBeInTheDocument();

    expect(screen.getByText("Driver Identity")).toBeInTheDocument();
    expect(
      screen.getByText("Contact Information & Address"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Driving License & Compliance"),
    ).toBeInTheDocument();
    expect(screen.getByText("Employment & Assignment")).toBeInTheDocument();
    expect(screen.getByText("Notes & Internal Remarks")).toBeInTheDocument();
  });

  it("renders the main driver form fields", () => {
    renderAddForm();

    expect(screen.getByLabelText("Driver Code")).toBeInTheDocument();
    expect(screen.getByLabelText("Prefix")).toBeInTheDocument();
    expect(screen.getByLabelText(/Driver Full Name/i)).toBeInTheDocument();

    expect(screen.getByLabelText("Date of Birth")).toBeInTheDocument();

    expect(screen.getByLabelText(/Driver Type/i)).toBeInTheDocument();

    expect(
      screen.getByLabelText(/Mobile Phone \(Primary\)/i),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Alternate Mobile")).toBeInTheDocument();
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Residential Address")).toBeInTheDocument();

    expect(screen.getByLabelText("State")).toBeInTheDocument();
    expect(screen.getByLabelText("City")).toBeInTheDocument();
    expect(screen.getByLabelText("PIN Code")).toBeInTheDocument();

    expect(
      screen.getByLabelText(/Driving License Number/i),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(/License Category \/ Class/i),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(/Issuing Authority \/ RTO/i),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("License Issue Date")).toBeInTheDocument();

    expect(
      screen.getByLabelText("License Expiration Date"),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Joining Date")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Employee / Reference ID"),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Daily Rate (₹)")).toBeInTheDocument();
    expect(screen.getByLabelText("Internal Driver Notes")).toBeInTheDocument();

    expect(
      screen.getByRole("switch", {
        name: "Driver Master Status",
      }),
    ).toBeInTheDocument();
  });

  it("initializes the form with the correct default values", () => {
    renderAddForm();

    expect(screen.getByLabelText("Driver Code")).toHaveValue(
      "Will be generated automatically",
    );

    expect(screen.getByLabelText("Prefix")).toHaveValue("mr");
    expect(screen.getByLabelText(/Driver Full Name/)).toHaveValue("");
    expect(screen.getByLabelText(/Driver Type/)).toHaveValue("own");

    expect(screen.getByLabelText(/Driving License Number/i)).toHaveValue("");

    expect(screen.getByLabelText(/License Category \/ Class/i)).toHaveValue(
      "commercial",
    );

    expect(screen.getByLabelText("Daily Rate (₹)")).toHaveValue(null);

    expect(
      screen.getByRole("switch", {
        name: "Driver Master Status",
      }),
    ).toBeChecked();
  });

  it("updates the driver name field", () => {
    renderAddForm();

    const input = screen.getByLabelText(/Driver Full Name/);

    fireEvent.change(input, {
      target: {
        value: "Amit Patil",
      },
    });

    expect(input).toHaveValue("Amit Patil");
  });

  it("updates mobile number and removes non-numeric characters", () => {
    renderAddForm();

    const input = screen.getByLabelText(/Mobile Phone \(Primary\)/i);

    fireEvent.change(input, {
      target: {
        value: "98abc76543210",
      },
    });

    expect(input).toHaveValue("9876543210");
  });

  it("updates alternate mobile and removes non-numeric characters", () => {
    renderAddForm();

    const input = screen.getByLabelText("Alternate Mobile");

    fireEvent.change(input, {
      target: {
        value: "9876abc54321",
      },
    });

    expect(input).toHaveValue("987654321");
  });

  it("updates PIN code and removes non-numeric characters", () => {
    renderAddForm();

    const input = screen.getByLabelText("PIN Code");

    fireEvent.change(input, {
      target: {
        value: "411a038",
      },
    });

    expect(input).toHaveValue("411038");
  });

  it("uppercases the driving license number", () => {
    renderAddForm();

    const input = screen.getByLabelText(/Driving License Number/i);

    fireEvent.change(input, {
      target: {
        value: "mh1220100012345",
      },
    });

    expect(input).toHaveValue("MH1220100012345");
  });

  it("updates the state and resets city when state changes", () => {
    renderAddForm();

    const state = screen.getByLabelText("State");
    const city = screen.getByLabelText("City");

    expect(city).toBeDisabled();

    fireEvent.change(state, {
      target: {
        value: "MH",
      },
    });

    expect(state).toHaveValue("MH");
    expect(city).toBeEnabled();
    expect(city).toHaveValue("");
  });

  it("allows selecting a city after selecting a state", () => {
    renderAddForm();

    fireEvent.change(screen.getByLabelText("State"), {
      target: {
        value: "MH",
      },
    });

    const city = screen.getByLabelText("City");

    expect(city).toBeEnabled();

    const cityOptions = Array.from(city.options).map((option) => option.value);

    if (cityOptions.includes("Pune")) {
      fireEvent.change(city, {
        target: {
          value: "Pune",
        },
      });

      expect(city).toHaveValue("Pune");
    }
  });

  it("toggles driver master status", () => {
    renderAddForm();

    const statusSwitch = screen.getByRole("switch", {
      name: "Driver Master Status",
    });

    expect(statusSwitch).toBeChecked();

    fireEvent.click(statusSwitch);

    expect(statusSwitch).not.toBeChecked();
    expect(screen.getByText("Inactive / Grounded")).toBeInTheDocument();
  });

  it("renders license health information", () => {
    renderAddForm();

    expect(screen.getByText("License Health")).toBeInTheDocument();
    expect(screen.getByText("License Valid")).toBeInTheDocument();
    expect(
      screen.getByText("License is valid for dispatch."),
    ).toBeInTheDocument();
  });

  it("does not show an expiry status pill when expiry date is empty", () => {
    renderAddForm();

    expect(screen.queryByText("License Valid")).toBeInTheDocument();

    expect(
      screen.queryByText(/Driving License is Expired/i),
    ).not.toBeInTheDocument();
  });

  it("shows expired license warning when license status is expired", () => {
    getDriverLicenseStatus.mockReturnValue({
      value: "expired",
      label: "Expired",
      message: "License expired on 2026-01-01.",
    });

    renderAddForm();

    const expiryInput = screen.getByLabelText("License Expiration Date");

    fireEvent.change(expiryInput, {
      target: {
        value: "2026-01-01",
      },
    });

    expect(screen.getByText(/Driving License is Expired/i)).toBeInTheDocument();

    expect(screen.getByText(/This driver is grounded/i)).toBeInTheDocument();
  });

  it("shows expiring soon license warning", () => {
    getDriverLicenseStatus.mockReturnValue({
      value: "expiring_soon",
      label: "Expiring Soon",
      message: "License expires soon.",
    });

    renderAddForm();

    const expiryInput = screen.getByLabelText("License Expiration Date");

    fireEvent.change(expiryInput, {
      target: {
        value: "2026-09-01",
      },
    });

    expect(
      screen.getByText(/Driving License Expiring Soon/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/Renewal documentation required soon/i),
    ).toBeInTheDocument();
  });

  it("does not save when validation fails", async () => {
    validateDriver.mockReturnValue({
      isValid: false,
      errors: {
        name: "Driver name is required.",
      },
    });

    renderAddForm();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Save Driver",
      }),
    );

    expect(validateDriver).toHaveBeenCalled();

    expect(saveDriver).not.toHaveBeenCalled();
    expect(updateDriver).not.toHaveBeenCalled();

    expect(
      await screen.findByText("Driver name is required."),
    ).toBeInTheDocument();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Please check the form",
    );
  });

  it("shows singular validation toast when one field is invalid", async () => {
    validateDriver.mockReturnValue({
      isValid: false,
      errors: {
        name: "Driver name is required.",
      },
    });

    renderAddForm();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Save Driver",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please correct the highlighted field before saving.",
    );
  });

  it("shows plural validation toast when multiple fields are invalid", async () => {
    validateDriver.mockReturnValue({
      isValid: false,
      errors: {
        name: "Driver name is required.",
        mobile: "Mobile number is required.",
        licenseNumber: "License number is required.",
      },
    });

    renderAddForm();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Save Driver",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please correct the 3 highlighted fields before saving.",
    );
  });

  it("saves a new driver when the form is valid", async () => {
    const createdDriver = {
      id: "driver-new",
      name: "Amit Patil",
      driverCode: "DRV-2026-002",
    };

    saveDriver.mockReturnValue(createdDriver);

    renderAddForm();

    fireEvent.change(screen.getByLabelText(/Driver Full Name/), {
      target: {
        value: "Amit Patil",
      },
    });

    fireEvent.change(screen.getByLabelText(/Mobile Phone \(Primary\)/i), {
      target: {
        value: "9876543210",
      },
    });

    fireEvent.change(screen.getByLabelText(/Driving License Number/i), {
      target: {
        value: "MH1220100012345",
      },
    });

    fireEvent.change(screen.getByLabelText("License Expiration Date"), {
      target: {
        value: "2030-06-01",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Save Driver",
      }),
    );

    await waitFor(() => {
      expect(saveDriver).toHaveBeenCalledTimes(1);
    });

    expect(saveDriver).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Amit Patil",
        mobile: "9876543210",
        licenseNumber: "MH1220100012345",
        licenseExpiryDate: "2030-06-01",
      }),
    );

    expect(screen.getByText("Drivers Page")).toBeInTheDocument();
  });

  it("calls saveDriver with the current form state", async () => {
    renderAddForm();

    fireEvent.change(screen.getByLabelText(/Driver Full Name/), {
      target: {
        value: "Suresh Patil",
      },
    });

    fireEvent.change(screen.getByLabelText("Email Address"), {
      target: {
        value: "suresh@example.com",
      },
    });

    fireEvent.change(screen.getByLabelText("Daily Rate (₹)"), {
      target: {
        value: "1000",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Save Driver",
      }),
    );

    await waitFor(() => {
      expect(saveDriver).toHaveBeenCalledTimes(1);
    });

    expect(saveDriver).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Suresh Patil",
        email: "suresh@example.com",
        dailyRate: "1000",
      }),
    );
  });

  it("loads an existing driver in edit mode", async () => {
    getDriverById.mockReturnValue(validDriver);

    renderEditForm("driver-1");

    expect(
      await screen.findByRole("heading", {
        name: "Edit Driver",
      }),
    ).toBeInTheDocument();

    expect(screen.getAllByText("DRV-2026-001").length).toBeGreaterThan(0);

    expect(screen.getByLabelText(/Driver Full Name/)).toHaveValue(
      "Rajesh Kumar",
    );

    expect(screen.getByLabelText(/Mobile Phone \(Primary\)/i)).toHaveValue(
      "9876543210",
    );

    expect(screen.getByLabelText(/Driving License Number/i)).toHaveValue(
      "MH1220100012345",
    );

    expect(screen.getByLabelText("Daily Rate (₹)")).toHaveValue(850);
  });

  it("shows Save Changes instead of Save Driver in edit mode", async () => {
    renderEditForm();

    expect(
      await screen.findByRole("button", {
        name: "Save Changes",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("button", {
        name: "Save Driver",
      }),
    ).not.toBeInTheDocument();
  });

  it("updates an existing driver in edit mode", async () => {
    const updatedDriver = {
      ...validDriver,
      name: "Rajesh Patil",
      driverCode: "DRV-2026-001",
    };

    updateDriver.mockReturnValue(updatedDriver);

    renderEditForm("driver-1");

    const nameInput = await screen.findByLabelText(/Driver Full Name/);

    fireEvent.change(nameInput, {
      target: {
        value: "Rajesh Patil",
      },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Save Changes",
      }),
    );

    await waitFor(() => {
      expect(updateDriver).toHaveBeenCalledTimes(1);
    });

    expect(updateDriver).toHaveBeenCalledWith(
      "driver-1",
      expect.objectContaining({
        name: "Rajesh Patil",
      }),
    );

    expect(screen.getByText("Drivers Page")).toBeInTheDocument();
  });

  it("calls getDriverById with the route driver id in edit mode", async () => {
    renderEditForm("driver-123");

    await waitFor(() => {
      expect(getDriverById).toHaveBeenCalledWith("driver-123");
    });
  });

  it("loads trips on mount", async () => {
    const trips = [
      {
        id: "trip-1",
        tripCode: "TRP-2026-001",
        driverId: "driver-1",
      },
    ];

    getTrips.mockReturnValue(trips);

    renderAddForm();

    await waitFor(() => {
      expect(getTrips).toHaveBeenCalledTimes(1);
    });
  });

  it("shows operational assignment snapshot in edit mode", async () => {
    getDriverById.mockReturnValue(validDriver);

    getTrips.mockReturnValue([
      {
        id: "trip-1",
        tripCode: "TRP-2026-101",
        driverId: "driver-1",
        status: "in_progress",
        vehicleNumber: "MH-12-AB-1234",
        pickupLocation: "Pune",
        dropLocation: "Mumbai",
      },
    ]);

    renderEditForm();

    expect(
      await screen.findByText("Current Operational Status"),
    ).toBeInTheDocument();
  });

  it("shows available for trip dispatch in edit mode when no active trip exists", async () => {
    getDriverById.mockReturnValue(validDriver);
    getTrips.mockReturnValue([]);

    renderEditForm();

    expect(
      await screen.findByText("Available for Trip Dispatch"),
    ).toBeInTheDocument();
  });

  it("redirects to drivers when Cancel is clicked", () => {
    renderAddForm();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Cancel",
      }),
    );

    expect(screen.getByText("Drivers Page")).toBeInTheDocument();
  });

  it("redirects to drivers when Discard Changes is clicked", () => {
    renderAddForm();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Discard Changes",
      }),
    );

    expect(screen.getByText("Drivers Page")).toBeInTheDocument();
  });

  it("handles a missing driver in edit mode", async () => {
    getDriverById.mockReturnValue(null);

    renderEditForm("missing-driver");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Driver Not Found",
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "The requested driver record could not be found.",
    );
  });

  it("handles getDriverById failure in edit mode", async () => {
    getDriverById.mockImplementation(() => {
      throw new Error("Database unavailable");
    });

    renderEditForm("driver-1");

    expect(await screen.findByRole("alert")).toHaveTextContent("Error");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Failed to load driver data.",
    );
  });

  it("handles save failure in add mode", async () => {
    saveDriver.mockImplementation(() => {
      throw new Error("Unable to save driver");
    });

    renderAddForm();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Save Driver",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to save driver",
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to save driver",
    );
  });

  it("handles update failure in edit mode", async () => {
    updateDriver.mockImplementation(() => {
      throw new Error("Unable to update driver");
    });

    renderEditForm();

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Save Changes",
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to update driver",
    );
  });

  it("renders the profile summary for a new driver", () => {
    renderAddForm();

    expect(screen.getByText("New Driver")).toBeInTheDocument();
    expect(
      screen.getByText("Will be generated automatically"),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Own/).length).toBeGreaterThan(0);
  });

  it("updates the profile summary as the driver name changes", () => {
    renderAddForm();

    fireEvent.change(screen.getByLabelText(/Driver Full Name/), {
      target: {
        value: "Amit Patil",
      },
    });

    expect(screen.getByText("Mr. Amit Patil")).toBeInTheDocument();
    expect(screen.getByText("AP")).toBeInTheDocument();
  });

  it("renders notes and updates them", () => {
    renderAddForm();

    const notes = screen.getByLabelText("Internal Driver Notes");

    fireEvent.change(notes, {
      target: {
        value: "Experienced in long-distance routes.",
      },
    });

    expect(notes).toHaveValue("Experienced in long-distance routes.");
  });

  it("updates daily rate", () => {
    renderAddForm();

    const dailyRate = screen.getByLabelText("Daily Rate (₹)");

    fireEvent.change(dailyRate, {
      target: {
        value: "1250",
      },
    });

    expect(dailyRate).toHaveValue(1250);
  });

  it("updates email address", () => {
    renderAddForm();

    const email = screen.getByLabelText("Email Address");

    fireEvent.change(email, {
      target: {
        value: "driver@example.com",
      },
    });

    expect(email).toHaveValue("driver@example.com");
  });

  it("updates address", () => {
    renderAddForm();

    const address = screen.getByLabelText("Residential Address");

    fireEvent.change(address, {
      target: {
        value: "123 Main Road, Pune",
      },
    });

    expect(address).toHaveValue("123 Main Road, Pune");
  });

  it("updates license issue and expiry dates", () => {
    renderAddForm();

    const issueDate = screen.getByLabelText("License Issue Date");
    const expiryDate = screen.getByLabelText("License Expiration Date");

    fireEvent.change(issueDate, {
      target: {
        value: "2024-01-01",
      },
    });

    fireEvent.change(expiryDate, {
      target: {
        value: "2034-01-01",
      },
    });

    expect(issueDate).toHaveValue("2024-01-01");
    expect(expiryDate).toHaveValue("2034-01-01");
  });
});
