import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import VehicleList from "./VehicleList";
import { getVehicles, deleteVehicle } from "../../services/vehicleService";
import { getTrips } from "../../services/tripService";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

vi.mock("../../services/vehicleService", () => ({
  getVehicles: vi.fn(),
  deleteVehicle: vi.fn(),
}));

vi.mock("../../services/tripService", () => ({
  getTrips: vi.fn(),
}));

const mockVehicles = [
  {
    id: "veh-1",
    vehicleCode: "VEH-0001",
    vehicleNumber: "MH-12-AB-1234",
    vehicleType: "bus",
    make: "Tata",
    model: "Starbus",
    seatingCapacity: 45,
    fuelType: "diesel",
    manufacturingYear: "2022",
    ownershipType: "own",
    ownerName: "",
    isActive: true,
    insuranceExpiry: "2027-10-10",
    fitnessExpiry: "2027-10-10",
    pucExpiry: "2027-10-10",
    permitExpiry: "2027-10-10",
  },
  {
    id: "veh-2",
    vehicleCode: "VEH-0002",
    vehicleNumber: "MH-14-CD-5678",
    vehicleType: "traveller",
    make: "Force",
    model: "Traveller 3050",
    seatingCapacity: 17,
    fuelType: "diesel",
    manufacturingYear: "2023",
    ownershipType: "attached",
    ownerName: "Star Logistics",
    isActive: true,
    insuranceExpiry: "2024-01-01", // Expired
    fitnessExpiry: "2027-10-10",
    pucExpiry: "2027-10-10",
    permitExpiry: "2027-10-10",
  },
  {
    id: "veh-3",
    vehicleCode: "VEH-0003",
    vehicleNumber: "MH-20-EF-9012",
    vehicleType: "car",
    make: "Maruti Suzuki",
    model: "Ertiga",
    seatingCapacity: 7,
    fuelType: "cng",
    manufacturingYear: "2021",
    ownershipType: "leased",
    ownerName: "RentACar Co",
    isActive: false, // Inactive / Maintenance
    insuranceExpiry: "2027-10-10",
    fitnessExpiry: "2027-10-10",
    pucExpiry: "2027-10-10",
    permitExpiry: "2027-10-10",
  },
];

const mockTrips = [
  {
    id: "trip-1",
    tripCode: "TRP-0101",
    vehicleId: "veh-1",
    vehicleNumber: "MH-12-AB-1234",
    status: "in_progress",
    driverName: "Ramesh Sharma",
    pickupLocation: "Pune Station",
    dropLocation: "Mumbai Airport",
    startDateTime: "2026-08-26T06:00",
    endDateTime: "2026-08-26T18:00",
  },
];

