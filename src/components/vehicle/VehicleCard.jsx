import Card, { CardContent } from "../ui/Card";
import Button from "../ui/Button";
import { getVehicleDocumentStatus } from "../../utils/vehicleDocumentStatus";
import {
  VEHICLE_TYPE_LABELS,
  FUEL_TYPE_LABELS,
  OWNERSHIP_TYPE_LABELS,
} from "../../constants/vehicles";

const STATUS_CLASSES = {
  active: "bg-success/10 text-success border border-success/20",
  inactive: "bg-muted/20 text-muted border border-border",

  valid: "bg-success/10 text-success border border-success/20",
  expiring_soon: "bg-warning/10 text-warning border border-warning/20",
  expired: "bg-error/10 text-error border border-error/20",
};

function StatusBadge({ value, label, title }) {
  return (
    <span
      title={title}
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5",
        "text-xs font-medium whitespace-nowrap",
        STATUS_CLASSES[value] ?? "bg-muted/20 text-muted border border-border",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

export default function VehicleCard({
  vehicle,
  onView,
  onEdit,
  onDelete,
  highlighted = false,
}) {
  const docStatus = getVehicleDocumentStatus(vehicle);

  const vehicleStatus = vehicle.isActive
    ? { value: "active", label: "Active" }
    : { value: "inactive", label: "Inactive" };

  const typeLabel =
    VEHICLE_TYPE_LABELS[vehicle.vehicleType] ||
    vehicle.vehicleType ||
    "Vehicle";
  const fuelLabel = FUEL_TYPE_LABELS[vehicle.fuelType] || vehicle.fuelType;
  const ownershipLabel =
    OWNERSHIP_TYPE_LABELS[vehicle.ownershipType] || vehicle.ownershipType;

  return (
    <Card className={highlighted ? "ring-2 ring-primary/40 shadow-sm" : ""}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold tracking-tight text-foreground">
              {vehicle.vehicleNumber}
            </h3>

            <p className="mt-0.5 text-xs text-muted">
              {vehicle.vehicleCode}
              {" · "}
              {typeLabel}
            </p>
          </div>

          <StatusBadge
            value={vehicleStatus.value}
            label={vehicleStatus.label}
          />
        </div>

        {/* Details Grid */}
        <div className="mt-4 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted">Make / Model</span>
            <span className="truncate font-medium text-foreground">
              {vehicle.make} {vehicle.model}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-muted">Capacity & Fuel</span>
            <span className="font-medium text-foreground">
              {vehicle.seatingCapacity} Seats · {fuelLabel}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-muted">Ownership</span>
            <span className="truncate font-medium text-foreground">
              {ownershipLabel}
              {(vehicle.ownershipType === "attached" ||
                vehicle.ownershipType === "leased") &&
                vehicle.ownerName &&
                ` (${vehicle.ownerName})`}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
            <span className="text-muted">Compliance</span>
            <StatusBadge
              value={docStatus.value}
              label={docStatus.label}
              title={docStatus.summary}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onView(vehicle)}
            className="text-xs"
          >
            View
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onEdit(vehicle)}
            className="text-xs"
          >
            Edit
          </Button>

          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => onDelete(vehicle)}
            className="text-xs"
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
