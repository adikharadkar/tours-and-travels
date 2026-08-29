import { getVehicleDocumentStatus } from "../../utils/vehicleDocumentStatus";
import { getVehicleOperationalState } from "../../utils/vehicleOperationalStatus";
import {
  VEHICLE_TYPE_LABELS,
  OWNERSHIP_TYPE_LABELS,
  FUEL_TYPE_LABELS,
} from "../../constants/vehicles";

export default function VehicleTable({
  vehicles = [],
  trips = [],
  sortField,
  sortDirection,
  onSort,
  onViewVehicle,
  onEditVehicle,
  onDeleteVehicle,
  highlightedVehicleId,
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
                onClick={() => onSort && onSort("vehicleCode")}
              >
                <div className="flex items-center gap-1">
                  <span>Vehicle / Reg</span>
                  {sortField === "vehicleCode" && (
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
                className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                onClick={() => onSort && onSort("make")}
              >
                <div className="flex items-center gap-1">
                  <span>Make & Model</span>
                  {sortField === "make" && (
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
                className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono cursor-pointer select-none hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                onClick={() => onSort && onSort("seatingCapacity")}
              >
                <div className="flex items-center gap-1">
                  <span>Type & Capacity</span>
                  {sortField === "seatingCapacity" && (
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
                Ownership
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
                className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono"
              >
                Actions
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-[#202330]">
            {vehicles.map((vehicle) => {
              const op = getVehicleOperationalState(vehicle, trips);
              const docStatus = getVehicleDocumentStatus(vehicle);
              const isHighlighted = vehicle.id === highlightedVehicleId;

              const leftBarColor =
                vehicle.isActive === false
                  ? "border-l-4 border-l-slate-400 dark:border-l-slate-600"
                  : docStatus.value === "expired"
                    ? "border-l-4 border-l-rose-500"
                    : docStatus.value === "expiring_soon"
                      ? "border-l-4 border-l-amber-500"
                      : op.operationalStatus === "on_trip"
                        ? "border-l-4 border-l-purple-500"
                        : "border-l-4 border-l-emerald-500";

              // Operational Pill Styles
              let opPillStyle =
                "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20";
              let opDotStyle = "bg-emerald-500";

              if (op.operationalStatus === "on_trip") {
                opPillStyle =
                  "bg-purple-500/10 text-purple-700 dark:text-[#d0bcff] border border-purple-500/20";
                opDotStyle = "bg-purple-500";
              } else if (
                op.operationalStatus === "maintenance" ||
                vehicle.isActive === false
              ) {
                opPillStyle =
                  "bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20";
                opDotStyle = "bg-slate-500";
              }

              // Compliance Pill Styles
              let compPillStyle =
                "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20";
              let compDotStyle = "bg-emerald-500";

              if (docStatus.value === "expired") {
                compPillStyle =
                  "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20";
                compDotStyle = "bg-rose-500";
              } else if (docStatus.value === "expiring_soon") {
                compPillStyle =
                  "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20";
                compDotStyle = "bg-amber-500";
              }

              return (
                <tr
                  key={vehicle.id}
                  onClick={() => onViewVehicle && onViewVehicle(vehicle)}
                  className={[
                    "group transition-colors duration-150 relative cursor-pointer",
                    leftBarColor,
                    isHighlighted
                      ? "bg-cyan-500/10 dark:bg-cyan-950/40 ring-1 ring-inset ring-cyan-400/40"
                      : "hover:bg-slate-50/80 dark:hover:bg-[#1a1c28]",
                  ].join(" ")}
                >
                  {/* 1. VEHICLE / REG COLUMN */}
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                        {vehicle.vehicleNumber}
                      </span>

                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-400 mt-0.5">
                        {vehicle.vehicleCode}
                      </span>
                    </div>
                  </td>

                  {/* 2. MAKE & MODEL COLUMN */}
                  <td className="px-4 py-3 align-middle max-w-[200px]">
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                        {vehicle.make} {vehicle.model}
                      </div>

                      <div className="text-[11px] text-slate-400 dark:text-slate-400 truncate mt-0.5">
                        {vehicle.manufacturingYear
                          ? `${vehicle.manufacturingYear} · `
                          : ""}
                        {FUEL_TYPE_LABELS[vehicle.fuelType] ||
                          vehicle.fuelType ||
                          "Diesel"}
                      </div>
                    </div>
                  </td>

                  {/* 3. TYPE & CAPACITY COLUMN */}
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase tracking-wider bg-slate-100 dark:bg-[#1f2230] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#262837]">
                        {VEHICLE_TYPE_LABELS[vehicle.vehicleType] ||
                          vehicle.vehicleType}
                      </span>

                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        {vehicle.seatingCapacity} Seater
                      </span>
                    </div>
                  </td>

                  {/* 4. OWNERSHIP COLUMN */}
                  <td className="px-4 py-3 align-middle whitespace-nowrap">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {OWNERSHIP_TYPE_LABELS[vehicle.ownershipType] ||
                        vehicle.ownershipType ||
                        "Owned"}
                    </div>

                    {vehicle.ownerName && (
                      <div className="text-[11px] text-slate-400 dark:text-slate-400 truncate max-w-[140px] mt-0.5">
                        {vehicle.ownerName}
                      </div>
                    )}
                  </td>

                  {/* 5. OPERATIONAL STATE */}
                  <td className="px-4 py-3 align-middle text-center whitespace-nowrap">
                    <span
                      className={[
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono",
                        opPillStyle,
                      ].join(" ")}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${opDotStyle}`}
                      />

                      <span>
                        {op.label ||
                          (vehicle.isActive === false
                            ? "Inactive"
                            : "Available")}
                      </span>
                    </span>
                  </td>

                  {/* 6. COMPLIANCE */}
                  <td className="px-4 py-3 align-middle text-center whitespace-nowrap">
                    <span
                      className={[
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono",
                        compPillStyle,
                      ].join(" ")}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${compDotStyle}`}
                      />

                      <span>{docStatus.label || "Valid"}</span>
                    </span>
                  </td>

                  {/* 7. ACTIONS COLUMN */}
                  <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      {/* View Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onViewVehicle) onViewVehicle(vehicle);
                        }}
                        title="View Details"
                        aria-label={`View ${vehicle.vehicleNumber}`}
                        className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] hover:bg-slate-50 dark:hover:bg-[#1f2230] text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-slate-500 dark:text-slate-400">
                          visibility
                        </span>

                        <span>View</span>
                      </button>

                      {/* Edit Button */}
                      {onEditVehicle && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditVehicle(vehicle);
                          }}
                          title="Edit Vehicle"
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
                      {onDeleteVehicle && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteVehicle(vehicle);
                          }}
                          title="Delete Vehicle"
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
