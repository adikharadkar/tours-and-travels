import { forwardRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../ui/ConfirmDialog";
import { getVehicleDocumentStatus } from "../../utils/vehicleDocumentStatus";
import { getVehicleOperationalState } from "../../utils/vehicleOperationalStatus";
import { deleteVehicle as deleteVehicleService } from "../../services/vehicleService";
import {
  VEHICLE_TYPE_LABELS,
  FUEL_TYPE_LABELS,
  OWNERSHIP_TYPE_LABELS,
} from "../../constants/vehicles";
import formatValue from "../../utils/formatValue";

const formatDate = (value) => {
  if (!value) {
    return "—";
  }
  const [year, month, day] = String(value).split("T")[0].split("-");
  if (!year || !month || !day) {
    return value;
  }
  return `${day}/${month}/${year}`;
};

const STATUS_BADGES = {
  valid:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  expiring_soon:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  expired:
    "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
  not_provided:
    "bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700",
};

function ComplianceDocCard({ name, icon, certNo, expiryDate, evaluation }) {
  const isExpired = evaluation?.status === "expired";
  const isExpiring = evaluation?.status === "expiring_soon";

  return (
    <div
      className={`relative rounded-xl border p-4 transition-all duration-150 overflow-hidden ${
        isExpired
          ? "bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/30 dark:border-rose-500/30"
          : isExpiring
            ? "bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/30 dark:border-amber-500/30"
            : "bg-white dark:bg-[#16181b] border-slate-200 dark:border-[#27272a] hover:border-slate-300 dark:hover:border-[#38393a]"
      }`}
    >
      {/* Accent left indicator for critical state */}
      {isExpired && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
      )}
      {isExpiring && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`p-2.5 rounded-lg shrink-0 flex items-center justify-center ${
              isExpired
                ? "bg-rose-500/10 text-rose-500 dark:text-rose-400"
                : isExpiring
                  ? "bg-amber-500/10 text-amber-500 dark:text-amber-400"
                  : "bg-slate-100 dark:bg-[#202227] text-slate-600 dark:text-slate-400"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {icon}
            </span>
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-[#e3e2e3] truncate">
              {name}
            </h4>
            <p className="text-xs text-slate-500 dark:text-[#958ea0] mt-0.5 flex items-center gap-1">
              <span>Doc No:</span>
              <span className="font-mono font-medium text-slate-700 dark:text-slate-300 truncate">
                {formatValue(certNo)}
              </span>
            </p>
          </div>
        </div>

        {evaluation && (
          <span
            className={`inline-flex shrink-0 items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              STATUS_BADGES[evaluation.status] || STATUS_BADGES.not_provided
            }`}
          >
            {evaluation.label}
          </span>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#27272a] flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-[#958ea0]">Expires</span>
        <span
          className={`font-medium ${
            isExpired
              ? "text-rose-600 dark:text-rose-400 font-semibold"
              : isExpiring
                ? "text-amber-600 dark:text-amber-400 font-semibold"
                : "text-slate-900 dark:text-[#e3e2e3]"
          }`}
        >
          {formatDate(expiryDate)}
        </span>
      </div>

      {evaluation?.message && (
        <p
          className={`mt-2 text-[11px] font-medium leading-tight ${
            isExpired
              ? "text-rose-600 dark:text-rose-400"
              : isExpiring
                ? "text-amber-600 dark:text-amber-400"
                : "text-slate-500 dark:text-[#958ea0]"
          }`}
        >
          {evaluation.message}
        </p>
      )}
    </div>
  );
}

const VehicleDetailsModal = forwardRef(function VehicleDetailsModal(
  { open, vehicle, trips = [], onClose, onEdit, onDelete },
  ref,
) {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!open || !vehicle) {
    return null;
  }

  const docStatus = getVehicleDocumentStatus(vehicle);
  const operational = getVehicleOperationalState(vehicle, trips);

  const typeLabel =
    VEHICLE_TYPE_LABELS[vehicle.vehicleType] || vehicle.vehicleType || "—";
  const fuelLabel =
    FUEL_TYPE_LABELS[vehicle.fuelType] || vehicle.fuelType || "—";
  const rawOwnershipLabel =
    OWNERSHIP_TYPE_LABELS[vehicle.ownershipType] ||
    vehicle.ownershipType ||
    "—";
  const isCompanyOwned =
    vehicle.ownershipType === "own" || rawOwnershipLabel === "Own";
  const ownershipDisplayLabel = isCompanyOwned
    ? "Company Owned (Own)"
    : rawOwnershipLabel;

  const getDocEval = (nameKeyword) =>
    docStatus.evaluations?.find((e) =>
      e.name.toLowerCase().includes(nameKeyword.toLowerCase()),
    );

  const insuranceEval = getDocEval("Insurance");
  const fitnessEval = getDocEval("Fitness");
  const permitEval = getDocEval("Permit");
  const pucEval = getDocEval("PUC");

  const validDocsCount =
    docStatus.evaluations?.filter((e) => e.status === "valid").length || 0;
  const expiredDocsCount =
    docStatus.evaluations?.filter((e) => e.status === "expired").length || 0;
  const expiringDocsCount =
    docStatus.evaluations?.filter((e) => e.status === "expiring_soon").length ||
    0;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEditClick = () => {
    onClose();
    if (onEdit) {
      onEdit(vehicle);
    } else {
      navigate(`/vehicles/${vehicle.id}/edit`);
    }
  };

  const handleViewAllTrips = () => {
    onClose();
    navigate("/trips", {
      state: {
        search: vehicle.vehicleNumber,
        vehicleFilter: vehicle.id,
      },
    });
  };

  const handleViewTrip = (trip) => {
    if (!trip) return;
    onClose();
    navigate("/trips", {
      state: {
        highlightedTripId: trip.id,
        search: trip.tripCode,
      },
    });
  };

  const handleDeleteClick = () => {
    if (onDelete) {
      onClose();
      onDelete(vehicle);
    } else {
      setShowDeleteConfirm(true);
    }
  };

  const handleConfirmDeleteInternal = async () => {
    setIsDeleting(true);
    try {
      deleteVehicleService(vehicle.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      console.error("Failed to delete vehicle:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 dark:bg-black/85 backdrop-blur-xs p-3 sm:p-4 md:p-6 overflow-y-auto"
        onMouseDown={handleBackdropClick}
      >
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby="vehicle-details-title"
          className="relative bg-white dark:bg-[#121315] w-full max-w-6xl rounded-2xl border border-slate-200 dark:border-[#27272a] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-900 dark:text-[#e3e2e3] animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Close Button Top Right */}
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#1f2021] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>

          {/* HEADER SECTION - Stitch Design */}
          <header className="flex flex-col md:flex-row md:items-start justify-between p-5 sm:p-6 md:p-7 border-b border-slate-200 dark:border-[#27272a] bg-slate-50/70 dark:bg-[#16181b]/90 gap-4 shrink-0">
            <div className="flex items-start gap-4 min-w-0 pr-8 md:pr-0">
              {/* Vehicle Icon Box */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-violet-500/10 dark:bg-[#1f2021] flex items-center justify-center border border-violet-500/20 dark:border-[#27272a] shrink-0 text-violet-600 dark:text-[#d0bcff]">
                <span className="material-symbols-outlined text-3xl">
                  directions_car
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5 mb-1">
                  <h1
                    id="vehicle-details-title"
                    className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
                  >
                    {vehicle.vehicleNumber}
                  </h1>
                  <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-[#292a2b] text-slate-700 dark:text-[#e3e2e3] border border-slate-200 dark:border-[#38393a]">
                    {vehicle.vehicleCode}
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-600 dark:text-[#958ea0] mb-3">
                  {vehicle.make
                    ? `${vehicle.make} ${vehicle.model || ""}`
                    : vehicle.model || typeLabel}
                  {vehicle.manufacturingYear
                    ? ` • ${vehicle.manufacturingYear} Model`
                    : ""}
                </p>

                {/* Status Indicators */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Master Status */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-xs font-semibold ${
                      vehicle.isActive !== false
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        vehicle.isActive !== false
                          ? "bg-emerald-500"
                          : "bg-slate-400"
                      }`}
                    />
                    {vehicle.isActive !== false ? "Active" : "Inactive"}
                  </span>

                  {/* Operational Status */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-xs font-semibold ${
                      operational.operationalStatus === "on_trip"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        : operational.operationalStatus === "available"
                          ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20"
                          : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        operational.operationalStatus === "on_trip"
                          ? "bg-amber-500 animate-pulse"
                          : operational.operationalStatus === "available"
                            ? "bg-cyan-500"
                            : "bg-rose-500"
                      }`}
                    />
                    {operational.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto pt-2 md:pt-0">
              <button
                type="button"
                onClick={handleDeleteClick}
                className="px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50 transition-all text-xs sm:text-sm font-medium cursor-pointer"
              >
                Delete Vehicle
              </button>

              <button
                type="button"
                onClick={handleViewAllTrips}
                className="px-3.5 py-2 text-slate-700 dark:text-[#e3e2e3] bg-white dark:bg-[#1f2021] border border-slate-200 dark:border-[#27272a] hover:bg-slate-50 dark:hover:bg-[#292a2b] rounded-lg transition-all text-xs sm:text-sm font-medium cursor-pointer shadow-xs"
              >
                View All Trips
              </button>

              <button
                type="button"
                onClick={handleEditClick}
                className="px-4 py-2 bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] text-white rounded-lg shadow-sm hover:shadow-md transition-all text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[17px]">
                  edit
                </span>
                <span>Edit Vehicle</span>
              </button>
            </div>
          </header>

          {/* MAIN SCROLLABLE 3-COLUMN BODY */}
          <main className="flex-1 overflow-y-auto p-5 sm:p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* COLUMN 1: Technical Specs & Ownership (4 cols) */}
              <section className="lg:col-span-4 flex flex-col gap-6">
                {/* Technical Specs Card */}
                <div className="bg-slate-50/50 dark:bg-[#16181b] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-xs">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#8b5cf6] text-[20px]">
                      build_circle
                    </span>
                    Technical Specs
                    <span className="sr-only">Vehicle Information</span>
                  </h2>

                  <dl className="space-y-3.5 text-xs sm:text-sm">
                    <div className="flex justify-between items-center border-b border-slate-200/70 dark:border-[#27272a] pb-2">
                      <dt className="text-slate-500 dark:text-[#958ea0]">
                        Vehicle Type
                      </dt>
                      <dd className="text-slate-900 dark:text-[#e3e2e3] font-medium text-right">
                        {typeLabel}
                      </dd>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-200/70 dark:border-[#27272a] pb-2">
                      <dt className="text-slate-500 dark:text-[#958ea0]">
                        Make / Manufacturer
                      </dt>
                      <dd className="text-slate-900 dark:text-[#e3e2e3] font-medium text-right">
                        {formatValue(vehicle.make)}
                      </dd>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-200/70 dark:border-[#27272a] pb-2">
                      <dt className="text-slate-500 dark:text-[#958ea0]">
                        Model
                      </dt>
                      <dd className="text-slate-900 dark:text-[#e3e2e3] font-medium text-right">
                        {formatValue(vehicle.model)}
                      </dd>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-200/70 dark:border-[#27272a] pb-2">
                      <dt className="text-slate-500 dark:text-[#958ea0]">
                        Manufacturing Year
                      </dt>
                      <dd className="text-slate-900 dark:text-[#e3e2e3] font-medium text-right">
                        {formatValue(vehicle.manufacturingYear)}
                      </dd>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-200/70 dark:border-[#27272a] pb-2">
                      <dt className="text-slate-500 dark:text-[#958ea0]">
                        Seating Capacity
                      </dt>
                      <dd className="text-slate-900 dark:text-[#e3e2e3] font-medium text-right">
                        {vehicle.seatingCapacity
                          ? `${vehicle.seatingCapacity} Passengers`
                          : "—"}
                      </dd>
                    </div>

                    <div className="flex justify-between items-center border-b border-slate-200/70 dark:border-[#27272a] pb-2">
                      <dt className="text-slate-500 dark:text-[#958ea0]">
                        Fuel Type
                      </dt>
                      <dd className="text-slate-900 dark:text-[#e3e2e3] font-medium text-right">
                        {fuelLabel}
                      </dd>
                    </div>

                    <div className="flex justify-between items-center pb-0.5">
                      <dt className="text-slate-500 dark:text-[#958ea0]">
                        Registration Date
                      </dt>
                      <dd className="text-slate-900 dark:text-[#e3e2e3] font-medium text-right">
                        {formatDate(vehicle.registrationDate)}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* Ownership Card */}
                <div className="bg-slate-50/50 dark:bg-[#16181b] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-xs">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#8b5cf6] text-[20px]">
                      badge
                    </span>
                    Ownership Details
                  </h2>

                  <dl className="space-y-3.5 text-xs sm:text-sm">
                    <div className="flex justify-between items-center border-b border-slate-200/70 dark:border-[#27272a] pb-2">
                      <dt className="text-slate-500 dark:text-[#958ea0]">
                        Ownership Type
                      </dt>
                      <dd className="text-slate-900 dark:text-[#e3e2e3] font-medium text-right">
                        {ownershipDisplayLabel}
                      </dd>
                    </div>

                    {!isCompanyOwned && (
                      <>
                        <div className="flex justify-between items-center border-b border-slate-200/70 dark:border-[#27272a] pb-2">
                          <dt className="text-slate-500 dark:text-[#958ea0]">
                            Owner Name
                          </dt>
                          <dd className="text-slate-900 dark:text-[#e3e2e3] font-medium text-right">
                            {formatValue(vehicle.ownerName)}
                          </dd>
                        </div>

                        <div className="flex justify-between items-center border-b border-slate-200/70 dark:border-[#27272a] pb-2">
                          <dt className="text-slate-500 dark:text-[#958ea0]">
                            Owner Contact
                          </dt>
                          <dd className="text-slate-900 dark:text-[#e3e2e3] font-medium text-right">
                            {formatValue(vehicle.ownerContact)}
                          </dd>
                        </div>
                      </>
                    )}

                    {vehicle.createdAt && (
                      <div className="flex justify-between items-center pb-0.5">
                        <dt className="text-slate-500 dark:text-[#958ea0]">
                          Record Created
                        </dt>
                        <dd className="text-slate-700 dark:text-[#958ea0] text-xs text-right">
                          {formatDate(vehicle.createdAt)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </section>

              {/* COLUMN 2: Compliance & Documents (4 cols) */}
              <section className="lg:col-span-4 flex flex-col gap-4">
                {/* Health Summary Banner */}
                <div className="bg-slate-100/90 dark:bg-[#1c1d22] border border-slate-200 dark:border-[#27272a] rounded-xl p-4 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <span
                      className={`material-symbols-outlined text-2xl ${
                        expiredDocsCount > 0
                          ? "text-rose-500"
                          : expiringDocsCount > 0
                            ? "text-amber-500"
                            : "text-emerald-500"
                      }`}
                    >
                      {expiredDocsCount > 0
                        ? "warning"
                        : expiringDocsCount > 0
                          ? "schedule"
                          : "verified_user"}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Document Health
                        <span className="sr-only">
                          Document & Compliance Information
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-[#958ea0] mt-0.5">
                        {expiredDocsCount === 0 && expiringDocsCount === 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            All {validDocsCount} Documents Valid
                          </span>
                        ) : (
                          <>
                            {validDocsCount} Valid
                            {expiredDocsCount > 0 && (
                              <span className="text-rose-600 dark:text-rose-400 font-semibold ml-1.5">
                                · {expiredDocsCount} Expired
                              </span>
                            )}
                            {expiringDocsCount > 0 && (
                              <span className="text-amber-600 dark:text-amber-400 font-semibold ml-1.5">
                                · {expiringDocsCount} Expiring Soon
                              </span>
                            )}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      STATUS_BADGES[docStatus.value] ||
                      STATUS_BADGES.not_provided
                    }`}
                  >
                    {docStatus.label}
                  </span>
                </div>

                {/* 4 Compliance Cards */}
                <div className="space-y-3">
                  <ComplianceDocCard
                    name="Insurance Policy"
                    icon="shield"
                    certNo={vehicle.insuranceNumber}
                    expiryDate={vehicle.insuranceExpiry}
                    evaluation={insuranceEval}
                  />

                  <ComplianceDocCard
                    name="Fitness Certificate"
                    icon="health_and_safety"
                    certNo={vehicle.fitnessCertificateNumber}
                    expiryDate={vehicle.fitnessExpiry}
                    evaluation={fitnessEval}
                  />

                  <ComplianceDocCard
                    name="National Permit"
                    icon="article"
                    certNo={vehicle.permitNumber}
                    expiryDate={vehicle.permitExpiry}
                    evaluation={permitEval}
                  />

                  <ComplianceDocCard
                    name="PUC Certificate"
                    icon="co2"
                    certNo={vehicle.pucNumber}
                    expiryDate={vehicle.pucExpiry}
                    evaluation={pucEval}
                  />
                </div>
              </section>

              {/* COLUMN 3: Operational Context (4 cols) */}
              <section className="lg:col-span-4 flex flex-col gap-6">
                {/* Current Assignment Card */}
                <div className="bg-slate-50/50 dark:bg-[#16181b] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 relative overflow-hidden shadow-xs">
                  {/* Accent Top Line */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 ${
                      operational.activeTrip
                        ? "bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6]"
                        : "bg-slate-200 dark:bg-[#27272a]"
                    }`}
                  />

                  <div className="flex items-center justify-between mb-4 mt-0.5">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#8b5cf6] text-[20px]">
                        local_shipping
                      </span>
                      Current Assignment
                    </h2>
                    {operational.activeTrip && (
                      <span className="font-mono text-xs font-semibold text-violet-600 dark:text-[#d0bcff]">
                        {operational.activeTrip.tripCode}
                      </span>
                    )}
                  </div>

                  {operational.activeTrip ? (
                    <div>
                      {/* Visual Route Timeline */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className="flex flex-col items-center pt-1 shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-400 dark:border-slate-500" />
                          <div className="w-0.5 h-7 bg-slate-300 dark:bg-[#343536] my-0.5" />
                          <div className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]" />
                        </div>
                        <div className="flex flex-col h-14 justify-between min-w-0">
                          <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                            {operational.activeTrip.pickupLocation ||
                              "Pickup Location"}
                          </p>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                            {operational.activeTrip.dropLocation ||
                              "Drop Location"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-200/70 dark:border-[#27272a] pt-3 text-xs">
                        <div>
                          <p className="text-[11px] text-slate-400 dark:text-[#958ea0]">
                            Driver
                          </p>
                          <p className="font-medium text-slate-800 dark:text-[#e3e2e3]">
                            {operational.activeTrip.driverName ||
                              "Assigned Driver"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleViewTrip(operational.activeTrip)}
                          className="text-violet-600 dark:text-[#d0bcff] hover:underline font-semibold text-xs cursor-pointer"
                        >
                          View Trip →
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <div className="inline-flex p-2.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mb-2">
                        <span className="material-symbols-outlined text-[22px]">
                          check_circle
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-[#e3e2e3]">
                        Available for Assignment
                      </p>
                      <p className="text-xs text-slate-500 dark:text-[#958ea0] mt-1">
                        No active trip in progress for this vehicle.
                      </p>
                    </div>
                  )}
                </div>

                {/* Recent Trips Card */}
                <div className="bg-slate-50/50 dark:bg-[#16181b] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-xs">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#8b5cf6] text-[20px]">
                      history
                    </span>
                    Recent Trips
                  </h2>

                  {operational.recentTrips &&
                  operational.recentTrips.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-[#27272a]">
                            <th className="font-mono uppercase text-slate-400 dark:text-[#958ea0] pb-2 font-semibold text-[10px]">
                              Trip ID
                            </th>
                            <th className="font-mono uppercase text-slate-400 dark:text-[#958ea0] pb-2 font-semibold text-[10px] pl-2">
                              Route
                            </th>
                            <th className="font-mono uppercase text-slate-400 dark:text-[#958ea0] pb-2 font-semibold text-[10px] text-right">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#27272a]">
                          {operational.recentTrips.slice(0, 4).map((t) => (
                            <tr
                              key={t.id || t.tripCode}
                              onClick={() => handleViewTrip(t)}
                              className="hover:bg-slate-100/70 dark:hover:bg-[#1f2021] transition-colors cursor-pointer group"
                            >
                              <td className="font-mono py-2.5 font-medium text-slate-700 dark:text-slate-300 group-hover:text-violet-600 dark:group-hover:text-[#d0bcff]">
                                {t.tripCode}
                              </td>
                              <td className="py-2.5 pl-2 text-slate-600 dark:text-slate-300 max-w-[130px] truncate">
                                {t.pickupLocation} → {t.dropLocation}
                              </td>
                              <td className="py-2.5 text-right text-slate-400 dark:text-[#958ea0]">
                                {formatDate(t.bookingDate || t.startDateTime)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-[#958ea0] italic py-2">
                      No recent trip history recorded for this vehicle.
                    </p>
                  )}
                </div>

                {/* Internal Notes */}
                <div className="bg-slate-100/70 dark:bg-[#16181b] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-xs">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#8b5cf6] text-[20px]">
                      notes
                    </span>
                    Internal Notes
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-[#958ea0] italic leading-relaxed whitespace-pre-wrap">
                    {vehicle.notes
                      ? `"${vehicle.notes}"`
                      : "No internal notes recorded."}
                  </p>
                  <p className="font-mono text-[10px] text-slate-400 dark:text-[#958ea0] mt-3">
                    Read-only view • Manage notes via Edit Vehicle
                  </p>
                </div>
              </section>
            </div>
          </main>

          {/* FOOTER */}
          <footer className="flex items-center justify-between p-4 px-6 border-t border-slate-200 dark:border-[#27272a] bg-slate-50/70 dark:bg-[#16181b]/80 shrink-0">
            <span className="text-xs text-slate-400 dark:text-[#958ea0]">
              FleetCore Asset Profile
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#1f2021] border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleEditClick}
                className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] rounded-lg shadow-sm transition-all cursor-pointer"
              >
                Edit Vehicle
              </button>
            </div>
          </footer>
        </div>
      </div>

      {/* Internal Delete Confirmation Dialog if needed */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Vehicle?"
        description={`Are you sure you want to delete ${vehicle.vehicleNumber} (${vehicle.vehicleCode})? This action cannot be undone.`}
        confirmText="Delete Vehicle"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
        onConfirm={handleConfirmDeleteInternal}
        onClose={() => setShowDeleteConfirm(false)}
      />
    </>
  );
});

export default VehicleDetailsModal;
