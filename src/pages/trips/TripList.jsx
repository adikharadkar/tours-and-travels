import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Button from "../../components/ui/Button";
import Card, { CardContent } from "../../components/ui/Card";
import Dropdown, { DropdownItem } from "../../components/ui/Dropdown";
import Pagination from "../../components/ui/Pagination";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Toast from "../../components/ui/Toast";
import DatePicker from "../../components/ui/DatePicker";
import Modal, {
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
  ModalClose,
} from "../../components/ui/Modal";

import TripCard from "../../components/trips/TripCard";
import TripDetailsModal from "../../components/trips/TripDetailsModal";
import TripActionsDrawer from "../../components/trips/TripActionsDrawer";
import {
  TripStatusBadge,
  PaymentStatusBadge,
} from "../../components/trips/TripStatusBadge";
import TripCalendar from "../../components/trips/TripCalendar";

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
import {
  TRIP_STATUSES,
  PAYMENT_STATUSES,
  TRIP_TYPES,
  TRIP_TYPE_LABELS,
} from "../../constants/trips";

const DATE_FILTER_OPTIONS = [
  { label: "All Dates", value: "all" },
  { label: "Today", value: "today" },
  { label: "Tomorrow", value: "tomorrow" },
  { label: "This Week", value: "this_week" },
  { label: "Next 7 Days", value: "next_7_days" },
  { label: "This Month", value: "this_month" },
  { label: "Custom Range", value: "custom" },
];

const SORT_OPTIONS = [
  { label: "Start Date (Earliest First)", value: "date_asc" },
  { label: "Start Date (Latest First)", value: "date_desc" },
  { label: "Amount (High to Low)", value: "amount_desc" },
  { label: "Amount (Low to High)", value: "amount_asc" },
  { label: "Customer Name", value: "customer_asc" },
  { label: "Trip Code", value: "code_desc" },
];

const INVOICE_FILTER_OPTIONS = [
  { label: "All Invoice Statuses", value: "all" },
  { label: "Ready to Invoice", value: "ready_to_invoice" },
  { label: "Invoiced", value: "invoiced" },
  { label: "Not Invoiced", value: "not_invoiced" },
];

const ITEMS_PER_PAGE = 8;

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

function getFormattedToday() {
  const now = new Date();
  return now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function FilterDropdown({ label, value, options, onChange }) {
  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];
  const isFiltered = value !== "all";

  return (
    <Dropdown
      trigger={
        <button
          type="button"
          className={[
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none",
            isFiltered
              ? "bg-cyan-50 text-cyan-800 border border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-500/50 shadow-xs ring-1 ring-cyan-500/20"
              : "bg-slate-50 dark:bg-[#191b26] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#262837] hover:bg-slate-100 dark:hover:bg-[#202330] hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs",
          ].join(" ")}
        >
          <span>
            {isFiltered ? `${label}: ${selectedOption.label}` : `${label}`}
          </span>
          <span className="material-symbols-outlined text-[16px] text-slate-400 dark:text-slate-400">
            expand_more
          </span>
        </button>
      }
    >
      <div className="py-1 min-w-[210px] max-h-[300px] overflow-y-auto">
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <DropdownItem
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={
                isSelected
                  ? "font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#202330]"
              }
            >
              <div className="flex items-center justify-between w-full">
                <span>{opt.label}</span>
                {isSelected && (
                  <span className="material-symbols-outlined text-[16px] text-cyan-600 dark:text-cyan-400">
                    check
                  </span>
                )}
              </div>
            </DropdownItem>
          );
        })}
      </div>
    </Dropdown>
  );
}

