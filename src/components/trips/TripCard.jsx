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
  onOpenActions,
  onMore,
  highlighted = false,
}) {
  const tripTypeLabel =
    TRIP_TYPE_LABELS[trip.tripType] || trip.tripType || "Trip";
  const customerName = customer?.name || "Customer";
  const vehicleText = vehicle
    ? `${vehicle.vehicleNumber || vehicle.vehicleCode} (${vehicle.make || ""} ${vehicle.model || ""})`.trim()
    : "Vehicle";
  const driverText = driver?.name ? driver.name : "Driver";

  const handleActionsClick = () => {
    if (onOpenActions) {
      onOpenActions(trip);
    } else if (onMore) {
      onMore(trip);
    }
  };

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

        {/* Actions: ONLY View and 3 Dots Actions Button */}
        <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onView?.(trip)}
            aria-label="View"
            className="text-xs inline-flex items-center gap-1.5 px-3 py-1.5"
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[16px]"
            >
              visibility
            </span>
            <span>View</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleActionsClick}
            aria-label="Trip actions"
            title="More actions"
            data-testid="trip-card-actions-btn"
            className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-[#262837] hover:bg-slate-100 dark:hover:bg-[#1f2230] text-slate-600 dark:text-slate-300 transition-colors"
          >
            <span
              aria-hidden="true"
              className="material-symbols-outlined text-[18px]"
            >
              more_vert
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
