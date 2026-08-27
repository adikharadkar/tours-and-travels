import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import VehicleForm from "./VehicleForm";
import {
  saveVehicle,
  updateVehicle,
  getVehicleById,
} from "../../services/vehicleService";
import { getTrips } from "../../services/tripService";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../services/vehicleService", () => ({
  saveVehicle: vi.fn(),
  updateVehicle: vi.fn(),
  getVehicleById: vi.fn(),
}));

vi.mock("../../services/tripService", () => ({
  getTrips: vi.fn(),
}));

const mockExistingVehicle = {
  id: "veh_1",
  vehicleCode: "VEH-0001",
  vehicleNumber: "MH12AB1234",
  vehicleType: "bus",
  registrationDate: "2024-01-15",
  make: "BharatBenz",
  model: "1624 Sleeper Coach",
  manufacturingYear: 2024,
  seatingCapacity: 36,
  fuelType: "diesel",
  ownershipType: "attached",
  ownerName: "Star Logistics",
  ownerContact: "9876543210",
  insuranceNumber: "POL-98765",
  insuranceExpiry: "2027-11-20",
  fitnessCertificateNumber: "FC-12345",
  fitnessExpiry: "2027-10-15",
  pucNumber: "PUC-5555",
  pucExpiry: "2027-09-10",
  permitNumber: "ALL-IND-01",
  permitExpiry: "2027-03-01",
  notes: "Executive coach with AC and audio system.",
  isActive: true,
};

const mockTrips = [
  {
    id: "trp_1",
    tripCode: "TRP-0101",
    bookingDate: "2026-08-10",
    vehicleId: "veh_1",
    vehicleNumber: "MH12AB1234",
    status: "completed",
    driverName: "Rajesh Patil",
    pickupLocation: "Mumbai HQ",
    dropLocation: "Pune MIDC",
    totalKm: 320,
    endDateTime: "2026-08-10T20:00:00.000Z",
  },
];

