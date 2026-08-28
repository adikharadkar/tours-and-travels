import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Button from "../../components/ui/Button";
import Card, { CardContent } from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import FilterDropdown from "../../components/ui/FilterDropdown";
import Pagination from "../../components/ui/Pagination";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Toast from "../../components/ui/Toast";
import DriverCard from "../../components/drivers/DriverCard";
import DriverDetailsModal from "../../components/drivers/DriverDetailsModal";

import { getDrivers, deleteDriver } from "../../services/driverService";
import { getTrips } from "../../services/tripService";
import { getVehicles } from "../../services/vehicleService";
import {
  getDriverLicenseStatus,
  isDriverEligible,
} from "../../utils/driverLicenseStatus";
import {
  DRIVER_TYPES,
  DRIVER_STATUS_OPTIONS,
  LICENSE_STATUS_OPTIONS,
  DRIVER_TYPE_LABELS,
  PREFIX_LABELS,
  LICENSE_TYPE_LABELS,
} from "../../constants/drivers";

const SORT_OPTIONS = [
  { label: "Driver Name (A–Z)", value: "name_asc" },
  { label: "Driver Name (Z–A)", value: "name_desc" },
  { label: "Driver Code (Newest)", value: "code_desc" },
  { label: "Driver Code (Oldest)", value: "code_asc" },
  { label: "License Expiry (Earliest)", value: "expiry_asc" },
  { label: "License Expiry (Latest)", value: "expiry_desc" },
];

const ITEMS_PER_PAGE = 8;

