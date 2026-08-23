import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import VehicleDetailsModal from "./VehicleDetailsModal";

import { getVehicleDocumentStatus } from "../../utils/vehicleDocumentStatus";

vi.mock("../../utils/vehicleDocumentStatus", () => ({
  getVehicleDocumentStatus: vi.fn(),
}));

const vehicle = {
  id: "vehicle-1",
  vehicleCode: "VEH-0001",
  vehicleNumber: "MH20AB1234",

  vehicleType: "bus",
  registrationDate: "2020-08-15",
  make: "Tata",
  model: "Starbus",
  manufacturingYear: 2020,
  seatingCapacity: 45,
  fuelType: "diesel",

  ownershipType: "own",
  ownerName: "",
  ownerContact: "",

  insuranceNumber: "INS-12345",
  insuranceExpiry: "2027-08-20",

  fitnessCertificateNumber: "FIT-12345",
  fitnessExpiry: "2027-09-15",

  pucNumber: "PUC-12345",
  pucExpiry: "2026-12-10",

  permitNumber: "PERMIT-12345",
  permitExpiry: "2027-01-20",

  notes: "Vehicle is regularly serviced.",

  isActive: true,

  createdAt: "2026-08-19T10:30:00.000Z",
  updatedAt: "2026-08-20T15:45:00.000Z",
};

const attachedVehicle = {
  ...vehicle,
  id: "vehicle-2",
  vehicleCode: "VEH-0002",
  vehicleNumber: "MH20CD5678",

  ownershipType: "attached",
  ownerName: "ABC Travels",
  ownerContact: "9876543210",
};

const leasedVehicle = {
  ...vehicle,
  id: "vehicle-3",
  vehicleCode: "VEH-0003",
  vehicleNumber: "MH20EF9012",

  ownershipType: "leased",
  ownerName: "XYZ Transport",
  ownerContact: "9876543211",
};

const documentStatus = {
  value: "valid",
  label: "Valid",
  summary: "All vehicle documents are valid.",
  evaluations: [
    {
      name: "Insurance",
      status: "valid",
      label: "Valid",
      message: "Insurance is valid.",
    },
    {
      name: "Fitness Certificate",
      status: "valid",
      label: "Valid",
      message: "Fitness certificate is valid.",
    },
    {
      name: "PUC",
      status: "valid",
      label: "Valid",
      message: "PUC is valid.",
    },
    {
      name: "Permit",
      status: "valid",
      label: "Valid",
      message: "Permit is valid.",
    },
  ],
};