describe("VehicleForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTrips.mockReturnValue(mockTrips);
  });

  const renderAddMode = () =>
    render(
      <MemoryRouter initialEntries={["/vehicles/new"]}>
        <Routes>
          <Route path="/vehicles/new" element={<VehicleForm />} />
        </Routes>
      </MemoryRouter>,
    );

  const renderEditMode = (vehicleId = "veh_1") =>
    render(
      <MemoryRouter initialEntries={[`/vehicles/${vehicleId}/edit`]}>
        <Routes>
          <Route path="/vehicles/:vehicleId/edit" element={<VehicleForm />} />
        </Routes>
      </MemoryRouter>,
    );

  describe("ADD MODE", () => {
    it("renders Add Vehicle heading, identity inputs, and action buttons", () => {
      renderAddMode();

      expect(
        screen.getByRole("heading", { name: "Add Vehicle" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Register a new fleet asset/i),
      ).toBeInTheDocument();

      expect(
        screen.getByText("Vehicle Registration Number"),
      ).toBeInTheDocument();
      expect(screen.getByText("Internal Fleet ID (Code)")).toBeInTheDocument();
      expect(screen.getAllByText("Vehicle Type")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Registration Date")[0]).toBeInTheDocument();

      expect(
        screen.getByRole("button", { name: "Discard Changes" }),
      ).toBeInTheDocument();
      expect(
        screen.getAllByRole("button", { name: /Save Vehicle/i })[0],
      ).toBeInTheDocument();
    });

    it("displays auto-uppercase registration number input", () => {
      renderAddMode();

      const regInput = screen.getByPlaceholderText("MH20AB1234");
      fireEvent.change(regInput, { target: { value: "mh12xy9999" } });

      expect(regInput.value).toBe("MH12XY9999");
    });

    it("shows validation errors and toast when required fields are missing", async () => {
      renderAddMode();

      const saveBtn = screen.getAllByRole("button", {
        name: /Save Vehicle/i,
      })[0];
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(
          screen.getByText("Vehicle registration number is required."),
        ).toBeInTheDocument();
        expect(
          screen.getByText("Vehicle make/manufacturer is required."),
        ).toBeInTheDocument();
        expect(
          screen.getByText("Vehicle model is required."),
        ).toBeInTheDocument();
      });

      expect(saveVehicle).not.toHaveBeenCalled();
    });

    it("successfully creates a vehicle and navigates to /vehicles", async () => {
      saveVehicle.mockReturnValue({
        id: "veh_new_123",
        vehicleCode: "VEH-0005",
        vehicleNumber: "MH12AB9999",
      });

      renderAddMode();

      // Fill in required fields
      fireEvent.change(screen.getByPlaceholderText("MH20AB1234"), {
        target: { value: "MH12AB9999" },
      });
      fireEvent.change(
        screen.getByPlaceholderText("e.g. Tata, BharatBenz, Ashok Leyland"),
        { target: { value: "Tata" } },
      );
      fireEvent.change(
        screen.getByPlaceholderText("e.g. Starbus Ultra, Urbania 17S"),
        { target: { value: "Starbus" } },
      );
      fireEvent.change(screen.getByPlaceholderText("e.g. 45"), {
        target: { value: "45" },
      });

      // Compliance dates
      fireEvent.change(screen.getByLabelText(/Insurance Expiry Date/i), {
        target: { value: "2027-12-31" },
      });
      fireEvent.change(screen.getByLabelText(/Fitness Expiry Date/i), {
        target: { value: "2027-12-31" },
      });
      fireEvent.change(screen.getByLabelText(/PUC Expiry Date/i), {
        target: { value: "2027-12-31" },
      });

      const saveBtn = screen.getAllByRole("button", {
        name: /Save Vehicle/i,
      })[0];
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(saveVehicle).toHaveBeenCalledWith(
          expect.objectContaining({
            vehicleNumber: "MH12AB9999",
            make: "Tata",
            model: "Starbus",
            seatingCapacity: 45,
            fuelType: "diesel",
            ownershipType: "own",
            isActive: true,
          }),
        );
      });

      expect(mockNavigate).toHaveBeenCalledWith("/vehicles", {
        state: expect.objectContaining({
          highlightedVehicleId: "veh_new_123",
        }),
      });
    });
  });

  describe("EDIT MODE", () => {
    beforeEach(() => {
      getVehicleById.mockReturnValue(mockExistingVehicle);
    });

    it("loads existing vehicle data and shows Edit Vehicle Profile heading", async () => {
      renderEditMode("veh_1");

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Edit Vehicle Profile" }),
        ).toBeInTheDocument();
      });

      expect(screen.getByText("VEH-0001")).toBeInTheDocument();
      expect(screen.getByDisplayValue("MH12AB1234")).toBeInTheDocument();
      expect(screen.getByDisplayValue("BharatBenz")).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("1624 Sleeper Coach"),
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue("36")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Star Logistics")).toBeInTheDocument();
      expect(screen.getByDisplayValue("9876543210")).toBeInTheDocument();
    });

    it("displays real operational snapshot metrics computed from trips", async () => {
      renderEditMode("veh_1");

      await waitFor(() => {
        expect(
          screen.getByText("Vehicle Operational Snapshot"),
        ).toBeInTheDocument();
      });

      expect(screen.getByText("Total Trips")).toBeInTheDocument();
      expect(screen.getByText("Distance Logged")).toBeInTheDocument();
      expect(screen.getByText("TRP-0101")).toBeInTheDocument();
      expect(screen.getByText(/Mumbai HQ → Pune MIDC/i)).toBeInTheDocument();
    });

    it("submits updated vehicle data through updateVehicle", async () => {
      updateVehicle.mockReturnValue({
        ...mockExistingVehicle,
        make: "Mercedes-Benz",
      });

      renderEditMode("veh_1");

      await waitFor(() => {
        expect(screen.getByDisplayValue("BharatBenz")).toBeInTheDocument();
      });

      const makeInput = screen.getByDisplayValue("BharatBenz");
      fireEvent.change(makeInput, { target: { value: "Mercedes-Benz" } });

      const saveBtn = screen.getAllByRole("button", {
        name: /Save Changes/i,
      })[0];
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(updateVehicle).toHaveBeenCalledWith(
          "veh_1",
          expect.objectContaining({
            make: "Mercedes-Benz",
            vehicleNumber: "MH12AB1234",
          }),
        );
      });

      expect(mockNavigate).toHaveBeenCalledWith("/vehicles", {
        state: expect.objectContaining({
          highlightedVehicleId: "veh_1",
        }),
      });
    });

    it("handles non-existent vehicle ID gracefully", async () => {
      getVehicleById.mockReturnValue(null);

      renderEditMode("non_existent_id");

      await waitFor(() => {
        expect(screen.getByText("Vehicle Not Found")).toBeInTheDocument();
      });
    });
  });

  describe("OWNERSHIP CONDITIONAL BEHAVIOR", () => {
    it("toggles owner name and contact fields when changing ownership type", () => {
      renderAddMode();

      // By default, ownership is 'own'
      expect(
        screen.getByText(/Direct company-owned vehicle/i),
      ).toBeInTheDocument();
      expect(
        screen.queryByPlaceholderText("Owner or Agency Name"),
      ).not.toBeInTheDocument();

      // Switch to 'attached'
      const ownershipSelect = screen.getByRole("combobox", {
        name: "Ownership Type",
      });
      fireEvent.change(ownershipSelect, { target: { value: "attached" } });

      expect(
        screen.getByPlaceholderText("Owner or Agency Name"),
      ).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("10-digit mobile number"),
      ).toBeInTheDocument();

      // Switch back to 'own'
      fireEvent.change(ownershipSelect, { target: { value: "own" } });
      expect(
        screen.queryByPlaceholderText("Owner or Agency Name"),
      ).not.toBeInTheDocument();
    });
  });

  describe("COMPLIANCE & STATUS", () => {
    it("renders compliance document sections and active status switch", () => {
      renderAddMode();

      expect(screen.getByText("Compliance & Documents")).toBeInTheDocument();
      expect(screen.getByText("Insurance Policy")).toBeInTheDocument();
      expect(screen.getByText("Fitness Certificate")).toBeInTheDocument();
      expect(
        screen.getByText("PUC (Pollution Under Control)"),
      ).toBeInTheDocument();
      expect(screen.getByText("Transport Permit")).toBeInTheDocument();

      const activeSwitch = screen.getByRole("switch", {
        name: "Vehicle Active Status",
      });
      expect(activeSwitch).toBeChecked();

      fireEvent.click(activeSwitch);
      expect(activeSwitch).not.toBeChecked();
      expect(
        screen.getByText(/Inactive \/ Out of Service/i),
      ).toBeInTheDocument();
    });
  });

  describe("NAVIGATION & DISCARD", () => {
    it("navigates back to /vehicles on Discard Changes", () => {
      renderAddMode();

      const discardBtn = screen.getByRole("button", {
        name: "Discard Changes",
      });
      fireEvent.click(discardBtn);

      expect(mockNavigate).toHaveBeenCalledWith("/vehicles");
    });
  });
});
