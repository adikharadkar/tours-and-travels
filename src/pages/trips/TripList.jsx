import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Button from "../../components/ui/Button";
import Card, { CardContent } from "../../components/ui/Card";
import Pagination from "../../components/ui/Pagination";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Toast from "../../components/ui/Toast";
import Modal, {
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
  ModalClose,
} from "../../components/ui/Modal";

import TripToolbar from "../../components/trips/TripToolbar";
import TripTable from "../../components/trips/TripTable";
import TripCard from "../../components/trips/TripCard";
import TripDetailsModal from "../../components/trips/TripDetailsModal";
import TripActionsDrawer from "../../components/trips/TripActionsDrawer";

import {
  getTrips,
  deleteTrip,
  confirmTrip,
  startTrip,
  completeTrip,
  cancelTrip,
} from "../../services/tripService";
import { getCustomers } from "../../services/customerService";
import { getVehicles } from "../../services/vehicleService";
import { getDrivers } from "../../services/driverService";
import { getInvoices } from "../../services/invoiceService";
import { TRIP_TYPE_LABELS } from "../../constants/trips";

const ITEMS_PER_PAGE = 8;

export default function TripList() {
  const navigate = useNavigate();
  const location = useLocation();

  const [trips, setTrips] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [tripTypeFilter, setTripTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [driverFilter, setDriverFilter] = useState("all");
  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const [activeKpiFilter, setActiveKpiFilter] = useState(null); // null | 'today' | 'in_progress' | 'ready_to_invoice' | 'needs_attention' | 'upcoming'
  const [sortBy, setSortBy] = useState("date_asc");
  const [currentPage, setCurrentPage] = useState(1);

  // Selection for details / actions
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [actionDrawerTrip, setActionDrawerTrip] = useState(null);
  const [tripToCancel, setTripToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [tripToDelete, setTripToDelete] = useState(null);
  const [tripToStart, setTripToStart] = useState(null);
  const [startOpeningKm, setStartOpeningKm] = useState("");
  const [tripToComplete, setTripToComplete] = useState(null);
  const [completeForm, setCompleteForm] = useState({
    closingKm: "",
    actualEndDateTime: "",
    tollCharges: 0,
    parkingCharges: 0,
    otherCharges: 0,
    notes: "",
  });

  const [toast, setToast] = useState(null);
  const [highlightedTripId, setHighlightedTripId] = useState(null);

  const loadData = useCallback(() => {
    setIsLoading(true);
    try {
      setTrips(getTrips() || []);
      setCustomers(getCustomers() || []);
      setVehicles(getVehicles() || []);
      setDrivers(getDrivers() || []);
      setInvoices(getInvoices() || []);
    } catch (err) {
      console.error("Failed to load trips data:", err);
      setToast({
        id: Date.now(),
        message: "Failed to load records from storage.",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle location navigation state
  useEffect(() => {
    if (location.state?.toast) {
      setToast({
        id: Date.now(),
        ...location.state.toast,
      });
    }

    const targetId = location.state?.highlightedTripId;
    if (targetId) {
      setHighlightedTripId(targetId);
      const timer = setTimeout(() => {
        setHighlightedTripId(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Lookup maps
  const customerMap = useMemo(() => {
    const map = new Map();
    customers.forEach((c) => map.set(c.id, c));
    return map;
  }, [customers]);

  const vehicleMap = useMemo(() => {
    const map = new Map();
    vehicles.forEach((v) => map.set(v.id, v));
    return map;
  }, [vehicles]);

  const driverMap = useMemo(() => {
    const map = new Map();
    drivers.forEach((d) => map.set(d.id, d));
    return map;
  }, [drivers]);

  // Invoices mapping
  const invoiceByTripIdMap = useMemo(() => {
    const map = new Map();
    invoices.forEach((inv) => {
      if (inv.documentStatus !== "cancelled") {
        if (inv.tripId) map.set(inv.tripId, inv);
        if (inv.tripCode) map.set(inv.tripCode, inv);
      }
    });
    return map;
  }, [invoices]);

  // Operational Trip Helpers
  const isTripInvoiced = useCallback(
    (trip) => {
      if (!trip) return false;
      return Boolean(
        invoiceByTripIdMap.get(trip.id) ||
        (trip.tripCode && invoiceByTripIdMap.get(trip.tripCode)),
      );
    },
    [invoiceByTripIdMap],
  );

  const getTripInvoice = useCallback(
    (trip) => {
      if (!trip) return null;
      return (
        invoiceByTripIdMap.get(trip.id) ||
        (trip.tripCode ? invoiceByTripIdMap.get(trip.tripCode) : null)
      );
    },
    [invoiceByTripIdMap],
  );

  const isTripNeedsAttention = useCallback(
    (trip) => {
      if (!trip || trip.status === "cancelled") return false;

      const now = new Date();
      const isUnassigned =
        (!trip.vehicleId || !trip.driverId) && trip.status !== "completed";

      let isDelayed = false;
      if (trip.startDateTime) {
        const startTime = new Date(trip.startDateTime);
        if (
          (trip.status === "draft" || trip.status === "confirmed") &&
          startTime < now
        ) {
          isDelayed = true;
        }
      }
      if (trip.endDateTime && trip.status === "in_progress") {
        const endTime = new Date(trip.endDateTime);
        if (endTime < now) {
          isDelayed = true;
        }
      }

      const isUninvoicedOld =
        trip.status === "completed" &&
        !isTripInvoiced(trip) &&
        trip.startDateTime &&
        new Date(trip.startDateTime) < new Date(Date.now() - 7 * 86400000);

      const isOverduePayment =
        trip.paymentStatus === "unpaid" && trip.status === "completed";

      return isUnassigned || isDelayed || isUninvoicedOld || isOverduePayment;
    },
    [isTripInvoiced],
  );

  const isTripUpcoming = useCallback((trip) => {
    if (!trip?.startDateTime) return false;
    if (trip.status === "completed" || trip.status === "cancelled")
      return false;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const tripDateStr = trip.startDateTime.split("T")[0];
    return tripDateStr >= todayStr;
  }, []);

  // KPI summaries derived from actual data
  const kpiData = useMemo(() => {
    let todayCount = 0;
    let inProgressCount = 0;
    let confirmedCount = 0;
    let readyToInvoiceCount = 0;
    let completedCount = 0;
    let attentionCount = 0;
    let attentionDelayed = 0;
    let attentionUnassigned = 0;
    let upcomingCount = 0;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    trips.forEach((trip) => {
      const tripDateStr = trip.startDateTime
        ? trip.startDateTime.split("T")[0]
        : "";

      if (tripDateStr === todayStr) {
        todayCount++;
      }

      if (trip.status === "in_progress") {
        inProgressCount++;
      }

      if (trip.status === "confirmed") {
        confirmedCount++;
      }

      if (trip.status === "completed") {
        completedCount++;
        if (!isTripInvoiced(trip)) {
          readyToInvoiceCount++;
        }
      }

      if (isTripNeedsAttention(trip)) {
        attentionCount++;
        if (!trip.vehicleId || !trip.driverId) {
          attentionUnassigned++;
        }
        if (trip.startDateTime && new Date(trip.startDateTime) < now) {
          attentionDelayed++;
        }
      }

      if (
        (trip.status === "confirmed" || trip.status === "draft") &&
        tripDateStr >= todayStr
      ) {
        upcomingCount++;
      }
    });

    return {
      todayCount,
      inProgressCount,
      confirmedCount,
      readyToInvoiceCount,
      completedCount,
      attentionCount,
      attentionDelayed,
      attentionUnassigned,
      upcomingCount,
    };
  }, [trips, isTripInvoiced, isTripNeedsAttention]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: trips.length,
      in_progress: kpiData.inProgressCount,
      confirmed: kpiData.confirmedCount,
      ready_to_invoice: kpiData.readyToInvoiceCount,
      needs_attention: kpiData.attentionCount,
      completed: kpiData.completedCount,
    };
  }, [trips.length, kpiData]);

  // KPI card filter interaction handlers
  const handleKpiCardClick = (kpiKey) => {
    setCurrentPage(1);

    if (activeKpiFilter === kpiKey) {
      // Toggle off
      setActiveKpiFilter(null);
      setActiveTab("all");
      if (kpiKey === "today") setDateFilter("all");
      if (kpiKey === "in_progress") setStatusFilter("all");
      if (kpiKey === "ready_to_invoice") {
        setInvoiceFilter("all");
        setStatusFilter("all");
      }
      return;
    }

    setActiveKpiFilter(kpiKey);

    if (kpiKey === "today") {
      setDateFilter("today");
      setStatusFilter("all");
      setInvoiceFilter("all");
      setActiveTab("all");
    } else if (kpiKey === "in_progress") {
      setStatusFilter("in_progress");
      setDateFilter("all");
      setInvoiceFilter("all");
      setActiveTab("in_progress");
    } else if (kpiKey === "ready_to_invoice") {
      setStatusFilter("completed");
      setInvoiceFilter("ready_to_invoice");
      setDateFilter("all");
      setActiveTab("ready_to_invoice");
    } else if (kpiKey === "needs_attention") {
      setStatusFilter("all");
      setDateFilter("all");
      setInvoiceFilter("all");
      setActiveTab("needs_attention");
    } else if (kpiKey === "upcoming") {
      setStatusFilter("all");
      setDateFilter("all");
      setInvoiceFilter("all");
      setActiveTab("all");
    }
  };

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setActiveKpiFilter(null);
    setCurrentPage(1);

    if (tabKey === "all") {
      setStatusFilter("all");
      setInvoiceFilter("all");
    } else if (tabKey === "in_progress") {
      setStatusFilter("in_progress");
      setInvoiceFilter("all");
    } else if (tabKey === "confirmed") {
      setStatusFilter("confirmed");
      setInvoiceFilter("all");
    } else if (tabKey === "ready_to_invoice") {
      setStatusFilter("completed");
      setInvoiceFilter("ready_to_invoice");
    } else if (tabKey === "needs_attention") {
      setStatusFilter("all");
      setInvoiceFilter("all");
    } else if (tabKey === "completed") {
      setStatusFilter("completed");
      setInvoiceFilter("all");
    }
  };

  // Filter & Search & Sort
  const filteredTrips = useMemo(() => {
    const query = search.trim().toLowerCase();
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

    const next7Days = new Date(now);
    next7Days.setDate(next7Days.getDate() + 7);
    const next7DaysStr = `${next7Days.getFullYear()}-${String(next7Days.getMonth() + 1).padStart(2, "0")}-${String(next7Days.getDate()).padStart(2, "0")}`;

    return trips
      .filter((trip) => {
        const cust = customerMap.get(trip.customerId);
        const veh = vehicleMap.get(trip.vehicleId);
        const drv = driverMap.get(trip.driverId);
        const inv = getTripInvoice(trip);

        // 1. Search: Trip Code, Customer Name, Customer Code, Vehicle Number, Driver Name, Invoice Number, Route
        if (query) {
          const matchCode = (trip.tripCode || "").toLowerCase().includes(query);
          const matchCustName = (cust?.name || "")
            .toLowerCase()
            .includes(query);
          const matchCustCode = (cust?.customerCode || "")
            .toLowerCase()
            .includes(query);
          const matchVeh = (veh?.vehicleNumber || "")
            .toLowerCase()
            .includes(query);
          const matchVehCode = (veh?.vehicleCode || "")
            .toLowerCase()
            .includes(query);
          const matchDrv = (drv?.name || "").toLowerCase().includes(query);
          const matchPickup = (trip.pickupLocation || "")
            .toLowerCase()
            .includes(query);
          const matchDrop = (trip.dropLocation || "")
            .toLowerCase()
            .includes(query);
          const matchInv = (inv?.invoiceNumber || "")
            .toLowerCase()
            .includes(query);

          if (
            !matchCode &&
            !matchCustName &&
            !matchCustCode &&
            !matchVeh &&
            !matchVehCode &&
            !matchDrv &&
            !matchPickup &&
            !matchDrop &&
            !matchInv
          ) {
            return false;
          }
        }

        // 2. Active Tab Filter (if needs_attention)
        if (activeTab === "needs_attention") {
          if (!isTripNeedsAttention(trip)) return false;
        }

        // 3. Active KPI Filter (if needs_attention or upcoming)
        if (activeKpiFilter === "needs_attention") {
          if (!isTripNeedsAttention(trip)) return false;
        } else if (activeKpiFilter === "upcoming") {
          if (!isTripUpcoming(trip)) return false;
        }

        // 4. Status Filter
        if (statusFilter !== "all" && trip.status !== statusFilter) {
          return false;
        }

        // 5. Payment Filter
        if (paymentFilter !== "all" && trip.paymentStatus !== paymentFilter) {
          return false;
        }

        // 6. Trip Type Filter
        if (tripTypeFilter !== "all" && trip.tripType !== tripTypeFilter) {
          return false;
        }

        // 7. Vehicle Filter
        if (vehicleFilter !== "all" && trip.vehicleId !== vehicleFilter) {
          return false;
        }

        // 8. Driver Filter
        if (driverFilter !== "all" && trip.driverId !== driverFilter) {
          return false;
        }

        // 9. Invoice Filter
        if (invoiceFilter !== "all") {
          const hasInv = isTripInvoiced(trip);
          if (invoiceFilter === "ready_to_invoice") {
            if (trip.status !== "completed" || hasInv) return false;
          } else if (invoiceFilter === "invoiced") {
            if (!hasInv) return false;
          } else if (invoiceFilter === "not_invoiced") {
            if (hasInv) return false;
          }
        }

        // 10. Date Filter
        if (dateFilter !== "all" && trip.startDateTime) {
          const tripDateStr = trip.startDateTime.split("T")[0];

          if (dateFilter === "today") {
            if (tripDateStr !== todayStr) return false;
          } else if (dateFilter === "tomorrow") {
            if (tripDateStr !== tomorrowStr) return false;
          } else if (dateFilter === "next_7_days") {
            if (tripDateStr < todayStr || tripDateStr > next7DaysStr)
              return false;
          } else if (dateFilter === "this_week") {
            const tripDate = new Date(tripDateStr);
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            if (tripDate < startOfWeek || tripDate > endOfWeek) return false;
          } else if (dateFilter === "this_month") {
            const tripDate = new Date(tripDateStr);
            if (
              tripDate.getFullYear() !== now.getFullYear() ||
              tripDate.getMonth() !== now.getMonth()
            ) {
              return false;
            }
          } else if (dateFilter === "custom") {
            if (customStartDate && tripDateStr < customStartDate) return false;
            if (customEndDate && tripDateStr > customEndDate) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "date_asc") {
          return new Date(a.startDateTime) - new Date(b.startDateTime);
        }
        if (sortBy === "date_desc") {
          return new Date(b.startDateTime) - new Date(a.startDateTime);
        }
        if (sortBy === "amount_desc") {
          return (Number(b.totalAmount) || 0) - (Number(a.totalAmount) || 0);
        }
        if (sortBy === "amount_asc") {
          return (Number(a.totalAmount) || 0) - (Number(b.totalAmount) || 0);
        }
        if (sortBy === "customer_asc") {
          const nameA = customerMap.get(a.customerId)?.name || "";
          const nameB = customerMap.get(b.customerId)?.name || "";
          return nameA.localeCompare(nameB);
        }
        if (sortBy === "code_desc") {
          return (b.tripCode || "").localeCompare(a.tripCode || "");
        }
        return 0;
      });
  }, [
    trips,
    search,
    activeTab,
    statusFilter,
    paymentFilter,
    tripTypeFilter,
    vehicleFilter,
    driverFilter,
    dateFilter,
    customStartDate,
    customEndDate,
    invoiceFilter,
    activeKpiFilter,
    sortBy,
    customerMap,
    vehicleMap,
    driverMap,
    isTripInvoiced,
    getTripInvoice,
    isTripNeedsAttention,
    isTripUpcoming,
  ]);

  // Paginated records
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTrips.length / ITEMS_PER_PAGE),
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredTrips.length);
  const paginatedTrips = filteredTrips.slice(startIndex, endIndex);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (tripTypeFilter !== "all") count++;
    if (paymentFilter !== "all") count++;
    if (statusFilter !== "all") count++;
    if (dateFilter !== "all") count++;
    if (vehicleFilter !== "all") count++;
    if (driverFilter !== "all") count++;
    if (invoiceFilter !== "all") count++;
    return count;
  }, [
    tripTypeFilter,
    paymentFilter,
    statusFilter,
    dateFilter,
    vehicleFilter,
    driverFilter,
    invoiceFilter,
  ]);

  // Action Handlers
  const handleConfirm = (trip) => {
    try {
      confirmTrip(trip.id);
      loadData();
      setToast({
        id: Date.now(),
        message: `${trip.tripCode} confirmed successfully.`,
        variant: "success",
      });
    } catch (err) {
      setToast({
        id: Date.now(),
        message: err.message || "Failed to confirm trip.",
        variant: "error",
      });
    }
  };

  const handleStartSubmit = () => {
    if (!tripToStart) return;
    try {
      startTrip(tripToStart.id, { openingKm: startOpeningKm });
      loadData();
      setTripToStart(null);
      setStartOpeningKm("");
      setToast({
        id: Date.now(),
        message: `${tripToStart.tripCode} started successfully.`,
        variant: "success",
      });
    } catch (err) {
      setToast({
        id: Date.now(),
        message: err.message || "Failed to start trip.",
        variant: "error",
      });
    }
  };

  const handleCompleteSubmit = () => {
    if (!tripToComplete) return;
    try {
      completeTrip(tripToComplete.id, {
        closingKm: completeForm.closingKm,
        actualEndDateTime: completeForm.actualEndDateTime,
        additionalCharges: {
          tollCharges: Number(completeForm.tollCharges || 0),
          parkingCharges: Number(completeForm.parkingCharges || 0),
          otherCharges: Number(completeForm.otherCharges || 0),
        },
        notes: completeForm.notes,
      });
      loadData();
      setTripToComplete(null);
      setToast({
        id: Date.now(),
        message: `${tripToComplete.tripCode} completed successfully. Ready for invoice.`,
        variant: "success",
      });
    } catch (err) {
      setToast({
        id: Date.now(),
        message: err.message || "Failed to complete trip.",
        variant: "error",
      });
    }
  };

  const handleCancelSubmit = () => {
    if (!tripToCancel) return;
    try {
      cancelTrip(tripToCancel.id, cancelReason);
      loadData();
      setTripToCancel(null);
      setCancelReason("");
      setToast({
        id: Date.now(),
        message: `${tripToCancel.tripCode} cancelled successfully.`,
        variant: "success",
      });
    } catch (err) {
      setToast({
        id: Date.now(),
        message: err.message || "Failed to cancel trip.",
        variant: "error",
      });
    }
  };

  const handleDeleteSubmit = () => {
    if (!tripToDelete) return;
    try {
      deleteTrip(tripToDelete.id);
      loadData();
      setTripToDelete(null);
      setToast({
        id: Date.now(),
        message: `${tripToDelete.tripCode} deleted successfully.`,
        variant: "success",
      });
    } catch (err) {
      setToast({
        id: Date.now(),
        message: err.message || "Failed to delete trip.",
        variant: "error",
      });
    }
  };

  const resetFilters = () => {
    setSearch("");
    setActiveTab("all");
    setStatusFilter("all");
    setPaymentFilter("all");
    setTripTypeFilter("all");
    setDateFilter("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setVehicleFilter("all");
    setDriverFilter("all");
    setInvoiceFilter("all");
    setActiveKpiFilter(null);
    setSortBy("date_asc");
    setCurrentPage(1);
  };

  const handleExportCsv = () => {
    try {
      const headers = [
        "Trip Code",
        "Customer",
        "Trip Type",
        "Vehicle",
        "Driver",
        "Pickup Location",
        "Drop Location",
        "Start Date",
        "End Date",
        "Status",
        "Payment Status",
        "Total Amount",
      ];

      const csvRows = [headers.join(",")];

      filteredTrips.forEach((t) => {
        const cust = customerMap.get(t.customerId);
        const veh = vehicleMap.get(t.vehicleId);
        const drv = driverMap.get(t.driverId);

        const row = [
          `"${t.tripCode || ""}"`,
          `"${cust ? cust.name : t.customerName || ""}"`,
          `"${TRIP_TYPE_LABELS[t.tripType] || t.tripType || ""}"`,
          `"${veh ? veh.vehicleNumber : "Unassigned"}"`,
          `"${drv ? drv.name : "Unassigned"}"`,
          `"${t.pickupLocation || ""}"`,
          `"${t.dropLocation || ""}"`,
          `"${t.startDateTime || ""}"`,
          `"${t.endDateTime || ""}"`,
          `"${t.status || ""}"`,
          `"${t.paymentStatus || ""}"`,
          `"${t.totalAmount || 0}"`,
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
        `fleetcore_trips_${new Date().toISOString().split("T")[0]}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setToast({
        id: Date.now(),
        variant: "success",
        message: `Exported ${filteredTrips.length} trip records to CSV.`,
      });
    } catch (err) {
      console.error("Failed to export trips:", err);
      setToast({
        id: Date.now(),
        variant: "error",
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
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-[#e3e2e3]">
              Trips & Bookings
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
              Active Operations
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-[#958ea0]">
            Manage trips, track active routes, assign fleets and dispatch
            operations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/trips/new")}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] active:opacity-90 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>+ Create Booking</span>
        </button>
      </div>

      {/* KPI Bento Grid Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Today's Trips */}
        <div
          onClick={() => handleKpiCardClick("today")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleKpiCardClick("today")}
          className={[
            "group relative rounded-xl border p-4 transition-all duration-200 cursor-pointer select-none bg-white dark:bg-[#161822]",
            activeKpiFilter === "today"
              ? "border-violet-500 ring-2 ring-violet-500/20 shadow-md"
              : "border-slate-200 dark:border-[#262837] hover:border-violet-400 dark:hover:border-violet-600 shadow-xs hover:shadow-sm",
          ].join(" ")}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
              Today's Trips
            </span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800/40 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[18px]">
                route
              </span>
            </div>
          </div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
            {kpiData.todayCount}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400">
            <span className="material-symbols-outlined text-[14px]">
              trending_up
            </span>
            <span>Scheduled for today</span>
          </div>
        </div>

        {/* 2. In Progress */}
        <div
          onClick={() => handleKpiCardClick("in_progress")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            e.key === "Enter" && handleKpiCardClick("in_progress")
          }
          className={[
            "group relative rounded-xl border p-4 transition-all duration-200 cursor-pointer select-none bg-white dark:bg-[#161822] overflow-hidden",
            activeKpiFilter === "in_progress"
              ? "border-cyan-500 ring-2 ring-cyan-500/20 shadow-md"
              : "border-slate-200 dark:border-[#262837] hover:border-cyan-400 dark:hover:border-cyan-600 shadow-xs hover:shadow-sm",
          ].join(" ")}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
              In Progress
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/40 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[18px] animate-spin">
                sync
              </span>
            </div>
          </div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
            {kpiData.inProgressCount}
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-[#1e2130] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(15, kpiData.inProgressCount * 15))}%`,
              }}
            />
          </div>
        </div>

        {/* 3. Ready to Invoice */}
        <div
          onClick={() => handleKpiCardClick("ready_to_invoice")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            e.key === "Enter" && handleKpiCardClick("ready_to_invoice")
          }
          className={[
            "group relative rounded-xl border p-4 transition-all duration-200 cursor-pointer select-none bg-white dark:bg-[#161822]",
            activeKpiFilter === "ready_to_invoice"
              ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
              : "border-slate-200 dark:border-[#262837] hover:border-emerald-400 dark:hover:border-emerald-600 shadow-xs hover:shadow-sm",
          ].join(" ")}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
              Ready to Invoice
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[18px]">
                request_quote
              </span>
            </div>
          </div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
            {kpiData.readyToInvoiceCount}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-[14px] text-emerald-500">
              check_circle
            </span>
            <span>Awaiting billing generation</span>
          </div>
        </div>

        {/* 4. Needs Attention */}
        <div
          onClick={() => handleKpiCardClick("needs_attention")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) =>
            e.key === "Enter" && handleKpiCardClick("needs_attention")
          }
          className={[
            "group relative rounded-xl border p-4 transition-all duration-200 cursor-pointer select-none bg-white dark:bg-[#161822]",
            activeKpiFilter === "needs_attention"
              ? "border-rose-500 ring-2 ring-rose-500/20 shadow-md bg-rose-50/10 dark:bg-rose-950/10"
              : kpiData.attentionCount > 0
                ? "border-rose-200 dark:border-rose-900/50 hover:border-rose-400 shadow-xs"
                : "border-slate-200 dark:border-[#262837] hover:border-slate-300 shadow-xs",
          ].join(" ")}
        >
          <div className="flex items-start justify-between">
            <span
              className={[
                "text-xs font-bold uppercase tracking-wider font-mono",
                kpiData.attentionCount > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-500 dark:text-slate-400",
              ].join(" ")}
            >
              Needs Attention
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[18px]">
                warning
              </span>
            </div>
          </div>
          <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
            {kpiData.attentionCount}
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400">
            <span>
              {kpiData.attentionUnassigned > 0
                ? `${kpiData.attentionUnassigned} Unassigned`
                : "0 Unassigned"}
              {kpiData.attentionDelayed > 0
                ? `, ${kpiData.attentionDelayed} Delayed`
                : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <TripToolbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabCounts={tabCounts}
        searchQuery={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        tripTypeFilter={tripTypeFilter}
        onTripTypeFilterChange={(val) => {
          setTripTypeFilter(val);
          setCurrentPage(1);
        }}
        paymentFilter={paymentFilter}
        onPaymentFilterChange={(val) => {
          setPaymentFilter(val);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={(val) => {
          setStatusFilter(val);
          setCurrentPage(1);
        }}
        dateFilter={dateFilter}
        onDateFilterChange={(val) => {
          setDateFilter(val);
          setCurrentPage(1);
        }}
        vehicleFilter={vehicleFilter}
        onVehicleFilterChange={(val) => {
          setVehicleFilter(val);
          setCurrentPage(1);
        }}
        driverFilter={driverFilter}
        onDriverFilterChange={(val) => {
          setDriverFilter(val);
          setCurrentPage(1);
        }}
        vehicles={vehicles}
        drivers={drivers}
        sortBy={sortBy}
        onSortByChange={(val) => setSortBy(val)}
        onResetFilters={resetFilters}
        onExportCsv={handleExportCsv}
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
      ) : trips.length === 0 ? (
        <Card className="py-16 text-center border-dashed">
          <CardContent className="space-y-4 max-w-md mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/40">
              <span className="material-symbols-outlined text-2xl">route</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                No trips booked yet
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Create a booking to assign vehicles, drivers and manage your
                operational transport schedule.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate("/trips/new")}
            >
              + Create Booking
            </Button>
          </CardContent>
        </Card>
      ) : filteredTrips.length === 0 ? (
        <Card className="py-14 text-center border-dashed">
          <CardContent className="space-y-3 max-w-sm mx-auto">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
              <span className="material-symbols-outlined text-2xl">
                search_off
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              No matching trips found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No trip records matched your filter or search criteria.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop High-Density Table (>= md) */}
          <div className="hidden md:block">
            <TripTable
              trips={paginatedTrips}
              customerMap={customerMap}
              vehicleMap={vehicleMap}
              driverMap={driverMap}
              isTripInvoiced={isTripInvoiced}
              getTripInvoice={getTripInvoice}
              isTripNeedsAttention={isTripNeedsAttention}
              sortField={
                sortBy.startsWith("date")
                  ? "date"
                  : sortBy.startsWith("amount")
                    ? "amount"
                    : sortBy.startsWith("code")
                      ? "code"
                      : ""
              }
              sortDirection={sortBy.endsWith("asc") ? "asc" : "desc"}
              onSort={(field) => {
                if (field === "date") {
                  setSortBy((prev) =>
                    prev === "date_asc" ? "date_desc" : "date_asc",
                  );
                } else if (field === "amount") {
                  setSortBy((prev) =>
                    prev === "amount_desc" ? "amount_asc" : "amount_desc",
                  );
                } else if (field === "code") {
                  setSortBy((prev) =>
                    prev === "code_desc" ? "code_asc" : "code_desc",
                  );
                }
              }}
              onViewTrip={(t) => setSelectedTrip(t)}
              onOpenActionsDrawer={(t) => setActionDrawerTrip(t)}
              highlightedTripId={highlightedTripId}
            />

            {/* Table Footer with Summary & Pagination */}
            <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="select-none">
                Showing {filteredTrips.length === 0 ? 0 : startIndex + 1} to{" "}
                {endIndex} of {filteredTrips.length} trips
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
            {paginatedTrips.map((trip) => {
              const customer = customerMap.get(trip.customerId);
              const vehicle = trip.vehicleId
                ? vehicleMap.get(trip.vehicleId)
                : null;
              const driver = trip.driverId
                ? driverMap.get(trip.driverId)
                : null;

              return (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  customer={customer}
                  vehicle={vehicle}
                  driver={driver}
                  invoice={getTripInvoice(trip)}
                  highlighted={trip.id === highlightedTripId}
                  onView={(t) => setSelectedTrip(t)}
                  onOpenActions={(t) => setActionDrawerTrip(t)}
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

      {/* Trip Details Modal */}
      <TripDetailsModal
        open={Boolean(selectedTrip)}
        trip={selectedTrip}
        customer={
          selectedTrip ? customerMap.get(selectedTrip.customerId) : null
        }
        vehicle={selectedTrip ? vehicleMap.get(selectedTrip.vehicleId) : null}
        driver={selectedTrip ? driverMap.get(selectedTrip.driverId) : null}
        invoice={selectedTrip ? getTripInvoice(selectedTrip) : null}
        onClose={() => setSelectedTrip(null)}
        onOpenActions={(t) => {
          setSelectedTrip(null);
          setActionDrawerTrip(t);
        }}
      />

      {/* Trip Actions Drawer */}
      <TripActionsDrawer
        open={Boolean(actionDrawerTrip)}
        trip={actionDrawerTrip}
        customer={
          actionDrawerTrip ? customerMap.get(actionDrawerTrip.customerId) : null
        }
        vehicle={
          actionDrawerTrip ? vehicleMap.get(actionDrawerTrip.vehicleId) : null
        }
        driver={
          actionDrawerTrip ? driverMap.get(actionDrawerTrip.driverId) : null
        }
        invoice={actionDrawerTrip ? getTripInvoice(actionDrawerTrip) : null}
        onClose={() => setActionDrawerTrip(null)}
        onConfirm={(t) => {
          setActionDrawerTrip(null);
          handleConfirm(t);
        }}
        onStart={(t) => {
          setActionDrawerTrip(null);
          setTripToStart(t);
          setStartOpeningKm(t.openingKm || "");
        }}
        onComplete={(t) => {
          setActionDrawerTrip(null);
          setTripToComplete(t);
          setCompleteForm({
            closingKm: "",
            actualEndDateTime: new Date().toISOString().slice(0, 16),
            tollCharges: 0,
            parkingCharges: 0,
            otherCharges: 0,
            notes: "",
          });
        }}
        onCancel={(t) => {
          setActionDrawerTrip(null);
          setTripToCancel(t);
        }}
        onDelete={(t) => {
          setActionDrawerTrip(null);
          setTripToDelete(t);
        }}
        onGenerateInvoice={(t) => {
          setActionDrawerTrip(null);
          navigate(`/invoices/new?tripId=${t.id}`);
        }}
        onEdit={(t) => {
          setActionDrawerTrip(null);
          navigate(`/trips/${t.id}/edit`);
        }}
      />

      {/* Start Trip Modal */}
      <Modal
        open={Boolean(tripToStart)}
        onClose={() => setTripToStart(null)}
        className="max-w-md"
      >
        <ModalHeader>
          <div>
            <ModalTitle>Start Trip {tripToStart?.tripCode}</ModalTitle>
            <ModalDescription>
              Record the odometer start reading to transition this trip into
              active dispatch.
            </ModalDescription>
          </div>
          <ModalClose onClose={() => setTripToStart(null)} />
        </ModalHeader>
        <ModalContent>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Opening Odometer Reading (KM)
              </label>
              <input
                type="number"
                value={startOpeningKm}
                onChange={(e) => setStartOpeningKm(e.target.value)}
                placeholder="e.g. 45200"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#191b26] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setTripToStart(null)}
          >
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={handleStartSubmit}>
            Confirm Start Trip
          </Button>
        </ModalFooter>
      </Modal>

      {/* Complete Trip Modal */}
      <Modal
        open={Boolean(tripToComplete)}
        onClose={() => setTripToComplete(null)}
        className="max-w-md"
      >
        <ModalHeader>
          <div>
            <ModalTitle>Complete Trip {tripToComplete?.tripCode}</ModalTitle>
            <ModalDescription>
              Record closing metrics, tolls, and parking charges before closing
              the trip.
            </ModalDescription>
          </div>
          <ModalClose onClose={() => setTripToComplete(null)} />
        </ModalHeader>
        <ModalContent>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Closing Odometer Reading (KM)
              </label>
              <input
                type="number"
                value={completeForm.closingKm}
                onChange={(e) =>
                  setCompleteForm((prev) => ({
                    ...prev,
                    closingKm: e.target.value,
                  }))
                }
                placeholder="e.g. 45850"
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#191b26] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Toll Charges (₹)
                </label>
                <input
                  type="number"
                  value={completeForm.tollCharges}
                  onChange={(e) =>
                    setCompleteForm((prev) => ({
                      ...prev,
                      tollCharges: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#191b26] text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Parking Charges (₹)
                </label>
                <input
                  type="number"
                  value={completeForm.parkingCharges}
                  onChange={(e) =>
                    setCompleteForm((prev) => ({
                      ...prev,
                      parkingCharges: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#191b26] text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Completion Notes
              </label>
              <textarea
                rows={2}
                value={completeForm.notes}
                onChange={(e) =>
                  setCompleteForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Any special remarks or route deviations..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#191b26] text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setTripToComplete(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleCompleteSubmit}
          >
            Complete & Close Trip
          </Button>
        </ModalFooter>
      </Modal>

      {/* Cancel Trip Modal */}
      <Modal
        open={Boolean(tripToCancel)}
        onClose={() => setTripToCancel(null)}
        className="max-w-md"
      >
        <ModalHeader>
          <div>
            <ModalTitle>Cancel Trip {tripToCancel?.tripCode}</ModalTitle>
            <ModalDescription>
              Provide an optional cancellation reason for logging purposes.
            </ModalDescription>
          </div>
          <ModalClose onClose={() => setTripToCancel(null)} />
        </ModalHeader>
        <ModalContent>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cancellation Reason
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Customer cancelled booking due to meeting reschedule..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#191b26] text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>
        </ModalContent>
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setTripToCancel(null)}
          >
            Keep Active
          </Button>
          <Button type="button" variant="danger" onClick={handleCancelSubmit}>
            Confirm Cancellation
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(tripToDelete)}
        title="Delete Trip?"
        description={`Are you sure you want to permanently delete trip ${tripToDelete?.tripCode}? This action cannot be undone.`}
        confirmText="Delete Trip"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteSubmit}
        onClose={() => setTripToDelete(null)}
      />
    </div>
  );
}
