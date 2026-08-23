import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalContent,
  ModalFooter,
  ModalClose,
} from "../ui/Modal";
import Button from "../ui/Button";
import { TripStatusBadge, PaymentStatusBadge } from "./TripStatusBadge";
import {
  TRIP_TYPE_LABELS,
  RATE_TYPE_LABELS,
  PAYMENT_MODE_LABELS,
} from "../../constants/trips";
import { getDriverLicenseStatus } from "../../utils/driverLicenseStatus";
import { getVehicleDocumentStatus } from "../../utils/vehicleDocumentStatus";
import { getCustomerAccountStatus } from "../../utils/customerAccountStatus";

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

function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

export default function TripDetailsModal({
  open,
  onClose,
  trip,
  customer,
  vehicle,
  driver,
  onEdit,
  onConfirm,
  onStart,
  onComplete,
  onCancel,
  onCreateInvoice,
}) {
  if (!trip) return null;

  const tripTypeLabel = TRIP_TYPE_LABELS[trip.tripType] || trip.tripType || "—";
  const rateTypeLabel = RATE_TYPE_LABELS[trip.rateType] || trip.rateType || "—";
  const paymentModeLabel =
    PAYMENT_MODE_LABELS[trip.advancePaymentMode] ||
    trip.advancePaymentMode ||
    "—";

  const customerAccount = customer ? getCustomerAccountStatus(customer) : null;
  const vehicleDocStatus = vehicle ? getVehicleDocumentStatus(vehicle) : null;
  const driverLicense = driver ? getDriverLicenseStatus(driver) : null;

  return (
    <Modal open={open} onClose={onClose} className="max-w-3xl">
      <ModalHeader>
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <ModalTitle className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-foreground">
                {trip.tripCode}
              </span>
              <TripStatusBadge status={trip.status} />
              <PaymentStatusBadge paymentStatus={trip.paymentStatus} />
            </ModalTitle>
            <p className="text-xs text-muted mt-0.5">
              Booked on {formatDate(trip.bookingDate)} · {tripTypeLabel}
              {trip.referenceNumber ? ` · Ref: ${trip.referenceNumber}` : ""}
            </p>
          </div>
        </div>
        <ModalClose onClose={onClose} />
      </ModalHeader>

      <ModalContent className="space-y-6">
        {/* Customer & Route Highlight */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Snapshot */}
          <div className="rounded-lg border border-border bg-background/50 p-4 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Customer Information
            </h4>
            <div className="text-sm font-bold text-foreground">
              {customer?.name || "Customer not found"}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted">
              <div>
                <span className="block font-medium text-foreground">
                  {customer?.customerCode || "—"}
                </span>
                <span>Customer Code</span>
              </div>
              <div>
                <span className="block font-medium text-foreground font-mono">
                  {customer?.mobile1 || customer?.mobile || "—"}
                </span>
                <span>Contact Mobile</span>
              </div>
              <div>
                <span className="block font-medium text-foreground">
                  {customer?.creditDays !== undefined
                    ? `${customer.creditDays} Days`
                    : "Immediate"}
                </span>
                <span>Payment Terms</span>
              </div>
              <div>
                <span
                  className={`block font-medium ${
                    customerAccount?.value === "due"
                      ? "text-warning"
                      : "text-success"
                  }`}
                >
                  {customerAccount?.label || "Active"}
                </span>
                <span>Account Status</span>
              </div>
            </div>
          </div>

          {/* Vehicle & Driver Snapshot */}
          <div className="rounded-lg border border-border bg-background/50 p-4 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Vehicle & Driver Assignment
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-muted block">Vehicle</span>
                <span className="font-bold text-foreground block">
                  {vehicle
                    ? `${vehicle.vehicleNumber || vehicle.vehicleCode}`
                    : "Unassigned"}
                </span>
                <span className="text-muted block truncate">
                  {vehicle
                    ? `${vehicle.make || ""} ${vehicle.model || ""}`
                    : ""}
                </span>
                {vehicleDocStatus && (
                  <span
                    className={`inline-block text-[11px] px-1.5 py-0.5 rounded border ${
                      vehicleDocStatus.value === "expired"
                        ? "bg-error/10 text-error border-error/20"
                        : "bg-success/10 text-success border-success/20"
                    }`}
                  >
                    Docs: {vehicleDocStatus.label}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-muted block">Driver</span>
                <span className="font-bold text-foreground block">
                  {driver ? driver.name : "Unassigned"}
                </span>
                <span className="text-muted block font-mono">
                  {driver ? driver.driverCode : ""}
                </span>
                {driverLicense && (
                  <span
                    className={`inline-block text-[11px] px-1.5 py-0.5 rounded border ${
                      driverLicense.value === "expired"
                        ? "bg-error/10 text-error border-error/20"
                        : "bg-success/10 text-success border-success/20"
                    }`}
                  >
                    License: {driverLicense.label}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Journey Details */}
        <div className="rounded-lg border border-border p-4 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Journey & Route
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted block">Pickup Location</span>
              <span className="text-sm font-semibold text-foreground">
                {trip.pickupLocation || "—"}
              </span>
            </div>
            <div>
              <span className="text-muted block">Drop Location</span>
              <span className="text-sm font-semibold text-foreground">
                {trip.dropLocation || "—"}
              </span>
            </div>
            {trip.stops && (
              <div className="md:col-span-2">
                <span className="text-muted block">Via / Stops</span>
                <span className="text-foreground">{trip.stops}</span>
              </div>
            )}
            {trip.pickupInstructions && (
              <div className="md:col-span-2">
                <span className="text-muted block">Pickup Instructions</span>
                <span className="text-foreground italic">
                  {trip.pickupInstructions}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Schedule & KM Tracking */}
        <div className="rounded-lg border border-border p-4 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Schedule & Kilometers
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-muted block">Start Date & Time</span>
              <span className="font-medium text-foreground">
                {formatDateTime(trip.startDateTime)}
              </span>
            </div>
            <div>
              <span className="text-muted block">End Date & Time</span>
              <span className="font-medium text-foreground">
                {formatDateTime(trip.endDateTime)}
              </span>
            </div>
            <div>
              <span className="text-muted block">Calculated Duration</span>
              <span className="font-semibold text-primary">
                {trip.duration || "—"}
              </span>
            </div>
            <div>
              <span className="text-muted block">Total Kilometers</span>
              <span className="font-semibold text-foreground">
                {trip.totalKm !== null && trip.totalKm !== undefined
                  ? `${trip.totalKm} KM`
                  : "—"}
              </span>
            </div>

            <div>
              <span className="text-muted block">Opening KM</span>
              <span className="font-mono text-foreground">
                {trip.openingKm !== null && trip.openingKm !== undefined
                  ? trip.openingKm
                  : "Not recorded"}
              </span>
            </div>
            <div>
              <span className="text-muted block">Closing KM</span>
              <span className="font-mono text-foreground">
                {trip.closingKm !== null && trip.closingKm !== undefined
                  ? trip.closingKm
                  : "Not recorded"}
              </span>
            </div>
          </div>
        </div>

        {/* Pricing & Financial Summary */}
        <div className="rounded-lg border border-border p-4 space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Pricing & Breakdown
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-muted block">Rate Type</span>
              <span className="font-medium text-foreground">
                {rateTypeLabel}
              </span>
            </div>
            <div>
              <span className="text-muted block">Base Rate</span>
              <span className="font-mono font-medium text-foreground">
                ₹{Number(trip.baseRate || 0).toLocaleString("en-IN")}
              </span>
            </div>
            {Number(trip.extraKmCharges || 0) > 0 && (
              <div>
                <span className="text-muted block">Extra KM Charges</span>
                <span className="font-mono text-foreground">
                  ₹{Number(trip.extraKmCharges).toLocaleString("en-IN")}
                </span>
              </div>
            )}
            {Number(trip.extraHourCharges || 0) > 0 && (
              <div>
                <span className="text-muted block">Extra Hour Charges</span>
                <span className="font-mono text-foreground">
                  ₹{Number(trip.extraHourCharges).toLocaleString("en-IN")}
                </span>
              </div>
            )}
            {Number(trip.driverCharges || 0) > 0 && (
              <div>
                <span className="text-muted block">Driver Allowance</span>
                <span className="font-mono text-foreground">
                  ₹{Number(trip.driverCharges).toLocaleString("en-IN")}
                </span>
              </div>
            )}
            {Number(trip.tollCharges || 0) > 0 && (
              <div>
                <span className="text-muted block">Tolls</span>
                <span className="font-mono text-foreground">
                  ₹{Number(trip.tollCharges).toLocaleString("en-IN")}
                </span>
              </div>
            )}
            {Number(trip.parkingCharges || 0) > 0 && (
              <div>
                <span className="text-muted block">Parking</span>
                <span className="font-mono text-foreground">
                  ₹{Number(trip.parkingCharges).toLocaleString("en-IN")}
                </span>
              </div>
            )}
            {Number(trip.discountAmount || 0) > 0 && (
              <div>
                <span className="text-muted block">Discount</span>
                <span className="font-mono text-success">
                  -₹{Number(trip.discountAmount).toLocaleString("en-IN")}
                </span>
              </div>
            )}
            {trip.taxApplicable && Number(trip.taxAmount || 0) > 0 && (
              <div>
                <span className="text-muted block">
                  Tax ({trip.taxRate || 0}%)
                </span>
                <span className="font-mono text-foreground">
                  +₹{Number(trip.taxAmount).toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-muted block">Grand Total</span>
              <span className="font-mono text-lg font-bold text-foreground">
                ₹{Number(trip.totalAmount || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted block">
                Advance Paid ({paymentModeLabel})
              </span>
              <span className="font-mono text-base font-semibold text-success">
                ₹{Number(trip.advanceAmount || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted block">
                Balance Remaining
              </span>
              <span className="font-mono text-base font-bold text-error">
                ₹{Number(trip.balanceAmount || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        {/* Notes & Status History */}
        {(trip.notes ||
          (trip.statusHistory && trip.statusHistory.length > 0)) && (
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Notes & History
            </h4>
            {trip.notes && (
              <p className="text-xs text-foreground bg-background/50 p-2.5 rounded-md">
                {trip.notes}
              </p>
            )}
            {Array.isArray(trip.statusHistory) &&
              trip.statusHistory.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-xs font-medium text-muted block">
                    Audit Trail
                  </span>
                  <div className="space-y-1 text-xs">
                    {trip.statusHistory.map((history, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-muted"
                      >
                        <span className="font-mono text-[11px]">
                          {formatDateTime(history.timestamp)}
                        </span>
                        <span>—</span>
                        <span className="font-medium text-foreground capitalize">
                          {history.status.replace("_", " ")}
                        </span>
                        {history.note && (
                          <span className="text-muted italic">
                            ({history.note})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </ModalContent>

      <ModalFooter className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {trip.status === "completed" && onCreateInvoice && (
            <Button
              type="button"
              variant="primary"
              onClick={() => onCreateInvoice(trip)}
            >
              Create Invoice
            </Button>
          )}
          {(trip.status === "draft" || trip.status === "confirmed") &&
            onCancel && (
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  onClose();
                  onCancel(trip);
                }}
              >
                Cancel Trip
              </Button>
            )}
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>

          {trip.status !== "completed" &&
            trip.status !== "cancelled" &&
            onEdit && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  onClose();
                  onEdit(trip);
                }}
              >
                Edit Trip
              </Button>
            )}

          {trip.status === "draft" && onConfirm && (
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                onClose();
                onConfirm(trip);
              }}
            >
              Confirm Trip
            </Button>
          )}

          {trip.status === "confirmed" && onStart && (
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                onClose();
                onStart(trip);
              }}
            >
              Start Trip
            </Button>
          )}

          {trip.status === "in_progress" && onComplete && (
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                onClose();
                onComplete(trip);
              }}
            >
              Complete Trip
            </Button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}
