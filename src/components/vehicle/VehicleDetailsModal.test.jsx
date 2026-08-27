import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import VehicleDetailsModal from "./VehicleDetailsModal";
import { getVehicleDocumentStatus } from "../../utils/vehicleDocumentStatus";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

const sampleTrips = [
  {
    id: "trip-1",
    tripCode: "TRP-0101",
    status: "in_progress",
    vehicleId: "vehicle-1",
    vehicleNumber: "MH20AB1234",
    driverName: "Rajesh Patil",
    pickupLocation: "Mumbai HQ",
    dropLocation: "Pune MIDC Plant",
    startDateTime: "2026-08-20T08:00",
  },
  {
    id: "trip-2",
    tripCode: "TRP-0099",
    status: "completed",
    vehicleId: "vehicle-1",
    vehicleNumber: "MH20AB1234",
    driverName: "Suresh Rao",
    pickupLocation: "Surat Port",
    dropLocation: "Mumbai Warehouse",
    bookingDate: "2026-08-15",
    startDateTime: "2026-08-15T09:00",
  },
];

const renderComponent = (props = {}) => {
  return render(
    <MemoryRouter>
      <VehicleDetailsModal
        open={true}
        vehicle={vehicle}
        trips={[]}
        onClose={vi.fn()}
        onEdit={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  );
};

describe("VehicleDetailsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getVehicleDocumentStatus.mockReturnValue(documentStatus);
  });

  it("renders nothing when vehicle is not provided", () => {
    const { container } = render(
      <MemoryRouter>
        <VehicleDetailsModal
          open
          vehicle={null}
          onClose={vi.fn()}
          onEdit={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when modal is closed", () => {
    render(
      <MemoryRouter>
        <VehicleDetailsModal
          open={false}
          vehicle={vehicle}
          onClose={vi.fn()}
          onEdit={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders vehicle header information", () => {
    renderComponent();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "MH20AB1234",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("VEH-0001")).toBeInTheDocument();
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
  });

  it("renders technical specifications", () => {
    renderComponent();

    expect(screen.getByText("Technical Specs")).toBeInTheDocument();
    expect(screen.getByText("VEH-0001")).toBeInTheDocument();
    expect(screen.getAllByText("MH20AB1234").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bus").length).toBeGreaterThan(0);
    expect(screen.getByText("15/08/2020")).toBeInTheDocument();
    expect(screen.getByText("Tata")).toBeInTheDocument();
    expect(screen.getByText("Starbus")).toBeInTheDocument();
    expect(screen.getByText("2020")).toBeInTheDocument();
    expect(screen.getByText("45 Passengers")).toBeInTheDocument();
    expect(screen.getAllByText("Diesel").length).toBeGreaterThan(0);
  });

  it("renders active status badge", () => {
    renderComponent({ vehicle: { ...vehicle, isActive: true } });
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
  });

  it("renders inactive status badge", () => {
    renderComponent({ vehicle: { ...vehicle, isActive: false } });
    expect(screen.getAllByText("Inactive").length).toBeGreaterThan(0);
  });

  it("renders ownership information for company-owned vehicle", () => {
    renderComponent({ vehicle });

    expect(screen.getByText("Ownership Details")).toBeInTheDocument();
    expect(screen.getByText("Company Owned (Own)")).toBeInTheDocument();
    expect(screen.queryByText("Owner Contact")).not.toBeInTheDocument();
  });

  it("renders owner details for an attached vehicle", () => {
    renderComponent({ vehicle: attachedVehicle });

    expect(screen.getByText("Attached")).toBeInTheDocument();
    expect(screen.getByText("Owner Name")).toBeInTheDocument();
    expect(screen.getByText("ABC Travels")).toBeInTheDocument();
    expect(screen.getByText("Owner Contact")).toBeInTheDocument();
    expect(screen.getByText("9876543210")).toBeInTheDocument();
  });

  it("renders owner details for a leased vehicle", () => {
    renderComponent({ vehicle: leasedVehicle });

    expect(screen.getByText("Leased")).toBeInTheDocument();
    expect(screen.getByText("XYZ Transport")).toBeInTheDocument();
    expect(screen.getByText("9876543211")).toBeInTheDocument();
  });

  it("renders overall document health summary", () => {
    renderComponent();

    expect(screen.getByText("Document Health")).toBeInTheDocument();
    expect(getVehicleDocumentStatus).toHaveBeenCalledWith(vehicle);
  });

  it("renders individual compliance documents", () => {
    renderComponent();

    expect(screen.getByText("Insurance Policy")).toBeInTheDocument();
    expect(screen.getByText("INS-12345")).toBeInTheDocument();
    expect(screen.getByText("20/08/2027")).toBeInTheDocument();

    expect(screen.getByText("Fitness Certificate")).toBeInTheDocument();
    expect(screen.getByText("FIT-12345")).toBeInTheDocument();
    expect(screen.getByText("15/09/2027")).toBeInTheDocument();

    expect(screen.getByText("PUC Certificate")).toBeInTheDocument();
    expect(screen.getByText("PUC-12345")).toBeInTheDocument();
    expect(screen.getByText("10/12/2026")).toBeInTheDocument();

    expect(screen.getByText("National Permit")).toBeInTheDocument();
    expect(screen.getByText("PERMIT-12345")).toBeInTheDocument();
    expect(screen.getByText("20/01/2027")).toBeInTheDocument();
  });

  it("renders document evaluation messages", () => {
    renderComponent();

    expect(screen.getByText("Insurance is valid.")).toBeInTheDocument();
    expect(
      screen.getByText("Fitness certificate is valid."),
    ).toBeInTheDocument();
    expect(screen.getByText("PUC is valid.")).toBeInTheDocument();
    expect(screen.getByText("Permit is valid.")).toBeInTheDocument();
  });

  it("renders expiring document status badge", () => {
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

    renderComponent();

    expect(screen.getAllByText("Expiring Soon").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Insurance expires in 10 days."),
    ).toBeInTheDocument();
  });

  it("renders expired document status badge", () => {
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

    renderComponent();

    expect(screen.getAllByText("Expired").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Fitness certificate has expired."),
    ).toBeInTheDocument();
  });

  it("renders operational availability when available with no active trip", () => {
    renderComponent({ trips: [] });

    expect(screen.getByText("Available for Assignment")).toBeInTheDocument();
    expect(
      screen.getByText("No active trip in progress for this vehicle."),
    ).toBeInTheDocument();
  });

  it("renders current assignment when active trip exists", () => {
    renderComponent({ trips: sampleTrips });

    expect(screen.getByText("Current Assignment")).toBeInTheDocument();
    expect(screen.getByText("TRP-0101")).toBeInTheDocument();
    expect(screen.getByText("Mumbai HQ")).toBeInTheDocument();
    expect(screen.getByText("Pune MIDC Plant")).toBeInTheDocument();
    expect(screen.getByText("Rajesh Patil")).toBeInTheDocument();
    expect(screen.getByText("View Trip →")).toBeInTheDocument();
  });

  it("navigates to trip when View Trip is clicked", () => {
    const onClose = vi.fn();
    renderComponent({ trips: sampleTrips, onClose });

    fireEvent.click(screen.getByText("View Trip →"));

    expect(onClose).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/trips", {
      state: {
        highlightedTripId: "trip-1",
        search: "TRP-0101",
      },
    });
  });

  it("renders recent trips in recent activity card", () => {
    renderComponent({ trips: sampleTrips });

    expect(screen.getByText("Recent Trips")).toBeInTheDocument();
    expect(screen.getByText("TRP-0099")).toBeInTheDocument();
    expect(
      screen.getByText("Surat Port → Mumbai Warehouse"),
    ).toBeInTheDocument();
  });

  it("renders internal notes", () => {
    renderComponent();

    expect(screen.getByText("Internal Notes")).toBeInTheDocument();
    expect(
      screen.getByText('"Vehicle is regularly serviced."'),
    ).toBeInTheDocument();
  });

  it("renders fallback text when notes are empty", () => {
    renderComponent({ vehicle: { ...vehicle, notes: "" } });

    expect(screen.getByText("No internal notes recorded.")).toBeInTheDocument();
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
    };

    renderComponent({ vehicle: incompleteVehicle });

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("calls onClose when Close is clicked", () => {
    const onClose = vi.fn();
    renderComponent({ onClose });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Close",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the modal top close X button is clicked", () => {
    const onClose = vi.fn();
    renderComponent({ onClose });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Close modal",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onEdit with the vehicle when Edit Vehicle is clicked", () => {
    const onClose = vi.fn();
    const onEdit = vi.fn();
    renderComponent({ onClose, onEdit });

    // Click the header "Edit Vehicle" button
    const editButtons = screen.getAllByRole("button", {
      name: /Edit Vehicle/i,
    });
    fireEvent.click(editButtons[0]);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(vehicle);
  });

  it("navigates to /trips when View All Trips is clicked", () => {
    const onClose = vi.fn();
    renderComponent({ onClose });

    fireEvent.click(
      screen.getByRole("button", {
        name: "View All Trips",
      }),
    );

    expect(onClose).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/trips", {
      state: {
        search: "MH20AB1234",
        vehicleFilter: "vehicle-1",
      },
    });
  });

  it("handles Delete Vehicle button click", () => {
    const onDelete = vi.fn();
    const onClose = vi.fn();
    renderComponent({ onDelete, onClose });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Delete Vehicle",
      }),
    );

    expect(onClose).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalledWith(vehicle);
  });
});