export default function DriverList() {
  const navigate = useNavigate();
  const location = useLocation();

  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [driverToDelete, setDriverToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Operational View Tabs: 'all' | 'available' | 'on_trip' | 'compliance' | 'active_only'
  const [activeTab, setActiveTab] = useState("all");
  const [activeKpiFilter, setActiveKpiFilter] = useState(null);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [licenseStatusFilter, setLicenseStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name_asc");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal & feedback state
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [toast, setToast] = useState(null);
  const [highlightedDriverId, setHighlightedDriverId] = useState(null);

  const loadData = useCallback(() => {
    setIsLoading(true);
    try {
      const driverData = getDrivers() || [];
      const tripData = getTrips() || [];
      const vehicleData = getVehicles() || [];

      setDrivers(driverData);
      setTrips(tripData);
      setVehicles(vehicleData);
      setLoadError("");
    } catch (err) {
      console.error("Failed to load driver operations data:", err);
      setLoadError(
        "Unable to load drivers. Please check your storage or try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle location navigation state (e.g. toasts, highlights)
  useEffect(() => {
    if (location.state?.toast) {
      setToast({
        id: Date.now(),
        ...location.state.toast,
      });
    }

    if (location.state?.highlightedDriverId) {
      setHighlightedDriverId(location.state.highlightedDriverId);
      const timer = setTimeout(() => {
        setHighlightedDriverId(null);
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Lookup maps
  const vehicleMap = useMemo(() => {
    const map = new Map();
    vehicles.forEach((v) => map.set(v.id, v));
    return map;
  }, [vehicles]);

  // Map active trips to drivers (prefer in_progress, or confirmed starting today)
  const activeTripByDriverIdMap = useMemo(() => {
    const map = new Map();
    const todayStr = new Date().toISOString().split("T")[0];

    // Priority 1: In Progress trips
    trips.forEach((t) => {
      if (t.driverId && t.status === "in_progress") {
        map.set(t.driverId, t);
      }
    });

    // Priority 2: Confirmed trips scheduled for today if not already mapped
    trips.forEach((t) => {
      if (
        t.driverId &&
        !map.has(t.driverId) &&
        t.status === "confirmed" &&
        t.startDateTime?.startsWith(todayStr)
      ) {
        map.set(t.driverId, t);
      }
    });

    return map;
  }, [trips]);

  // Operational State Calculator
  const getDriverOperationalInfo = useCallback(
    (driver) => {
      const activeTrip = activeTripByDriverIdMap.get(driver.id);
      const licStatus = getDriverLicenseStatus(driver);
      const isEligible = isDriverEligible(driver);
      const isActive = driver.isActive !== false;

      if (!isActive) {
        return {
          state: "inactive",
          label: "Inactive",
          badgeClass:
            "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
          activeTrip: null,
          vehicle: null,
        };
      }

      if (licStatus.value === "expired") {
        return {
          state: "grounded",
          label: "Grounded",
          badgeClass:
            "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/40",
          activeTrip: null,
          vehicle: null,
        };
      }

      if (activeTrip) {
        const assignedVehicle = activeTrip.vehicleId
          ? vehicleMap.get(activeTrip.vehicleId)
          : null;
        return {
          state: "on_trip",
          label: `On Trip (${activeTrip.tripCode})`,
          badgeClass:
            "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800/40",
          activeTrip,
          vehicle: assignedVehicle,
        };
      }

      if (isEligible) {
        return {
          state: "available",
          label: "Available",
          badgeClass:
            "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800/40",
          activeTrip: null,
          vehicle: null,
        };
      }

      return {
        state: "restricted",
        label: "Restricted",
        badgeClass:
          "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/40",
        activeTrip: null,
        vehicle: null,
      };
    },
    [activeTripByDriverIdMap, vehicleMap],
  );

  // High-Level KPIs calculation from real records
  const stats = useMemo(() => {
    let activeCount = 0;
    let onTripCount = 0;
    let availableCount = 0;
    let expiredLicCount = 0;
    let expiringSoonLicCount = 0;

    drivers.forEach((d) => {
      const isActive = d.isActive !== false;
      if (isActive) activeCount++;

      const lic = getDriverLicenseStatus(d);
      if (lic.value === "expired") {
        expiredLicCount++;
      } else if (lic.value === "expiring_soon") {
        expiringSoonLicCount++;
      }

      const op = getDriverOperationalInfo(d);
      if (op.state === "on_trip") {
        onTripCount++;
      } else if (op.state === "available") {
        availableCount++;
      }
    });

    const totalCount = drivers.length;
    const utilization =
      totalCount > 0 ? Math.round((onTripCount / totalCount) * 100) : 0;
    const complianceAlertsCount = expiredLicCount + expiringSoonLicCount;

    return {
      total: totalCount,
      active: activeCount,
      inactive: totalCount - activeCount,
      onTrip: onTripCount,
      available: availableCount,
      expiredLicenses: expiredLicCount,
      expiringSoonLicenses: expiringSoonLicCount,
      complianceAlerts: complianceAlertsCount,
      utilization,
    };
  }, [drivers, getDriverOperationalInfo]);

  // Filtered & Sorted Drivers
  const filteredDrivers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return drivers
      .filter((driver) => {
        const op = getDriverOperationalInfo(driver);
        const lic = getDriverLicenseStatus(driver);
        const isActive = driver.isActive !== false;

        // 1. Operational View Tab Filter
        if (activeTab === "available" && op.state !== "available") {
          return false;
        }
        if (activeTab === "on_trip" && op.state !== "on_trip") {
          return false;
        }
        if (
          activeTab === "compliance" &&
          lic.value !== "expired" &&
          lic.value !== "expiring_soon"
        ) {
          return false;
        }
        if (activeTab === "active_only" && !isActive) {
          return false;
        }

        // 2. Active KPI Card Interactive Filter
        if (activeKpiFilter === "on_trip" && op.state !== "on_trip") {
          return false;
        }
        if (activeKpiFilter === "available" && op.state !== "available") {
          return false;
        }
        if (
          activeKpiFilter === "compliance" &&
          lic.value !== "expired" &&
          lic.value !== "expiring_soon"
        ) {
          return false;
        }
        if (
          activeKpiFilter === "expiring_soon" &&
          lic.value !== "expiring_soon"
        ) {
          return false;
        }
        if (activeKpiFilter === "expired" && lic.value !== "expired") {
          return false;
        }

        // 3. Search: Code, Name, Mobile, License, Ref ID, Driver Type, License Type
        if (query) {
          const matchCode = (driver.driverCode || "")
            .toLowerCase()
            .includes(query);
          const matchName = (driver.name || "").toLowerCase().includes(query);
          const matchMobile = (driver.mobile || "")
            .toLowerCase()
            .includes(query);
          const matchLicense = (driver.licenseNumber || "")
            .toLowerCase()
            .includes(query);
          const matchRef = (driver.employeeReferenceId || "")
            .toLowerCase()
            .includes(query);
          const matchType = (
            DRIVER_TYPE_LABELS[driver.driverType] ||
            driver.driverType ||
            ""
          )
            .toLowerCase()
            .includes(query);
          const matchLicType = (
            LICENSE_TYPE_LABELS[driver.licenseType] ||
            driver.licenseType ||
            ""
          )
            .toLowerCase()
            .includes(query);

          if (
            !matchCode &&
            !matchName &&
            !matchMobile &&
            !matchLicense &&
            !matchRef &&
            !matchType &&
            !matchLicType
          ) {
            return false;
          }
        }

        // 4. Driver Type Filter
        if (typeFilter !== "all" && driver.driverType !== typeFilter) {
          return false;
        }

        // 5. Status Filter
        if (statusFilter !== "all") {
          if (statusFilter === "active" && !isActive) return false;
          if (statusFilter === "inactive" && isActive) return false;
        }

        // 6. License Status Filter
        if (
          licenseStatusFilter !== "all" &&
          lic.value !== licenseStatusFilter
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name_asc") {
          return (a.name || "").localeCompare(b.name || "");
        }
        if (sortBy === "name_desc") {
          return (b.name || "").localeCompare(a.name || "");
        }
        if (sortBy === "code_asc") {
          return (a.driverCode || "").localeCompare(b.driverCode || "");
        }
        if (sortBy === "code_desc") {
          return (b.driverCode || "").localeCompare(a.driverCode || "");
        }
        if (sortBy === "expiry_asc") {
          const expA = a.licenseExpiryDate || a.licenseExpiry || "9999-99-99";
          const expB = b.licenseExpiryDate || b.licenseExpiry || "9999-99-99";
          return expA.localeCompare(expB);
        }
        if (sortBy === "expiry_desc") {
          const expA = a.licenseExpiryDate || a.licenseExpiry || "";
          const expB = b.licenseExpiryDate || b.licenseExpiry || "";
          return expB.localeCompare(expA);
        }
        return 0;
      });
  }, [
    drivers,
    search,
    activeTab,
    activeKpiFilter,
    typeFilter,
    statusFilter,
    licenseStatusFilter,
    sortBy,
    getDriverOperationalInfo,
  ]);

  // Pagination calculation
  const totalPages = Math.max(
    1,
    Math.ceil(filteredDrivers.length / ITEMS_PER_PAGE),
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredDrivers.length,
  );
  const paginatedDrivers = filteredDrivers.slice(startIndex, endIndex);

  // Active filters tracker
  const hasActiveFilters =
    search.trim() !== "" ||
    activeTab !== "all" ||
    activeKpiFilter !== null ||
    typeFilter !== "all" ||
    statusFilter !== "all" ||
    licenseStatusFilter !== "all" ||
    sortBy !== "name_asc";

  const handleClearFilters = () => {
    setSearch("");
    setActiveTab("all");
    setActiveKpiFilter(null);
    setTypeFilter("all");
    setStatusFilter("all");
    setLicenseStatusFilter("all");
    setSortBy("name_asc");
    setCurrentPage(1);
  };

  const handleKpiCardClick = (kpiType) => {
    if (activeKpiFilter === kpiType) {
      setActiveKpiFilter(null);
    } else {
      setActiveKpiFilter(kpiType);
      if (kpiType === "on_trip") setActiveTab("on_trip");
      else if (kpiType === "available") setActiveTab("available");
      else if (
        kpiType === "compliance" ||
        kpiType === "expiring_soon" ||
        kpiType === "expired"
      ) {
        setActiveTab("compliance");
      } else {
        setActiveTab("all");
      }
    }
    setCurrentPage(1);
  };

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setActiveKpiFilter(null);
    setCurrentPage(1);
  };

  const handleEdit = (driver) => {
    navigate(`/drivers/${driver.id}/edit`);
  };

  const handleConfirmDelete = () => {
    if (!driverToDelete) return;
    setIsDeleting(true);

    try {
      deleteDriver(driverToDelete.id);
      setDrivers((prev) => prev.filter((d) => d.id !== driverToDelete.id));

      if (selectedDriver?.id === driverToDelete.id) {
        setSelectedDriver(null);
      }

      setToast({
        id: Date.now(),
        variant: "success",
        title: "Driver Deleted",
        message: `Driver ${driverToDelete.name} (${driverToDelete.driverCode}) was removed successfully.`,
      });
      setDriverToDelete(null);
    } catch (err) {
      console.error("Delete driver error:", err);
      setToast({
        id: Date.now(),
        variant: "error",
        title: "Delete Failed",
        message: err.message || "Failed to delete driver.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportDrivers = () => {
    try {
      const headers = [
        "Driver Code",
        "Driver Name",
        "Mobile",
        "Driver Type",
        "License Number",
        "License Type",
        "License Expiry",
        "License Status",
        "Account Status",
        "Operational State",
      ];

      const csvRows = [headers.join(",")];

      filteredDrivers.forEach((d) => {
        const lic = getDriverLicenseStatus(d);
        const op = getDriverOperationalInfo(d);
        const row = [
          `"${d.driverCode || ""}"`,
          `"${d.name || ""}"`,
          `"${d.mobile || ""}"`,
          `"${DRIVER_TYPE_LABELS[d.driverType] || d.driverType || ""}"`,
          `"${d.licenseNumber || ""}"`,
          `"${LICENSE_TYPE_LABELS[d.licenseType] || d.licenseType || ""}"`,
          `"${d.licenseExpiryDate || d.licenseExpiry || ""}"`,
          `"${lic.label}"`,
          `"${d.isActive !== false ? "Active" : "Inactive"}"`,
          `"${op.label}"`,
        ];
        csvRows.push(row.join(","));
      });

      const blob = new Blob([csvRows.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `fleetcore_drivers_${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setToast({
        id: Date.now(),
        variant: "success",
        title: "Export Completed",
        message: `Exported ${filteredDrivers.length} driver records to CSV.`,
      });
    } catch (err) {
      console.error("Failed to export drivers:", err);
      setToast({
        id: Date.now(),
        variant: "error",
        title: "Export Failed",
        message: "Unable to generate CSV export file.",
      });
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

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Drivers
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage drivers, license compliance, availability and trip
            eligibility.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/drivers/new")}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] active:opacity-90 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">
            person_add
          </span>
          <span>+ Add Driver</span>
        </button>
      </div>

      {/* KPI Bento Grid Section (Interactive Filters) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Drivers */}
        <div
          onClick={() => handleKpiCardClick("total")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleKpiCardClick("total")}
          className={[
            "group relative rounded-xl border p-4 transition-all duration-200 cursor-pointer select-none bg-white dark:bg-[#161822]",
            activeKpiFilter === "total"
              ? "border-violet-500 ring-2 ring-violet-500/20 shadow-md"
              : "border-slate-200 dark:border-[#262837] hover:border-violet-400 dark:hover:border-violet-600 shadow-xs hover:shadow-sm",
          ].join(" ")}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Drivers
            </span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800/40 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[18px]">
                group
              </span>
            </div>
          </div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
            {stats.total}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {stats.active} Active
            </span>
            <span>·</span>
            <span>{stats.inactive} Inactive</span>
          </div>
        </div>

        {/* 2. On Trip */}
        <div
          onClick={() => handleKpiCardClick("on_trip")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleKpiCardClick("on_trip")}
          className={[
            "group relative rounded-xl border p-4 transition-all duration-200 cursor-pointer select-none bg-white dark:bg-[#161822] overflow-hidden",
            activeKpiFilter === "on_trip"
              ? "border-cyan-500 ring-2 ring-cyan-500/20 shadow-md"
              : "border-slate-200 dark:border-[#262837] hover:border-cyan-400 dark:hover:border-cyan-600 shadow-xs hover:shadow-sm",
          ].join(" ")}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              On Trip
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/40 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[18px]">
                route
              </span>
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
              {stats.onTrip}
            </span>
            <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
              {stats.utilization}% utilization
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-[#1e2130] h-1.5 rounded-full mt-3 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(5, stats.utilization))}%`,
              }}
            />
          </div>
        </div>

        {/* 3. Available */}
        <div
          onClick={() => handleKpiCardClick("available")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            e.key === "Enter" && handleKpiCardClick("available")
          }
          className={[
            "group relative rounded-xl border p-4 transition-all duration-200 cursor-pointer select-none bg-white dark:bg-[#161822]",
            activeKpiFilter === "available"
              ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
              : "border-slate-200 dark:border-[#262837] hover:border-emerald-400 dark:hover:border-emerald-600 shadow-xs hover:shadow-sm",
          ].join(" ")}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Available
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[18px]">
                event_available
              </span>
            </div>
          </div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
            {stats.available}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="material-symbols-outlined text-[14px]">
              check_circle
            </span>
            <span>Ready for trip assignment</span>
          </div>
        </div>

        {/* 4. Compliance Alerts */}
        <div
          onClick={() => handleKpiCardClick("compliance")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            e.key === "Enter" && handleKpiCardClick("compliance")
          }
          className={[
            "group relative rounded-xl border p-4 transition-all duration-200 cursor-pointer select-none bg-white dark:bg-[#161822] flex flex-col justify-between",
            activeKpiFilter === "compliance"
              ? "border-rose-500 ring-2 ring-rose-500/20 shadow-md"
              : stats.complianceAlerts > 0
                ? "border-amber-200 dark:border-amber-900/50 hover:border-amber-400 shadow-xs hover:shadow-sm"
                : "border-slate-200 dark:border-[#262837] hover:border-slate-300 shadow-xs",
          ].join(" ")}
        >
          <div className="flex items-start justify-between mb-2">
            <span
              className={[
                "text-xs font-bold uppercase tracking-wider",
                stats.complianceAlerts > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-500 dark:text-slate-400",
              ].join(" ")}
            >
              Compliance Alerts
            </span>
            <div
              className={[
                "w-8 h-8 rounded-lg flex items-center justify-center border group-hover:scale-105 transition-transform",
                stats.expiredLicenses > 0
                  ? "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/40"
                  : "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40",
              ].join(" ")}
            >
              <span className="material-symbols-outlined text-[18px]">
                warning
              </span>
            </div>
          </div>

          <div className="space-y-1.5 mt-auto">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                Expiring Soon (&lt; 30d)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                {stats.expiringSoonLicenses}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                Expired (Critical)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                {stats.expiredLicenses}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Workspace: Tabs + Search & Filters */}
      <div className="rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] p-3 sm:p-4 shadow-xs space-y-3.5">
        {/* Top Control Bar: Tabs + Quick Actions */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-[#202330]">
          {/* Operational View Tabs */}
          <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-[#191b26] border border-slate-200/80 dark:border-[#262837] overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => handleTabChange("all")}
              className={[
                "px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap select-none",
                activeTab === "all"
                  ? "bg-white dark:bg-[#202330] text-slate-900 dark:text-slate-100 shadow-xs font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
              ].join(" ")}
            >
              All Drivers
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("available")}
              className={[
                "px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap select-none",
                activeTab === "available"
                  ? "bg-white dark:bg-[#202330] text-slate-900 dark:text-slate-100 shadow-xs font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
              ].join(" ")}
            >
              Available
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("on_trip")}
              className={[
                "px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap select-none",
                activeTab === "on_trip"
                  ? "bg-white dark:bg-[#202330] text-slate-900 dark:text-slate-100 shadow-xs font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
              ].join(" ")}
            >
              On Trip
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("compliance")}
              className={[
                "px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap select-none inline-flex items-center gap-1.5",
                activeTab === "compliance"
                  ? "bg-white dark:bg-[#202330] text-rose-700 dark:text-rose-300 shadow-xs font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
              ].join(" ")}
            >
              <span>Compliance</span>
              {stats.complianceAlerts > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {stats.complianceAlerts}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("active_only")}
              className={[
                "px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap select-none",
                activeTab === "active_only"
                  ? "bg-white dark:bg-[#202330] text-slate-900 dark:text-slate-100 shadow-xs font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
              ].join(" ")}
            >
              Active Only
            </button>
          </div>

          {/* Right Action: Export CSV */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={handleExportDrivers}
              title="Export Drivers List"
              aria-label="Export Drivers List"
              className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] hover:bg-slate-50 dark:hover:bg-[#1f2230] text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-slate-500 dark:text-slate-400">
                download
              </span>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 pointer-events-none">
              search
            </span>
            <Input
              placeholder="Search code, name, mobile, license..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 h-9 text-xs rounded-lg bg-slate-50/50 dark:bg-[#191b26] border-slate-200 dark:border-[#262837]"
            />
          </div>

          {/* Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <FilterDropdown
              label="Driver Type"
              value={typeFilter}
              options={[
                { label: "All Driver Types", value: "all" },
                ...DRIVER_TYPES,
              ]}
              onChange={(val) => {
                setTypeFilter(val);
                setCurrentPage(1);
              }}
            />

            <FilterDropdown
              label="Status"
              value={statusFilter}
              options={DRIVER_STATUS_OPTIONS}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
            />

            <FilterDropdown
              label="License Status"
              value={licenseStatusFilter}
              options={LICENSE_STATUS_OPTIONS}
              onChange={(val) => {
                setLicenseStatusFilter(val);
                setCurrentPage(1);
              }}
            />

            <FilterDropdown
              label="Sort"
              value={sortBy}
              options={SORT_OPTIONS}
              onChange={(val) => setSortBy(val)}
            />
          </div>
        </div>

        {/* Active Filter Bar Summary */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#202330] text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing{" "}
              <strong className="text-slate-900 dark:text-slate-200">
                {filteredDrivers.length}
              </strong>{" "}
              of {drivers.length} drivers
              {activeKpiFilter && (
                <span className="ml-2 font-semibold text-cyan-600 dark:text-cyan-400">
                  (Filtered by KPI:{" "}
                  {activeKpiFilter.replace(/_/g, " ").toUpperCase()})
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={handleClearFilters}
              className="font-semibold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <Card className="overflow-hidden p-6 space-y-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded" />
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded" />
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded" />
          </div>
        </Card>
      ) : loadError ? (
        <Card className="border-rose-300 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/20 p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-rose-500 mb-2">
            error
          </span>
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
            {loadError}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={loadData}
            className="mt-4"
          >
            Retry
          </Button>
        </Card>
      ) : drivers.length === 0 ? (
        <Card className="py-16 text-center border-dashed">
          <CardContent className="space-y-4 max-w-md mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800/40">
              <span className="material-symbols-outlined text-2xl">badge</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                No drivers added yet
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Add your drivers with their license information to establish
                trip assignment eligibility and operational availability.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate("/drivers/new")}
            >
              + Add First Driver
            </Button>
          </CardContent>
        </Card>
      ) : filteredDrivers.length === 0 ? (
        <Card className="py-14 text-center border-dashed">
          <CardContent className="space-y-3 max-w-sm mx-auto">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
              <span className="material-symbols-outlined text-2xl">
                search_off
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No matching drivers found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No driver records matched your search query and filter criteria.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop High-Density Table (>= md) */}
          <div className="hidden md:block">
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] shadow-xs">
              {/* Table Header Strip */}
              <div className="px-4 py-3 border-b border-slate-200 dark:border-[#262837] flex justify-between items-center bg-white dark:bg-[#161822]">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    Driver Personnel & Roster
                  </h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-slate-100 dark:bg-[#1f2230] text-slate-600 dark:text-slate-300">
                    {filteredDrivers.length}
                  </span>
                </div>

                <div className="text-xs text-slate-400">
                  {activeTab !== "all" && (
                    <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                      View: {activeTab.replace(/_/g, " ").toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-[#262837] bg-slate-50/70 dark:bg-[#13151f]">
                      <th
                        scope="col"
                        className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-1/4"
                      >
                        DRIVER DETAILS
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                      >
                        LICENSE INFO
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                      >
                        OPERATIONAL STATE
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                      >
                        COMPLIANCE
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                      >
                        CURRENT ASSIGNMENT
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                      >
                        ACTIONS
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-[#202330]">
                    {paginatedDrivers.map((driver) => {
                      const licStatus = getDriverLicenseStatus(driver);
                      const op = getDriverOperationalInfo(driver);
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

                      // Initials for avatar
                      const initials = (driver.name || "D")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase();

                      // Left indicator bar
                      let leftBarColor = "border-l-transparent";
                      if (op.state === "on_trip") {
                        leftBarColor = "border-l-4 border-l-violet-500";
                      } else if (
                        op.state === "grounded" ||
                        licStatus.value === "expired"
                      ) {
                        leftBarColor = "border-l-4 border-l-rose-500";
                      } else if (op.state === "available") {
                        leftBarColor = "border-l-4 border-l-cyan-500";
                      }

                      return (
                        <tr
                          key={driver.id}
                          className={[
                            "transition-colors duration-150 relative",
                            leftBarColor,
                            isHighlighted
                              ? "bg-violet-500/10 dark:bg-violet-950/40 ring-1 ring-inset ring-violet-400/40"
                              : "hover:bg-slate-50/80 dark:hover:bg-[#1a1c28]",
                          ].join(" ")}
                        >
                          {/* 1. Driver Details Column */}
                          <td className="px-4 py-3 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#1f2230] border border-slate-200 dark:border-[#262837] flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-xs shrink-0 select-none">
                                {initials}
                              </div>

                              <div className="min-w-0">
                                <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
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
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                {licenseTypeLabel}
                              </span>
                            </div>
                          </td>

                          {/* 3. Operational State Column */}
                          <td className="px-4 py-3 align-middle whitespace-nowrap">
                            {op.state === "on_trip" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/40">
                                <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse" />
                                On Trip ({op.activeTrip?.tripCode})
                              </span>
                            ) : op.state === "available" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/40">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                                Available
                              </span>
                            ) : op.state === "grounded" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                Grounded
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                Inactive
                              </span>
                            )}
                          </td>

                          {/* 4. Compliance Column */}
                          <td className="px-4 py-3 align-middle whitespace-nowrap">
                            {licStatus.value === "valid" ? (
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                                <span className="material-symbols-outlined text-[16px] text-cyan-600 dark:text-cyan-400">
                                  check_circle
                                </span>
                                <span>Valid</span>
                              </div>
                            ) : licStatus.value === "expiring_soon" ? (
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                                <span className="material-symbols-outlined text-[16px] text-amber-600 dark:text-amber-400">
                                  warning
                                </span>
                                <span>Expiring in {licStatus.daysLeft}d</span>
                              </div>
                            ) : licStatus.value === "expired" ? (
                              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                                <span className="material-symbols-outlined text-[16px] text-rose-600 dark:text-rose-400">
                                  error
                                </span>
                                <span>Expired</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">
                                Not Provided
                              </span>
                            )}
                          </td>

                          {/* 5. Current Assignment Column */}
                          <td className="px-4 py-3 align-middle max-w-[240px]">
                            {op.state === "on_trip" && op.activeTrip ? (
                              <div className="min-w-0">
                                <div className="font-semibold text-xs text-slate-900 dark:text-slate-200 truncate">
                                  {op.vehicle
                                    ? `${op.vehicle.vehicleNumber}${op.vehicle.model ? ` (${op.vehicle.model})` : ""}`
                                    : op.activeTrip.vehicleNumber ||
                                      "Vehicle Assigned"}
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                  <span className="truncate">
                                    {op.activeTrip.pickupLocation || "Origin"}
                                  </span>
                                  <span>→</span>
                                  <span className="truncate">
                                    {op.activeTrip.dropLocation ||
                                      "Destination"}
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
                                title="View Driver Details"
                                aria-label="View Details"
                                onClick={() => setSelectedDriver(driver)}
                                className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] hover:bg-slate-50 dark:hover:bg-[#1f2230] text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px] text-slate-500 dark:text-slate-400">
                                  visibility
                                </span>
                                <span>View</span>
                              </button>

                              {/* Edit Button */}
                              <button
                                type="button"
                                title="Edit Driver"
                                aria-label="Edit Driver"
                                onClick={() => handleEdit(driver)}
                                className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] hover:bg-slate-50 dark:hover:bg-[#1f2230] text-violet-700 dark:text-violet-300 text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px] text-violet-600 dark:text-violet-400">
                                  edit
                                </span>
                                <span>Edit</span>
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                title="Delete Driver"
                                aria-label="Delete Driver"
                                onClick={() => setDriverToDelete(driver)}
                                className="h-8 w-8 rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  delete
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with Summary & Pagination */}
              <div className="border-t border-slate-200 dark:border-[#262837] px-4 py-3.5 bg-slate-50/50 dark:bg-[#13151f] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500 dark:text-slate-400 select-none">
                  Showing {filteredDrivers.length === 0 ? 0 : startIndex + 1} to{" "}
                  {endIndex} of {filteredDrivers.length} drivers
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                  compact={true}
                />
              </div>
            </div>
          </div>

          {/* Mobile View: Responsive Cards (< md) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {paginatedDrivers.map((driver) => {
              const activeTrip = activeTripByDriverIdMap.get(driver.id);
              const vehicle = activeTrip?.vehicleId
                ? vehicleMap.get(activeTrip.vehicleId)
                : null;

              return (
                <DriverCard
                  key={driver.id}
                  driver={driver}
                  activeTrip={activeTrip}
                  vehicle={vehicle}
                  highlighted={driver.id === highlightedDriverId}
                  onView={(d) => setSelectedDriver(d)}
                  onEdit={(d) => handleEdit(d)}
                  onDelete={(d) => setDriverToDelete(d)}
                />
              );
            })}

            {/* Mobile Pagination */}
            <div className="flex justify-center pt-2">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
                compact={false}
              />
            </div>
          </div>
        </>
      )}

      {/* Driver Details Modal */}
      <DriverDetailsModal
        open={Boolean(selectedDriver)}
        driver={selectedDriver}
        onClose={() => setSelectedDriver(null)}
        onEdit={(d) => handleEdit(d)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(driverToDelete)}
        title="Delete Driver?"
        description={`Are you sure you want to delete driver ${driverToDelete?.name} (${driverToDelete?.driverCode})? This will remove their record from your driver roster.`}
        confirmText="Delete Driver"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDriverToDelete(null)}
      />
    </div>
  );
}
