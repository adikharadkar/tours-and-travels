import Card, { CardContent } from "../ui/Card";
import Button from "../ui/Button";
import { TripStatusBadge, PaymentStatusBadge } from "./TripStatusBadge";
import { TRIP_TYPE_LABELS } from "../../constants/trips";

function formatDateTime(dateTimeString) {
  if (!dateTimeString) return "—";
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return dateTimeString;
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateTimeString;
  }
}

export default function TripCard({
  trip,
  customer,
  vehicle,
  driver,
  onView,
  onEdit,
  onConfirm,
  onStart,
  onComplete,
  onCancel,
  onDelete,
  onCreateInvoice,
  highlighted = false,
}) {
  const tripTypeLabel =
    TRIP_TYPE_LABELS[trip.tripType] || trip.tripType || "Trip";
  const customerName = customer?.name || "Customer";
  const vehicleText = vehicle
    ? `${vehicle.vehicleNumber || vehicle.vehicleCode} (${vehicle.make || ""} ${vehicle.model || ""})`.trim()
    : "Vehicle";
  const driverText = driver?.name ? driver.name : "Driver";

  return (
    <Card className={highlighted ? "ring-2 ring-primary/40 shadow-sm" : ""}>
      <CardContent className="p-4">
        {/* Header: Trip Code & Badges */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-foreground">
                {trip.tripCode}
              </span>
              <span className="text-xs text-muted">· {tripTypeLabel}</span>
            </div>
            <h3 className="mt-1 truncate text-base font-bold text-foreground">
              {customerName}
            </h3>
          </div>

          <div className="flex flex-col items-end gap-1">
            <TripStatusBadge status={trip.status} />
            <PaymentStatusBadge paymentStatus={trip.paymentStatus} />
          </div>
        </div>

        {/* Route */}
        <div className="mt-3 rounded-md bg-background/50 p-2.5 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <span className="truncate">{trip.pickupLocation || "Pickup"}</span>
            <span className="text-muted">→</span>
            <span className="truncate">{trip.dropLocation || "Drop"}</span>
          </div>
          {trip.stops && (
            <p className="mt-1 truncate text-xs text-muted">
              Via: {trip.stops}
            </p>
          )}
        </div>

        {/* Details Grid */}
        <div className="mt-3 space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted">Start</span>
            <span className="font-medium text-foreground">
              {formatDateTime(trip.startDateTime)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-muted">Duration</span>
            <span className="font-medium text-foreground">
              {trip.duration || "—"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-muted">Vehicle</span>
            <span className="truncate font-medium text-foreground">
              {vehicleText}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-muted">Driver</span>
            <span className="truncate font-medium text-foreground">
              {driverText}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-border pt-1.5 font-medium">
            <span className="text-muted">Total Amount</span>
            <span className="font-mono text-sm font-bold text-foreground">
              ₹{Number(trip.totalAmount || 0).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap items-center justify-end gap-1.5 border-t border-border pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onView(trip)}
            className="text-xs"
          >
            View
          </Button>

          {trip.status !== "completed" && trip.status !== "cancelled" && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onEdit(trip)}
              className="text-xs"
            >
              Edit
            </Button>
          )}

          {trip.status === "completed" && onCreateInvoice && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onCreateInvoice(trip)}
              className="text-xs"
            >
              Generate Invoice
            </Button>
          )}

          {trip.status === "draft" && onConfirm && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onConfirm(trip)}
              className="text-xs"
            >
              Confirm
            </Button>
          )}

          {trip.status === "confirmed" && onStart && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onStart(trip)}
              className="text-xs"
            >
              Start
            </Button>
          )}

          {trip.status === "in_progress" && onComplete && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => onComplete(trip)}
              className="text-xs"
            >
              Complete
            </Button>
          )}

          {(trip.status === "draft" || trip.status === "confirmed") &&
            onCancel && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onCancel(trip)}
                className="text-xs text-error hover:bg-error/10"
              >
                Cancel
              </Button>
            )}

          {trip.status === "draft" && onDelete && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => onDelete(trip)}
              className="text-xs"
            >
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
