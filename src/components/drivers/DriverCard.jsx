import Card, { CardContent } from "../ui/Card";
import Button from "../ui/Button";
import { getDriverLicenseStatus } from "../../utils/driverLicenseStatus";
import {
  DRIVER_TYPE_LABELS,
  PREFIX_LABELS,
  LICENSE_TYPE_LABELS,
} from "../../constants/drivers";

const STATUS_CLASSES = {
  active: "bg-success/10 text-success border border-success/20",
  inactive: "bg-muted/20 text-muted border border-border",

  valid: "bg-success/10 text-success border border-success/20",
  expiring_soon: "bg-warning/10 text-warning border border-warning/20",
  expired: "bg-error/10 text-error border border-error/20",
  not_provided: "bg-muted/20 text-muted border border-border",
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

export default function DriverCard({
  driver,
  onView,
  onEdit,
  onDelete,
  highlighted = false,
}) {
  const licenseStatus = getDriverLicenseStatus(driver);

  const driverStatus =
    driver.isActive !== false
      ? { value: "active", label: "Active" }
      : { value: "inactive", label: "Inactive" };

  const prefixLabel = PREFIX_LABELS[driver.prefix] || "";
  const displayName = prefixLabel
    ? `${prefixLabel} ${driver.name}`
    : driver.name;
  const driverTypeLabel =
    DRIVER_TYPE_LABELS[driver.driverType] || driver.driverType || "Driver";
  const licenseTypeLabel =
    LICENSE_TYPE_LABELS[driver.licenseType] || driver.licenseType || "License";

  return (
    <Card className={highlighted ? "ring-2 ring-primary/40 shadow-sm" : ""}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold tracking-tight text-foreground">
              {displayName}
            </h3>

            <p className="mt-0.5 text-xs text-muted">
              {driver.driverCode}
              {" · "}
              <span className="font-medium text-foreground">
                {driverTypeLabel}
              </span>
            </p>
          </div>

          <StatusBadge value={driverStatus.value} label={driverStatus.label} />
        </div>

        {/* Details Grid */}
        <div className="mt-4 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted">Mobile</span>
            <span className="font-medium font-mono text-foreground">
              {driver.mobile || "—"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-muted">License No.</span>
            <span className="truncate font-mono font-medium text-foreground">
              {driver.licenseNumber}{" "}
              <span className="text-muted">({licenseTypeLabel})</span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
            <span className="text-muted">License Status</span>
            <StatusBadge
              value={licenseStatus.value}
              label={licenseStatus.label}
              title={licenseStatus.message}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onView(driver)}
            className="text-xs"
          >
            View
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onEdit(driver)}
            className="text-xs"
          >
            Edit
          </Button>

          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => onDelete(driver)}
            className="text-xs"
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