describe("VehicleDetailsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getVehicleDocumentStatus.mockReturnValue(documentStatus);
  });

  it("renders nothing when vehicle is not provided", () => {
    const { container } = render(
      <VehicleDetailsModal
        open
        vehicle={null}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when modal is closed", () => {
    render(
      <VehicleDetailsModal
        open={false}
        vehicle={vehicle}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders vehicle header information", () => {
    render(
      <VehicleDetailsModal
        open
        vehicle={vehicle}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "MH20AB1234",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("VEH-0001", {
        selector: "div",
      }),
    ).toBeInTheDocument();

    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
  });

  it("renders vehicle information", () => {
    render(
      <VehicleDetailsModal
        open
        vehicle={vehicle}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("Vehicle Information")).toBeInTheDocument();

    expect(screen.getByText("VEH-0001")).toBeInTheDocument();

    expect(screen.getAllByText("MH20AB1234")).toHaveLength(2);

    expect(screen.getAllByText("Bus").length).toBeGreaterThan(0);

    expect(screen.getByText("15/08/2020")).toBeInTheDocument();

    expect(screen.getByText("Tata")).toBeInTheDocument();

    expect(screen.getByText("Starbus")).toBeInTheDocument();

    expect(screen.getByText("2020")).toBeInTheDocument();

    expect(screen.getByText("45 Passengers")).toBeInTheDocument();

    expect(screen.getAllByText("Diesel").length).toBeGreaterThan(0);
  });

  it("renders active status", () => {
    render(
      <VehicleDetailsModal
        open
        vehicle={vehicle}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
  });

  it("renders inactive status", () => {
    const inactiveVehicle = {
      ...vehicle,
      isActive: false,
    };

    render(
      <VehicleDetailsModal
        open
        vehicle={inactiveVehicle}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getAllByText("Inactive").length).toBeGreaterThan(0);
  });

  it("renders ownership information for an owned vehicle", () => {
    render(
      <VehicleDetailsModal
        open
        vehicle={vehicle}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("Ownership Information")).toBeInTheDocument();

    expect(screen.getAllByText("Own").length).toBeGreaterThan(0);

    expect(screen.queryByText("Owner Name")).not.toBeInTheDocument();

    expect(screen.queryByText("Owner Contact")).not.toBeInTheDocument();
  });

  it("renders owner details for an attached vehicle", () => {
    render(
      <VehicleDetailsModal
        open
        vehicle={attachedVehicle}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("Attached")).toBeInTheDocument();

    expect(screen.getByText("Owner Name")).toBeInTheDocument();

    expect(screen.getByText("ABC Travels")).toBeInTheDocument();

    expect(screen.getByText("Owner Contact")).toBeInTheDocument();

    expect(screen.getByText("9876543210")).toBeInTheDocument();
  });

  it("renders owner details for a leased vehicle", () => {
    render(
      <VehicleDetailsModal
        open
        vehicle={leasedVehicle}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("Leased")).toBeInTheDocument();

    expect(screen.getByText("XYZ Transport")).toBeInTheDocument();

    expect(screen.getByText("9876543211")).toBeInTheDocument();
  });

  it("renders overall document status", () => {
    render(
      <VehicleDetailsModal
        open
        vehicle={vehicle}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Document & Compliance Information"),
    ).toBeInTheDocument();

    expect(screen.getByText("Overall: Valid")).toBeInTheDocument();

    expect(getVehicleDocumentStatus).toHaveBeenCalledWith(vehicle);
  });

  it("renders individual document information", () => {
    render(
      <VehicleDetailsModal
        open
        vehicle={vehicle}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("Insurance")).toBeInTheDocument();

    expect(screen.getByText("INS-12345")).toBeInTheDocument();

    expect(screen.getByText("20/08/2027")).toBeInTheDocument();

    expect(screen.getByText("Fitness Certificate")).toBeInTheDocument();

    expect(screen.getByText("FIT-12345")).toBeInTheDocument();

    expect(screen.getByText("15/09/2027")).toBeInTheDocument();

    expect(screen.getByText("PUC Certificate")).toBeInTheDocument();

    expect(screen.getByText("PUC-12345")).toBeInTheDocument();

    expect(screen.getByText("10/12/2026")).toBeInTheDocument();

    expect(screen.getByText("Permit")).toBeInTheDocument();

    expect(screen.getByText("PERMIT-12345")).toBeInTheDocument();

    expect(screen.getByText("20/01/2027")).toBeInTheDocument();
  });

  it("renders document evaluation messages", () => {
    render(
      <VehicleDetailsModal
        open
        vehicle={vehicle}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("Insurance is valid.")).toBeInTheDocument();

    expect(
      screen.getByText("Fitness certificate is valid."),
    ).toBeInTheDocument();

    expect(screen.getByText("PUC is valid.")).toBeInTheDocument();

    expect(screen.getByText("Permit is valid.")).toBeInTheDocument();
  });

  it("renders expiring document status", () => {
    getVehicleDocumentStatus.mockReturnValue({
      ...documentStatus,
      value: "expiring_soon",
      label: "Expiring Soon",
      evaluations: [
        {
          name: "Insurance",
          status: "expiring_soon",
          label: "Expiring Soon",
          message: "Insurance expires in 10 days.",
        },
      ],
    });

    render(
      <VehicleDetailsModal
        open
        vehicle={vehicle}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("Overall: Expiring Soon")).toBeInTheDocument();

    expect(
      screen.getByText("Insurance expires in 10 days."),
    ).toBeInTheDocument();
  });

  it("renders expired document status", () => {
    getVehicleDocumentStatus.mockReturnValue({
      ...documentStatus,
      value: "expired",
      label: "Expired",
      evaluations: [
        {
          name: "Fitness Certificate",
          status: "expired",
          label: "Expired",
          message: "Fitness certificate has expired.",
        },
      ],
    });

    render(
      <VehicleDetailsModal
        open
        vehicle={vehicle}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("Overall: Expired")).toBeInTheDocument();

    expect(
      screen.getByText("Fitness certificate has expired."),
    ).toBeInTheDocument();
  });

  it("renders notes", () => {
    render(
      <VehicleDetailsModal
        open
        vehicle={vehicle}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("Additional Notes & Audit")).toBeInTheDocument();

    expect(
      screen.getByText("Vehicle is regularly serviced."),
    ).toBeInTheDocument();
  });

  it("renders fallback text when notes are empty", () => {
    const vehicleWithoutNotes = {
      ...vehicle,
      notes: "",
    };

    render(
      <VehicleDetailsModal
        open
        vehicle={vehicleWithoutNotes}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("No notes entered.")).toBeInTheDocument();
  });

  it("renders em dash for missing values", () => {
    const incompleteVehicle = {
      ...vehicle,
      manufacturingYear: "",
      make: "",
      model: "",
      seatingCapacity: null,
      insuranceNumber: "",
      insuranceExpiry: "",
      ownerName: "",
      ownerContact: "",
      createdAt: "",
      updatedAt: "",
    };

    render(
      <VehicleDetailsModal
        open
        vehicle={incompleteVehicle}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders audit information", () => {
    render(
      <VehicleDetailsModal
        open
        vehicle={vehicle}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.getByText("Record Created")).toBeInTheDocument();

    expect(screen.getByText("Last Updated")).toBeInTheDocument();
  });

  it("calls onClose when Close is clicked", () => {
    const onClose = vi.fn();

    render(
      <VehicleDetailsModal
        open
        vehicle={vehicle}
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
      <VehicleDetailsModal
        open
        vehicle={vehicle}
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

  it("closes the modal and calls onEdit with the vehicle", () => {
    const onClose = vi.fn();
    const onEdit = vi.fn();

    render(
      <VehicleDetailsModal
        open
        vehicle={vehicle}
        onClose={onClose}
        onEdit={onEdit}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit Vehicle",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);

    expect(onEdit).toHaveBeenCalledTimes(1);

    expect(onEdit).toHaveBeenCalledWith(vehicle);
  });
});
