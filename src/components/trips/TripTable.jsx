import { TripStatusBadge, PaymentStatusBadge } from "./TripStatusBadge";
import { TRIP_TYPE_LABELS } from "../../constants/trips";

function formatDateTime(dateTimeString) {
  if (!dateTimeString) return "—";
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return dateTimeString;

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow =
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear();

    const timeStr = date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    if (isToday) {
      return `Today, ${timeStr}`;
    }
    if (isTomorrow) {
      return `Tomorrow, ${timeStr}`;
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateTimeString;
  }
}

export default function TripTable({
  trips = [],
  customerMap = new Map(),
  vehicleMap = new Map(),
  driverMap = new Map(),
  isTripInvoiced,
  getTripInvoice,
  isTripNeedsAttention,
  sortField,
  sortDirection,
  onSort,
  onViewTrip,
  onOpenActionsDrawer,
  onViewInvoice,
  highlightedTripId,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] shadow-xs">
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#262837] bg-slate-50/70 dark:bg-[#13151f]">
              <th
                scope="col"
                className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                onClick={() => onSort && onSort("code")}
              >
                <div className="flex items-center gap-1">
                  <span>Trip & Type</span>
                  {sortField === "code" && (
                    <span className="material-symbols-outlined text-[14px]">
                      {sortDirection === "asc"
                        ? "arrow_upward"
                        : "arrow_downward"}
                    </span>
                  )}
                </div>
              </th>

              <th
                scope="col"
                className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono"
              >
                Customer & Route
              </th>

              <th
                scope="col"
                className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono"
              >
                Vehicle & Driver
              </th>

              <th
                scope="col"
                className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                onClick={() => onSort && onSort("date")}
              >
                <div className="flex items-center gap-1">
                  <span>Schedule</span>
                  {sortField === "date" && (
                    <span className="material-symbols-outlined text-[14px]">
                      {sortDirection === "asc"
                        ? "arrow_upward"
                        : "arrow_downward"}
                    </span>
                  )}
                </div>
              </th>

              <th
                scope="col"
                className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono"
              >
                Status & Billing
              </th>

              <th
                scope="col"
                className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                onClick={() => onSort && onSort("amount")}
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Total Fare</span>
                  {sortField === "amount" && (
                    <span className="material-symbols-outlined text-[14px]">
                      {sortDirection === "asc"
                        ? "arrow_upward"
                        : "arrow_downward"}
                    </span>
                  )}
                </div>
              </th>

              <th
                scope="col"
                className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono"
              >
                Actions
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-[#202330]">
            {trips.map((trip) => {
              const customer = customerMap.get(trip.customerId);
              const vehicle = trip.vehicleId
                ? vehicleMap.get(trip.vehicleId)
                : null;
              const driver = trip.driverId
                ? driverMap.get(trip.driverId)
                : null;

              const isHighlighted = highlightedTripId === trip.id;
              const needsAtt = isTripNeedsAttention
                ? isTripNeedsAttention(trip)
                : false;
              const invoiced = isTripInvoiced ? isTripInvoiced(trip) : false;
              const invoice = getTripInvoice ? getTripInvoice(trip) : null;

              // Left indicator bar
              let leftBarColor;
              if (trip.status === "in_progress") {
                leftBarColor = "border-l-4 border-l-cyan-500";
              } else if (trip.status === "completed") {
                leftBarColor = "border-l-4 border-l-emerald-500";
              } else if (needsAtt) {
                leftBarColor = "border-l-4 border-l-rose-500";
              } else if (trip.status === "cancelled") {
                leftBarColor =
                  "border-l-4 border-l-slate-400 dark:border-l-slate-600";
              } else {
                leftBarColor = "border-l-4 border-l-violet-500";
              }

              const tripTypeLabel =
                TRIP_TYPE_LABELS[trip.tripType] ||
                trip.tripType ||
                "Standard Trip";

              return (
                <tr
                  key={trip.id}
                  onClick={() => onViewTrip && onViewTrip(trip)}
                  className={[
                    "group transition-colors duration-150 relative cursor-pointer",
                    leftBarColor,
                    isHighlighted
                      ? "bg-cyan-500/10 dark:bg-cyan-950/40 ring-1 ring-inset ring-cyan-400/40"
                      : "hover:bg-slate-50/80 dark:hover:bg-[#1a1c28]",
                  ].join(" ")}
                >
                  {/* 1. Trip Code & Type */}
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                          {trip.tripCode}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#202330] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#2a2d3d]">
                            {tripTypeLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. Customer & Route */}
                  <td className="px-4 py-3 align-middle max-w-[240px]">
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {customer ? customer.name : trip.customerName || "—"}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        <span className="truncate">
                          {trip.pickupLocation || "Pickup"}
                        </span>
                        <span className="text-slate-400">→</span>
                        <span className="truncate">
                          {trip.dropLocation || "Drop"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 3. Vehicle & Driver */}
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      {/* Vehicle */}
                      {vehicle ? (
                        <div className="flex items-center gap-1 text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                          <span className="material-symbols-outlined text-[14px] text-slate-400">
                            directions_car
                          </span>
                          <span>
                            {vehicle.vehicleNumber || vehicle.vehicleCode}
                          </span>
                          {vehicle.model && (
                            <span className="text-[11px] font-sans font-normal text-slate-400">
                              ({vehicle.model})
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                          <span className="material-symbols-outlined text-[14px]">
                            warning
                          </span>
                          <span>Unassigned Vehicle</span>
                        </div>
                      )}

                      {/* Driver */}
                      {driver ? (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="material-symbols-outlined text-[14px] text-slate-400">
                            person
                          </span>
                          <span>{driver.name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                          <span className="material-symbols-outlined text-[14px]">
                            warning
                          </span>
                          <span>Unassigned Driver</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 4. Schedule */}
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <div className="flex flex-col text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-medium">
                        {formatDateTime(trip.startDateTime)}
                      </span>
                      {trip.endDateTime && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
                          to {formatDateTime(trip.endDateTime)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 5. Status & Billing */}
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-center gap-1.5">
                        <TripStatusBadge status={trip.status} />
                        {needsAtt && (
                          <span
                            title="Needs attention: unassigned or delayed"
                            className="flex items-center text-rose-500"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              error
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5">
                        <PaymentStatusBadge status={trip.paymentStatus} />
                        {invoiced && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onViewInvoice) {
                                onViewInvoice(trip, invoice);
                              }
                            }}
                            data-testid={`trip-view-invoice-badge-${trip.id}`}
                            title={`View Invoice: ${invoice?.invoiceNumber || "Yes"}`}
                            aria-label={`View invoice for ${trip.tripCode}`}
                            className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/40 cursor-pointer transition-colors inline-flex items-center gap-0.5"
                          >
                            INV
                          </button>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 6. Total Fare */}
                  <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                    <div className="flex flex-col items-end">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                        ₹
                        {Number(
                          trip.totalAmount || trip.estimatedAmount || 0,
                        ).toLocaleString("en-IN")}
                      </span>
                      {trip.advanceAmount > 0 && (
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                          Adv: ₹
                          {Number(trip.advanceAmount).toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 7. Actions */}
                  <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      {/* View Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onViewTrip) onViewTrip(trip);
                        }}
                        title="View Trip Details"
                        aria-label={`View ${trip.tripCode}`}
                        className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] hover:bg-slate-50 dark:hover:bg-[#1f2230] text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-slate-500 dark:text-slate-400">
                          visibility
                        </span>
                        <span>View</span>
                      </button>

                      {/* 3-dots Action Drawer Button */}
                      {onOpenActionsDrawer && (
                        <button
                          type="button"
                          data-testid={`trip-actions-btn-${trip.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenActionsDrawer(trip);
                          }}
                          title="Trip Actions"
                          aria-label="Trip Actions"
                          className="h-8 w-8 rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] hover:bg-slate-50 dark:hover:bg-[#1f2230] text-slate-600 dark:text-slate-300 inline-flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            more_vert
                          </span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
