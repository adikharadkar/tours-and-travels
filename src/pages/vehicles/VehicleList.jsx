import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Button from "../../components/ui/Button";
import Card, { CardContent } from "../../components/ui/Card";
import Dropdown, {
  DropdownItem,
  DropdownDivider,
} from "../../components/ui/Dropdown";
import Pagination from "../../components/ui/Pagination";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Toast from "../../components/ui/Toast";
import VehicleCard from "../../components/vehicle/VehicleCard";
import VehicleDetailsModal from "../../components/vehicle/VehicleDetailsModal";
import { getVehicles, deleteVehicle } from "../../services/vehicleService";
import { getTrips } from "../../services/tripService";
import { getVehicleDocumentStatus } from "../../utils/vehicleDocumentStatus";
import { getVehicleOperationalState } from "../../utils/vehicleOperationalStatus";
import {
  VEHICLE_TYPES,
  OWNERSHIP_TYPES,
  VEHICLE_STATUS_OPTIONS,
  DOCUMENT_STATUS_OPTIONS,
  VEHICLE_TYPE_LABELS,
  OWNERSHIP_TYPE_LABELS,
  FUEL_TYPE_LABELS,
} from "../../constants/vehicles";

const VEHICLE_TYPE_FILTER_OPTIONS = [
  { label: "All Vehicle Types", value: "all" },
  ...VEHICLE_TYPES,
];

const OWNERSHIP_FILTER_OPTIONS = [
  { label: "All Ownerships", value: "all" },
  ...OWNERSHIP_TYPES,
];

const SORT_OPTIONS = [
  { label: "Vehicle Number", value: "vehicleNumber" },
  { label: "Vehicle Code", value: "vehicleCode" },
  { label: "Vehicle Type", value: "vehicleType" },
  { label: "Make / Model", value: "make" },
  { label: "Seating Capacity", value: "seatingCapacity" },
  { label: "Ownership", value: "ownershipType" },
  { label: "Status", value: "isActive" },
  { label: "Document Expiry", value: "documentExpiry" },
];

const ITEMS_PER_PAGE = 8;

