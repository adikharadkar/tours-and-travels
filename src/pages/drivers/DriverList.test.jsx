import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import DriverList from "./DriverList";
import { getDrivers, deleteDriver } from "../../services/driverService";
import { getTrips } from "../../services/tripService";
import { getVehicles } from "../../services/vehicleService";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

vi.mock("../../services/driverService", () => ({
  getDrivers: vi.fn(),
  deleteDriver: vi.fn(),
}));

vi.mock("../../services/tripService", () => ({
  getTrips: vi.fn(),
}));

vi.mock("../../services/vehicleService", () => ({
  getVehicles: vi.fn(),
}));

const mockDrivers = [
  {
    id: "drv_1",
    driverCode: "DRV-0001",
    prefix: "mr",
    name: "Rajesh Patil",
    mobile: "9876543210",
    licenseNumber: "MH1220100012345",
    licenseType: "hmv",
    licenseExpiryDate: "2027-05-10",
    driverType: "own",
    isActive: true,
  },
  {
    id: "drv_2",
    driverCode: "DRV-0002",
    prefix: "mr",
    name: "Amit Sharma",
    mobile: "9823012345",
    licenseNumber: "MH4320140098765",
    licenseType: "commercial",
    licenseExpiryDate: "2024-01-01", // Expired
    driverType: "contract",
    isActive: true,
  },
  {
    id: "drv_3",
    driverCode: "DRV-0003",
    prefix: "mr",
    name: "Suresh Pawar",
    mobile: "9812345678",
    licenseNumber: "MH1420180054321",
    licenseType: "lmv",
    licenseExpiryDate: "2028-09-15",
    driverType: "attached",
    isActive: false, // Inactive
  },
];

const mockVehicles = [
  {
    id: "veh_1",
    vehicleCode: "VEH-0001",
    vehicleNumber: "MH 12 AB 1234",
    model: "Starbus",
  },
];

const mockTrips = [
  {
    id: "trip_1",
    tripCode: "TRP-0101",
    driverId: "drv_1",
    driverName: "Rajesh Patil",
    vehicleId: "veh_1",
    vehicleNumber: "MH 12 AB 1234",
    status: "in_progress",
    pickupLocation: "Mumbai HQ",
    dropLocation: "Pune MIDC",
  },
];

describe("DriverList Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDrivers.mockReturnValue(mockDrivers);
    getTrips.mockReturnValue(mockTrips);
    getVehicles.mockReturnValue(mockVehicles);
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <DriverList />
      </MemoryRouter>,
    );

  it("renders page header and Add Driver button", () => {
    renderComponent();

    expect(
      screen.getByRole("heading", { name: "Drivers" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Manage drivers, license compliance, availability and trip eligibility.",
      ),
    ).toBeInTheDocument();

    const addBtn = screen.getByRole("button", { name: /\+ Add Driver/i });
    expect(addBtn).toBeInTheDocument();

    fireEvent.click(addBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/drivers/new");
  });

  it("renders KPI overview cards with accurate driver and compliance statistics", () => {
    renderComponent();

    expect(screen.getAllByText(/Total Drivers/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/On Trip/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Available/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Compliance Alerts/i).length).toBeGreaterThan(0);

    // Total Drivers: 3
    expect(screen.getAllByText("3").length).toBeGreaterThan(0);
  });

  it("filters drivers when clicking operational tabs", () => {
    renderComponent();

    // Click "On Trip" Tab
    const onTripTab = screen.getByRole("button", { name: "On Trip" });
    fireEvent.click(onTripTab);

    expect(screen.getAllByText(/Rajesh Patil/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Amit Sharma/i)).not.toBeInTheDocument();

    // Click "All Drivers" Tab
    const allTab = screen.getByRole("button", { name: "All Drivers" });
    fireEvent.click(allTab);

    expect(screen.getAllByText(/Rajesh Patil/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Amit Sharma/i).length).toBeGreaterThan(0);
  });

  it("searches drivers by name, code, mobile, or license", () => {
    renderComponent();

    const searchInput = screen.getByPlaceholderText(
      /Search code, name, mobile, license/i,
    );
    fireEvent.change(searchInput, { target: { value: "Amit" } });

    expect(screen.getAllByText(/Amit Sharma/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Rajesh Patil/i)).not.toBeInTheDocument();
  });

  it("opens DriverDetailsModal when View is clicked", () => {
    renderComponent();

    const viewButtons = screen.getAllByRole("button", { name: /view/i });
    fireEvent.click(viewButtons[0]);

    // Modal dialog opens
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("navigates to edit form when Edit is clicked", () => {
    renderComponent();

    // Since list is sorted A-Z by default, first driver is Amit Sharma (drv_2)
    const editButtons = screen.getAllByRole("button", { name: /edit/i });
    fireEvent.click(editButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith("/drivers/drv_2/edit");
  });

  it("opens delete confirmation modal and deletes driver", () => {
    renderComponent();

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    // Confirm dialog title
    expect(screen.getByText("Delete Driver?")).toBeInTheDocument();

    const dialog = screen.getByRole("dialog");
    const confirmBtn = within(dialog).getByRole("button", {
      name: "Delete Driver",
    });
    fireEvent.click(confirmBtn);

    expect(deleteDriver).toHaveBeenCalledWith("drv_2");
  });
});
