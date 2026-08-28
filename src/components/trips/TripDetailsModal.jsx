import { useMemo } from "react";
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
import { getInvoices } from "../../services/invoiceService";
import { VEHICLE_TYPE_LABELS } from "../../constants/vehicles";

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

function formatCurrency(amount) {
  const num = Number(amount || 0);
  return `₹${num.toLocaleString("en-IN")}`;
}

export default function TripDetailsModal({
  open,
  onClose,
  trip,
  customer,
  vehicle,
  driver,
  invoice: propInvoice,
  onEdit,
  onConfirm,
  onStart,
  onComplete,
  onCancel,
  onCreateInvoice,
  onViewInvoice,
  onViewCustomer,
  onViewVehicle,
  onViewDriver,
}) {
  // Resolve associated invoice if available
  const invoice = useMemo(() => {
    if (propInvoice) return propInvoice;
    if (!trip) return null;
    try {
      const allInvoices = getInvoices();
      return (
        allInvoices.find(
          (inv) =>
            inv.documentStatus !== "cancelled" &&
            (inv.tripId === trip.id ||
              (trip.tripCode && inv.tripCode === trip.tripCode)),
        ) || null
      );
    } catch {
      return null;
    }
  }, [propInvoice, trip]);

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

  // Financial values
  const baseRate = Number(trip.baseRate || 0);
  const extraKmCharges = Number(trip.extraKmCharges || 0);
  const extraHourCharges = Number(trip.extraHourCharges || 0);
  const driverCharges = Number(trip.driverCharges || 0);
  const tollCharges = Number(trip.tollCharges || 0);
  const parkingCharges = Number(trip.parkingCharges || 0);
  const otherCharges = Number(trip.otherCharges || 0);
  const discountAmount = Number(trip.discountAmount || 0);
  const taxAmount = Number(trip.taxAmount || 0);
  const taxRate = Number(trip.taxRate || 0);
  const taxApplicable = Boolean(trip.taxApplicable);

  const subtotal =
    trip.subtotal !== undefined
      ? Number(trip.subtotal)
      : baseRate +
        extraKmCharges +
        extraHourCharges +
        driverCharges +
        tollCharges +
        parkingCharges +
        otherCharges;

  const totalAmount = Number(trip.totalAmount || 0);
  const advanceAmount = Number(trip.advanceAmount || 0);
  const balanceAmount =
    trip.balanceAmount !== undefined
      ? Number(trip.balanceAmount)
      : Math.max(0, totalAmount - advanceAmount);

  const hasInvoice = Boolean(invoice);
  const isReadyToInvoice = trip.status === "completed" && !hasInvoice;

  // Lifecycle calculations
  const isCompleted = trip.status === "completed";
  const isDraft = trip.status === "draft";
  const isConfirmed = trip.status === "confirmed";
  const isInProgress = trip.status === "in_progress";
  const isCancelled = trip.status === "cancelled";

  const handleInvoiceView = () => {
    if (onViewInvoice) {
      onViewInvoice(invoice);
    } else if (typeof window !== "undefined") {
      window.location.href = "/invoices";
    }
  };

  const handleInvoiceCreate = () => {
    if (onCreateInvoice) {
      onCreateInvoice(trip);
    } else if (typeof window !== "undefined") {
      window.location.href = `/invoices/generate?tripId=${trip.id}`;
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="max-w-5xl w-full max-h-[94vh] rounded-2xl bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] shadow-2xl flex flex-col overflow-hidden"
    >
      {/* Header: Trip Identity & Contextual Top Actions */}
      <ModalHeader className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-200 dark:border-[#262837] bg-slate-50/70 dark:bg-[#13151f] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-20">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <ModalTitle className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{trip.tripCode}</span>
            </ModalTitle>
            <div className="flex items-center gap-2">
              <TripStatusBadge status={trip.status} />
              <PaymentStatusBadge paymentStatus={trip.paymentStatus} />
              {hasInvoice && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/40">
                  <span className="material-symbols-outlined text-[13px]">
                    receipt
                  </span>
                  <span>{invoice.invoiceNumber}</span>
                </span>
              )}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-1.5">
            <span>Booked on {formatDate(trip.bookingDate)}</span>
            <span>•</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {tripTypeLabel}
            </span>
            {trip.referenceNumber && (
              <>
                <span>•</span>
                <span className="font-mono text-slate-600 dark:text-slate-400">
                  Ref: {trip.referenceNumber}
                </span>
              </>
            )}
          </p>
        </div>

        {/* Top Contextual Header Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {!isCompleted && !isCancelled && onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(trip);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#191b26] text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-[#202330] hover:border-violet-300 shadow-2xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                edit
              </span>
              <span>Edit Trip</span>
            </button>
          )}

          {hasInvoice && (
            <button
              type="button"
              onClick={handleInvoiceView}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">
                receipt_long
              </span>
              <span>View Invoice</span>
            </button>
          )}

          {isReadyToInvoice && onCreateInvoice && (
            <button
              type="button"
              onClick={handleInvoiceCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Generate Invoice</span>
            </button>
          )}

          <ModalClose onClose={onClose} />
        </div>
      </ModalHeader>

      {/* Main Scrollable Body Content */}
      <ModalContent className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 bg-slate-50/50 dark:bg-[#0f111a]/40">
        {/* Top 3 Metric Cards: Customer, Schedule & Kilometers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Customer Information */}
          <div className="rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] p-5 shadow-2xs hover:border-violet-500/40 dark:hover:border-violet-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-[#202330] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-slate-400">
                    business
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Customer Information
                  </h3>
                </div>
                {customer && onViewCustomer && (
                  <button
                    type="button"
                    onClick={() => onViewCustomer(customer)}
                    className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    View
                  </button>
                )}
              </div>

              <div className="text-base font-bold text-slate-900 dark:text-slate-100 mb-0.5">
                {customer?.name || "Customer not found"}
              </div>
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-3">
                {customer?.customerCode
                  ? `Code: ${customer.customerCode}`
                  : customer?.name
                    ? "—"
                    : "CUS-0001"}
              </div>

              {(customer?.mobile1 || customer?.mobile || customer?.phone) && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-mono mb-4">
                  <span className="material-symbols-outlined text-[15px] text-slate-400">
                    call
                  </span>
                  <span>
                    {customer.mobile1 || customer.mobile || customer.phone}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-[#202330] mt-auto">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-0.5">
                  Payment Terms
                </div>
                <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  {customer?.creditDays !== undefined
                    ? `${customer.creditDays} Days`
                    : customer?.paymentTerms
                      ? `Net ${String(customer.paymentTerms).replace("_days", "")}`
                      : "Immediate"}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-0.5">
                  Account Status
                </div>
                <div
                  className={`text-xs font-semibold ${
                    customerAccount?.value === "due" ||
                    customerAccount?.value === "overdue"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {customerAccount?.label || "Active"}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Schedule & Duration */}
          <div className="rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] p-5 shadow-2xs hover:border-violet-500/40 dark:hover:border-violet-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-[#202330] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-slate-400">
                    schedule
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Schedule & Kilometers
                  </h3>
                </div>
              </div>

              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-0.5">
                    Start Date & Time
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {formatDateTime(trip.startDateTime)}
                  </div>
                </div>

                <div className="pt-3 px-1 text-slate-300 dark:text-slate-600">
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_forward
                  </span>
                </div>

                <div className="min-w-0 text-right">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-0.5">
                    End Date & Time
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {formatDateTime(trip.endDateTime)}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-[#202330] flex items-center justify-between mt-auto">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Calculated Duration
              </span>
              <span className="text-xs font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/40 px-2.5 py-0.5 rounded-md">
                {trip.duration || "—"}
              </span>
            </div>
          </div>

          {/* Card 3: Kilometers */}
          <div className="rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] p-5 shadow-2xs hover:border-violet-500/40 dark:hover:border-violet-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-[#202330] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-slate-400">
                    speed
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Kilometers
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-0.5">
                    Opening KM
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                    {trip.openingKm !== null && trip.openingKm !== undefined
                      ? trip.openingKm
                      : "Not recorded"}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 mb-0.5">
                    Closing KM
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                    {trip.closingKm !== null && trip.closingKm !== undefined
                      ? trip.closingKm
                      : "Not recorded"}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="pt-2.5 border-t border-slate-100 dark:border-[#202330] flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Total Kilometers
                </span>
                <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                  {trip.totalKm !== null && trip.totalKm !== undefined
                    ? `${trip.totalKm} KM`
                    : "—"}
                </span>
              </div>

              {/* Progress visual */}
              <div className="w-full bg-slate-100 dark:bg-[#202330] h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] rounded-full transition-all"
                  style={{
                    width: isCompleted
                      ? "100%"
                      : isInProgress
                        ? "65%"
                        : isConfirmed
                          ? "35%"
                          : "15%",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section: Route & Resources (Left) vs Financials & Invoices (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left 2 Columns: Journey & Route + Vehicle/Driver Cards */}
          <div className="lg:col-span-2 space-y-5">
            {/* Journey & Route Card */}
            <div className="rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] p-5 sm:p-6 shadow-2xs hover:border-violet-500/40 dark:hover:border-violet-500/40 transition-all">
              <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-[#202330] pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-slate-400">
                    map
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Journey & Route
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#202330] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2b2e3e]">
                  {tripTypeLabel}
                </span>
              </div>

              {/* Route Timeline */}
              <div className="relative pl-7 sm:pl-8 space-y-6">
                {/* Vertical connecting line */}
                <div className="absolute left-2.5 sm:left-3 top-2.5 bottom-2.5 w-0.5 bg-slate-200 dark:bg-[#2b2e3e]" />

                {/* 1. Pickup */}
                <div className="relative">
                  <div className="absolute -left-[27px] sm:-left-[31px] top-0.5 w-5 h-5 rounded-full bg-white dark:bg-[#161822] border-2 border-violet-600 flex items-center justify-center z-10 shadow-2xs">
                    <div className="w-2 h-2 rounded-full bg-violet-600" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-0.5">
                      Pickup Location
                    </span>
                    <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                      {trip.pickupLocation || "—"}
                    </div>

                    {trip.pickupInstructions && (
                      <div className="mt-2.5 p-3 rounded-lg bg-slate-50/80 dark:bg-[#191b26] border border-dashed border-slate-200 dark:border-[#262837] text-xs text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 not-italic mr-1">
                          Pickup Instructions:
                        </span>
                        <span className="italic">
                          {trip.pickupInstructions}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Intermediate Stops / Via */}
                {trip.stops && (
                  <div className="relative">
                    <div className="absolute -left-[25px] sm:-left-[29px] top-1 w-4 h-4 rounded-full bg-white dark:bg-[#161822] border-2 border-slate-300 dark:border-slate-600 z-10" />
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-0.5">
                        Via / Stops
                      </span>
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {trip.stops}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Drop Location */}
                <div className="relative">
                  <div className="absolute -left-[27px] sm:-left-[31px] top-0.5 w-5 h-5 rounded-full bg-white dark:bg-[#161822] border-2 border-cyan-500 flex items-center justify-center z-10 shadow-2xs">
                    <span className="material-symbols-outlined text-[13px] text-cyan-600 dark:text-cyan-400">
                      location_on
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-0.5">
                      Drop Location
                    </span>
                    <div className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                      {trip.dropLocation || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle & Driver Assignment Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Vehicle Assignment Card */}
              <div className="rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] p-5 shadow-2xs hover:border-violet-500/40 dark:hover:border-violet-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-[#202330] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-slate-400">
                        directions_car
                      </span>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Vehicle & Driver Assignment
                      </h3>
                    </div>
                    {vehicle && onViewVehicle && (
                      <button
                        type="button"
                        onClick={() => onViewVehicle(vehicle)}
                        className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                      >
                        View
                      </button>
                    )}
                  </div>

                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[22px]">
                        directions_car
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="text-base font-bold font-mono text-slate-900 dark:text-slate-100 truncate">
                        {vehicle
                          ? vehicle.vehicleNumber || vehicle.vehicleCode
                          : "Unassigned"}
                      </div>
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {vehicle
                          ? [vehicle.make, vehicle.model]
                              .filter(Boolean)
                              .join(" ") || "Vehicle"
                          : ""}
                      </div>
                      {vehicle && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {[
                            vehicle.vehicleCode,
                            VEHICLE_TYPE_LABELS[vehicle.vehicleType] ||
                              vehicle.vehicleType,
                            vehicle.seatingCapacity
                              ? `${vehicle.seatingCapacity} Seats`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" • ")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-[#202330] flex items-center justify-between mt-auto">
                  <span className="text-[11px] font-medium text-slate-400">
                    Status
                  </span>
                  <div className="flex items-center gap-1.5">
                    {vehicle ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-[#202330] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#2c2f3f]">
                        Assigned
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                        Unassigned
                      </span>
                    )}

                    {vehicleDocStatus && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          vehicleDocStatus.value === "expired"
                            ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/40"
                            : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40"
                        }`}
                      >
                        Docs: {vehicleDocStatus.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Driver Assignment Card */}
              <div className="rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] p-5 shadow-2xs hover:border-violet-500/40 dark:hover:border-violet-500/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-[#202330] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-slate-400">
                        person
                      </span>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Driver
                      </h3>
                    </div>
                    {driver && onViewDriver && (
                      <button
                        type="button"
                        onClick={() => onViewDriver(driver)}
                        className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                      >
                        View
                      </button>
                    )}
                  </div>

                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="w-11 h-11 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/40 text-cyan-700 dark:text-cyan-300 flex items-center justify-center shrink-0 font-bold text-sm">
                      {driver?.name
                        ? driver.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()
                        : "DR"}
                    </div>

                    <div className="min-w-0">
                      <div className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                        {driver ? driver.name : "Unassigned"}
                      </div>
                      <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {driver ? driver.driverCode : "—"}
                      </div>
                      {(driver?.mobile1 || driver?.mobile || driver?.phone) && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-mono mt-1">
                          <span className="material-symbols-outlined text-[14px] text-slate-400">
                            call
                          </span>
                          <span>
                            {driver.mobile1 || driver.mobile || driver.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-[#202330] flex items-center justify-between mt-auto">
                  <span className="text-[11px] font-medium text-slate-400">
                    License
                  </span>
                  <div>
                    {driverLicense ? (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          driverLicense.value === "expired"
                            ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/40"
                            : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[13px]">
                          {driverLicense.value === "expired"
                            ? "warning"
                            : "verified"}
                        </span>
                        <span>License: {driverLicense.label}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Unassigned</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Financial Breakdown & Invoice Status */}
          <div className="lg:col-span-1 flex flex-col">
            <div className="rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] p-5 sm:p-6 shadow-2xs hover:border-violet-500/40 dark:hover:border-violet-500/40 transition-all flex flex-col justify-between h-full">
              <div>
                {/* Header: Financial Title & Invoice Link */}
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-[#202330] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-slate-400 dark:text-slate-400">
                      account_balance_wallet
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Pricing & Breakdown
                    </h3>
                  </div>

                  {hasInvoice ? (
                    <button
                      type="button"
                      onClick={handleInvoiceView}
                      className="text-xs font-mono font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        link
                      </span>
                      <span>{invoice.invoiceNumber}</span>
                    </button>
                  ) : isReadyToInvoice ? (
                    <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
                      Ready to Invoice
                    </span>
                  ) : null}
                </div>

                {/* Line Charges Breakdown */}
                <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">
                      Base Rate ({rateTypeLabel})
                    </span>
                    <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(baseRate)}
                    </span>
                  </div>

                  {extraKmCharges > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">
                        Extra KM Charges
                      </span>
                      <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                        {formatCurrency(extraKmCharges)}
                      </span>
                    </div>
                  )}

                  {extraHourCharges > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">
                        Extra Hour Charges
                      </span>
                      <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                        {formatCurrency(extraHourCharges)}
                      </span>
                    </div>
                  )}

                  {driverCharges > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">
                        Driver Allowance
                      </span>
                      <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                        {formatCurrency(driverCharges)}
                      </span>
                    </div>
                  )}

                  {tollCharges > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">
                        Tolls
                      </span>
                      <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                        {formatCurrency(tollCharges)}
                      </span>
                    </div>
                  )}

                  {parkingCharges > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">
                        Parking
                      </span>
                      <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                        {formatCurrency(parkingCharges)}
                      </span>
                    </div>
                  )}

                  {otherCharges > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">
                        Other Charges
                      </span>
                      <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                        {formatCurrency(otherCharges)}
                      </span>
                    </div>
                  )}

                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                      <span>Discount</span>
                      <span className="font-mono font-medium">
                        -{formatCurrency(discountAmount)}
                      </span>
                    </div>
                  )}

                  {taxApplicable && taxAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400">
                        Tax ({taxRate}%)
                      </span>
                      <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                        +{formatCurrency(taxAmount)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Subtotal & Advance Summary */}
                <div className="border-t border-slate-100 dark:border-[#202330] pt-3 mb-4 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>

                  {advanceAmount > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                      <span>Advance Paid ({paymentModeLabel})</span>
                      <span className="font-mono font-semibold">
                        -{formatCurrency(advanceAmount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Grand Total Highlight Container */}
              <div className="rounded-xl bg-slate-50 dark:bg-[#191b26] p-4 border border-slate-200 dark:border-[#262837]">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    Grand Total
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>

                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200/80 dark:border-[#2b2e3e]">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Balance Remaining
                  </span>
                  <span
                    className={`text-sm font-bold font-mono flex items-center gap-1 ${
                      balanceAmount === 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    <span>{formatCurrency(balanceAmount)}</span>
                    {balanceAmount === 0 && (
                      <span className="material-symbols-outlined text-[15px]">
                        check_circle
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes & Audit History Section */}
        {(trip.notes ||
          (Array.isArray(trip.statusHistory) &&
            trip.statusHistory.length > 0)) && (
          <div className="rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] p-5 shadow-2xs">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-100 dark:border-[#202330] pb-2.5">
              <span className="material-symbols-outlined text-[18px] text-slate-400">
                history
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Notes & History
              </h3>
            </div>

            {trip.notes && (
              <div className="mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-1">
                  Trip Notes
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-[#191b26] p-3 rounded-lg border border-slate-200/60 dark:border-[#262837]">
                  {trip.notes}
                </p>
              </div>
            )}

            {Array.isArray(trip.statusHistory) &&
              trip.statusHistory.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
                    Audit Trail
                  </span>
                  <div className="space-y-1.5 text-xs divide-y divide-slate-100 dark:divide-[#202330]">
                    {trip.statusHistory.map((history, idx) => (
                      <div
                        key={idx}
                        className="flex flex-wrap items-center gap-2 pt-1.5 first:pt-0 text-slate-500 dark:text-slate-400"
                      >
                        <span className="font-mono text-[11px] text-slate-400">
                          {formatDateTime(history.timestamp)}
                        </span>
                        <span>—</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                          {history.status.replace("_", " ")}
                        </span>
                        {history.note && (
                          <span className="text-slate-500 dark:text-slate-400 italic">
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

      {/* Footer: Status-Aware Contextual Actions */}
      <ModalFooter className="px-5 sm:px-6 py-3.5 border-t border-slate-200 dark:border-[#262837] bg-slate-50/70 dark:bg-[#13151f] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {hasInvoice && (
            <Button type="button" variant="primary" onClick={handleInvoiceView}>
              <span className="material-symbols-outlined text-[16px] mr-1">
                receipt_long
              </span>
              View Invoice
            </Button>
          )}

          {isReadyToInvoice && onCreateInvoice && (
            <Button
              type="button"
              variant="primary"
              onClick={handleInvoiceCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] mr-1">
                receipt
              </span>
              Generate Invoice
            </Button>
          )}

          {(isDraft || isConfirmed) && onCancel && (
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

          {!isCompleted && !isCancelled && onEdit && (
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

          {isDraft && onConfirm && (
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

          {isConfirmed && onStart && (
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

          {isInProgress && onComplete && (
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
