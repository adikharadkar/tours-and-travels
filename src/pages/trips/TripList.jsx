import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Button from "../../components/ui/Button";
import Card, { CardContent } from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Table, {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/ui/Table";
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
  { label: "This Month", value: "this_month" },
  { label: "Custom Range", value: "custom" },
];

const SORT_OPTIONS = [
  { label: "Start Date (Ascending)", value: "date_asc" },
  { label: "Start Date (Descending)", value: "date_desc" },
  { label: "Amount (High to Low)", value: "amount_desc" },
  { label: "Amount (Low to High)", value: "amount_asc" },
  { label: "Customer Name", value: "customer_asc" },
  { label: "Trip Code", value: "code_desc" },
];

function formatDateTime(dateTimeString) {
  if (!dateTimeString) return "—";
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return dateTimeString;
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateTimeString;
  }
}

export default function TripList() {
  const navigate = useNavigate();
  const location = useLocation();

  const [trips, setTrips] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

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
  const [sortBy, setSortBy] = useState("date_asc");

  // Selection for details / actions
  const [selectedTrip, setSelectedTrip] = useState(null);
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

  // Filter & Search & Sort
  const filteredTrips = useMemo(() => {
    const query = search.trim().toLowerCase();
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

    return trips
      .filter((trip) => {
        const cust = customerMap.get(trip.customerId);
        const veh = vehicleMap.get(trip.vehicleId);
        const drv = driverMap.get(trip.driverId);

        // 1. Search: Trip Code, Customer Name, Customer Code, Vehicle Number, Driver Name
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
          const matchDrv = (drv?.name || "").toLowerCase().includes(query);
          const matchPickup = (trip.pickupLocation || "")
            .toLowerCase()
            .includes(query);
          const matchDrop = (trip.dropLocation || "")
            .toLowerCase()
            .includes(query);

          if (
            !matchCode &&
            !matchCustName &&
            !matchCustCode &&
            !matchVeh &&
            !matchDrv &&
            !matchPickup &&
            !matchDrop
          ) {
            return false;
          }
        }

        // 2. Status Filter
        if (statusFilter !== "all" && trip.status !== statusFilter) {
          return false;
        }

        // 3. Payment Filter
        if (paymentFilter !== "all" && trip.paymentStatus !== paymentFilter) {
          return false;
        }

        // 4. Trip Type Filter
        if (tripTypeFilter !== "all" && trip.tripType !== tripTypeFilter) {
          return false;
        }

        // 5. Vehicle Filter
        if (vehicleFilter !== "all" && trip.vehicleId !== vehicleFilter) {
          return false;
        }

        // 6. Driver Filter
        if (driverFilter !== "all" && trip.driverId !== driverFilter) {
          return false;
        }

        // 7. Date Filter
        if (dateFilter !== "all" && trip.startDateTime) {
          const tripDateStr = trip.startDateTime.split("T")[0];

          if (dateFilter === "today") {
            if (tripDateStr !== todayStr) return false;
          } else if (dateFilter === "tomorrow") {
            if (tripDateStr !== tomorrowStr) return false;
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
    sortBy,
    customerMap,
    vehicleMap,
    driverMap,
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
    setStatusFilter("all");
    setPaymentFilter("all");
    setTripTypeFilter("all");
    setDateFilter("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setVehicleFilter("all");
    setDriverFilter("all");
    setSortBy("date_asc");
  };

  const activeFilterCount = [
    statusFilter !== "all",
    paymentFilter !== "all",
    tripTypeFilter !== "all",
    dateFilter !== "all",
    vehicleFilter !== "all",
    driverFilter !== "all",
    Boolean(search.trim()),
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Trip & Booking Management
          </h1>
          <p className="text-xs text-muted">
            Manage trips, vehicle-driver allocations, schedules, and billing
            status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* List / Calendar View Toggle */}
          <div className="inline-flex rounded-md border border-border p-1 bg-surface">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={[
                "px-3 py-1.5 text-xs font-medium rounded transition-colors",
                viewMode === "list"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted hover:text-foreground",
              ].join(" ")}
            >
              List View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={[
                "px-3 py-1.5 text-xs font-medium rounded transition-colors",
                viewMode === "calendar"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted hover:text-foreground",
              ].join(" ")}
            >
              Calendar View
            </button>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={() => navigate("/trips/new")}
          >
            + Create Booking
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Search and Top Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Input
                type="search"
                placeholder="Search trip code, customer, route, vehicle, driver..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={SORT_OPTIONS}
              />
            </div>
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {/* Status */}
            <div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { label: "All Statuses", value: "all" },
                  ...TRIP_STATUSES,
                ]}
              />
            </div>

            {/* Payment */}
            <div>
              <Select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                options={[
                  { label: "All Payments", value: "all" },
                  ...PAYMENT_STATUSES,
                ]}
              />
            </div>

            {/* Trip Type */}
            <div>
              <Select
                value={tripTypeFilter}
                onChange={(e) => setTripTypeFilter(e.target.value)}
                options={[
                  { label: "All Trip Types", value: "all" },
                  ...TRIP_TYPES,
                ]}
              />
            </div>

            {/* Date Filter */}
            <div>
              <Select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                options={DATE_FILTER_OPTIONS}
              />
            </div>

            {/* Vehicle Filter */}
            <div>
              <Select
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
                options={[
                  { label: "All Vehicles", value: "all" },
                  ...vehicles.map((v) => ({
                    label: `${v.vehicleNumber || v.vehicleCode}`,
                    value: v.id,
                  })),
                ]}
              />
            </div>

            {/* Driver Filter */}
            <div>
              <Select
                value={driverFilter}
                onChange={(e) => setDriverFilter(e.target.value)}
                options={[
                  { label: "All Drivers", value: "all" },
                  ...drivers.map((d) => ({
                    label: d.name,
                    value: d.id,
                  })),
                ]}
              />
            </div>
          </div>

          {/* Custom Date Range if active */}
          {dateFilter === "custom" && (
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border">
              <span className="text-xs font-medium text-muted">From:</span>
              <div className="w-44">
                <DatePicker
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <span className="text-xs font-medium text-muted">To:</span>
              <div className="w-44">
                <DatePicker
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Filter Status summary & Reset */}
          {activeFilterCount > 0 && (
            <div className="flex items-center justify-between text-xs text-muted pt-2 border-t border-border">
              <span>
                Showing {filteredTrips.length} of {trips.length} trips
              </span>
              <button
                type="button"
                onClick={resetFilters}
                className="text-primary hover:underline font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </CardContent>
      </Card>

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
            <Card>
              <CardContent className="p-8 text-center space-y-3">
                {trips.length === 0 ? (
                  <>
                    <h3 className="text-lg font-bold text-foreground">
                      No trips yet
                    </h3>
                    <p className="text-xs text-muted max-w-sm mx-auto">
                      Create your first booking to assign vehicles, drivers, and
                      track trip lifecycles.
                    </p>
                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => navigate("/trips/new")}
                      >
                        Create First Booking
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-foreground">
                      No trips match your filters
                    </h3>
                    <p className="text-xs text-muted max-w-sm mx-auto">
                      Try adjusting your search terms or clearing selected
                      status/date filters.
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
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip Code</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Vehicle & Driver</TableHead>
                      <TableHead>Schedule Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrips.map((trip) => {
                      const cust = customerMap.get(trip.customerId);
                      const veh = vehicleMap.get(trip.vehicleId);
                      const drv = driverMap.get(trip.driverId);
                      const isHighlighted = highlightedTripId === trip.id;

                      return (
                        <TableRow
                          key={trip.id}
                          className={
                            isHighlighted
                              ? "bg-primary/5 ring-1 ring-primary"
                              : ""
                          }
                        >
                          <TableCell className="font-mono font-bold text-xs whitespace-nowrap">
                            {trip.tripCode}
                          </TableCell>

                          <TableCell className="max-w-[160px] truncate font-medium text-foreground">
                            {cust?.name || "Customer"}
                          </TableCell>

                          <TableCell className="max-w-[180px] text-xs">
                            <div className="font-medium truncate text-foreground">
                              {trip.pickupLocation} → {trip.dropLocation}
                            </div>
                            <div className="text-[11px] text-muted truncate">
                              {TRIP_TYPE_LABELS[trip.tripType] || trip.tripType}
                            </div>
                          </TableCell>

                          <TableCell className="max-w-[160px] text-xs">
                            <div className="font-medium truncate text-foreground">
                              {veh ? veh.vehicleNumber : "—"}
                            </div>
                            <div className="text-[11px] text-muted truncate">
                              {drv ? drv.name : "—"}
                            </div>
                          </TableCell>

                          <TableCell className="text-xs whitespace-nowrap">
                            <div className="font-medium text-foreground">
                              {formatDateTime(trip.startDateTime)}
                            </div>
                            <div className="text-[11px] text-muted">
                              {trip.duration}
                            </div>
                          </TableCell>

                          <TableCell>
                            <TripStatusBadge status={trip.status} />
                          </TableCell>

                          <TableCell>
                            <PaymentStatusBadge
                              paymentStatus={trip.paymentStatus}
                            />
                          </TableCell>

                          <TableCell className="text-right font-mono font-semibold text-xs whitespace-nowrap">
                            ₹
                            {Number(trip.totalAmount || 0).toLocaleString(
                              "en-IN",
                            )}
                          </TableCell>

                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedTrip(trip)}
                                className="text-xs px-2 py-1"
                              >
                                View
                              </Button>

                              {trip.status !== "completed" &&
                                trip.status !== "cancelled" && (
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() =>
                                      navigate(`/trips/${trip.id}/edit`)
                                    }
                                    className="text-xs px-2 py-1"
                                  >
                                    Edit
                                  </Button>
                                )}

                              {trip.status === "completed" && (
                                <Button
                                  type="button"
                                  variant="primary"
                                  size="sm"
                                  onClick={() =>
                                    navigate(
                                      `/invoices/generate?tripId=${trip.id}`,
                                    )
                                  }
                                  className="text-xs px-2 py-1 font-semibold"
                                >
                                  Generate Invoice
                                </Button>
                              )}

                              {trip.status === "draft" && (
                                <Button
                                  type="button"
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleConfirm(trip)}
                                  className="text-xs px-2 py-1"
                                >
                                  Confirm
                                </Button>
                              )}

                              {trip.status === "confirmed" && (
                                <Button
                                  type="button"
                                  variant="primary"
                                  size="sm"
                                  onClick={() => {
                                    setTripToStart(trip);
                                    setStartOpeningKm(
                                      trip.openingKm !== null &&
                                        trip.openingKm !== undefined
                                        ? String(trip.openingKm)
                                        : "",
                                    );
                                  }}
                                  className="text-xs px-2 py-1"
                                >
                                  Start
                                </Button>
                              )}

                              {trip.status === "in_progress" && (
                                <Button
                                  type="button"
                                  variant="primary"
                                  size="sm"
                                  onClick={() => {
                                    setTripToComplete(trip);
                                    setCompleteForm({
                                      closingKm: "",
                                      actualEndDateTime: trip.endDateTime || "",
                                      tollCharges: trip.tollCharges || 0,
                                      parkingCharges: trip.parkingCharges || 0,
                                      otherCharges: trip.otherCharges || 0,
                                      notes: trip.notes || "",
                                    });
                                  }}
                                  className="text-xs px-2 py-1"
                                >
                                  Complete
                                </Button>
                              )}

                              {(trip.status === "draft" ||
                                trip.status === "confirmed") && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setTripToCancel(trip)}
                                  className="text-xs px-2 py-1 text-error hover:bg-error/10"
                                >
                                  Cancel
                                </Button>
                              )}

                              {trip.status === "draft" && (
                                <Button
                                  type="button"
                                  variant="danger"
                                  size="sm"
                                  onClick={() => setTripToDelete(trip)}
                                  className="text-xs px-2 py-1"
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card List View */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    customer={customerMap.get(trip.customerId)}
                    vehicle={vehicleMap.get(trip.vehicleId)}
                    driver={driverMap.get(trip.driverId)}
                    highlighted={highlightedTripId === trip.id}
                    onView={(t) => setSelectedTrip(t)}
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
                    onDelete={(t) => setTripToDelete(t)}
                    onCreateInvoice={(t) =>
                      navigate(`/invoices/generate?tripId=${t.id}`)
                    }
                  />
                ))}
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

      {/* Start Trip Modal (Optional Opening KM entry) */}
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
              <label className="block text-xs font-semibold text-foreground mb-1">
                Opening Kilometers (Odometer Reading)
              </label>
              <Input
                type="number"
                placeholder="e.g. 45200"
                value={startOpeningKm}
                onChange={(e) => setStartOpeningKm(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted">
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
            <Button type="button" variant="primary" onClick={handleStartSubmit}>
              Start Journey
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* Complete Trip Modal (Closing KM & Actuals) */}
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
            <div className="p-3 bg-background/50 rounded-md border border-border">
              <span className="text-muted block">Opening KM</span>
              <span className="text-sm font-bold font-mono text-foreground">
                {tripToComplete.openingKm !== null &&
                tripToComplete.openingKm !== undefined
                  ? `${tripToComplete.openingKm} KM`
                  : "Not recorded"}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">
                Closing Kilometers <span className="text-error">*</span>
              </label>
              <Input
                type="number"
                placeholder="e.g. 45680"
                value={completeForm.closingKm}
                onChange={(e) =>
                  setCompleteForm((prev) => ({
                    ...prev,
                    closingKm: e.target.value,
                  }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Toll Charges (₹)
                </label>
                <Input
                  type="number"
                  value={completeForm.tollCharges}
                  onChange={(e) =>
                    setCompleteForm((prev) => ({
                      ...prev,
                      tollCharges: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Parking Charges (₹)
                </label>
                <Input
                  type="number"
                  value={completeForm.parkingCharges}
                  onChange={(e) =>
                    setCompleteForm((prev) => ({
                      ...prev,
                      parkingCharges: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">
                Completion Notes / Feedback
              </label>
              <Input
                placeholder="Driver notes, route deviations, customer feedback..."
                value={completeForm.notes}
                onChange={(e) =>
                  setCompleteForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
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
            <Button
              type="button"
              variant="primary"
              onClick={handleCompleteSubmit}
            >
              Finalize & Complete
            </Button>
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
          description={
            Number(tripToCancel.advanceAmount || 0) > 0
              ? `Are you sure you want to cancel this booking? This will release the vehicle and driver. Note: An advance of ₹${Number(
                  tripToCancel.advanceAmount,
                ).toLocaleString(
                  "en-IN",
                )} was previously received and will be preserved in historical records.`
              : "Are you sure you want to cancel this booking? This will release the vehicle and driver."
          }
          confirmText="Yes, Cancel Booking"
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
          description="Are you sure you want to permanently delete this draft booking? This action cannot be undone."
          confirmText="Delete Draft"
          variant="danger"
        />
      )}
    </div>
  );
}
