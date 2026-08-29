import { getDriverLicenseStatus } from "../../utils/driverLicenseStatus";
import {
  DRIVER_TYPE_LABELS,
  PREFIX_LABELS,
  LICENSE_TYPE_LABELS,
} from "../../constants/drivers";

export default function DriverTable({
  drivers = [],
  getDriverOperationalInfo,
  sortField,
  sortDirection,
  onSort,
  onViewDriver,
  onEditDriver,
  onDeleteDriver,
  highlightedDriverId,
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
                onClick={() => onSort && onSort("name")}
              >
                <div className="flex items-center gap-1">
                  <span>Driver Details</span>
                  {sortField === "name" && (
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
                License Info
              </th>

              <th
                scope="col"
                className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono"
              >
                Operational State
              </th>

              <th
                scope="col"
                className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono"
              >
                Compliance
              </th>

              <th
                scope="col"
                className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono"
              >
                Current Assignment
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
            {drivers.map((driver) => {
              const licStatus = getDriverLicenseStatus(driver);
              const op = getDriverOperationalInfo
                ? getDriverOperationalInfo(driver)
                : { state: "available", label: "Available" };
              const isHighlighted = highlightedDriverId === driver.id;

              const prefixLabel = PREFIX_LABELS[driver.prefix] || "";
              const displayName = prefixLabel
                ? `${prefixLabel} ${driver.name}`
                : driver.name;
              const driverTypeLabel =
                DRIVER_TYPE_LABELS[driver.driverType] ||
                driver.driverType ||
                "Own";
              const licenseTypeLabel =
                LICENSE_TYPE_LABELS[driver.licenseType] ||
                driver.licenseType ||
                "License";

              // Avatar initials
              const initials = (driver.name || "D")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();

              // Left indicator bar
              let leftBarColor;
              if (op.state === "on_trip") {
                leftBarColor = "border-l-4 border-l-violet-500";
              } else if (
                op.state === "grounded" ||
                licStatus.value === "expired"
              ) {
                leftBarColor = "border-l-4 border-l-rose-500";
              } else if (op.state === "available") {
                leftBarColor = "border-l-4 border-l-cyan-500";
              } else {
                leftBarColor =
                  "border-l-4 border-l-slate-400 dark:border-l-slate-600";
              }

              // Operational Pill
              let opPillStyle =
                "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20";
              let opDotStyle = "bg-cyan-500";
              if (op.state === "on_trip") {
                opPillStyle =
                  "bg-violet-500/10 text-violet-700 dark:text-[#d0bcff] border border-violet-500/20";
                opDotStyle = "bg-violet-500 animate-pulse";
              } else if (op.state === "grounded") {
                opPillStyle =
                  "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20";
                opDotStyle = "bg-rose-500";
              } else if (op.state === "inactive") {
                opPillStyle =
                  "bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20";
                opDotStyle = "bg-slate-500";
              }

              // Compliance Pill
              let compPillStyle =
                "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20";
              let compDotStyle = "bg-emerald-500";
              let compText = "Valid";
              if (licStatus.value === "expired") {
                compPillStyle =
                  "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20";
                compDotStyle = "bg-rose-500";
                compText = "Expired";
              } else if (licStatus.value === "expiring_soon") {
                compPillStyle =
                  "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20";
                compDotStyle = "bg-amber-500";
                compText = `Expiring (${licStatus.daysLeft}d)`;
              }

              return (
                <tr
                  key={driver.id}
                  onClick={() => onViewDriver && onViewDriver(driver)}
                  className={[
                    "group transition-colors duration-150 relative cursor-pointer",
                    leftBarColor,
                    isHighlighted
                      ? "bg-cyan-500/10 dark:bg-cyan-950/40 ring-1 ring-inset ring-cyan-400/40"
                      : "hover:bg-slate-50/80 dark:hover:bg-[#1a1c28]",
                  ].join(" ")}
                >
                  {/* 1. Driver Details Column */}
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1f2230] border border-slate-200 dark:border-[#262837] flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-xs shrink-0 select-none">
                        {initials}
                      </div>

                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">
                          {displayName}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            {driver.driverCode}
                          </span>
                          <span>·</span>
                          <span className="text-[11px] capitalize">
                            {driverTypeLabel}
                          </span>
                          {driver.mobile && (
                            <>
                              <span>·</span>
                              <span className="font-mono text-[11px]">
                                {driver.mobile}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. License Info Column */}
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                        {driver.licenseNumber}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium mt-0.5">
                        {licenseTypeLabel}
                      </span>
                    </div>
                  </td>

                  {/* 3. Operational State Column */}
                  <td className="px-4 py-3 align-middle text-center whitespace-nowrap">
                    <span
                      className={[
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono",
                        opPillStyle,
                      ].join(" ")}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${opDotStyle}`}
                      />
                      <span>{op.label}</span>
                    </span>
                  </td>

                  {/* 4. Compliance Column */}
                  <td className="px-4 py-3 align-middle text-center whitespace-nowrap">
                    <span
                      className={[
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono",
                        compPillStyle,
                      ].join(" ")}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${compDotStyle}`}
                      />
                      <span>{compText}</span>
                    </span>
                  </td>

                  {/* 5. Current Assignment Column */}
                  <td className="px-4 py-3 align-middle max-w-[200px]">
                    {op.state === "on_trip" && op.activeTrip ? (
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-200 truncate">
                          {op.vehicle
                            ? `${op.vehicle.vehicleNumber}${op.vehicle.model ? ` (${op.vehicle.model})` : ""}`
                            : op.activeTrip.vehicleNumber || "Vehicle Assigned"}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-400 truncate mt-0.5">
                          <span className="truncate">
                            {op.activeTrip.pickupLocation || "Origin"}
                          </span>
                          <span>→</span>
                          <span className="truncate">
                            {op.activeTrip.dropLocation || "Destination"}
                          </span>
                        </div>
                      </div>
                    ) : op.state === "grounded" ? (
                      <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                        Unassigned (Restricted)
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500 italic">
                        Unassigned
                      </span>
                    )}
                  </td>

                  {/* 6. Actions Column */}
                  <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      {/* View Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onViewDriver) onViewDriver(driver);
                        }}
                        title="View Details"
                        aria-label={`View ${driver.name}`}
                        className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] hover:bg-slate-50 dark:hover:bg-[#1f2230] text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-slate-500 dark:text-slate-400">
                          visibility
                        </span>
                        <span>View</span>
                      </button>

                      {/* Edit Button */}
                      {onEditDriver && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditDriver(driver);
                          }}
                          title="Edit Driver"
                          aria-label="Edit"
                          className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] hover:bg-slate-50 dark:hover:bg-[#1f2230] text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            edit
                          </span>
                          <span className="hidden xl:inline">Edit</span>
                        </button>
                      )}

                      {/* Delete Button */}
                      {onDeleteDriver && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDriver(driver);
                          }}
                          title="Delete Driver"
                          aria-label="Delete"
                          className="h-8 w-8 rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 inline-flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            delete
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