export default function TripList() {
  const navigate = useNavigate();
  const location = useLocation();

  const [trips, setTrips] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [viewMode, setViewMode] = useState("list"); // 'list' | 'calendar'
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

  const loadData = () => {
    try {
      setTrips(getTrips());
      setCustomers(getCustomers());
      setVehicles(getVehicles());
      setDrivers(getDrivers());
      setInvoices(getInvoices());
    } catch (err) {
      console.error("Failed to load trips data:", err);
      setToast({
        id: Date.now(),
        message: "Failed to load records from storage.",
        variant: "error",
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
    let readyToInvoiceCount = 0;
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

      if (trip.status === "completed" && !isTripInvoiced(trip)) {
        readyToInvoiceCount++;
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
      readyToInvoiceCount,
      attentionCount,
      attentionDelayed,
      attentionUnassigned,
      upcomingCount,
    };
  }, [trips, isTripInvoiced, isTripNeedsAttention]);

  // KPI card filter interaction handlers
  const handleKpiCardClick = (kpiKey) => {
    setCurrentPage(1);

    if (activeKpiFilter === kpiKey) {
      // Toggle off
      setActiveKpiFilter(null);
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
    } else if (kpiKey === "in_progress") {
      setStatusFilter("in_progress");
      setDateFilter("all");
      setInvoiceFilter("all");
    } else if (kpiKey === "ready_to_invoice") {
      setStatusFilter("completed");
      setInvoiceFilter("ready_to_invoice");
      setDateFilter("all");
    } else if (kpiKey === "needs_attention") {
      // Custom filter handled in useMemo
      setStatusFilter("all");
      setDateFilter("all");
      setInvoiceFilter("all");
    } else if (kpiKey === "upcoming") {
      setStatusFilter("all");
      setDateFilter("all");
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

        // 2. Active KPI Filter (if needs_attention or upcoming)
        if (activeKpiFilter === "needs_attention") {
          if (!isTripNeedsAttention(trip)) return false;
        } else if (activeKpiFilter === "upcoming") {
          if (!isTripUpcoming(trip)) return false;
        }

        // 3. Status Filter
        if (statusFilter !== "all" && trip.status !== statusFilter) {
          return false;
        }

        // 4. Payment Filter
        if (paymentFilter !== "all" && trip.paymentStatus !== paymentFilter) {
          return false;
        }

        // 5. Trip Type Filter
        if (tripTypeFilter !== "all" && trip.tripType !== tripTypeFilter) {
          return false;
        }

        // 6. Vehicle Filter
        if (vehicleFilter !== "all" && trip.vehicleId !== vehicleFilter) {
          return false;
        }

        // 7. Driver Filter
        if (driverFilter !== "all" && trip.driverId !== driverFilter) {
          return false;
        }

        // 8. Invoice Filter
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

        // 9. Date Filter
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

  const activeFilterCount = [
    statusFilter !== "all",
    paymentFilter !== "all",
    tripTypeFilter !== "all",
    dateFilter !== "all",
    vehicleFilter !== "all",
    driverFilter !== "all",
    invoiceFilter !== "all",
    activeKpiFilter !== null,
    Boolean(search.trim()),
  ].filter(Boolean).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      {/* Page Header (Stitch & FleetCore Alignment) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Trips & Bookings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage active routes, vehicle/driver assignments, and billing
            readiness.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Today / Date Context Badge */}
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs">
            <span className="material-symbols-outlined text-[16px] text-cyan-600 dark:text-cyan-400">
              calendar_month
            </span>
            <span>Today, {getFormattedToday()}</span>
          </div>

          {/* List / Calendar View Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-[#262837] p-0.5 bg-slate-100 dark:bg-[#13151f] shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={[
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer select-none",
                viewMode === "list"
                  ? "bg-white dark:bg-[#1f2230] text-slate-900 dark:text-slate-100 shadow-2xs font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
              ].join(" ")}
            >
              <span className="material-symbols-outlined text-[15px]">
                view_list
              </span>
              <span>List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={[
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer select-none",
                viewMode === "calendar"
                  ? "bg-white dark:bg-[#1f2230] text-slate-900 dark:text-slate-100 shadow-2xs font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
              ].join(" ")}
            >
              <span className="material-symbols-outlined text-[15px]">
                calendar_today
              </span>
              <span>Calendar</span>
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => navigate("/trips/new")}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] active:opacity-90 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>+ Create Booking</span>
          </button>
        </div>
      </div>

      {/* KPI Bento Section (Interactive Filters) */}
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
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Today's Trips
            </span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800/40">
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
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              In Progress
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/40">
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
              ? "border-violet-500 ring-2 ring-violet-500/20 shadow-md"
              : "border-slate-200 dark:border-[#262837] hover:border-violet-400 dark:hover:border-violet-600 shadow-xs hover:shadow-sm",
          ].join(" ")}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ready to Invoice
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
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
                "text-xs font-bold uppercase tracking-wider",
                kpiData.attentionCount > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-500 dark:text-slate-400",
              ].join(" ")}
            >
              Needs Attention
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
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

      {/* Filter Workspace Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] p-3 sm:px-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Filter Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase select-none mr-1">
              <span className="material-symbols-outlined text-[18px]">
                filter_list
              </span>
              <span>FILTERS</span>
            </div>

            {/* Status Dropdown */}
            <FilterDropdown
              label="Status"
              value={statusFilter}
              options={[
                { label: "All Statuses", value: "all" },
                ...TRIP_STATUSES,
              ]}
              onChange={(val) => {
                setStatusFilter(val);
                setActiveKpiFilter(null);
                setCurrentPage(1);
              }}
            />

            {/* Payment Dropdown */}
            <FilterDropdown
              label="Payment"
              value={paymentFilter}
              options={[
                { label: "All Payments", value: "all" },
                ...PAYMENT_STATUSES,
              ]}
              onChange={(val) => {
                setPaymentFilter(val);
                setCurrentPage(1);
              }}
            />

            {/* Trip Type Dropdown */}
            <FilterDropdown
              label="Trip Type"
              value={tripTypeFilter}
              options={[{ label: "All Types", value: "all" }, ...TRIP_TYPES]}
              onChange={(val) => {
                setTripTypeFilter(val);
                setCurrentPage(1);
              }}
            />

            {/* Date Range Dropdown */}
            <FilterDropdown
              label="Date Range"
              value={dateFilter}
              options={DATE_FILTER_OPTIONS}
              onChange={(val) => {
                setDateFilter(val);
                if (val !== "today") setActiveKpiFilter(null);
                setCurrentPage(1);
              }}
            />

            {/* Invoice Status Dropdown */}
            <FilterDropdown
              label="Invoice"
              value={invoiceFilter}
              options={INVOICE_FILTER_OPTIONS}
              onChange={(val) => {
                setInvoiceFilter(val);
                if (val !== "ready_to_invoice") setActiveKpiFilter(null);
                setCurrentPage(1);
              }}
            />

            {/* Vehicle Dropdown */}
            <FilterDropdown
              label="Vehicle"
              value={vehicleFilter}
              options={[
                { label: "All Vehicles", value: "all" },
                ...vehicles.map((v) => ({
                  label: `${v.vehicleNumber || v.vehicleCode}`,
                  value: v.id,
                })),
              ]}
              onChange={(val) => {
                setVehicleFilter(val);
                setCurrentPage(1);
              }}
            />

            {/* Driver Dropdown */}
            <FilterDropdown
              label="Driver"
              value={driverFilter}
              options={[
                { label: "All Drivers", value: "all" },
                ...drivers.map((d) => ({
                  label: d.name,
                  value: d.id,
                })),
              ]}
              onChange={(val) => {
                setDriverFilter(val);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Right: Search Input & Sort & Clear */}
          <div className="flex items-center gap-2.5 ml-auto w-full lg:w-auto justify-between lg:justify-end">
            <div className="relative flex items-center flex-1 sm:w-64 max-w-xs">
              <span className="material-symbols-outlined absolute left-2.5 text-[18px] text-slate-400 dark:text-slate-500 select-none pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search trip code, customer, route..."
                className="w-full pl-8 pr-7 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-[#191b26] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-[#262837] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2 text-slate-400 hover:text-slate-200 text-xs cursor-pointer p-0.5"
                  aria-label="Clear search query"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Menu */}
            <FilterDropdown
              label="Sort"
              value={sortBy}
              options={SORT_OPTIONS}
              onChange={(val) => setSortBy(val)}
            />

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors cursor-pointer select-none whitespace-nowrap shrink-0"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Range if active */}
        {dateFilter === "custom" && (
          <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-slate-200 dark:border-[#262837]">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              From:
            </span>
            <div className="w-40">
              <DatePicker
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              To:
            </span>
            <div className="w-40">
              <DatePicker
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {viewMode === "calendar" ? (
        <TripCalendar
          trips={filteredTrips}
          customers={customers}
          vehicles={vehicles}
          drivers={drivers}
          onSelectTrip={(trip) => setSelectedTrip(trip)}
        />
      ) : (
        <>
          {filteredTrips.length === 0 ? (
            <Card className="border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822]">
              <CardContent className="p-8 text-center space-y-3">
                {trips.length === 0 ? (
                  <>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 text-xl font-bold">
                      <span className="material-symbols-outlined text-[24px]">
                        route
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      No trips yet
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Create your first booking to assign vehicles, drivers, and
                      track operational lifecycles.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => navigate("/trips/new")}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] rounded-lg shadow-sm cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          add
                        </span>
                        <span>Create First Booking</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      No trips match your filters
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Try adjusting your search terms or clearing selected
                      status, vehicle, or date filters.
                    </p>
                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={resetFilters}
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Desktop High-Density Table (>= md) */}
              <div className="hidden md:block">
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] shadow-xs">
                  {/* Table Header Bar */}
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-[#262837] flex justify-between items-center bg-white dark:bg-[#161822]">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                        Active Operations
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-slate-100 dark:bg-[#1f2230] text-slate-600 dark:text-slate-300">
                        {filteredTrips.length}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400">
                      {activeKpiFilter && (
                        <span className="font-medium text-cyan-600 dark:text-cyan-400">
                          Filtering by:{" "}
                          {activeKpiFilter.replace(/_/g, " ").toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-[#262837] bg-slate-50/70 dark:bg-[#13151f]">
                          <th
                            scope="col"
                            className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                          >
                            TRIP ID
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                          >
                            CUSTOMER / ROUTE
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                          >
                            SCHEDULE
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                          >
                            VEHICLE & DRIVER
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                          >
                            STATUS
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                          >
                            PAYMENT & BILLING
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
                        {paginatedTrips.map((trip) => {
                          const cust = customerMap.get(trip.customerId);
                          const veh = vehicleMap.get(trip.vehicleId);
                          const drv = driverMap.get(trip.driverId);
                          const inv = getTripInvoice(trip);
                          const isHighlighted = highlightedTripId === trip.id;
                          const isInvoiced = Boolean(inv);
                          const isReadyToInv =
                            trip.status === "completed" && !isInvoiced;
                          const hasAttention = isTripNeedsAttention(trip);

                          // Left indicator bar
                          let leftBarColor = "border-l-transparent";
                          if (trip.status === "in_progress") {
                            leftBarColor = "border-l-4 border-l-cyan-500";
                          } else if (hasAttention) {
                            leftBarColor = "border-l-4 border-l-rose-500";
                          } else if (trip.status === "completed") {
                            leftBarColor = "border-l-4 border-l-emerald-500";
                          }

                          return (
                            <tr
                              key={trip.id}
                              className={[
                                "transition-colors duration-150 relative",
                                leftBarColor,
                                isHighlighted
                                  ? "bg-cyan-500/10 dark:bg-cyan-950/40 ring-1 ring-inset ring-cyan-400/40"
                                  : "hover:bg-slate-50/80 dark:hover:bg-[#1a1c28]",
                              ].join(" ")}
                            >
                              {/* 1. Trip ID Column */}
                              <td className="px-4 py-3 align-middle whitespace-nowrap">
                                <div className="flex flex-col">
                                  <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                                    {trip.tripCode}
                                  </span>
                                  <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
                                    {TRIP_TYPE_LABELS[trip.tripType] ||
                                      trip.tripType ||
                                      "Outstation"}
                                  </span>
                                </div>
                              </td>

                              {/* 2. Customer / Route Column */}
                              <td className="px-4 py-3 align-middle max-w-[230px]">
                                <div className="min-w-0">
                                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                                    {cust?.name || "Customer"}
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                    <span className="material-symbols-outlined text-[13px] text-slate-400 shrink-0">
                                      trip_origin
                                    </span>
                                    <span className="truncate">
                                      {trip.pickupLocation || "Origin"}
                                    </span>
                                    <span className="material-symbols-outlined text-[13px] text-slate-400 shrink-0">
                                      arrow_right_alt
                                    </span>
                                    <span className="truncate">
                                      {trip.dropLocation || "Destination"}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* 3. Schedule Column */}
                              <td className="px-4 py-3 align-middle whitespace-nowrap">
                                <div className="min-w-0 text-xs">
                                  <div className="font-semibold text-slate-900 dark:text-slate-200">
                                    {formatDateTime(trip.startDateTime)}
                                  </div>
                                  <div className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
                                    {trip.duration || "Standard Route"}
                                  </div>
                                </div>
                              </td>

                              {/* 4. Vehicle & Driver Column */}
                              <td className="px-4 py-3 align-middle max-w-[190px]">
                                <div className="flex items-center gap-2">
                                  {veh ? (
                                    <div className="w-8 h-8 rounded bg-slate-100 dark:bg-[#1f2230] border border-slate-200 dark:border-[#262837] flex items-center justify-center text-slate-700 dark:text-slate-300 text-[11px] font-mono font-bold shrink-0">
                                      {veh.vehicleCode
                                        ? veh.vehicleCode.replace("VEH-", "V-")
                                        : "V"}
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 rounded border border-dashed border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400 text-xs font-mono font-bold shrink-0">
                                      --
                                    </div>
                                  )}

                                  <div className="min-w-0">
                                    <div className="font-semibold text-xs text-slate-900 dark:text-slate-200 truncate">
                                      {veh ? (
                                        veh.vehicleNumber
                                      ) : (
                                        <span className="text-rose-600 dark:text-rose-400 italic">
                                          Unassigned Vehicle
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                      {drv ? (
                                        drv.name
                                      ) : (
                                        <span className="text-rose-500 dark:text-rose-400/80 italic">
                                          Unassigned Driver
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* 5. Status Column */}
                              <td className="px-4 py-3 align-middle whitespace-nowrap">
                                <TripStatusBadge status={trip.status} />
                              </td>

                              {/* 6. Payment & Billing Column */}
                              <td className="px-4 py-3 align-middle whitespace-nowrap">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                                      ₹
                                      {Number(
                                        trip.totalAmount || 0,
                                      ).toLocaleString("en-IN")}
                                    </span>
                                    <PaymentStatusBadge
                                      paymentStatus={trip.paymentStatus}
                                    />
                                  </div>

                                  {/* Invoice state pill */}
                                  <div>
                                    {isInvoiced ? (
                                      <span
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate("/invoices");
                                        }}
                                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                                      >
                                        <span className="material-symbols-outlined text-[13px]">
                                          receipt_long
                                        </span>
                                        {inv.invoiceNumber}
                                      </span>
                                    ) : isReadyToInv ? (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/40">
                                        Ready to Invoice
                                      </span>
                                    ) : (
                                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                        Not Invoiced
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* 7. Actions Column: ONLY View + 3-dots Button */}
                              <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                                <div className="inline-flex items-center justify-end gap-1.5">
                                  {/* View Button */}
                                  <button
                                    type="button"
                                    title="View Details"
                                    aria-label="View Details"
                                    onClick={() => setSelectedTrip(trip)}
                                    className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] hover:bg-slate-50 dark:hover:bg-[#1f2230] text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[16px] text-slate-500 dark:text-slate-400">
                                      visibility
                                    </span>
                                    <span>View</span>
                                  </button>

                                  {/* 3 Dots Actions Drawer Button */}
                                  <button
                                    type="button"
                                    title="Trip Actions"
                                    aria-label="Trip actions"
                                    data-testid={`trip-actions-btn-${trip.id}`}
                                    onClick={() => setActionDrawerTrip(trip)}
                                    className="h-8 w-8 rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] hover:bg-slate-50 dark:hover:bg-[#1f2230] text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                                  >
                                    <span className="material-symbols-outlined text-[18px]">
                                      more_vert
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
                      Showing {filteredTrips.length === 0 ? 0 : startIndex + 1}{" "}
                      to {endIndex} of {filteredTrips.length} trips
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
                {paginatedTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    customer={customerMap.get(trip.customerId)}
                    vehicle={vehicleMap.get(trip.vehicleId)}
                    driver={driverMap.get(trip.driverId)}
                    highlighted={highlightedTripId === trip.id}
                    onView={(t) => setSelectedTrip(t)}
                    onOpenActions={(t) => setActionDrawerTrip(t)}
                  />
                ))}

                {/* Mobile Pagination */}
                <div className="flex justify-center pt-2">
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
        </>
      )}

      {/* Read-Only Details Modal */}
      {selectedTrip && (
        <TripDetailsModal
          open={Boolean(selectedTrip)}
          onClose={() => setSelectedTrip(null)}
          trip={selectedTrip}
          customer={customerMap.get(selectedTrip.customerId)}
          vehicle={vehicleMap.get(selectedTrip.vehicleId)}
          driver={driverMap.get(selectedTrip.driverId)}
          onEdit={(t) => navigate(`/trips/${t.id}/edit`)}
          onConfirm={(t) => handleConfirm(t)}
          onStart={(t) => {
            setTripToStart(t);
            setStartOpeningKm(
              t.openingKm !== null && t.openingKm !== undefined
                ? String(t.openingKm)
                : "",
            );
          }}
          onComplete={(t) => {
            setTripToComplete(t);
            setCompleteForm({
              closingKm: "",
              actualEndDateTime: t.endDateTime || "",
              tollCharges: t.tollCharges || 0,
              parkingCharges: t.parkingCharges || 0,
              otherCharges: t.otherCharges || 0,
              notes: t.notes || "",
            });
          }}
          onCancel={(t) => setTripToCancel(t)}
          onCreateInvoice={(t) => {
            setSelectedTrip(null);
            navigate(`/invoices/generate?tripId=${t.id}`);
          }}
        />
      )}

      {/* Start Trip Modal */}
      {tripToStart && (
        <Modal open={Boolean(tripToStart)} onClose={() => setTripToStart(null)}>
          <ModalHeader>
            <div>
              <ModalTitle>Start Trip {tripToStart.tripCode}</ModalTitle>
              <ModalDescription>
                Confirm vehicle departure and record starting odometer reading.
              </ModalDescription>
            </div>
            <ModalClose onClose={() => setTripToStart(null)} />
          </ModalHeader>
          <ModalContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Opening Kilometers (Odometer Reading)
              </label>
              <input
                type="number"
                placeholder="e.g. 45200"
                value={startOpeningKm}
                onChange={(e) => setStartOpeningKm(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500/40 focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-400">
                Recorded for accurate total distance calculation upon return.
              </p>
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
            <button
              type="button"
              onClick={handleStartSubmit}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] rounded-lg shadow-sm cursor-pointer"
            >
              Start Journey
            </button>
          </ModalFooter>
        </Modal>
      )}

      {/* Complete Trip Modal */}
      {tripToComplete && (
        <Modal
          open={Boolean(tripToComplete)}
          onClose={() => setTripToComplete(null)}
          className="max-w-md"
        >
          <ModalHeader>
            <div>
              <ModalTitle>Complete Trip {tripToComplete.tripCode}</ModalTitle>
              <ModalDescription>
                Record final odometer reading and additional operational
                charges.
              </ModalDescription>
            </div>
            <ModalClose onClose={() => setTripToComplete(null)} />
          </ModalHeader>
          <ModalContent className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-[#191b26] rounded-lg border border-slate-200 dark:border-[#262837]">
              <span className="text-slate-400 block text-[11px]">
                Opening KM
              </span>
              <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">
                {tripToComplete.openingKm !== null &&
                tripToComplete.openingKm !== undefined
                  ? `${tripToComplete.openingKm} KM`
                  : "Not recorded"}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Closing Kilometers <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                placeholder="e.g. 45680"
                value={completeForm.closingKm}
                onChange={(e) =>
                  setCompleteForm((prev) => ({
                    ...prev,
                    closingKm: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500/40 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
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
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500/40 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
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
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500/40 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Completion Notes / Feedback
              </label>
              <input
                type="text"
                placeholder="Driver notes, route deviations, customer feedback..."
                value={completeForm.notes}
                onChange={(e) =>
                  setCompleteForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500/40 focus:outline-none"
              />
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
            <button
              type="button"
              onClick={handleCompleteSubmit}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] rounded-lg shadow-sm cursor-pointer"
            >
              Finalize & Complete
            </button>
          </ModalFooter>
        </Modal>
      )}

      {/* Cancel Confirmation Dialog */}
      {tripToCancel && (
        <ConfirmDialog
          open={Boolean(tripToCancel)}
          onClose={() => setTripToCancel(null)}
          onConfirm={handleCancelSubmit}
          title={`Cancel Trip ${tripToCancel.tripCode}?`}
          message={
            Number(tripToCancel.advanceAmount || 0) > 0
              ? `Are you sure you want to cancel this booking? This will release the vehicle and driver. Note: An advance of ₹${Number(
                  tripToCancel.advanceAmount,
                ).toLocaleString(
                  "en-IN",
                )} was previously received and will be preserved in historical records.`
              : "Are you sure you want to cancel this booking? This will release the vehicle and driver."
          }
          confirmLabel="Yes, Cancel Booking"
          cancelLabel="Keep Booking"
          variant="danger"
        />
      )}

      {/* Delete Confirmation Dialog (Drafts Only) */}
      {tripToDelete && (
        <ConfirmDialog
          open={Boolean(tripToDelete)}
          onClose={() => setTripToDelete(null)}
          onConfirm={handleDeleteSubmit}
          title={`Delete Draft ${tripToDelete.tripCode}?`}
          message="Are you sure you want to permanently delete this draft booking? This action cannot be undone."
          confirmLabel="Delete Draft"
          cancelLabel="Cancel"
          variant="danger"
        />
      )}

      {/* Trip Actions Slide-Over Drawer */}
      {actionDrawerTrip && (
        <TripActionsDrawer
          open={Boolean(actionDrawerTrip)}
          onClose={() => setActionDrawerTrip(null)}
          trip={actionDrawerTrip}
          customer={customerMap.get(actionDrawerTrip.customerId)}
          vehicle={vehicleMap.get(actionDrawerTrip.vehicleId)}
          driver={driverMap.get(actionDrawerTrip.driverId)}
          invoice={getTripInvoice(actionDrawerTrip)}
          onViewDetails={(t) => {
            setActionDrawerTrip(null);
            setSelectedTrip(t);
          }}
          onEdit={(t) => {
            setActionDrawerTrip(null);
            navigate(`/trips/${t.id}/edit`);
          }}
          onConfirm={(t) => {
            setActionDrawerTrip(null);
            handleConfirm(t);
          }}
          onStart={(t) => {
            setActionDrawerTrip(null);
            setTripToStart(t);
            setStartOpeningKm(
              t.openingKm !== null && t.openingKm !== undefined
                ? String(t.openingKm)
                : "",
            );
          }}
          onComplete={(t) => {
            setActionDrawerTrip(null);
            setTripToComplete(t);
            setCompleteForm({
              closingKm: "",
              actualEndDateTime: t.endDateTime || "",
              tollCharges: t.tollCharges || 0,
              parkingCharges: t.parkingCharges || 0,
              otherCharges: t.otherCharges || 0,
              notes: t.notes || "",
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
            navigate(`/invoices/generate?tripId=${t.id}`);
          }}
          onViewInvoice={() => {
            setActionDrawerTrip(null);
            navigate("/invoices");
          }}
        />
      )}
    </div>
  );
}