describe("VehicleList Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getVehicles.mockReturnValue(mockVehicles);
    getTrips.mockReturnValue(mockTrips);
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <VehicleList />
      </MemoryRouter>,
    );

  it("renders page header and Add Vehicle button", () => {
    renderComponent();

    expect(
      screen.getByRole("heading", { name: "Vehicles" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Manage your fleet, availability, compliance and vehicle records.",
      ),
    ).toBeInTheDocument();

    const addBtn = screen.getByRole("button", { name: /Add Vehicle/i });
    expect(addBtn).toBeInTheDocument();

    fireEvent.click(addBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/vehicles/new");
  });

  it("renders KPI overview cards with accurate fleet statistics", () => {
    renderComponent();

    expect(screen.getByText("TOTAL FLEET")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("AVAILABLE")).toBeInTheDocument();
    expect(screen.getByText("ON TRIP")).toBeInTheDocument();
    expect(screen.getByText("INACTIVE")).toBeInTheDocument();
    expect(screen.getByText("EXPIRED DOCS")).toBeInTheDocument();

    // Total Fleet: 3
    expect(screen.getAllByText("3").length).toBeGreaterThan(0);
  });

  it("renders attention banner when expired documents exist", () => {
    renderComponent();

    expect(screen.getByText(/1 vehicle needs attention/i)).toBeInTheDocument();
    expect(screen.getByText(/1 with expired document/i)).toBeInTheDocument();

    const viewExpiredBtn = screen.getByRole("button", {
      name: /View Expired/i,
    });
    expect(viewExpiredBtn).toBeInTheDocument();

    fireEvent.click(viewExpiredBtn);
    expect(screen.getAllByText("MH-14-CD-5678").length).toBeGreaterThan(0);
    expect(screen.queryByText("MH-12-AB-1234")).not.toBeInTheDocument();
  });

  it("filters vehicles when clicking KPI cards", () => {
    renderComponent();

    // Click "AVAILABLE" KPI card
    const availableCard = screen.getByText("AVAILABLE").closest("button");
    fireEvent.click(availableCard);

    expect(screen.getAllByText("MH-14-CD-5678").length).toBeGreaterThan(0);
    expect(screen.queryByText("MH-12-AB-1234")).not.toBeInTheDocument();

    // Click "TOTAL FLEET" to reset
    const totalCard = screen.getByText("TOTAL FLEET").closest("button");
    fireEvent.click(totalCard);

    expect(screen.getAllByText("MH-12-AB-1234").length).toBeGreaterThan(0);
    expect(screen.getAllByText("MH-14-CD-5678").length).toBeGreaterThan(0);
  });

  it("renders vehicle list with operational details in table", () => {
    renderComponent();

    // Vehicle 1
    expect(screen.getAllByText("MH-12-AB-1234").length).toBeGreaterThan(0);
    expect(screen.getAllByText("VEH-0001").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Tata Starbus").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/On Trip/i).length).toBeGreaterThan(0);

    // Vehicle 2
    expect(screen.getAllByText("MH-14-CD-5678").length).toBeGreaterThan(0);
    expect(screen.getAllByText("VEH-0002").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Force Traveller 3050").length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText(/Expired/i).length).toBeGreaterThan(0);

    // Vehicle 3
    expect(screen.getAllByText("MH-20-EF-9012").length).toBeGreaterThan(0);
    expect(screen.getAllByText("VEH-0003").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Inactive").length).toBeGreaterThan(0);
  });

  it("filters vehicles by search input", () => {
    renderComponent();

    const searchInput = screen.getByRole("textbox", {
      name: "Search vehicles",
    });
    fireEvent.change(searchInput, { target: { value: "Ertiga" } });

    expect(screen.getAllByText("MH-20-EF-9012").length).toBeGreaterThan(0);
    expect(screen.queryByText("MH-12-AB-1234")).not.toBeInTheDocument();
  });

  it("filters vehicles by operational tabs", () => {
    renderComponent();

    // Click "On Trip" tab
    const onTripTab = screen.getByRole("button", { name: "On Trip" });
    fireEvent.click(onTripTab);

    expect(screen.getAllByText("MH-12-AB-1234").length).toBeGreaterThan(0);
    expect(screen.queryByText("MH-20-EF-9012")).not.toBeInTheDocument();

    // Click "Maintenance" tab
    const maintenanceTab = screen.getByRole("button", { name: "Maintenance" });
    fireEvent.click(maintenanceTab);

    expect(screen.getAllByText("MH-20-EF-9012").length).toBeGreaterThan(0);
    expect(screen.queryByText("MH-12-AB-1234")).not.toBeInTheDocument();
  });

  it("toggles filter panel and filters by vehicle type", () => {
    renderComponent();

    const filterBtn = screen.getByRole("button", { name: /Filters/i });
    fireEvent.click(filterBtn);

    const typeSelect = screen.getByRole("combobox", {
      name: "Filter by vehicle type",
    });
    fireEvent.change(typeSelect, { target: { value: "bus" } });

    expect(screen.getAllByText("MH-12-AB-1234").length).toBeGreaterThan(0);
    expect(screen.queryByText("MH-14-CD-5678")).not.toBeInTheDocument();

    // Reset filters
    const resetBtn = screen.getByRole("button", { name: "Reset all filters" });
    fireEvent.click(resetBtn);

    expect(screen.getAllByText("MH-12-AB-1234").length).toBeGreaterThan(0);
    expect(screen.getAllByText("MH-14-CD-5678").length).toBeGreaterThan(0);
  });

  it("opens the vehicle details modal on View click", () => {
    renderComponent();

    const viewButtons = screen.getAllByTitle("View Details");
    fireEvent.click(viewButtons[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Vehicle Information")).toBeInTheDocument();
    expect(
      screen.getByText("Document & Compliance Information"),
    ).toBeInTheDocument();
  });

  it("navigates to edit vehicle page on Edit click", () => {
    renderComponent();

    const editButtons = screen.getAllByRole("button", { name: "Edit" });
    fireEvent.click(editButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith("/vehicles/veh-1/edit");
  });

  it("opens delete confirmation and deletes a vehicle", () => {
    renderComponent();

    // Click Delete on mobile or more menu
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to delete/i),
    ).toBeInTheDocument();

    const confirmDeleteBtn = screen.getByRole("button", {
      name: "Delete Vehicle",
    });
    fireEvent.click(confirmDeleteBtn);

    expect(deleteVehicle).toHaveBeenCalledWith("veh-1");
  });

  it("displays empty state when no vehicles exist", () => {
    getVehicles.mockReturnValue([]);
    renderComponent();

    expect(screen.getByText("No vehicles added yet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "+ Add First Vehicle" }),
    ).toBeInTheDocument();
  });

  it("displays no matching vehicles found when filters yield zero results", () => {
    renderComponent();

    const searchInput = screen.getByRole("textbox", {
      name: "Search vehicles",
    });
    fireEvent.change(searchInput, {
      target: { value: "NonExistentVehicleXYZ" },
    });

    expect(screen.getByText("No matching vehicles found")).toBeInTheDocument();
  });
});