export default function VehicleList() {
  const navigate = useNavigate();
  const location = useLocation();

  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [operationalTab, setOperationalTab] = useState("all"); // 'all' | 'available' | 'on_trip' | 'maintenance'
  const [typeFilter, setTypeFilter] = useState("all");
  const [ownershipFilter, setOwnershipFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [docStatusFilter, setDocStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("vehicleCode");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAttentionBanner, setShowAttentionBanner] = useState(true);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState(null);
  const [highlightedVehicleId, setHighlightedVehicleId] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    try {
      const vehicleData = getVehicles();
      const tripData = getTrips();
      setVehicles(vehicleData);
      setTrips(tripData);
      setLoadError("");
    } catch (err) {
      console.error("Failed to load vehicle fleet records:", err);
      setLoadError("Failed to load vehicle records from storage.");
    }
  }, []);

  useEffect(() => {
    if (location.state?.toast) {
      setToast({
        id: Date.now(),
        ...location.state.toast,
      });
    }

    if (location.state?.highlightedVehicleId) {
      setHighlightedVehicleId(location.state.highlightedVehicleId);
      const timer = setTimeout(() => {
        setHighlightedVehicleId(null);
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Comprehensive Fleet Metrics
  const stats = useMemo(() => {
    let activeCount = 0;
    let availableCount = 0;
    let onTripCount = 0;
    let maintenanceCount = 0;
    let expiredDocsCount = 0;
    let expiringDocsCount = 0;

    vehicles.forEach((v) => {
      if (v.isActive !== false) {
        activeCount++;
      } else {
        maintenanceCount++;
      }

      const op = getVehicleOperationalState(v, trips);
      if (op.operationalStatus === "available") {
        availableCount++;
      } else if (op.operationalStatus === "on_trip") {
        onTripCount++;
      }

      const doc = getVehicleDocumentStatus(v);
      if (doc.value === "expired") {
        expiredDocsCount++;
      } else if (doc.value === "expiring_soon") {
        expiringDocsCount++;
      }
    });

    return {
      total: vehicles.length,
      active: activeCount,
      inactive: maintenanceCount,
      available: availableCount,
      onTrip: onTripCount,
      maintenance: maintenanceCount,
      expired: expiredDocsCount,
      expiringSoon: expiringDocsCount,
      needsAttention: expiredDocsCount + expiringDocsCount,
    };
  }, [vehicles, trips]);

  // Filtered and Sorted Vehicles
  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return vehicles
      .filter((vehicle) => {
        // 1. Search Query: Code, Number, Make, Model, Owner, Type
        if (query) {
          const matchCode = (vehicle.vehicleCode || "")
            .toLowerCase()
            .includes(query);
          const matchNumber = (vehicle.vehicleNumber || "")
            .toLowerCase()
            .includes(query);
          const matchMake = (vehicle.make || "").toLowerCase().includes(query);
          const matchModel = (vehicle.model || "")
            .toLowerCase()
            .includes(query);
          const matchOwner = (vehicle.ownerName || "")
            .toLowerCase()
            .includes(query);
          const typeLabel = (
            VEHICLE_TYPE_LABELS[vehicle.vehicleType] || ""
          ).toLowerCase();
          const matchType =
            typeLabel.includes(query) ||
            (vehicle.vehicleType || "").toLowerCase().includes(query);

          if (
            !matchCode &&
            !matchNumber &&
            !matchMake &&
            !matchModel &&
            !matchOwner &&
            !matchType
          ) {
            return false;
          }
        }

        // 2. Operational Tab Filter
        if (operationalTab !== "all") {
          const op = getVehicleOperationalState(vehicle, trips);
          if (
            operationalTab === "available" &&
            op.operationalStatus !== "available"
          )
            return false;
          if (
            operationalTab === "on_trip" &&
            op.operationalStatus !== "on_trip"
          )
            return false;
          if (
            operationalTab === "maintenance" &&
            op.operationalStatus !== "maintenance"
          )
            return false;
        }

        // 3. Vehicle Type Filter
        if (typeFilter !== "all" && vehicle.vehicleType !== typeFilter) {
          return false;
        }

        // 4. Ownership Filter
        if (
          ownershipFilter !== "all" &&
          vehicle.ownershipType !== ownershipFilter
        ) {
          return false;
        }

        // 5. Vehicle Status Filter (Active / Inactive)
        if (statusFilter !== "all") {
          const isActive = vehicle.isActive !== false;
          if (statusFilter === "active" && !isActive) return false;
          if (statusFilter === "inactive" && isActive) return false;
        }

        // 6. Document Compliance Filter
        if (docStatusFilter !== "all") {
          const docStatus = getVehicleDocumentStatus(vehicle);
          if (docStatus.value !== docStatusFilter) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let valA = a[sortBy] ?? "";
        let valB = b[sortBy] ?? "";

        if (sortBy === "seatingCapacity") {
          valA = Number(valA || 0);
          valB = Number(valB || 0);
          return sortOrder === "asc" ? valA - valB : valB - valA;
        }

        if (sortBy === "isActive") {
          valA = a.isActive !== false ? 1 : 0;
          valB = b.isActive !== false ? 1 : 0;
          return sortOrder === "asc" ? valA - valB : valB - valA;
        }

        if (sortBy === "documentExpiry") {
          const docA = getVehicleDocumentStatus(a);
          const docB = getVehicleDocumentStatus(b);
          const prio = { expired: 0, expiring_soon: 1, valid: 2 };
          valA = prio[docA.value] ?? 3;
          valB = prio[docB.value] ?? 3;
          return sortOrder === "asc" ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortOrder === "asc"
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      });
  }, [
    vehicles,
    trips,
    search,
    operationalTab,
    typeFilter,
    ownershipFilter,
    statusFilter,
    docStatusFilter,
    sortBy,
    sortOrder,
  ]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    operationalTab,
    typeFilter,
    ownershipFilter,
    statusFilter,
    docStatusFilter,
    sortBy,
    sortOrder,
  ]);

  const totalPages = Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE);
  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredVehicles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredVehicles, currentPage]);

  const hasActiveFilters =
    search.trim() !== "" ||
    operationalTab !== "all" ||
    typeFilter !== "all" ||
    ownershipFilter !== "all" ||
    statusFilter !== "all" ||
    docStatusFilter !== "all";

  const handleClearFilters = () => {
    setSearch("");
    setOperationalTab("all");
    setTypeFilter("all");
    setOwnershipFilter("all");
    setStatusFilter("all");
    setDocStatusFilter("all");
  };

  const handleEdit = (vehicle) => {
    navigate(`/vehicles/${vehicle.id}/edit`);
  };

  const handleConfirmDelete = () => {
    if (!vehicleToDelete) return;
    setIsDeleting(true);

    try {
      deleteVehicle(vehicleToDelete.id);
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleToDelete.id));

      if (selectedVehicle?.id === vehicleToDelete.id) {
        setSelectedVehicle(null);
      }

      setToast({
        id: Date.now(),
        variant: "success",
        title: "Vehicle Deleted",
        message: `Vehicle ${vehicleToDelete.vehicleNumber} (${vehicleToDelete.vehicleCode}) was removed successfully.`,
      });
      setVehicleToDelete(null);
    } catch (err) {
      console.error("Delete vehicle error:", err);
      setToast({
        id: Date.now(),
        variant: "error",
        title: "Delete Failed",
        message: err.message || "Failed to delete vehicle.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // KPI Card click helpers
  const handleKpiClick = (type) => {
    if (type === "total") {
      handleClearFilters();
    } else if (type === "active") {
      setStatusFilter((prev) => (prev === "active" ? "all" : "active"));
      setOperationalTab("all");
    } else if (type === "available") {
      setOperationalTab((prev) => (prev === "available" ? "all" : "available"));
    } else if (type === "on_trip") {
      setOperationalTab((prev) => (prev === "on_trip" ? "all" : "on_trip"));
    } else if (type === "maintenance" || type === "inactive") {
      setOperationalTab((prev) =>
        prev === "maintenance" ? "all" : "maintenance",
      );
    } else if (type === "expiring_soon") {
      setDocStatusFilter((prev) =>
        prev === "expiring_soon" ? "all" : "expiring_soon",
      );
    } else if (type === "expired") {
      setDocStatusFilter((prev) => (prev === "expired" ? "all" : "expired"));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {toast && (
        <Toast
          id={toast.id}
          variant={toast.variant}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Top Header - Stitch Style */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-[#e3e2e3]">
            Vehicles
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-[#958ea0]">
            Manage your fleet, availability, compliance and vehicle records.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/vehicles/new")}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] active:opacity-90 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Add Vehicle</span>
        </button>
      </div>

      {/* KPI / Fleet Overview Area */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {/* Total Fleet */}
        <button
          type="button"
          onClick={() => handleKpiClick("total")}
          className={[
            "group relative flex flex-col justify-between text-left rounded-xl p-3.5 transition-all duration-200 cursor-pointer select-none",
            "border bg-white dark:bg-[#161822] shadow-xs hover:shadow-md hover:-translate-y-0.5",
            operationalTab === "all" && !hasActiveFilters
              ? "border-cyan-500/70 dark:border-cyan-500/80 ring-2 ring-cyan-500/20 dark:ring-cyan-500/30 bg-cyan-50/10 dark:bg-cyan-950/20"
              : "border-slate-200/90 dark:border-[#262837] hover:border-slate-300 dark:hover:border-slate-600",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-1 w-full">
            <span className="font-mono text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              TOTAL FLEET
            </span>
            <span className="material-symbols-outlined text-[17px] text-slate-500 dark:text-slate-400 p-1 rounded-md bg-slate-100 dark:bg-[#202330]">
              directions_car
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            {stats.total}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Total registered
          </p>
        </button>

        {/* Active */}
        <button
          type="button"
          onClick={() => handleKpiClick("active")}
          className={[
            "group relative flex flex-col justify-between text-left rounded-xl p-3.5 transition-all duration-200 cursor-pointer select-none",
            "border bg-white dark:bg-[#161822] shadow-xs hover:shadow-md hover:-translate-y-0.5",
            statusFilter === "active"
              ? "border-emerald-500/80 dark:border-emerald-500 ring-2 ring-emerald-500/20 dark:ring-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20"
              : "border-slate-200/90 dark:border-[#262837] hover:border-slate-300 dark:hover:border-slate-600",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-1 w-full">
            <span className="font-mono text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              ACTIVE
            </span>
            <span className="material-symbols-outlined text-[17px] text-emerald-600 dark:text-emerald-400 p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60">
              check_circle
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <span className="text-sm leading-none">•</span>
            {stats.active}
          </p>
          <p className="mt-1 text-[11px] text-emerald-600/90 dark:text-emerald-400/90 font-medium">
            Operational
          </p>
        </button>

        {/* Available */}
        <button
          type="button"
          onClick={() => handleKpiClick("available")}
          className={[
            "group relative flex flex-col justify-between text-left rounded-xl p-3.5 transition-all duration-200 cursor-pointer select-none",
            "border bg-white dark:bg-[#161822] shadow-xs hover:shadow-md hover:-translate-y-0.5",
            operationalTab === "available"
              ? "border-cyan-500/80 dark:border-cyan-500 ring-2 ring-cyan-500/20 dark:ring-cyan-500/30 bg-cyan-50/20 dark:bg-cyan-950/20"
              : "border-slate-200/90 dark:border-[#262837] hover:border-slate-300 dark:hover:border-slate-600",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-1 w-full">
            <span className="font-mono text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              AVAILABLE
            </span>
            <span className="material-symbols-outlined text-[17px] text-cyan-600 dark:text-cyan-400 p-1 rounded-md bg-cyan-50 dark:bg-cyan-950/60">
              event_available
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-cyan-600 dark:text-cyan-400">
            {stats.available}
          </p>
          <p className="mt-1 text-[11px] text-cyan-600/90 dark:text-cyan-400/90 font-medium">
            Ready for trip
          </p>
        </button>

        {/* On Trip */}
        <button
          type="button"
          onClick={() => handleKpiClick("on_trip")}
          className={[
            "group relative flex flex-col justify-between text-left rounded-xl p-3.5 transition-all duration-200 cursor-pointer select-none",
            "border bg-white dark:bg-[#161822] shadow-xs hover:shadow-md hover:-translate-y-0.5",
            operationalTab === "on_trip"
              ? "border-purple-500/80 dark:border-purple-400 ring-2 ring-purple-500/20 dark:ring-purple-500/30 bg-purple-50/20 dark:bg-purple-950/20"
              : "border-slate-200/90 dark:border-[#262837] hover:border-slate-300 dark:hover:border-slate-600",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-1 w-full">
            <span className="font-mono text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              ON TRIP
            </span>
            <span className="material-symbols-outlined text-[17px] text-purple-600 dark:text-[#d0bcff] p-1 rounded-md bg-purple-50 dark:bg-purple-950/60">
              commute
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-purple-600 dark:text-[#d0bcff]">
            {stats.onTrip}
          </p>
          <p className="mt-1 text-[11px] text-purple-600/90 dark:text-purple-400/90 font-medium">
            In transit
          </p>
        </button>

        {/* Inactive / Maintenance */}
        <button
          type="button"
          onClick={() => handleKpiClick("maintenance")}
          className={[
            "group relative flex flex-col justify-between text-left rounded-xl p-3.5 transition-all duration-200 cursor-pointer select-none",
            "border bg-white dark:bg-[#161822] shadow-xs hover:shadow-md hover:-translate-y-0.5",
            operationalTab === "maintenance" || statusFilter === "inactive"
              ? "border-slate-400 dark:border-slate-500 ring-2 ring-slate-400/20 dark:ring-slate-500/30 bg-slate-50 dark:bg-slate-800/20"
              : "border-slate-200/90 dark:border-[#262837] hover:border-slate-300 dark:hover:border-slate-600",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-1 w-full">
            <span className="font-mono text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              INACTIVE
            </span>
            <span className="material-symbols-outlined text-[17px] text-slate-500 dark:text-slate-400 p-1 rounded-md bg-slate-100 dark:bg-[#202330]">
              build
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <span className="text-sm leading-none">•</span>
            {stats.inactive}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Needs service
          </p>
        </button>

        {/* Expiring Soon */}
        <button
          type="button"
          onClick={() => handleKpiClick("expiring_soon")}
          className={[
            "group relative flex flex-col justify-between text-left rounded-xl p-3.5 transition-all duration-200 cursor-pointer select-none",
            "border bg-white dark:bg-[#161822] shadow-xs hover:shadow-md hover:-translate-y-0.5",
            docStatusFilter === "expiring_soon"
              ? "border-amber-500/80 dark:border-amber-400 ring-2 ring-amber-500/20 dark:ring-amber-500/30 bg-amber-50/20 dark:bg-amber-950/20"
              : "border-slate-200/90 dark:border-[#262837] hover:border-slate-300 dark:hover:border-slate-600",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-1 w-full">
            <span className="font-mono text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              EXPIRING SOON
            </span>
            <span className="material-symbols-outlined text-[17px] text-amber-600 dark:text-amber-400 p-1 rounded-md bg-amber-50 dark:bg-amber-950/60">
              alarm
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
            {stats.expiringSoon}
          </p>
          <p className="mt-1 text-[11px] text-amber-600/90 dark:text-amber-400/90 font-medium">
            Within 30 days
          </p>
        </button>

        {/* Expired Docs */}
        <button
          type="button"
          onClick={() => handleKpiClick("expired")}
          className={[
            "col-span-2 sm:col-span-1 group relative flex flex-col justify-between text-left rounded-xl p-3.5 transition-all duration-200 cursor-pointer select-none",
            "border bg-white dark:bg-[#161822] shadow-xs hover:shadow-md hover:-translate-y-0.5",
            docStatusFilter === "expired"
              ? "border-rose-500/80 dark:border-rose-400 ring-2 ring-rose-500/20 dark:ring-rose-500/30 bg-rose-50/20 dark:bg-rose-950/20"
              : "border-slate-200/90 dark:border-[#262837] hover:border-slate-300 dark:hover:border-slate-600",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-1 w-full">
            <span className="font-mono text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              EXPIRED DOCS
            </span>
            <span className="material-symbols-outlined text-[17px] text-rose-600 dark:text-rose-400 p-1 rounded-md bg-rose-50 dark:bg-rose-950/60">
              report
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <span className="text-sm leading-none">•</span>
            {stats.expired}
          </p>
          <p className="mt-1 text-[11px] text-rose-600/90 dark:text-rose-400/90 font-medium">
            Action required
          </p>
        </button>
      </div>

      {/* Needs Attention Alert Banner if compliance items exist */}
      {stats.needsAttention > 0 && showAttentionBanner && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5 text-amber-900 dark:text-amber-200 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-amber-600 dark:text-amber-400 select-none">
              warning
            </span>
            <span>
              <strong className="font-semibold">
                {stats.needsAttention}{" "}
                {stats.needsAttention === 1 ? "vehicle needs" : "vehicles need"}{" "}
                attention:
              </strong>{" "}
              {stats.expired > 0 && (
                <span className="text-rose-700 dark:text-rose-400 font-medium">
                  {stats.expired} with expired document
                  {stats.expired > 1 ? "s" : ""}
                </span>
              )}
              {stats.expired > 0 && stats.expiringSoon > 0 && ", "}
              {stats.expiringSoon > 0 && (
                <span>
                  {stats.expiringSoon} with document
                  {stats.expiringSoon > 1 ? "s" : ""} expiring soon
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {stats.expired > 0 && (
              <button
                type="button"
                onClick={() => setDocStatusFilter("expired")}
                className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-medium text-[11px] transition-colors cursor-pointer"
              >
                View Expired ({stats.expired})
              </button>
            )}
            {stats.expiringSoon > 0 && (
              <button
                type="button"
                onClick={() => setDocStatusFilter("expiring_soon")}
                className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-medium text-[11px] transition-colors cursor-pointer"
              >
                View Expiring Soon ({stats.expiringSoon})
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowAttentionBanner(false)}
              aria-label="Dismiss alert"
              className="p-1 text-amber-800 dark:text-amber-400 hover:text-amber-950 dark:hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Operational Views Tab Bar & Search / Filter Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 dark:border-[#27272a] pb-3">
        {/* Operational Tabs matching Stitch layout */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
          <button
            type="button"
            onClick={() => setOperationalTab("all")}
            className={[
              "relative pb-2.5 px-3 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap",
              operationalTab === "all"
                ? "text-[#8b5cf6] dark:text-[#d0bcff] font-semibold"
                : "text-slate-600 dark:text-[#cbc3d7] hover:text-slate-900 dark:hover:text-white",
            ].join(" ")}
          >
            All Vehicles
            {operationalTab === "all" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8b5cf6] dark:bg-[#d0bcff] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setOperationalTab("available")}
            className={[
              "relative pb-2.5 px-3 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap",
              operationalTab === "available"
                ? "text-[#8b5cf6] dark:text-[#d0bcff] font-semibold"
                : "text-slate-600 dark:text-[#cbc3d7] hover:text-slate-900 dark:hover:text-white",
            ].join(" ")}
          >
            Available
            {operationalTab === "available" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8b5cf6] dark:bg-[#d0bcff] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setOperationalTab("on_trip")}
            className={[
              "relative pb-2.5 px-3 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap",
              operationalTab === "on_trip"
                ? "text-[#8b5cf6] dark:text-[#d0bcff] font-semibold"
                : "text-slate-600 dark:text-[#cbc3d7] hover:text-slate-900 dark:hover:text-white",
            ].join(" ")}
          >
            On Trip
            {operationalTab === "on_trip" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8b5cf6] dark:bg-[#d0bcff] rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setOperationalTab("maintenance")}
            className={[
              "relative pb-2.5 px-3 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap",
              operationalTab === "maintenance"
                ? "text-[#8b5cf6] dark:text-[#d0bcff] font-semibold"
                : "text-slate-600 dark:text-[#cbc3d7] hover:text-slate-900 dark:hover:text-white",
            ].join(" ")}
          >
            Maintenance
            {operationalTab === "maintenance" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8b5cf6] dark:bg-[#d0bcff] rounded-full" />
            )}
          </button>
        </div>

        {/* Right Search and Filter Trigger */}
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-72 lg:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 text-[18px] select-none pointer-events-none">
              search
            </span>
            <input
              type="text"
              aria-label="Search vehicles"
              placeholder="Search vehicles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-8 rounded-lg text-xs sm:text-sm bg-slate-50 dark:bg-[#191b26] border border-slate-200 dark:border-[#262837] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 shadow-2xs transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setShowMoreFilters((prev) => !prev)}
            className={[
              "h-9 px-3.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer select-none",
              showMoreFilters ||
              (hasActiveFilters && operationalTab === "all" && search === "")
                ? "bg-cyan-50 text-cyan-800 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-500/50 shadow-xs ring-1 ring-cyan-500/20"
                : "bg-slate-50 dark:bg-[#191b26] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-[#262837] hover:bg-slate-100 dark:hover:bg-[#202330] hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs",
            ].join(" ")}
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>Filters</span>
            {(typeFilter !== "all" ||
              ownershipFilter !== "all" ||
              statusFilter !== "all" ||
              docStatusFilter !== "all") && (
              <span className="w-2 h-2 rounded-full bg-cyan-500" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Filter Panel */}
      {showMoreFilters && (
        <Card className="border border-slate-200/90 dark:border-[#262837] bg-white dark:bg-[#161822] shadow-xs rounded-xl overflow-hidden">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#262837] pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                Filter Fleet Records
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    refresh
                  </span>
                  <span>Reset filters</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {/* Type Filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  Vehicle Type
                </label>
                <div className="relative">
                  <select
                    aria-label="Filter by vehicle type"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className={[
                      "w-full h-9 pl-3 pr-8 text-xs font-semibold rounded-lg border appearance-none transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/30",
                      typeFilter !== "all"
                        ? "bg-cyan-50 text-cyan-900 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-500/50 ring-1 ring-cyan-500/20"
                        : "bg-slate-50 dark:bg-[#191b26] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-[#262837] hover:bg-slate-100 dark:hover:bg-[#202330] hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs",
                    ].join(" ")}
                  >
                    {VEHICLE_TYPE_FILTER_OPTIONS.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        className="dark:bg-[#191b26]"
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 dark:text-slate-400 pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Ownership Filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  Ownership
                </label>
                <div className="relative">
                  <select
                    aria-label="Filter by ownership"
                    value={ownershipFilter}
                    onChange={(e) => setOwnershipFilter(e.target.value)}
                    className={[
                      "w-full h-9 pl-3 pr-8 text-xs font-semibold rounded-lg border appearance-none transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/30",
                      ownershipFilter !== "all"
                        ? "bg-cyan-50 text-cyan-900 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-500/50 ring-1 ring-cyan-500/20"
                        : "bg-slate-50 dark:bg-[#191b26] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-[#262837] hover:bg-slate-100 dark:hover:bg-[#202330] hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs",
                    ].join(" ")}
                  >
                    {OWNERSHIP_FILTER_OPTIONS.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        className="dark:bg-[#191b26]"
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 dark:text-slate-400 pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Master Status Filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  Master Status
                </label>
                <div className="relative">
                  <select
                    aria-label="Filter by status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={[
                      "w-full h-9 pl-3 pr-8 text-xs font-semibold rounded-lg border appearance-none transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/30",
                      statusFilter !== "all"
                        ? "bg-cyan-50 text-cyan-900 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-500/50 ring-1 ring-cyan-500/20"
                        : "bg-slate-50 dark:bg-[#191b26] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-[#262837] hover:bg-slate-100 dark:hover:bg-[#202330] hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs",
                    ].join(" ")}
                  >
                    {VEHICLE_STATUS_OPTIONS.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        className="dark:bg-[#191b26]"
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 dark:text-slate-400 pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Document Compliance Filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  Compliance
                </label>
                <div className="relative">
                  <select
                    aria-label="Filter by document status"
                    value={docStatusFilter}
                    onChange={(e) => setDocStatusFilter(e.target.value)}
                    className={[
                      "w-full h-9 pl-3 pr-8 text-xs font-semibold rounded-lg border appearance-none transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/30",
                      docStatusFilter !== "all"
                        ? "bg-cyan-50 text-cyan-900 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-500/50 ring-1 ring-cyan-500/20"
                        : "bg-slate-50 dark:bg-[#191b26] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-[#262837] hover:bg-slate-100 dark:hover:bg-[#202330] hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs",
                    ].join(" ")}
                  >
                    {DOCUMENT_STATUS_OPTIONS.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        className="dark:bg-[#191b26]"
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 dark:text-slate-400 pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Sorting Selection */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
                  Sort By
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <select
                      aria-label="Sort by"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full h-9 pl-3 pr-8 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#191b26] text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#202330] hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 appearance-none shadow-2xs cursor-pointer"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="dark:bg-[#191b26]"
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 dark:text-slate-400 pointer-events-none">
                      expand_more
                    </span>
                  </div>
                  <button
                    type="button"
                    title={
                      sortOrder === "asc"
                        ? "Ascending (Click for Descending)"
                        : "Descending (Click for Ascending)"
                    }
                    onClick={() =>
                      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
                    }
                    className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#191b26] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#202330] hover:border-slate-300 dark:hover:border-slate-600 text-xs font-semibold cursor-pointer shadow-2xs transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Filter Chips bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-[#958ea0]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span>
              Showing {filteredVehicles.length} of {vehicles.length} vehicles
            </span>
            {search && (
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-[#1f2021] px-2 py-0.5 text-[11px] text-slate-800 dark:text-[#e3e2e3]">
                Search: "{search}"
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="hover:text-rose-500"
                >
                  ✕
                </button>
              </span>
            )}
            {operationalTab !== "all" && (
              <span className="inline-flex items-center gap-1 rounded bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 text-[11px] text-purple-700 dark:text-[#d0bcff]">
                View: {operationalTab}
                <button
                  type="button"
                  onClick={() => setOperationalTab("all")}
                  className="hover:text-rose-500"
                >
                  ✕
                </button>
              </span>
            )}
            {typeFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-[#1f2021] px-2 py-0.5 text-[11px] text-slate-800 dark:text-[#e3e2e3]">
                Type: {VEHICLE_TYPE_LABELS[typeFilter] || typeFilter}
                <button
                  type="button"
                  onClick={() => setTypeFilter("all")}
                  className="hover:text-rose-500"
                >
                  ✕
                </button>
              </span>
            )}
            {ownershipFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-[#1f2021] px-2 py-0.5 text-[11px] text-slate-800 dark:text-[#e3e2e3]">
                Ownership:{" "}
                {OWNERSHIP_TYPE_LABELS[ownershipFilter] || ownershipFilter}
                <button
                  type="button"
                  onClick={() => setOwnershipFilter("all")}
                  className="hover:text-rose-500"
                >
                  ✕
                </button>
              </span>
            )}
            {statusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-[#1f2021] px-2 py-0.5 text-[11px] text-slate-800 dark:text-[#e3e2e3]">
                Status: {statusFilter}
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className="hover:text-rose-500"
                >
                  ✕
                </button>
              </span>
            )}
            {docStatusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-[#1f2021] px-2 py-0.5 text-[11px] text-slate-800 dark:text-[#e3e2e3]">
                Doc: {docStatusFilter}
                <button
                  type="button"
                  onClick={() => setDocStatusFilter("all")}
                  className="hover:text-rose-500"
                >
                  ✕
                </button>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleClearFilters}
            className="font-medium text-[#8b5cf6] dark:text-[#d0bcff] hover:underline cursor-pointer"
          >
            Reset all filters
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {loadError ? (
        <Card className="border-rose-500/30 bg-rose-500/5 p-6 text-center">
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
            {loadError}
          </p>
        </Card>
      ) : vehicles.length === 0 ? (
        <Card className="py-12 text-center border border-slate-200 dark:border-[#27272a] bg-white dark:bg-[#121314]">
          <CardContent className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 text-purple-600 dark:text-[#d0bcff] font-bold text-2xl">
              🚌
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-[#e3e2e3]">
                No vehicles added yet
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-[#958ea0]">
                Create your first vehicle master record to start managing your
                fleet operations.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate("/vehicles/new")}
              className="bg-[#8b5cf6] text-white"
            >
              + Add First Vehicle
            </Button>
          </CardContent>
        </Card>
      ) : filteredVehicles.length === 0 ? (
        <Card className="py-12 text-center border border-slate-200 dark:border-[#27272a] bg-white dark:bg-[#121314]">
          <CardContent className="space-y-3">
            <h3 className="text-base font-semibold text-slate-900 dark:text-[#e3e2e3]">
              No matching vehicles found
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#958ea0]">
              No vehicles matched your search query and active filter criteria.
            </p>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClearFilters}
              className="text-[#8b5cf6] dark:text-[#d0bcff]"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile View: High Quality Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:hidden">
            {paginatedVehicles.map((vehicle, idx) => (
              <VehicleCard
                key={vehicle.id || vehicle.vehicleCode || `veh_card_${idx}`}
                vehicle={vehicle}
                trips={trips}
                highlighted={vehicle.id === highlightedVehicleId}
                onView={(v) => setSelectedVehicle(v)}
                onEdit={(v) => handleEdit(v)}
                onDelete={(v) => setVehicleToDelete(v)}
              />
            ))}
          </div>

          {/* Desktop View: Precision Stitch Table */}
          <div className="hidden md:block">
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-[#27272a] bg-white dark:bg-[#121314] shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-[#27272a] bg-slate-50/75 dark:bg-[#18191c]">
                      <th className="py-3 px-4 font-mono font-medium tracking-wider text-[11px] text-slate-500 dark:text-[#958ea0] uppercase">
                        REG / ID
                      </th>
                      <th className="py-3 px-4 font-mono font-medium tracking-wider text-[11px] text-slate-500 dark:text-[#958ea0] uppercase">
                        MAKE & MODEL
                      </th>
                      <th className="py-3 px-4 font-mono font-medium tracking-wider text-[11px] text-slate-500 dark:text-[#958ea0] uppercase">
                        CAPACITY / TYPE
                      </th>
                      <th className="py-3 px-4 font-mono font-medium tracking-wider text-[11px] text-slate-500 dark:text-[#958ea0] uppercase">
                        STATUS / ACTIVITY
                      </th>
                      <th className="py-3 px-4 font-mono font-medium tracking-wider text-[11px] text-slate-500 dark:text-[#958ea0] uppercase">
                        COMPLIANCE
                      </th>
                      <th className="py-3 px-4 font-mono font-medium tracking-wider text-[11px] text-slate-500 dark:text-[#958ea0] uppercase text-right">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-[#27272a]/60">
                    {paginatedVehicles.map((vehicle, idx) => {
                      const docStatus = getVehicleDocumentStatus(vehicle);
                      const operational = getVehicleOperationalState(
                        vehicle,
                        trips,
                      );
                      const isHighlighted = vehicle.id === highlightedVehicleId;

                      const typeLabel =
                        VEHICLE_TYPE_LABELS[vehicle.vehicleType] ||
                        vehicle.vehicleType ||
                        "Vehicle";
                      const fuelLabel =
                        FUEL_TYPE_LABELS[vehicle.fuelType] || vehicle.fuelType;
                      const ownershipLabel =
                        OWNERSHIP_TYPE_LABELS[vehicle.ownershipType] ||
                        vehicle.ownershipType;

                      const criticalDoc = docStatus.criticalItems?.[0];

                      return (
                        <tr
                          key={
                            vehicle.id ||
                            vehicle.vehicleCode ||
                            `veh_row_${idx}`
                          }
                          className={[
                            "transition-colors duration-150",
                            "hover:bg-slate-50/80 dark:hover:bg-[#1a1b1e]",
                            isHighlighted
                              ? "bg-purple-500/10 dark:bg-purple-500/15 ring-1 ring-inset ring-purple-500/30"
                              : "",
                          ].join(" ")}
                        >
                          {/* REG / ID */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-bold font-mono text-sm tracking-tight text-slate-900 dark:text-[#e3e2e3]">
                              {vehicle.vehicleNumber}
                            </div>
                            <div className="font-mono text-[11px] text-slate-500 dark:text-[#958ea0]">
                              {vehicle.vehicleCode}
                            </div>
                          </td>

                          {/* MAKE & MODEL */}
                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-900 dark:text-[#e3e2e3] truncate max-w-[200px]">
                              {vehicle.make} {vehicle.model}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-[#958ea0]">
                              {fuelLabel}
                              {vehicle.manufacturingYear
                                ? ` · ${vehicle.manufacturingYear}`
                                : ""}
                            </div>
                          </td>

                          {/* CAPACITY / TYPE / OWNERSHIP */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-medium text-slate-900 dark:text-[#e3e2e3]">
                              {vehicle.seatingCapacity} Seats · {typeLabel}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-[#958ea0]">
                              <span className="inline-block">
                                {ownershipLabel}
                              </span>
                              {(vehicle.ownershipType === "attached" ||
                                vehicle.ownershipType === "leased") &&
                                vehicle.ownerName && (
                                  <span className="ml-1 truncate max-w-[120px]">
                                    ({vehicle.ownerName})
                                  </span>
                                )}
                            </div>
                          </td>

                          {/* STATUS / ACTIVITY */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-medium">
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  vehicle.isActive !== false
                                    ? "bg-emerald-500"
                                    : "bg-slate-400 dark:bg-slate-600"
                                }`}
                              />
                              <span
                                className={
                                  vehicle.isActive !== false
                                    ? "text-emerald-700 dark:text-emerald-400"
                                    : "text-slate-500 dark:text-slate-400"
                                }
                              >
                                {vehicle.isActive !== false
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </div>

                            {/* Operational Activity subtext */}
                            <div className="text-[11px] mt-0.5">
                              {operational.operationalStatus ===
                                "available" && (
                                <span className="text-emerald-600 dark:text-emerald-400/90 font-medium">
                                  Available
                                </span>
                              )}
                              {operational.operationalStatus === "on_trip" && (
                                <span className="text-purple-600 dark:text-purple-400 font-medium">
                                  On Trip ({operational.subtext})
                                </span>
                              )}
                              {operational.operationalStatus ===
                                "maintenance" && (
                                <span className="text-slate-500 dark:text-[#958ea0]">
                                  Maintenance
                                </span>
                              )}
                            </div>
                          </td>

                          {/* COMPLIANCE */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {docStatus.value === "valid" ? (
                              <span className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                Healthy
                              </span>
                            ) : docStatus.value === "expiring_soon" ? (
                              <div className="flex flex-col items-start">
                                <span className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                  Expiring Soon
                                </span>
                                {criticalDoc && (
                                  <span className="text-[11px] text-amber-700 dark:text-amber-400/90 mt-0.5">
                                    {criticalDoc.name}, {criticalDoc.daysLeft}{" "}
                                    days
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-start">
                                <span className="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                                  Expired
                                </span>
                                {criticalDoc && (
                                  <span className="text-[11px] text-rose-700 dark:text-rose-400/90 mt-0.5">
                                    {criticalDoc.name}
                                    {criticalDoc.daysLeft !== null &&
                                      ` (${Math.abs(criticalDoc.daysLeft)}d ago)`}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* ACTIONS */}
                          <td className="py-3 px-4 whitespace-nowrap text-right">
                            <div className="inline-flex items-center justify-end gap-1">
                              {/* Quick View Button */}
                              <button
                                type="button"
                                title="View Details"
                                onClick={() => setSelectedVehicle(vehicle)}
                                className="p-1.5 rounded-md text-slate-500 dark:text-[#958ea0] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1f2021] transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  visibility
                                </span>
                              </button>

                              {/* Dropdown Menu */}
                              <Dropdown
                                align="right"
                                trigger={
                                  <button
                                    type="button"
                                    title="More Actions"
                                    className="p-1.5 rounded-md text-slate-500 dark:text-[#958ea0] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1f2021] transition-colors cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">
                                      more_vert
                                    </span>
                                  </button>
                                }
                              >
                                <DropdownItem
                                  onClick={() => setSelectedVehicle(vehicle)}
                                >
                                  <span className="material-symbols-outlined mr-2 text-[16px]">
                                    visibility
                                  </span>
                                  View Vehicle Details
                                </DropdownItem>

                                <DropdownItem
                                  onClick={() => handleEdit(vehicle)}
                                >
                                  <span className="material-symbols-outlined mr-2 text-[16px] text-purple-600 dark:text-purple-400">
                                    edit
                                  </span>
                                  Edit Vehicle
                                </DropdownItem>

                                <DropdownDivider />

                                <DropdownItem
                                  onClick={() => setVehicleToDelete(vehicle)}
                                  className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                >
                                  <span className="material-symbols-outlined mr-2 text-[16px]">
                                    delete
                                  </span>
                                  Delete Vehicle
                                </DropdownItem>
                              </Dropdown>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination bar */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-[#27272a] bg-slate-50/50 dark:bg-[#141517]">
                  <span className="text-xs text-slate-500 dark:text-[#958ea0]">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredVehicles.length,
                    )}{" "}
                    of {filteredVehicles.length} vehicles
                  </span>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Vehicle Details Modal */}
      <VehicleDetailsModal
        open={Boolean(selectedVehicle)}
        vehicle={selectedVehicle}
        trips={trips}
        onClose={() => setSelectedVehicle(null)}
        onEdit={(v) => handleEdit(v)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(vehicleToDelete)}
        title="Delete Vehicle?"
        description={`Are you sure you want to delete ${vehicleToDelete?.vehicleNumber} (${vehicleToDelete?.vehicleCode})? This action cannot be undone.`}
        confirmText="Delete Vehicle"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setVehicleToDelete(null)}
      />
    </div>
  );
}
