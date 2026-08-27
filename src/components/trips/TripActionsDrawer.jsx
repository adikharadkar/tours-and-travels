import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

export default function TripActionsDrawer({
  open,
  onClose,
  trip,
  customer,
  vehicle,
  driver,
  invoice,
  onViewDetails,
  onEdit,
  onConfirm,
  onStart,
  onComplete,
  onCancel,
  onDelete,
  onGenerateInvoice,
  onViewInvoice,
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !trip) {
    return null;
  }

  const tripTypeLabel =
    TRIP_TYPE_LABELS[trip.tripType] || trip.tripType || "Outstation";
  const customerName = customer?.name || "Customer";
  const isInvoiced = Boolean(invoice);
  const isReadyToInvoice = trip.status === "completed" && !isInvoiced;

  const handleCopySummary = () => {
    const summary = [
      `Trip Code: ${trip.tripCode}`,
      `Customer: ${customerName}`,
      `Route: ${trip.pickupLocation || "Origin"} → ${trip.dropLocation || "Destination"}`,
      `Start: ${formatDateTime(trip.startDateTime)}`,
      `Vehicle: ${vehicle ? `${vehicle.vehicleNumber} (${vehicle.make || ""} ${vehicle.model || ""})` : "Unassigned"}`,
      `Driver: ${driver ? `${driver.name} (${driver.mobile || ""})` : "Unassigned"}`,
      `Amount: ₹${Number(trip.totalAmount || 0).toLocaleString("en-IN")}`,
      `Status: ${trip.status}`,
    ]
      .filter(Boolean)
      .join("\n");

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrintDutySlip = () => {
    window.print();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Trip Actions Drawer"
      data-testid="trip-actions-drawer"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        <div className="w-screen max-w-md transform bg-white dark:bg-[#161822] text-slate-900 dark:text-slate-100 shadow-2xl border-l border-slate-200 dark:border-[#262837] flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[#262837] bg-slate-50/70 dark:bg-[#13151f] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                <span className="material-symbols-outlined text-[18px]">
                  more_horiz
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    {trip.tripCode}
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-[#202330] text-slate-700 dark:text-slate-300">
                    {tripTypeLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  Trip Actions & Operations
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close actions drawer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-[#1f2230] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                close
              </span>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Snapshot Card */}
            <div className="rounded-xl border border-slate-200 dark:border-[#262837] bg-slate-50/50 dark:bg-[#13151f] p-3.5 space-y-3">
              {/* Customer & Route */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Customer & Route
                </div>
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                  {customerName}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mt-1">
                  <span className="material-symbols-outlined text-[14px] text-cyan-600 dark:text-cyan-400 shrink-0">
                    trip_origin
                  </span>
                  <span className="font-medium truncate">
                    {trip.pickupLocation || "Origin"}
                  </span>
                  <span className="material-symbols-outlined text-[14px] text-slate-400 shrink-0">
                    arrow_right_alt
                  </span>
                  <span className="font-medium truncate">
                    {trip.dropLocation || "Destination"}
                  </span>
                </div>
              </div>

              {/* Status & Payment Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/80 dark:border-[#262837]">
                <TripStatusBadge status={trip.status} />
                <PaymentStatusBadge paymentStatus={trip.paymentStatus} />
                {isInvoiced ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/40">
                    <span className="material-symbols-outlined text-[12px]">
                      receipt_long
                    </span>
                    {invoice.invoiceNumber}
                  </span>
                ) : isReadyToInvoice ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/40">
                    Ready to Invoice
                  </span>
                ) : null}
              </div>

              {/* Resource & Schedule Grid */}
              <div className="grid grid-cols-2 gap-2.5 pt-1 text-xs border-t border-slate-200/80 dark:border-[#262837]">
                <div>
                  <span className="text-[11px] text-slate-400 block">
                    Schedule Start
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatDateTime(trip.startDateTime)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">
                    Total Amount
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                    ₹{Number(trip.totalAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">
                    Vehicle
                  </span>
                  {vehicle ? (
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">
                      {vehicle.vehicleNumber}
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold italic text-[11px]">
                      Unassigned
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">
                    Driver
                  </span>
                  {driver ? (
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">
                      {driver.name}
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 font-semibold italic text-[11px]">
                      Unassigned
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Primary Lifecycle Action Hero Section */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Recommended Next Step
              </h4>

              {/* Draft -> Confirm */}
              {trip.status === "draft" && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onConfirm?.(trip);
                  }}
                  className="w-full p-3 rounded-xl border border-violet-300 dark:border-violet-700/60 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">
                        check_circle
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-sm">Confirm Booking</div>
                      <div className="text-xs text-violet-100 opacity-90">
                        Lock schedule & prepare for dispatch
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[18px] transform group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>
              )}

              {/* Confirmed -> Start Journey */}
              {trip.status === "confirmed" && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStart?.(trip);
                  }}
                  className="w-full p-3 rounded-xl border border-violet-300 dark:border-violet-700/60 bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">
                        speed
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-sm">Start Journey</div>
                      <div className="text-xs text-violet-100 opacity-90">
                        Record opening odometer & mark active
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[18px] transform group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>
              )}

              {/* In Progress -> Complete Trip */}
              {trip.status === "in_progress" && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onComplete?.(trip);
                  }}
                  className="w-full p-3 rounded-xl border border-cyan-300 dark:border-cyan-700/60 bg-gradient-to-r from-[#06b6d4] to-[#0891b2] text-white shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">
                        task_alt
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-sm">Complete Trip</div>
                      <div className="text-xs text-cyan-100 opacity-90">
                        Record closing km, tolls & finish
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[18px] transform group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>
              )}

              {/* Completed & Not Invoiced -> Generate Invoice */}
              {isReadyToInvoice && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGenerateInvoice?.(trip);
                  }}
                  className="w-full p-3 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm hover:shadow-md transition-all text-left flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">
                        receipt_long
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-sm">
                        Generate Tax Invoice
                      </div>
                      <div className="text-xs text-emerald-100 opacity-90">
                        Create GST invoice for billing
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[18px] transform group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </button>
              )}

              {/* Completed & Invoiced -> View Invoice */}
              {trip.status === "completed" && isInvoiced && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewInvoice?.(trip, invoice);
                  }}
                  className="w-full p-3 rounded-xl border border-cyan-300 dark:border-cyan-700/60 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-900 dark:text-cyan-100 hover:bg-cyan-100/80 transition-all text-left flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-600 text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">
                        receipt
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-sm">
                        View Invoice {invoice?.invoiceNumber}
                      </div>
                      <div className="text-xs text-cyan-700 dark:text-cyan-300">
                        Status: {invoice?.documentStatus || "issued"} (
                        {invoice?.paymentStatus || "unpaid"})
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-cyan-600 transform group-hover:translate-x-1 transition-transform">
                    open_in_new
                  </span>
                </button>
              )}

              {/* Cancelled Trip Notice */}
              {trip.status === "cancelled" && (
                <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 text-xs">
                  <div className="font-bold flex items-center gap-1.5 mb-0.5">
                    <span className="material-symbols-outlined text-[16px]">
                      cancel
                    </span>
                    Trip Cancelled
                  </div>
                  {trip.cancelReason
                    ? `Reason: ${trip.cancelReason}`
                    : "This trip was cancelled."}
                </div>
              )}
            </div>

            {/* General Trip Operations */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Trip Operations
              </h4>

              <div className="rounded-xl border border-slate-200 dark:border-[#262837] divide-y divide-slate-100 dark:divide-[#262837] overflow-hidden bg-white dark:bg-[#161822]">
                {/* 1. View Full Details */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewDetails?.(trip);
                  }}
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#1a1c28] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px] text-slate-500 dark:text-slate-400">
                      visibility
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        View Full Trip Details
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Detailed duty summary, routes & history
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-slate-400">
                    chevron_right
                  </span>
                </button>

                {/* 2. Edit Trip Details */}
                {trip.status !== "completed" && trip.status !== "cancelled" && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onEdit?.(trip);
                    }}
                    className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#1a1c28] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px] text-cyan-600 dark:text-cyan-400">
                        edit
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          Edit Trip & Booking
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Modify route, timings, vehicle & pricing
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-slate-400">
                      chevron_right
                    </span>
                  </button>
                )}

                {/* 3. Generate Tax Invoice (if ready) */}
                {isReadyToInvoice && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onGenerateInvoice?.(trip);
                    }}
                    className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#1a1c28] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400">
                        receipt_long
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          Generate Tax Invoice
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Create billing invoice for customer
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-slate-400">
                      chevron_right
                    </span>
                  </button>
                )}

                {/* 4. Copy Trip Summary */}
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#1a1c28] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px] text-slate-500 dark:text-slate-400">
                      {copied ? "check" : "content_copy"}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>Copy Trip Summary</span>
                        {copied && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            Copied!
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Copy route, driver & vehicle details to clipboard
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-slate-400">
                    chevron_right
                  </span>
                </button>

                {/* 5. Print Duty Slip / Trip Sheet */}
                <button
                  type="button"
                  onClick={handlePrintDutySlip}
                  className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#1a1c28] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px] text-slate-500 dark:text-slate-400">
                      print
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Print Duty Slip / Trip Sheet
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Print dispatch copy for driver & passenger
                      </div>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-slate-400">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            {(trip.status === "draft" ||
              trip.status === "confirmed" ||
              trip.status === "in_progress") && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-2">
                  Cancellation & Removal
                </h4>

                <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 divide-y divide-rose-100 dark:divide-rose-950/60 overflow-hidden bg-rose-50/20 dark:bg-rose-950/10">
                  {/* Cancel Trip */}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onCancel?.(trip);
                    }}
                    className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-rose-100/40 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-rose-700 dark:text-rose-400"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px]">
                        cancel
                      </span>
                      <div>
                        <div className="text-xs font-semibold">Cancel Trip</div>
                        <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80">
                          Provide cancellation reason and free assigned
                          resources
                        </div>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[16px]">
                      chevron_right
                    </span>
                  </button>

                  {/* Delete Draft */}
                  {trip.status === "draft" && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onDelete?.(trip);
                      }}
                      className="w-full px-3.5 py-3 flex items-center justify-between text-left hover:bg-rose-100/40 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-rose-700 dark:text-rose-400"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[18px]">
                          delete_forever
                        </span>
                        <div>
                          <div className="text-xs font-semibold">
                            Delete Draft Booking
                          </div>
                          <div className="text-[11px] text-rose-600/80 dark:text-rose-400/80">
                            Permanently remove this unconfirmed draft
                          </div>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-[16px]">
                        chevron_right
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-[#262837] bg-slate-50/70 dark:bg-[#13151f] flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              Trip Ref: {trip.id.slice(0, 8)}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-[#262837] hover:bg-slate-200/60 dark:hover:bg-[#1f2230] text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Close Drawer
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
