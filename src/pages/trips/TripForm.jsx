import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Textarea from "../../components/ui/Textarea";
import Switch from "../../components/ui/Switch";
import DatePicker from "../../components/ui/DatePicker";
import Toast from "../../components/ui/Toast";

import {
  TRIP_TYPES,
  RATE_TYPES,
  PAYMENT_MODES,
  DISCOUNT_TYPES,
  TAX_TYPES,
  PAYMENT_STATUS_LABELS,
} from "../../constants/trips";
import {
  calculateTripDuration,
  calculateTotalKm,
  calculateTripAmount,
} from "../../utils/tripCalculation";
import {
  getVehicleConflicts,
  getDriverConflicts,
} from "../../utils/tripAvailability";
import { validateTrip } from "../../utils/validation/tripValidation";
import { getCustomerAccountStatus } from "../../utils/customerAccountStatus";
import { getVehicleDocumentStatus } from "../../utils/vehicleDocumentStatus";
import {
  getDriverLicenseStatus,
  isDriverEligible,
} from "../../utils/driverLicenseStatus";

import {
  getTripById,
  saveTrip,
  updateTrip,
  getTrips,
} from "../../services/tripService";
import { getCustomers } from "../../services/customerService";
import { getVehicles } from "../../services/vehicleService";
import { getDrivers } from "../../services/driverService";

const getTodayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getInitialStartDateTime = () => {
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `${dateStr}T09:00`;
};

const getInitialEndDateTime = () => {
  const d = new Date();
  d.setHours(18, 0, 0, 0);
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `${dateStr}T18:00`;
};

const initialFormData = {
  tripCode: "Generated automatically",
  bookingDate: getTodayDate(),
  tripType: "outstation",
  referenceNumber: "",

  customerId: "",
  vehicleId: "",
  driverId: "",

  pickupLocation: "",
  dropLocation: "",
  stops: "",
  pickupInstructions: "",

  startDateTime: getInitialStartDateTime(),
  endDateTime: getInitialEndDateTime(),

  openingKm: "",
  closingKm: "",

  rateType: "per_day",
  baseRate: 5000,
  ratePerKm: "",
  ratePerHour: "",
  ratePerDay: "",
  extraKmCharges: "",
  extraHourCharges: "",
  driverCharges: "",
  tollCharges: "",
  parkingCharges: "",
  otherCharges: "",

  discountType: "fixed",
  discountValue: "",

  taxApplicable: false,
  taxType: "gst_12",
  taxRate: 12,

  advanceAmount: "",
  advancePaymentMode: "bank_transfer",
  advancePaymentReference: "",
  advancePaymentDate: getTodayDate(),

  notes: "",
};

