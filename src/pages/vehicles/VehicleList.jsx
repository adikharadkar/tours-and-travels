import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Card, { CardContent } from "../../components/ui/Card";
import Pagination from "../../components/ui/Pagination";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Toast from "../../components/ui/Toast";
import VehicleToolbar from "../../components/vehicle/VehicleToolbar";
import VehicleTable from "../../components/vehicle/VehicleTable";
import VehicleCard from "../../components/vehicle/VehicleCard";
import VehicleDetailsModal from "../../components/vehicle/VehicleDetailsModal";
import { getVehicles, deleteVehicle } from "../../services/vehicleService";
import { getTrips } from "../../services/tripService";
import { getVehicleDocumentStatus } from "../../utils/vehicleDocumentStatus";
import { getVehicleOperationalState } from "../../utils/vehicleOperationalStatus";
import { VEHICLE_TYPE_LABELS } from "../../constants/vehicles";

const ITEMS_PER_PAGE = 8;

export default function VehicleList() {
  const navigate = useNavigate();
  const location = useLocation();

  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [operationalTab, setOperationalTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [ownershipFilter, setOwnershipFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [docStatusFilter, setDocStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("vehicleCode");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAttentionBanner, setShowAttentionBanner] = useState(true);

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

  // Fleet Statistics
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

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: stats.total,
      available: stats.available,
      on_trip: stats.onTrip,
      maintenance: stats.maintenance,
    };
  }, [stats]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (typeFilter !== "all") count++;
    if (ownershipFilter !== "all") count++;
    if (statusFilter !== "all") count++;
    if (docStatusFilter !== "all") count++;
    return count;
  }, [typeFilter, ownershipFilter, statusFilter, docStatusFilter]);

  const handleResetFilters = () => {
    setSearch("");
    setOperationalTab("all");
    setTypeFilter("all");
    setOwnershipFilter("all");
    setStatusFilter("all");
    setDocStatusFilter("all");
    setSortBy("vehicleCode");
    setSortOrder("asc");
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Filtered and Sorted Vehicles
  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return vehicles
      .filter((vehicle) => {
        // 1. Search Query
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

  const totalPages = Math.max(
    1,
    Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE),
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredVehicles.length,
  );
  const paginatedVehicles = useMemo(() => {
    return filteredVehicles.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredVehicles, startIndex]);

  const hasActiveFilters =
    search.trim() !== "" ||
    operationalTab !== "all" ||
    typeFilter !== "all" ||
    ownershipFilter !== "all" ||
    statusFilter !== "all" ||
    docStatusFilter !== "all";

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
      handleResetFilters();
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

      {/* Top Header */}
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
              ? "border-emerald-500/80 dark:border-emerald-400 ring-2 ring-emerald-500/20 dark:ring-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20"
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
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
            {stats.active}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
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
              ? "border-cyan-500/80 dark:border-cyan-400 ring-2 ring-cyan-500/20 dark:ring-cyan-500/30 bg-cyan-50/20 dark:bg-cyan-950/20"
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
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Ready to dispatch
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
            <span className="material-symbols-outlined text-[17px] text-purple-600 dark:text-purple-400 p-1 rounded-md bg-purple-50 dark:bg-purple-950/60">
              near_me
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-purple-600 dark:text-purple-400">
            {stats.onTrip}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Currently running
          </p>
        </button>

        {/* Inactive / Maintenance */}
        <button
          type="button"
          onClick={() => handleKpiClick("maintenance")}
          className={[
            "group relative flex flex-col justify-between text-left rounded-xl p-3.5 transition-all duration-200 cursor-pointer select-none",
            "border bg-white dark:bg-[#161822] shadow-xs hover:shadow-md hover:-translate-y-0.5",
            operationalTab === "maintenance"
              ? "border-slate-500/80 dark:border-slate-400 ring-2 ring-slate-500/20 dark:ring-slate-500/30 bg-slate-100 dark:bg-[#1a1d2b]"
              : "border-slate-200/90 dark:border-[#262837] hover:border-slate-300 dark:hover:border-slate-600",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-1 w-full">
            <span className="font-mono text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              INACTIVE
            </span>
            <span className="material-symbols-outlined text-[17px] text-slate-600 dark:text-slate-400 p-1 rounded-md bg-slate-100 dark:bg-[#202330]">
              build
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-700 dark:text-slate-300">
            {stats.inactive}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            In shop / Offline
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
              history_toggle_off
            </span>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
            {stats.expiringSoon}
          </p>
          <p className="mt-1 text-[11px] text-amber-600/90 dark:text-amber-400/90 font-medium">
            Due in 30 days
          </p>
        </button>

        {/* Expired */}
        <button
          type="button"
          onClick={() => handleKpiClick("expired")}
          className={[
            "group relative flex flex-col justify-between text-left rounded-xl p-3.5 transition-all duration-200 cursor-pointer select-none",
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

      {/* Toolbar */}
      <VehicleToolbar
        operationalTab={operationalTab}
        onOperationalTabChange={(tab) => {
          setOperationalTab(tab);
          setCurrentPage(1);
        }}
        tabCounts={tabCounts}
        searchQuery={search}
        onSearchChange={(q) => {
          setSearch(q);
          setCurrentPage(1);
        }}
        typeFilter={typeFilter}
        onTypeFilterChange={(t) => {
          setTypeFilter(t);
          setCurrentPage(1);
        }}
        ownershipFilter={ownershipFilter}
        onOwnershipFilterChange={(o) => {
          setOwnershipFilter(o);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(s) => {
          setStatusFilter(s);
          setCurrentPage(1);
        }}
        docStatusFilter={docStatusFilter}
        onDocStatusFilterChange={(d) => {
          setDocStatusFilter(d);
          setCurrentPage(1);
        }}
        sortBy={sortBy}
        onSortByChange={(s) => setSortBy(s)}
        sortOrder={sortOrder}
        onSortOrderChange={(o) => setSortOrder(o)}
        onResetFilters={handleResetFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* Main Content Area */}
      {loadError ? (
        <Card className="border-error/30 bg-error/5 p-6 text-center">
          <p className="text-sm font-medium text-error">{loadError}</p>
        </Card>
      ) : vehicles.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl">
              🚗
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                No vehicles added yet
              </h3>
              <p className="mt-1 text-sm text-muted">
                Add your first vehicle to start building and tracking your
                fleet.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/vehicles/new")}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#06b6d4] hover:bg-[#0891b2] rounded-lg shadow-sm transition-all cursor-pointer mx-auto"
            >
              + Add First Vehicle
            </button>
          </CardContent>
        </Card>
      ) : filteredVehicles.length === 0 ? (
        <Card className="py-12 text-center border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822]">
          <CardContent className="space-y-3">
            <h3 className="text-base font-semibold text-foreground">
              No matching vehicles found
            </h3>
            <p className="text-sm text-muted">
              No vehicles matched your selected filter criteria.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-[#1f2230] rounded-lg hover:bg-slate-200 dark:hover:bg-[#262837] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile View: Responsive Cards (< md) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:hidden">
            {paginatedVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                trips={trips}
                highlighted={vehicle.id === highlightedVehicleId}
                onView={(v) => setSelectedVehicle(v)}
                onEdit={(v) => handleEdit(v)}
                onDelete={(v) => setVehicleToDelete(v)}
              />
            ))}
          </div>

          {/* Desktop View: Shared Table Design (>= md) */}
          <div className="hidden md:block">
            <VehicleTable
              vehicles={paginatedVehicles}
              trips={trips}
              sortField={sortBy}
              sortDirection={sortOrder}
              onSort={handleSort}
              onViewVehicle={(v) => setSelectedVehicle(v)}
              onEditVehicle={(v) => handleEdit(v)}
              onDeleteVehicle={(v) => setVehicleToDelete(v)}
              highlightedVehicleId={highlightedVehicleId}
            />

            {/* Table Footer with Summary and Pagination */}
            <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="select-none">
                Showing {filteredVehicles.length === 0 ? 0 : startIndex + 1} to{" "}
                {endIndex} of {filteredVehicles.length} vehicles
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
                compact={true}
              />
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
        onCreateTrip={(v) => {
          setSelectedVehicle(null);
          navigate("/trips/new", {
            state: { vehicleId: v.id, vehicleNumber: v.vehicleNumber },
          });
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(vehicleToDelete)}
        title="Delete Vehicle?"
        description={`Are you sure you want to delete ${vehicleToDelete?.vehicleNumber} (${vehicleToDelete?.vehicleCode})?`}
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
