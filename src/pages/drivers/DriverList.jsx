import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Button from "../../components/ui/Button";
import Card, { CardContent } from "../../components/ui/Card";
import Pagination from "../../components/ui/Pagination";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Toast from "../../components/ui/Toast";
import DriverToolbar from "../../components/drivers/DriverToolbar";
import DriverTable from "../../components/drivers/DriverTable";
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
  DRIVER_TYPE_LABELS,
  LICENSE_TYPE_LABELS,
} from "../../constants/drivers";

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

  // Statistics calculation for KPI cards and tabs
  const stats = useMemo(() => {
    let active = 0;
    let inactive = 0;
    let onTrip = 0;
    let available = 0;
    let expiringSoonLicenses = 0;
    let expiredLicenses = 0;

    drivers.forEach((d) => {
      const isActive = d.isActive !== false;
      if (isActive) active++;
      else inactive++;

      const op = getDriverOperationalInfo(d);
      if (op.state === "on_trip") onTrip++;
      if (op.state === "available") available++;

      const licStatus = getDriverLicenseStatus(d);
      if (licStatus.value === "expiring_soon") expiringSoonLicenses++;
      if (licStatus.value === "expired") expiredLicenses++;
    });

    const complianceAlerts = expiringSoonLicenses + expiredLicenses;
    const utilization = active > 0 ? Math.round((onTrip / active) * 100) : 0;

    return {
      total: drivers.length,
      active,
      inactive,
      onTrip,
      available,
      expiringSoonLicenses,
      expiredLicenses,
      complianceAlerts,
      utilization,
    };
  }, [drivers, getDriverOperationalInfo]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: stats.total,
      available: stats.available,
      on_trip: stats.onTrip,
      compliance: stats.complianceAlerts,
      active_only: stats.active,
    };
  }, [stats]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (typeFilter !== "all") count++;
    if (statusFilter !== "all") count++;
    if (licenseStatusFilter !== "all") count++;
    return count;
  }, [typeFilter, statusFilter, licenseStatusFilter]);

  // Filtered & Sorted Drivers
  const filteredDrivers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return drivers
      .filter((driver) => {
        // 1. Text Search
        if (q) {
          const matchCode = (driver.driverCode || "").toLowerCase().includes(q);
          const matchName = (driver.name || "").toLowerCase().includes(q);
          const matchMobile = (driver.mobile || "").toLowerCase().includes(q);
          const matchLicense = (driver.licenseNumber || "")
            .toLowerCase()
            .includes(q);
          const matchType = (DRIVER_TYPE_LABELS[driver.driverType] || "")
            .toLowerCase()
            .includes(q);

          if (
            !matchCode &&
            !matchName &&
            !matchMobile &&
            !matchLicense &&
            !matchType
          ) {
            return false;
          }
        }

        // 2. Operational Tab Filter
        if (activeTab === "available") {
          const op = getDriverOperationalInfo(driver);
          if (op.state !== "available") return false;
        } else if (activeTab === "on_trip") {
          const op = getDriverOperationalInfo(driver);
          if (op.state !== "on_trip") return false;
        } else if (activeTab === "compliance") {
          const lic = getDriverLicenseStatus(driver);
          if (lic.value !== "expired" && lic.value !== "expiring_soon")
            return false;
        } else if (activeTab === "active_only") {
          if (driver.isActive === false) return false;
        }

        // 3. Driver Type Filter
        if (typeFilter !== "all" && driver.driverType !== typeFilter) {
          return false;
        }

        // 4. Driver Status Filter
        if (statusFilter !== "all") {
          const isActive = driver.isActive !== false;
          if (statusFilter === "active" && !isActive) return false;
          if (statusFilter === "inactive" && isActive) return false;
        }

        // 5. License Status Filter
        if (licenseStatusFilter !== "all") {
          const lic = getDriverLicenseStatus(driver);
          if (lic.value !== licenseStatusFilter) return false;
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
          const dateA = a.licenseExpiryDate || a.licenseExpiry || "9999";
          const dateB = b.licenseExpiryDate || b.licenseExpiry || "9999";
          return dateA.localeCompare(dateB);
        }
        if (sortBy === "expiry_desc") {
          const dateA = a.licenseExpiryDate || a.licenseExpiry || "0000";
          const dateB = b.licenseExpiryDate || b.licenseExpiry || "0000";
          return dateB.localeCompare(dateA);
        }
        return 0;
      });
  }, [
    drivers,
    search,
    activeTab,
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-[#e3e2e3]">
            Drivers
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-[#958ea0]">
            Manage drivers, license compliance, availability and trip
            eligibility.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/drivers/new")}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] active:opacity-90 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">
            person_add
          </span>
          <span>+ Add Driver</span>
        </button>
      </div>

      {/* KPI Bento Grid Section */}
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
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
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
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
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
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
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
                "text-xs font-bold uppercase tracking-wider font-mono",
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

      {/* Toolbar */}
      <DriverToolbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabCounts={tabCounts}
        searchQuery={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        typeFilter={typeFilter}
        onTypeFilterChange={(val) => {
          setTypeFilter(val);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => {
          setStatusFilter(val);
          setCurrentPage(1);
        }}
        licenseStatusFilter={licenseStatusFilter}
        onLicenseStatusFilterChange={(val) => {
          setLicenseStatusFilter(val);
          setCurrentPage(1);
        }}
        sortBy={sortBy}
        onSortByChange={(val) => setSortBy(val)}
        onResetFilters={handleClearFilters}
        onExportCsv={handleExportDrivers}
        activeFilterCount={activeFilterCount}
      />

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
            <DriverTable
              drivers={paginatedDrivers}
              getDriverOperationalInfo={getDriverOperationalInfo}
              sortField={sortBy.startsWith("name") ? "name" : ""}
              sortDirection={sortBy.endsWith("asc") ? "asc" : "desc"}
              onSort={(field) => {
                if (field === "name") {
                  setSortBy((prev) =>
                    prev === "name_asc" ? "name_desc" : "name_asc",
                  );
                }
              }}
              onViewDriver={(d) => setSelectedDriver(d)}
              onEditDriver={(d) => handleEdit(d)}
              onDeleteDriver={(d) => setDriverToDelete(d)}
              highlightedDriverId={highlightedDriverId}
            />

            {/* Table Footer with Summary & Pagination */}
            <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="select-none">
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