export default function TripForm() {
  const navigate = useNavigate();
  const { tripId } = useParams();
  const isEditMode = Boolean(tripId);

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdditionalCharges, setShowAdditionalCharges] = useState(false);

  const [allTrips, setAllTrips] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  // Load masters & existing trip on mount
  useEffect(() => {
    try {
      const tripsData = getTrips();
      const customersData = getCustomers();
      const vehiclesData = getVehicles();
      const driversData = getDrivers();

      setAllTrips(tripsData);
      setCustomers(customersData);
      setVehicles(vehiclesData);
      setDrivers(driversData);

      if (isEditMode) {
        const existing = getTripById(tripId);
        if (!existing) {
          setToast({
            id: Date.now(),
            message: "Trip not found.",
            variant: "error",
          });
          setTimeout(() => navigate("/trips"), 1500);
          return;
        }

        setFormData({
          ...initialFormData,
          ...existing,
          openingKm:
            existing.openingKm !== null && existing.openingKm !== undefined
              ? String(existing.openingKm)
              : "",
          closingKm:
            existing.closingKm !== null && existing.closingKm !== undefined
              ? String(existing.closingKm)
              : "",
          baseRate: existing.baseRate ?? "",
          ratePerKm: existing.ratePerKm ?? "",
          ratePerHour: existing.ratePerHour ?? "",
          ratePerDay: existing.ratePerDay ?? "",
          extraKmCharges: existing.extraKmCharges ?? "",
          extraHourCharges: existing.extraHourCharges ?? "",
          driverCharges: existing.driverCharges ?? "",
          tollCharges: existing.tollCharges ?? "",
          parkingCharges: existing.parkingCharges ?? "",
          otherCharges: existing.otherCharges ?? "",
          discountValue: existing.discountValue ?? "",
          advanceAmount: existing.advanceAmount ?? "",
        });

        if (
          existing.driverCharges ||
          existing.tollCharges ||
          existing.parkingCharges ||
          existing.otherCharges ||
          existing.extraKmCharges ||
          existing.extraHourCharges
        ) {
          setShowAdditionalCharges(true);
        }
      }
    } catch (err) {
      console.error("Failed to load form data:", err);
      setToast({
        id: Date.now(),
        message: "Failed to load master records.",
        variant: "error",
      });
    }
  }, [tripId, isEditMode, navigate]);

  // Selected Entities
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === formData.customerId) || null,
    [customers, formData.customerId],
  );

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === formData.vehicleId) || null,
    [vehicles, formData.vehicleId],
  );

  const selectedDriver = useMemo(
    () => drivers.find((d) => d.id === formData.driverId) || null,
    [drivers, formData.driverId],
  );

  // Status Evaluations
  const customerAccountStatus = useMemo(
    () =>
      selectedCustomer ? getCustomerAccountStatus(selectedCustomer) : null,
    [selectedCustomer],
  );

  const vehicleDocumentStatus = useMemo(
    () => (selectedVehicle ? getVehicleDocumentStatus(selectedVehicle) : null),
    [selectedVehicle],
  );

  const driverLicenseStatus = useMemo(
    () => (selectedDriver ? getDriverLicenseStatus(selectedDriver) : null),
    [selectedDriver],
  );

  const driverEligibility = useMemo(
    () => (selectedDriver ? isDriverEligible(selectedDriver) : true),
    [selectedDriver],
  );

  // Live Availability Conflicts
  const vehicleConflicts = useMemo(() => {
    if (
      !formData.vehicleId ||
      !formData.startDateTime ||
      !formData.endDateTime
    ) {
      return [];
    }
    return getVehicleConflicts(
      formData.vehicleId,
      formData.startDateTime,
      formData.endDateTime,
      isEditMode ? tripId : null,
      allTrips,
    );
  }, [
    formData.vehicleId,
    formData.startDateTime,
    formData.endDateTime,
    isEditMode,
    tripId,
    allTrips,
  ]);

  const driverConflicts = useMemo(() => {
    if (
      !formData.driverId ||
      !formData.startDateTime ||
      !formData.endDateTime
    ) {
      return [];
    }
    return getDriverConflicts(
      formData.driverId,
      formData.startDateTime,
      formData.endDateTime,
      isEditMode ? tripId : null,
      allTrips,
    );
  }, [
    formData.driverId,
    formData.startDateTime,
    formData.endDateTime,
    isEditMode,
    tripId,
    allTrips,
  ]);

  // Live Calculations
  const durationCalculation = useMemo(
    () => calculateTripDuration(formData.startDateTime, formData.endDateTime),
    [formData.startDateTime, formData.endDateTime],
  );

  const totalKmCalculation = useMemo(
    () => calculateTotalKm(formData.openingKm, formData.closingKm),
    [formData.openingKm, formData.closingKm],
  );

  const financialCalculations = useMemo(
    () => calculateTripAmount(formData),
    [formData],
  );

  // Booking Readiness evaluations
  const readiness = useMemo(() => {
    const isCustomerAssigned = Boolean(formData.customerId && selectedCustomer);
    const isRouteDefined = Boolean(
      formData.pickupLocation?.trim() && formData.dropLocation?.trim(),
    );
    const isScheduleValid = Boolean(
      formData.startDateTime &&
      formData.endDateTime &&
      durationCalculation.text !== "—" &&
      durationCalculation.text !== "Invalid duration",
    );
    const isVehicleAvailable = Boolean(
      formData.vehicleId &&
      selectedVehicle &&
      vehicleConflicts.length === 0 &&
      selectedVehicle.isActive !== false,
    );
    const isDriverEligibleAndAvailable = Boolean(
      formData.driverId &&
      selectedDriver &&
      driverConflicts.length === 0 &&
      driverEligibility &&
      selectedDriver.isActive !== false,
    );
    const isPricingCompleted = Boolean(
      formData.rateType &&
      formData.baseRate !== "" &&
      Number(formData.baseRate) >= 0 &&
      financialCalculations.totalAmount > 0,
    );

    const isAllReady =
      isCustomerAssigned &&
      isRouteDefined &&
      isScheduleValid &&
      isVehicleAvailable &&
      isDriverEligibleAndAvailable &&
      isPricingCompleted;

    return {
      isCustomerAssigned,
      isRouteDefined,
      isScheduleValid,
      isVehicleAvailable,
      isDriverEligibleAndAvailable,
      isPricingCompleted,
      isAllReady,
    };
  }, [
    formData.customerId,
    selectedCustomer,
    formData.pickupLocation,
    formData.dropLocation,
    formData.startDateTime,
    formData.endDateTime,
    durationCalculation.text,
    formData.vehicleId,
    selectedVehicle,
    vehicleConflicts.length,
    formData.driverId,
    selectedDriver,
    driverConflicts.length,
    driverEligibility,
    formData.rateType,
    formData.baseRate,
    financialCalculations.totalAmount,
  ]);

  // Field change handler
  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      // Synchronize Tax Rate when Tax Type changes
      if (field === "taxType") {
        const found = TAX_TYPES.find((t) => t.value === value);
        if (found && found.rate > 0) {
          next.taxRate = found.rate;
        }
      }

      return next;
    });

    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  // Submit Handler
  const handleSubmit = (targetStatus = "draft") => {
    setIsSubmitting(true);
    setErrors({});

    try {
      const payload = {
        ...formData,
        status: targetStatus,
      };

      const validation = validateTrip(payload);
      if (!validation.isValid) {
        setErrors(validation.errors);
        const firstErrorMessage = Object.values(validation.errors)[0];
        setToast({
          id: Date.now(),
          message: firstErrorMessage || "Please review the form for errors.",
          variant: "error",
        });
        setIsSubmitting(false);
        return;
      }

      // Check conflicts if confirming
      if (targetStatus === "confirmed") {
        if (vehicleConflicts.length > 0) {
          throw new Error(
            `Vehicle is already assigned to ${vehicleConflicts[0].tripCode}. Please pick another vehicle or adjust schedule.`,
          );
        }
        if (driverConflicts.length > 0) {
          throw new Error(
            `Driver is already assigned to ${driverConflicts[0].tripCode}. Please pick another driver or adjust schedule.`,
          );
        }
        if (selectedDriver && !isDriverEligible(selectedDriver)) {
          throw new Error(
            `Driver ${selectedDriver.name} is not eligible due to expired license.`,
          );
        }
      }

      let savedTrip;
      if (isEditMode) {
        savedTrip = updateTrip(tripId, payload);
      } else {
        savedTrip = saveTrip(payload);
      }

      navigate("/trips", {
        state: {
          highlightedTripId: savedTrip.id,
          toast: {
            message: isEditMode
              ? `Trip ${savedTrip.tripCode} updated successfully.`
              : `Trip ${savedTrip.tripCode} created successfully (${targetStatus.toUpperCase()}).`,
            variant: "success",
          },
        },
      });
    } catch (err) {
      console.error("Save error:", err);
      setToast({
        id: Date.now(),
        message: err.message || "Failed to save trip.",
        variant: "error",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-16">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header & Top Actions */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pb-2 border-b border-slate-200 dark:border-[#262837]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {isEditMode
                ? `Edit Trip: ${formData.tripCode}`
                : "Create New Trip / Booking"}
            </h1>
            <span
              id="trip-code-badge"
              className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60"
            >
              {isEditMode ? formData.tripCode : "TRP-NEW"}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure customer journey, vehicle & driver allocation, schedule,
            and pricing.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
          <Button
            id="trip-cancel-btn-top"
            type="button"
            variant="secondary"
            onClick={() => navigate("/trips")}
            disabled={isSubmitting}
            className="text-xs sm:text-sm font-medium"
          >
            Cancel
          </Button>
          <Button
            id="trip-save-draft-btn-top"
            type="button"
            variant="secondary"
            onClick={() => handleSubmit("draft")}
            disabled={isSubmitting}
            className="text-xs sm:text-sm font-medium"
          >
            Save Draft
          </Button>
          <Button
            id="trip-save-confirm-btn-top"
            type="button"
            variant="primary"
            onClick={() =>
              handleSubmit(
                isEditMode && formData.status ? formData.status : "confirmed",
              )
            }
            disabled={isSubmitting}
            className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] text-white shadow-sm"
          >
            {isEditMode ? "Save Changes" : "Save & Confirm"}
          </Button>
        </div>
      </header>

      {/* Main Form Layout (2 Columns on Desktop) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(
            isEditMode && formData.status ? formData.status : "confirmed",
          );
        }}
        className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start"
      >
        {/* Left Column: Flow Sections */}
        <div className="xl:col-span-8 space-y-6">
          {/* 1. Booking Information */}
          <section
            id="section-booking-info"
            className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-5 sm:p-6 shadow-xs hover:border-violet-300 dark:hover:border-violet-700/50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Booking Information
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Basic booking reference and general trip categorization.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="trip-code-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
                >
                  Trip Code
                </label>
                <Input
                  id="trip-code-input"
                  value={formData.tripCode}
                  disabled
                  className="bg-slate-50 dark:bg-[#13151f] font-mono font-semibold text-slate-600 dark:text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label
                  htmlFor="booking-date-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
                >
                  Booking Date <span className="text-rose-500">*</span>
                </label>
                <DatePicker
                  id="booking-date-input"
                  value={formData.bookingDate}
                  onChange={(e) => handleChange("bookingDate", e.target.value)}
                  error={errors.bookingDate}
                />
                {errors.bookingDate && (
                  <p className="text-xs text-rose-500 mt-1">
                    {errors.bookingDate}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="trip-type-select"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
                >
                  Trip Type <span className="text-rose-500">*</span>
                </label>
                <Select
                  id="trip-type-select"
                  value={formData.tripType}
                  onChange={(e) => handleChange("tripType", e.target.value)}
                  options={TRIP_TYPES}
                  error={errors.tripType}
                />
                {errors.tripType && (
                  <p className="text-xs text-rose-500 mt-1">
                    {errors.tripType}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor="customer-reference-input"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
              >
                Customer Reference / Booking ID (Optional)
              </label>
              <Input
                id="customer-reference-input"
                placeholder="e.g. PO-88492 or TOUR-2026-AUG"
                value={formData.referenceNumber}
                onChange={(e) =>
                  handleChange("referenceNumber", e.target.value)
                }
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Client-provided PO, tour booking code, or internal reference
              </p>
            </div>
          </section>

          {/* 2. Customer Selection & Snapshot */}
          <section
            id="section-customer"
            className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-5 sm:p-6 shadow-xs hover:border-violet-300 dark:hover:border-violet-700/50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Customer
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select an active customer from the Customer Master.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="customer-select-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5"
                >
                  Select Customer <span className="text-rose-500">*</span>
                </label>
                <Select
                  id="customer-select-input"
                  placeholder="-- Select a Customer --"
                  value={formData.customerId}
                  onChange={(e) => handleChange("customerId", e.target.value)}
                  options={customers
                    .filter(
                      (c) =>
                        c.isActive !== false || c.id === formData.customerId,
                    )
                    .map((c) => ({
                      label: `${c.name} (${c.customerCode || "No Code"}) ${c.mobile1 ? `· ${c.mobile1}` : ""}`,
                      value: c.id,
                    }))}
                  error={errors.customerId}
                />
                {errors.customerId && (
                  <p className="text-xs text-rose-500 mt-1">
                    {errors.customerId}
                  </p>
                )}
              </div>

              {/* Selected Customer Snapshot Card */}
              {selectedCustomer && (
                <div
                  id="customer-snapshot-card"
                  className="rounded-xl border border-slate-200 dark:border-[#262837] bg-slate-50/80 dark:bg-[#13151f] p-4 space-y-3 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 font-bold text-base flex items-center justify-center shrink-0 border border-cyan-200 dark:border-cyan-800/60">
                        {selectedCustomer.name
                          ?.split(" ")
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "CU"}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {selectedCustomer.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {selectedCustomer.customerCode && (
                            <span className="font-mono font-medium">
                              {selectedCustomer.customerCode}
                            </span>
                          )}
                          {selectedCustomer.mobile1 && (
                            <span className="inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">
                                phone
                              </span>
                              {selectedCustomer.mobile1}
                            </span>
                          )}
                          {selectedCustomer.email && (
                            <span className="inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">
                                mail
                              </span>
                              {selectedCustomer.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-col sm:items-end gap-1.5 shrink-0">
                      {customerAccountStatus && (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            customerAccountStatus.value === "due"
                              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
                              : "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/60"
                          }`}
                        >
                          ACCOUNT: {customerAccountStatus.label.toUpperCase()}
                        </span>
                      )}
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Credit Terms:{" "}
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {selectedCustomer.creditDays !== undefined &&
                          selectedCustomer.creditDays !== null
                            ? `${selectedCustomer.creditDays} Days`
                            : "Immediate"}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Pending Dues Warning */}
                  {customerAccountStatus?.value === "due" && (
                    <div
                      id="customer-dues-warning"
                      className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200/80 dark:border-amber-800/50"
                    >
                      <span className="material-symbols-outlined text-[16px] text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                        warning
                      </span>
                      <span>
                        <strong>Note:</strong> Customer currently has pending
                        dues/balance. Proceed with booking as scheduled.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* 3. Journey & Schedule */}
          <section
            id="section-journey-schedule"
            className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-5 sm:p-6 shadow-xs hover:border-violet-300 dark:hover:border-violet-700/50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Journey & Schedule
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Define route, timeline, duration, and odometer tracking.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Route Timeline Column */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Route Path
                </h3>

                <div className="relative pl-7 space-y-4 before:content-[''] before:absolute before:left-[9px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-[#262837]">
                  {/* Origin */}
                  <div className="relative">
                    <div className="absolute -left-[27px] top-2.5 w-4 h-4 rounded-full bg-white dark:bg-[#161822] border-2 border-violet-600 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-600"></div>
                    </div>
                    <label
                      htmlFor="pickup-location-input"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1"
                    >
                      Pickup Location <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      id="pickup-location-input"
                      placeholder="Enter origin address or city"
                      value={formData.pickupLocation}
                      onChange={(e) =>
                        handleChange("pickupLocation", e.target.value)
                      }
                      error={errors.pickupLocation}
                    />
                    {errors.pickupLocation && (
                      <p className="text-xs text-rose-500 mt-1">
                        {errors.pickupLocation}
                      </p>
                    )}
                  </div>

                  {/* Intermediate Stops */}
                  <div className="relative">
                    <div className="absolute -left-[27px] top-2.5 w-4 h-4 rounded-full bg-white dark:bg-[#161822] border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                    </div>
                    <label
                      htmlFor="stops-input"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1"
                    >
                      Via / Intermediate Stops (Optional)
                    </label>
                    <Input
                      id="stops-input"
                      placeholder="e.g. MIDC Waluj, Ahmednagar Bypass (comma-separated)"
                      value={formData.stops}
                      onChange={(e) => handleChange("stops", e.target.value)}
                    />
                  </div>

                  {/* Destination */}
                  <div className="relative">
                    <div className="absolute -left-[27px] top-2.5 w-4 h-4 rounded-full bg-white dark:bg-[#161822] border-2 border-cyan-500 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                    </div>
                    <label
                      htmlFor="drop-location-input"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1"
                    >
                      Drop-off Location <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      id="drop-location-input"
                      placeholder="Enter destination address or city"
                      value={formData.dropLocation}
                      onChange={(e) =>
                        handleChange("dropLocation", e.target.value)
                      }
                      error={errors.dropLocation}
                    />
                    {errors.dropLocation && (
                      <p className="text-xs text-rose-500 mt-1">
                        {errors.dropLocation}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <label
                    htmlFor="pickup-instructions-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1"
                  >
                    Pickup Instructions / Notes
                  </label>
                  <Textarea
                    id="pickup-instructions-input"
                    rows={2}
                    placeholder="Reporting gate, contact details, flight info, name board text..."
                    value={formData.pickupInstructions}
                    onChange={(e) =>
                      handleChange("pickupInstructions", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Schedule & KM Column */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Schedule & Timing
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="start-datetime-input"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1"
                    >
                      Start Date & Time <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      id="start-datetime-input"
                      type="datetime-local"
                      value={formData.startDateTime}
                      onChange={(e) =>
                        handleChange("startDateTime", e.target.value)
                      }
                      error={errors.startDateTime}
                    />
                    {errors.startDateTime && (
                      <p className="text-xs text-rose-500 mt-1">
                        {errors.startDateTime}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="end-datetime-input"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1"
                    >
                      End Date & Time <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      id="end-datetime-input"
                      type="datetime-local"
                      value={formData.endDateTime}
                      onChange={(e) =>
                        handleChange("endDateTime", e.target.value)
                      }
                      error={errors.endDateTime}
                    />
                    {errors.endDateTime && (
                      <p className="text-xs text-rose-500 mt-1">
                        {errors.endDateTime}
                      </p>
                    )}
                  </div>
                </div>

                {/* Duration & Distance Highlight Box */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#13151f] border border-slate-200 dark:border-[#262837] flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Calculated Duration
                    </span>
                    <span
                      id="calculated-duration-display"
                      className="text-base font-bold text-violet-700 dark:text-violet-300"
                    >
                      {durationCalculation.text}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Total Distance
                    </span>
                    <span
                      id="calculated-distance-display"
                      className="text-base font-mono font-bold text-slate-800 dark:text-slate-200"
                    >
                      {totalKmCalculation !== null
                        ? `${totalKmCalculation} km`
                        : "— km"}
                    </span>
                  </div>
                </div>

                {/* Kilometer Readings */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label
                      htmlFor="opening-km-input"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1"
                    >
                      Opening KM
                    </label>
                    <Input
                      id="opening-km-input"
                      type="number"
                      placeholder="e.g. 45200"
                      value={formData.openingKm}
                      onChange={(e) =>
                        handleChange("openingKm", e.target.value)
                      }
                      error={errors.openingKm}
                    />
                    {errors.openingKm && (
                      <p className="text-xs text-rose-500 mt-1">
                        {errors.openingKm}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="closing-km-input"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1"
                    >
                      Closing KM
                    </label>
                    <Input
                      id="closing-km-input"
                      type="number"
                      placeholder="e.g. 45680"
                      value={formData.closingKm}
                      onChange={(e) =>
                        handleChange("closingKm", e.target.value)
                      }
                      error={errors.closingKm}
                    />
                    {errors.closingKm && (
                      <p className="text-xs text-rose-500 mt-1">
                        {errors.closingKm}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Vehicle & Driver Assignment */}
          <section
            id="section-resources"
            className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-5 sm:p-6 shadow-xs hover:border-violet-300 dark:hover:border-violet-700/50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Vehicle & Driver Assignment
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Assign available and eligible fleet assets to this journey.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Vehicle Assignment Column */}
              <div className="space-y-3">
                <label
                  htmlFor="vehicle-select-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1"
                >
                  Assign Vehicle <span className="text-rose-500">*</span>
                </label>
                <Select
                  id="vehicle-select-input"
                  placeholder="-- Select a Vehicle --"
                  value={formData.vehicleId}
                  onChange={(e) => handleChange("vehicleId", e.target.value)}
                  options={vehicles
                    .filter(
                      (v) =>
                        v.isActive !== false || v.id === formData.vehicleId,
                    )
                    .map((v) => ({
                      label: `${v.vehicleNumber || v.vehicleCode} — ${v.make || ""} ${v.model || ""} (${v.seatingCapacity || 0} Seats)`,
                      value: v.id,
                    }))}
                  error={errors.vehicleId}
                />
                {errors.vehicleId && (
                  <p className="text-xs text-rose-500 mt-1">
                    {errors.vehicleId}
                  </p>
                )}

                {/* Vehicle Snapshot Card */}
                {selectedVehicle && (
                  <div
                    id="vehicle-snapshot-card"
                    className="border border-slate-200 dark:border-[#262837] rounded-xl p-4 bg-slate-50/80 dark:bg-[#13151f] space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                          {selectedVehicle.make} {selectedVehicle.model}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          {selectedVehicle.vehicleNumber} •{" "}
                          <span className="capitalize">
                            {selectedVehicle.vehicleType}
                          </span>{" "}
                          • {selectedVehicle.seatingCapacity} Seats
                        </p>
                      </div>

                      {vehicleConflicts.length > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                          UNAVAILABLE
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/60">
                          AVAILABLE
                        </span>
                      )}
                    </div>

                    <div className="h-px bg-slate-200 dark:bg-[#262837] w-full" />

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-cyan-600 dark:text-cyan-400">
                          verified
                        </span>
                        Compliance / Docs
                      </span>
                      {vehicleDocumentStatus && (
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[11px] border ${
                            vehicleDocumentStatus.value === "expired"
                              ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
                              : vehicleDocumentStatus.value === "expiring_soon"
                                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
                                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
                          }`}
                        >
                          {vehicleDocumentStatus.label}
                        </span>
                      )}
                    </div>

                    {/* Conflict Warning Box */}
                    {vehicleConflicts.length > 0 && (
                      <div
                        id="vehicle-conflict-alert"
                        className="p-2.5 rounded-lg bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs space-y-1"
                      >
                        <div className="font-bold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px] text-rose-600 dark:text-rose-400">
                            error
                          </span>
                          Vehicle Unavailable (Schedule Conflict)
                        </div>
                        <p>
                          Already assigned to{" "}
                          <span className="font-mono font-bold">
                            {vehicleConflicts[0].tripCode}
                          </span>{" "}
                          (
                          {vehicleConflicts[0].startDateTime
                            ?.replace("T", " ")
                            .slice(0, 16)}{" "}
                          →{" "}
                          {vehicleConflicts[0].endDateTime
                            ?.replace("T", " ")
                            .slice(0, 16)}
                          )
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Driver Assignment Column */}
              <div className="space-y-3">
                <label
                  htmlFor="driver-select-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1"
                >
                  Assign Driver <span className="text-rose-500">*</span>
                </label>
                <Select
                  id="driver-select-input"
                  placeholder="-- Select a Driver --"
                  value={formData.driverId}
                  onChange={(e) => handleChange("driverId", e.target.value)}
                  options={drivers
                    .filter(
                      (d) =>
                        (d.isActive !== false && isDriverEligible(d)) ||
                        d.id === formData.driverId,
                    )
                    .map((d) => ({
                      label: `${d.name} (${d.driverCode || "DRV"}) · ${d.mobile || ""}`,
                      value: d.id,
                    }))}
                  error={errors.driverId}
                />
                {errors.driverId && (
                  <p className="text-xs text-rose-500 mt-1">
                    {errors.driverId}
                  </p>
                )}

                {/* Driver Snapshot Card */}
                {selectedDriver && (
                  <div
                    id="driver-snapshot-card"
                    className="border border-slate-200 dark:border-[#262837] rounded-xl p-4 bg-slate-50/80 dark:bg-[#13151f] space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 font-bold text-sm flex items-center justify-center shrink-0 border border-violet-200 dark:border-violet-800/60">
                          {selectedDriver.name
                            ?.split(" ")
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase() || "DR"}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {selectedDriver.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            ID: {selectedDriver.driverCode || "—"} • Mobile:{" "}
                            {selectedDriver.mobile || "—"}
                          </p>
                        </div>
                      </div>

                      {driverConflicts.length > 0 || !driverEligibility ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                          {!driverEligibility ? "INELIGIBLE" : "UNAVAILABLE"}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/60">
                          AVAILABLE
                        </span>
                      )}
                    </div>

                    <div className="h-px bg-slate-200 dark:bg-[#262837] w-full" />

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-cyan-600 dark:text-cyan-400">
                          badge
                        </span>
                        License & Daily Rate
                      </span>
                      <div className="flex items-center gap-2">
                        {driverLicenseStatus && (
                          <span
                            className={`font-semibold px-2 py-0.5 rounded text-[11px] border ${
                              driverLicenseStatus.value === "expired"
                                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60"
                                : driverLicenseStatus.value === "expiring_soon"
                                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
                                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
                            }`}
                          >
                            License: {driverLicenseStatus.label}
                          </span>
                        )}
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                          ₹{selectedDriver.dailyRate || 0}/day
                        </span>
                      </div>
                    </div>

                    {/* Driver Ineligibility Warning */}
                    {!driverEligibility && (
                      <div
                        id="driver-ineligible-alert"
                        className="p-2.5 rounded-lg bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs"
                      >
                        ⚠ <strong>Driver Ineligible:</strong> License is expired
                        or missing. Cannot assign this driver.
                      </div>
                    )}

                    {/* Conflict Warning Box */}
                    {driverConflicts.length > 0 && (
                      <div
                        id="driver-conflict-alert"
                        className="p-2.5 rounded-lg bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs space-y-1"
                      >
                        <div className="font-bold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px] text-rose-600 dark:text-rose-400">
                            error
                          </span>
                          Driver Unavailable (Schedule Conflict)
                        </div>
                        <p>
                          Already assigned to{" "}
                          <span className="font-mono font-bold">
                            {driverConflicts[0].tripCode}
                          </span>{" "}
                          (
                          {driverConflicts[0].startDateTime
                            ?.replace("T", " ")
                            .slice(0, 16)}{" "}
                          →{" "}
                          {driverConflicts[0].endDateTime
                            ?.replace("T", " ")
                            .slice(0, 16)}
                          )
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 5. Pricing, Charges & Taxes */}
          <section
            id="section-pricing"
            className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-5 sm:p-6 shadow-xs hover:border-violet-300 dark:hover:border-violet-700/50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 flex items-center justify-center font-bold text-sm">
                5
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Pricing & Charges
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure tariffs, rate structures, additional allowances,
                  discounts, and GST.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Rate Type & Base Rate Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="rate-type-select"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1"
                  >
                    Rate Type <span className="text-rose-500">*</span>
                  </label>
                  <Select
                    id="rate-type-select"
                    value={formData.rateType}
                    onChange={(e) => handleChange("rateType", e.target.value)}
                    options={RATE_TYPES}
                    error={errors.rateType}
                  />
                  {errors.rateType && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.rateType}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="base-rate-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1"
                  >
                    Base Rate / Tariff (₹){" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    id="base-rate-input"
                    type="number"
                    placeholder="e.g. 5000"
                    value={formData.baseRate}
                    onChange={(e) => handleChange("baseRate", e.target.value)}
                    error={errors.baseRate}
                  />
                  {errors.baseRate && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.baseRate}
                    </p>
                  )}
                </div>

                {/* Contextual Rate Field based on Rate Type */}
                <div>
                  <label
                    htmlFor="contextual-rate-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1"
                  >
                    {formData.rateType === "per_km"
                      ? "Rate Per KM (₹)"
                      : formData.rateType === "per_hour"
                        ? "Rate Per Hour (₹)"
                        : "Rate Per Day (₹)"}
                  </label>
                  <Input
                    id="contextual-rate-input"
                    type="number"
                    placeholder="e.g. 20"
                    value={
                      formData.rateType === "per_km"
                        ? formData.ratePerKm
                        : formData.rateType === "per_hour"
                          ? formData.ratePerHour
                          : formData.ratePerDay
                    }
                    onChange={(e) => {
                      if (formData.rateType === "per_km")
                        handleChange("ratePerKm", e.target.value);
                      else if (formData.rateType === "per_hour")
                        handleChange("ratePerHour", e.target.value);
                      else handleChange("ratePerDay", e.target.value);
                    }}
                  />
                </div>
              </div>

              {/* Additional Charges Section (Expandable/Toggleable) */}
              <div className="pt-3 border-t border-slate-200 dark:border-[#262837]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Additional Charges & Allowances
                  </span>
                  <button
                    id="toggle-additional-charges-btn"
                    type="button"
                    onClick={() =>
                      setShowAdditionalCharges(!showAdditionalCharges)
                    }
                    className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    {showAdditionalCharges ? "Hide Details" : "Show All Fields"}
                    <span className="material-symbols-outlined text-[15px]">
                      {showAdditionalCharges ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                </div>

                <div
                  className={`grid grid-cols-2 sm:grid-cols-4 gap-3 ${showAdditionalCharges ? "block" : "hidden sm:grid"}`}
                >
                  <div>
                    <label
                      htmlFor="driver-charges-input"
                      className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"
                    >
                      Driver Allowance (₹)
                    </label>
                    <Input
                      id="driver-charges-input"
                      type="number"
                      placeholder="0"
                      value={formData.driverCharges}
                      onChange={(e) =>
                        handleChange("driverCharges", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="toll-charges-input"
                      className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"
                    >
                      Toll Charges (₹)
                    </label>
                    <Input
                      id="toll-charges-input"
                      type="number"
                      placeholder="0"
                      value={formData.tollCharges}
                      onChange={(e) =>
                        handleChange("tollCharges", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="parking-charges-input"
                      className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"
                    >
                      Parking Charges (₹)
                    </label>
                    <Input
                      id="parking-charges-input"
                      type="number"
                      placeholder="0"
                      value={formData.parkingCharges}
                      onChange={(e) =>
                        handleChange("parkingCharges", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="other-charges-input"
                      className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1"
                    >
                      Other Charges (₹)
                    </label>
                    <Input
                      id="other-charges-input"
                      type="number"
                      placeholder="0"
                      value={formData.otherCharges}
                      onChange={(e) =>
                        handleChange("otherCharges", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Discount & Tax Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-3 border-t border-slate-200 dark:border-[#262837]">
                {/* Discount */}
                <div className="space-y-2">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Discount
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      id="discount-type-select"
                      value={formData.discountType}
                      onChange={(e) =>
                        handleChange("discountType", e.target.value)
                      }
                      options={DISCOUNT_TYPES}
                    />
                    <Input
                      id="discount-value-input"
                      type="number"
                      placeholder={
                        formData.discountType === "percentage"
                          ? "% e.g. 10"
                          : "₹ Amount"
                      }
                      value={formData.discountValue}
                      onChange={(e) =>
                        handleChange("discountValue", e.target.value)
                      }
                      error={errors.discountValue}
                    />
                  </div>
                  {errors.discountValue && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.discountValue}
                    </p>
                  )}
                </div>

                {/* Tax / GST */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      GST / Tax Applicable
                    </span>
                    <Switch
                      id="tax-applicable-switch"
                      checked={formData.taxApplicable}
                      onChange={(checked) =>
                        handleChange("taxApplicable", checked)
                      }
                    />
                  </div>

                  {formData.taxApplicable && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Select
                        id="tax-type-select"
                        value={formData.taxType}
                        onChange={(e) =>
                          handleChange("taxType", e.target.value)
                        }
                        options={TAX_TYPES}
                      />
                      <Input
                        id="tax-rate-input"
                        type="number"
                        placeholder="Tax Rate %"
                        value={formData.taxRate}
                        onChange={(e) =>
                          handleChange("taxRate", e.target.value)
                        }
                        error={errors.taxRate}
                      />
                    </div>
                  )}
                  {errors.taxRate && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.taxRate}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 6. Advance Payment & General Notes */}
          <section
            id="section-advance-notes"
            className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-5 sm:p-6 shadow-xs hover:border-violet-300 dark:hover:border-violet-700/50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 flex items-center justify-center font-bold text-sm">
                6
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Advance Payment & Remarks
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Capture advance receipt, payment mode, reference ID, and
                  operational remarks.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label
                    htmlFor="advance-amount-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1"
                  >
                    Advance Amount (₹)
                  </label>
                  <Input
                    id="advance-amount-input"
                    type="number"
                    placeholder="0"
                    value={formData.advanceAmount}
                    onChange={(e) =>
                      handleChange("advanceAmount", e.target.value)
                    }
                    error={errors.advanceAmount}
                  />
                  {errors.advanceAmount && (
                    <p className="text-xs text-rose-500 mt-1">
                      {errors.advanceAmount}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="advance-mode-select"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1"
                  >
                    Payment Mode
                  </label>
                  <Select
                    id="advance-mode-select"
                    value={formData.advancePaymentMode}
                    onChange={(e) =>
                      handleChange("advancePaymentMode", e.target.value)
                    }
                    options={PAYMENT_MODES}
                  />
                </div>

                <div>
                  <label
                    htmlFor="advance-ref-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1"
                  >
                    Transaction / Ref No.
                  </label>
                  <Input
                    id="advance-ref-input"
                    placeholder="UPI / Cheque / UTR"
                    value={formData.advancePaymentReference}
                    onChange={(e) =>
                      handleChange("advancePaymentReference", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="advance-date-input"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1"
                  >
                    Payment Date
                  </label>
                  <DatePicker
                    id="advance-date-input"
                    value={formData.advancePaymentDate}
                    onChange={(e) =>
                      handleChange("advancePaymentDate", e.target.value)
                    }
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="notes-textarea"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1"
                >
                  General Operational Notes / Remarks
                </label>
                <Textarea
                  id="notes-textarea"
                  rows={2}
                  placeholder="e.g. VIP client, preferred AC temp, route restrictions, special requests..."
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Sticky Summary & Actions (Stitch Command Center) */}
        <div className="xl:col-span-4 space-y-6 xl:sticky xl:top-6">
          {/* Financial & Booking Summary Card */}
          <div
            id="trip-summary-card"
            className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-5 sm:p-6 shadow-sm space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#262837] pb-3">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Financial Summary
              </h2>
              <span
                id="summary-payment-status-badge"
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  financialCalculations.paymentStatus === "paid"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
                    : financialCalculations.paymentStatus === "partially_paid"
                      ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
                      : "bg-slate-100 dark:bg-[#1f2230] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#262837]"
                }`}
              >
                {PAYMENT_STATUS_LABELS[financialCalculations.paymentStatus] ||
                  financialCalculations.paymentStatus}
              </span>
            </div>

            {/* Live Pricing Breakdown */}
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between items-center">
                <span>Base Rate</span>
                <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                  ₹{Number(formData.baseRate || 0).toLocaleString("en-IN")}
                </span>
              </div>

              {financialCalculations.subtotal - Number(formData.baseRate || 0) >
                0 && (
                <div className="flex justify-between items-center">
                  <span>Additional Charges</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                    +₹
                    {(
                      financialCalculations.subtotal -
                      Number(formData.baseRate || 0)
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              {financialCalculations.discountAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Discount</span>
                  <span className="font-mono">
                    -₹
                    {financialCalculations.discountAmount.toLocaleString(
                      "en-IN",
                    )}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-1.5 border-t border-slate-200/80 dark:border-[#262837]">
                <span>Subtotal</span>
                <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                  ₹{financialCalculations.subtotal.toLocaleString("en-IN")}
                </span>
              </div>

              {formData.taxApplicable && (
                <div className="flex justify-between items-center">
                  <span>Tax ({formData.taxRate}%)</span>
                  <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                    +₹{financialCalculations.taxAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 dark:border-[#262837]">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Grand Total
                </span>
                <span
                  id="summary-grand-total"
                  className="font-mono text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100"
                >
                  ₹{financialCalculations.totalAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Advance & Balance Box */}
            <div className="p-3.5 bg-slate-50 dark:bg-[#13151f] rounded-xl border border-slate-200 dark:border-[#262837] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  Advance Received:
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  ₹{Number(formData.advanceAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/80 dark:border-[#262837]">
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  Balance Due:
                </span>
                <span
                  id="summary-balance-due"
                  className={`font-mono text-base font-bold ${
                    financialCalculations.balanceAmount > 0
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  ₹{financialCalculations.balanceAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Real Booking Readiness Checklist */}
            <div className="pt-2 border-t border-slate-200 dark:border-[#262837] space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Booking Readiness
                </h3>
                <span
                  id="readiness-overall-status"
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    readiness.isAllReady
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                      : "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {readiness.isAllReady ? "Ready to Confirm" : "Incomplete"}
                </span>
              </div>

              <ul className="space-y-1.5 text-xs">
                <li
                  id="readiness-item-customer"
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-300"
                >
                  <span
                    className={`material-symbols-outlined text-[17px] ${
                      readiness.isCustomerAssigned
                        ? "text-emerald-500"
                        : "text-slate-300 dark:text-slate-600"
                    }`}
                  >
                    {readiness.isCustomerAssigned
                      ? "check_circle"
                      : "radio_button_unchecked"}
                  </span>
                  <span>Customer Assigned</span>
                </li>

                <li
                  id="readiness-item-route"
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-300"
                >
                  <span
                    className={`material-symbols-outlined text-[17px] ${
                      readiness.isRouteDefined
                        ? "text-emerald-500"
                        : "text-slate-300 dark:text-slate-600"
                    }`}
                  >
                    {readiness.isRouteDefined
                      ? "check_circle"
                      : "radio_button_unchecked"}
                  </span>
                  <span>Route Defined</span>
                </li>

                <li
                  id="readiness-item-schedule"
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-300"
                >
                  <span
                    className={`material-symbols-outlined text-[17px] ${
                      readiness.isScheduleValid
                        ? "text-emerald-500"
                        : "text-slate-300 dark:text-slate-600"
                    }`}
                  >
                    {readiness.isScheduleValid
                      ? "check_circle"
                      : "radio_button_unchecked"}
                  </span>
                  <span>Schedule Valid</span>
                </li>

                <li
                  id="readiness-item-vehicle"
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-300"
                >
                  <span
                    className={`material-symbols-outlined text-[17px] ${
                      readiness.isVehicleAvailable
                        ? "text-emerald-500"
                        : vehicleConflicts.length > 0
                          ? "text-rose-500"
                          : "text-slate-300 dark:text-slate-600"
                    }`}
                  >
                    {readiness.isVehicleAvailable
                      ? "check_circle"
                      : vehicleConflicts.length > 0
                        ? "error"
                        : "radio_button_unchecked"}
                  </span>
                  <span>
                    Vehicle Allocated{" "}
                    {vehicleConflicts.length > 0 && "(Conflict)"}
                  </span>
                </li>

                <li
                  id="readiness-item-driver"
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-300"
                >
                  <span
                    className={`material-symbols-outlined text-[17px] ${
                      readiness.isDriverEligibleAndAvailable
                        ? "text-emerald-500"
                        : driverConflicts.length > 0 || !driverEligibility
                          ? "text-rose-500"
                          : "text-slate-300 dark:text-slate-600"
                    }`}
                  >
                    {readiness.isDriverEligibleAndAvailable
                      ? "check_circle"
                      : driverConflicts.length > 0 || !driverEligibility
                        ? "error"
                        : "radio_button_unchecked"}
                  </span>
                  <span>
                    Driver Assigned{" "}
                    {!driverEligibility
                      ? "(Ineligible)"
                      : driverConflicts.length > 0
                        ? "(Conflict)"
                        : ""}
                  </span>
                </li>

                <li
                  id="readiness-item-pricing"
                  className="flex items-center gap-2 text-slate-600 dark:text-slate-300"
                >
                  <span
                    className={`material-symbols-outlined text-[17px] ${
                      readiness.isPricingCompleted
                        ? "text-emerald-500"
                        : "text-slate-300 dark:text-slate-600"
                    }`}
                  >
                    {readiness.isPricingCompleted
                      ? "check_circle"
                      : "radio_button_unchecked"}
                  </span>
                  <span>Pricing Completed</span>
                </li>
              </ul>
            </div>

            {/* Bottom Actions inside Sidebar */}
            <div className="pt-3 border-t border-slate-200 dark:border-[#262837] space-y-2.5">
              <Button
                id="trip-save-confirm-btn-side"
                type="button"
                variant="primary"
                onClick={() =>
                  handleSubmit(
                    isEditMode && formData.status
                      ? formData.status
                      : "confirmed",
                  )
                }
                disabled={isSubmitting}
                className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] shadow-md hover:shadow-lg transition-all rounded-lg cursor-pointer"
              >
                {isEditMode ? "Save Changes" : "Save & Confirm"}
              </Button>

              <Button
                id="trip-save-draft-btn-side"
                type="button"
                variant="secondary"
                onClick={() => handleSubmit("draft")}
                disabled={isSubmitting}
                className="w-full py-2.5 text-sm font-semibold rounded-lg"
              >
                Save as Draft
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
