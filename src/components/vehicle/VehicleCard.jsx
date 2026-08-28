import Card, { CardContent } from "../ui/Card";
import Button from "../ui/Button";
import { getVehicleDocumentStatus } from "../../utils/vehicleDocumentStatus";
import { getVehicleOperationalState } from "../../utils/vehicleOperationalStatus";
import {
  VEHICLE_TYPE_LABELS,
  FUEL_TYPE_LABELS,
  OWNERSHIP_TYPE_LABELS,
} from "../../constants/vehicles";

const STATUS_CLASSES = {
  active:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  inactive:
    "bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20",

  valid:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  expiring_soon:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  expired:
    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
};

function StatusBadge({ value, label, title }) {
  return (
    <span
      title={title}
      className={[
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5",
        "text-xs font-medium whitespace-nowrap",
        STATUS_CLASSES[value] ??
          "bg-slate-500/10 text-slate-500 border border-slate-500/20",
      ].join(" ")}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
          value === "active" || value === "valid"
            ? "bg-emerald-500"
            : value === "expiring_soon"
              ? "bg-amber-500"
              : value === "expired"
                ? "bg-rose-500"
                : "bg-slate-400"
        }`}
      />
      {label}
    </span>
  );
}

export default function VehicleCard({
  vehicle,
  trips = [],
  onView,
  onEdit,
  onDelete,
  highlighted = false,
}) {
  const docStatus = getVehicleDocumentStatus(vehicle);
  const operational = getVehicleOperationalState(vehicle, trips);

  const vehicleStatus =
    vehicle.isActive !== false
      ? { value: "active", label: "Active" }
      : { value: "inactive", label: "Inactive" };

  const typeLabel =
    VEHICLE_TYPE_LABELS[vehicle.vehicleType] ||
    vehicle.vehicleType ||
    "Vehicle";
  const fuelLabel = FUEL_TYPE_LABELS[vehicle.fuelType] || vehicle.fuelType;
  const ownershipLabel =
    OWNERSHIP_TYPE_LABELS[vehicle.ownershipType] || vehicle.ownershipType;

  // Primary compliance message if any
  const criticalDoc = docStatus.criticalItems?.[0];

  return (
    <Card
      className={[
        "transition-all duration-200 rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] shadow-xs",
        highlighted
          ? "ring-2 ring-primary/40 shadow-sm"
          : "hover:border-slate-300 dark:hover:border-slate-600",
      ].join(" ")}
    >
      <CardContent className="p-4 flex flex-col justify-between h-full">
        <div>
          {/* Header: Reg Number, Code, Status Badges */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">
                {vehicle.vehicleNumber}
              </h3>

              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {vehicle.vehicleCode}
                {" · "}
                {typeLabel}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <StatusBadge
                value={vehicleStatus.value}
                label={vehicleStatus.label}
              />
              {operational.operationalStatus === "on_trip" && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                  On Trip ({operational.subtext})
                </span>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="mt-3.5 space-y-2 text-xs divide-y divide-slate-100 dark:divide-[#202330]">
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-slate-500 dark:text-slate-400">
                Make / Model
              </span>
              <span className="truncate font-medium text-slate-900 dark:text-slate-100">
                {vehicle.make} {vehicle.model}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1.5">
              <span className="text-slate-500 dark:text-slate-400">
                Capacity & Fuel
              </span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {vehicle.seatingCapacity} Seats · {fuelLabel}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1.5">
              <span className="text-slate-500 dark:text-slate-400">
                Ownership
              </span>
              <span className="truncate font-medium text-slate-900 dark:text-slate-100">
                {ownershipLabel}
                {(vehicle.ownershipType === "attached" ||
                  vehicle.ownershipType === "leased") &&
                  vehicle.ownerName &&
                  ` (${vehicle.ownerName})`}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1.5">
              <span className="text-slate-500 dark:text-slate-400">
                Compliance
              </span>
              <div className="flex flex-col items-end">
                <StatusBadge
                  value={docStatus.value}
                  label={docStatus.label}
                  title={docStatus.summary}
                />
                {criticalDoc && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[140px]">
                    {criticalDoc.name}
                    {criticalDoc.daysLeft !== null &&
                      (criticalDoc.daysLeft < 0
                        ? ` (expired ${Math.abs(criticalDoc.daysLeft)}d ago)`
                        : ` (${criticalDoc.daysLeft}d left)`)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="mt-4 flex items-center justify-end gap-1.5 border-t border-slate-100 dark:border-[#202330] pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onView(vehicle)}
            className="text-xs h-8 px-2.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            View
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onEdit(vehicle)}
            className="text-xs h-8 px-2.5"
          >
            Edit
          </Button>

          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => onDelete(vehicle)}
            className="text-xs h-8 px-2.5"
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
