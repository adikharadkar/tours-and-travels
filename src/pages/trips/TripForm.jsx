import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../../components/ui/Button";
import Card, {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../components/ui/Card";
import FormField from "../../components/ui/FormField";
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
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isEditMode
              ? `Edit Trip: ${formData.tripCode}`
              : "Create New Trip / Booking"}
          </h1>
          <p className="text-xs text-muted">
            Configure customer journey, vehicle & driver allocation, schedule,
            and pricing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/trips")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSubmit("draft")}
            disabled={isSubmitting}
          >
            Save Draft
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => handleSubmit("confirmed")}
            disabled={isSubmitting}
          >
            Save & Confirm
          </Button>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(
            isEditMode && formData.status ? formData.status : "confirmed",
          );
        }}
        className="space-y-6"
      >
        {/* 1. Booking Information */}
        <Card>
          <CardHeader>
            <CardTitle>1. Booking Information</CardTitle>
            <CardDescription>
              Basic booking reference and general trip categorization.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Trip Code">
              {({ id }) => (
                <Input
                  id={id}
                  value={formData.tripCode}
                  disabled
                  className="bg-background font-mono text-foreground font-semibold"
                />
              )}
            </FormField>

            <FormField label="Booking Date" required error={errors.bookingDate}>
              {({ id }) => (
                <DatePicker
                  id={id}
                  value={formData.bookingDate}
                  onChange={(e) => handleChange("bookingDate", e.target.value)}
                />
              )}
            </FormField>

            <FormField label="Trip Type" required error={errors.tripType}>
              {({ id }) => (
                <Select
                  id={id}
                  value={formData.tripType}
                  onChange={(e) => handleChange("tripType", e.target.value)}
                  options={TRIP_TYPES}
                />
              )}
            </FormField>

            <div className="md:col-span-3">
              <FormField
                label="Customer Reference / Booking ID (Optional)"
                description="Client-provided PO, tour booking code, or internal reference"
              >
                {({ id }) => (
                  <Input
                    id={id}
                    placeholder="e.g. PO-88492 or TOUR-2026-AUG"
                    value={formData.referenceNumber}
                    onChange={(e) =>
                      handleChange("referenceNumber", e.target.value)
                    }
                  />
                )}
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* 2. Customer Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>2. Customer</CardTitle>
            <CardDescription>
              Select an active customer from the Customer Master.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              label="Select Customer"
              required
              error={errors.customerId}
            >
              {({ id }) => (
                <Select
                  id={id}
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
                />
              )}
            </FormField>

            {/* Customer Snapshot Information Block */}
            {selectedCustomer && (
              <div className="rounded-lg border border-border bg-background/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
                    Customer Snapshot
                  </h4>
                  {customerAccountStatus && (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        customerAccountStatus.value === "due"
                          ? "bg-warning/10 text-warning border-warning/20"
                          : "bg-success/10 text-success border-success/20"
                      }`}
                    >
                      Account: {customerAccountStatus.label}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-muted block">Customer Name</span>
                    <span className="font-semibold text-foreground">
                      {selectedCustomer.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block">Customer Code</span>
                    <span className="font-mono font-medium text-foreground">
                      {selectedCustomer.customerCode || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block">Primary Mobile</span>
                    <span className="font-mono font-medium text-foreground">
                      {selectedCustomer.mobile1 || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block">Payment Terms</span>
                    <span className="font-medium text-foreground">
                      {selectedCustomer.creditDays !== undefined
                        ? `${selectedCustomer.creditDays} Days`
                        : "Immediate"}
                    </span>
                  </div>
                </div>

                {customerAccountStatus?.value === "due" && (
                  <p className="text-xs text-warning bg-warning/10 p-2 rounded border border-warning/20">
                    ⚠ Note: Customer currently has pending dues/balance. Proceed
                    with booking as scheduled.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 3. Vehicle & Driver Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>3. Vehicle & Driver Assignment</CardTitle>
            <CardDescription>
              Assign available and eligible fleet assets to this journey.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vehicle Selection */}
            <div className="space-y-3">
              <FormField
                label="Assign Vehicle"
                required
                error={errors.vehicleId}
              >
                {({ id }) => (
                  <Select
                    id={id}
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
                  />
                )}
              </FormField>

              {/* Vehicle Snapshot & Availability alert */}
              {selectedVehicle && (
                <div className="rounded-lg border border-border bg-background/50 p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">
                      {selectedVehicle.vehicleNumber} ({selectedVehicle.make}{" "}
                      {selectedVehicle.model})
                    </span>
                    {vehicleDocumentStatus && (
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                          vehicleDocumentStatus.value === "expired"
                            ? "bg-error/10 text-error border-error/20"
                            : "bg-success/10 text-success border-success/20"
                        }`}
                      >
                        Docs: {vehicleDocumentStatus.label}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-muted">
                    <span>
                      Capacity: {selectedVehicle.seatingCapacity} Seats
                    </span>
                    <span className="capitalize">
                      Type: {selectedVehicle.vehicleType}
                    </span>
                  </div>

                  {/* Availability badge/conflict warning */}
                  {vehicleConflicts.length > 0 ? (
                    <div className="p-2 rounded bg-error/10 border border-error/20 text-error font-medium">
                      ⚠ Vehicle Unavailable: Already assigned to{" "}
                      <span className="font-mono font-bold">
                        {vehicleConflicts[0].tripCode}
                      </span>{" "}
                      ({vehicleConflicts[0].startDateTime.replace("T", " ")} -{" "}
                      {vehicleConflicts[0].endDateTime.replace("T", " ")})
                    </div>
                  ) : (
                    <div className="p-1.5 rounded bg-success/10 border border-success/20 text-success text-[11px]">
                      ● Vehicle is available for selected schedule
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Driver Selection */}
            <div className="space-y-3">
              <FormField label="Assign Driver" required error={errors.driverId}>
                {({ id }) => (
                  <Select
                    id={id}
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
                        label: `${d.name} (${d.driverCode}) · ${d.mobile || ""}`,
                        value: d.id,
                      }))}
                  />
                )}
              </FormField>

              {/* Driver Snapshot & Availability alert */}
              {selectedDriver && (
                <div className="rounded-lg border border-border bg-background/50 p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">
                      {selectedDriver.name} ({selectedDriver.driverCode})
                    </span>
                    {driverLicenseStatus && (
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                          driverLicenseStatus.value === "expired"
                            ? "bg-error/10 text-error border-error/20"
                            : "bg-success/10 text-success border-success/20"
                        }`}
                      >
                        License: {driverLicenseStatus.label}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-muted">
                    <span>Mobile: {selectedDriver.mobile || "—"}</span>
                    <span>Daily Rate: ₹{selectedDriver.dailyRate || 0}</span>
                  </div>

                  {/* Availability / Conflict warning */}
                  {driverConflicts.length > 0 ? (
                    <div className="p-2 rounded bg-error/10 border border-error/20 text-error font-medium">
                      ⚠ Driver Unavailable: Already assigned to{" "}
                      <span className="font-mono font-bold">
                        {driverConflicts[0].tripCode}
                      </span>{" "}
                      ({driverConflicts[0].startDateTime.replace("T", " ")} -{" "}
                      {driverConflicts[0].endDateTime.replace("T", " ")})
                    </div>
                  ) : (
                    <div className="p-1.5 rounded bg-success/10 border border-success/20 text-success text-[11px]">
                      ● Driver is available for selected schedule
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 4. Journey Details */}
        <Card>
          <CardHeader>
            <CardTitle>4. Journey Information</CardTitle>
            <CardDescription>
              Pickup point, destination, stops, and driver instructions.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Pickup Location"
              required
              error={errors.pickupLocation}
            >
              {({ id }) => (
                <Input
                  id={id}
                  placeholder="e.g. Chhatrapati Sambhajinagar"
                  value={formData.pickupLocation}
                  onChange={(e) =>
                    handleChange("pickupLocation", e.target.value)
                  }
                />
              )}
            </FormField>

            <FormField
              label="Drop Location"
              required
              error={errors.dropLocation}
            >
              {({ id }) => (
                <Input
                  id={id}
                  placeholder="e.g. Pune / Mumbai Airport"
                  value={formData.dropLocation}
                  onChange={(e) => handleChange("dropLocation", e.target.value)}
                />
              )}
            </FormField>

            <div className="md:col-span-2">
              <FormField
                label="Via / Intermediate Stops (Optional)"
                description="Comma-separated landmarks or stopping points along the journey"
              >
                {({ id }) => (
                  <Input
                    id={id}
                    placeholder="e.g. MIDC Waluj, Ahmednagar Highway Bypass"
                    value={formData.stops}
                    onChange={(e) => handleChange("stops", e.target.value)}
                  />
                )}
              </FormField>
            </div>

            <div className="md:col-span-2">
              <FormField
                label="Pickup Instructions / Notes"
                description="Reporting gates, contact numbers, flight details, name board text"
              >
                {({ id }) => (
                  <Textarea
                    id={id}
                    rows={2}
                    placeholder="e.g. Arrive 15 minutes before departure. Name board: 'Dr. Sethi - Tours'."
                    value={formData.pickupInstructions}
                    onChange={(e) =>
                      handleChange("pickupInstructions", e.target.value)
                    }
                  />
                )}
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* 5. Schedule & Kilometers */}
        <Card>
          <CardHeader>
            <CardTitle>5. Schedule & Kilometers</CardTitle>
            <CardDescription>
              Trip timings, automatic duration calculation, and odometer
              tracking.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Trip Start Date & Time"
                required
                error={errors.startDateTime}
              >
                {({ id }) => (
                  <Input
                    id={id}
                    type="datetime-local"
                    value={formData.startDateTime}
                    onChange={(e) =>
                      handleChange("startDateTime", e.target.value)
                    }
                  />
                )}
              </FormField>

              <FormField
                label="Trip End Date & Time"
                required
                error={errors.endDateTime}
              >
                {({ id }) => (
                  <Input
                    id={id}
                    type="datetime-local"
                    value={formData.endDateTime}
                    onChange={(e) =>
                      handleChange("endDateTime", e.target.value)
                    }
                  />
                )}
              </FormField>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Calculated Duration
                </label>
                <div className="h-10 px-3 rounded-md border border-border bg-background flex items-center font-semibold text-primary text-sm">
                  {durationCalculation.text}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-border">
              <FormField
                label="Opening KM"
                description="Odometer at start"
                error={errors.openingKm}
              >
                {({ id }) => (
                  <Input
                    id={id}
                    type="number"
                    placeholder="e.g. 45200"
                    value={formData.openingKm}
                    onChange={(e) => handleChange("openingKm", e.target.value)}
                  />
                )}
              </FormField>

              <FormField
                label="Closing KM"
                description="Odometer at trip finish"
                error={errors.closingKm}
              >
                {({ id }) => (
                  <Input
                    id={id}
                    type="number"
                    placeholder="e.g. 45680"
                    value={formData.closingKm}
                    onChange={(e) => handleChange("closingKm", e.target.value)}
                  />
                )}
              </FormField>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Total Distance
                </label>
                <div className="h-10 px-3 rounded-md border border-border bg-background flex items-center font-mono font-bold text-foreground text-sm">
                  {totalKmCalculation !== null
                    ? `${totalKmCalculation} KM`
                    : "—"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 6. Pricing & Charges */}
        <Card>
          <CardHeader>
            <CardTitle>6. Pricing & Billing Breakdown</CardTitle>
            <CardDescription>
              Define base tariffs, allowances, taxes, and automatic totals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Rate Type" required error={errors.rateType}>
                {({ id }) => (
                  <Select
                    id={id}
                    value={formData.rateType}
                    onChange={(e) => handleChange("rateType", e.target.value)}
                    options={RATE_TYPES}
                  />
                )}
              </FormField>

              <FormField
                label="Base Rate / Tariff (₹)"
                required
                error={errors.baseRate}
              >
                {({ id }) => (
                  <Input
                    id={id}
                    type="number"
                    placeholder="e.g. 18000"
                    value={formData.baseRate}
                    onChange={(e) => handleChange("baseRate", e.target.value)}
                  />
                )}
              </FormField>

              <FormField
                label={
                  formData.rateType === "per_km"
                    ? "Rate Per KM (₹)"
                    : formData.rateType === "per_hour"
                      ? "Rate Per Hour (₹)"
                      : "Rate Per Day (₹)"
                }
                error={
                  errors.ratePerKm || errors.ratePerHour || errors.ratePerDay
                }
              >
                {({ id }) => (
                  <Input
                    id={id}
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
                )}
              </FormField>
            </div>

            {/* Additional Charges Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-border">
              <FormField
                label="Driver Charges (₹)"
                error={errors.driverCharges}
              >
                {({ id }) => (
                  <Input
                    id={id}
                    type="number"
                    placeholder="0"
                    value={formData.driverCharges}
                    onChange={(e) =>
                      handleChange("driverCharges", e.target.value)
                    }
                  />
                )}
              </FormField>

              <FormField label="Toll Charges (₹)" error={errors.tollCharges}>
                {({ id }) => (
                  <Input
                    id={id}
                    type="number"
                    placeholder="0"
                    value={formData.tollCharges}
                    onChange={(e) =>
                      handleChange("tollCharges", e.target.value)
                    }
                  />
                )}
              </FormField>

              <FormField
                label="Parking Charges (₹)"
                error={errors.parkingCharges}
              >
                {({ id }) => (
                  <Input
                    id={id}
                    type="number"
                    placeholder="0"
                    value={formData.parkingCharges}
                    onChange={(e) =>
                      handleChange("parkingCharges", e.target.value)
                    }
                  />
                )}
              </FormField>

              <FormField label="Other Charges (₹)" error={errors.otherCharges}>
                {({ id }) => (
                  <Input
                    id={id}
                    type="number"
                    placeholder="0"
                    value={formData.otherCharges}
                    onChange={(e) =>
                      handleChange("otherCharges", e.target.value)
                    }
                  />
                )}
              </FormField>
            </div>

            {/* Discounts & Taxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-border">
              {/* Discount Group */}
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Discount
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={formData.discountType}
                    onChange={(e) =>
                      handleChange("discountType", e.target.value)
                    }
                    options={DISCOUNT_TYPES}
                  />
                  <Input
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
                  />
                </div>
              </div>

              {/* Tax Group */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                    GST / Tax Applicable
                  </span>
                  <Switch
                    checked={formData.taxApplicable}
                    onChange={(checked) =>
                      handleChange("taxApplicable", checked)
                    }
                  />
                </div>

                {formData.taxApplicable && (
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={formData.taxType}
                      onChange={(e) => handleChange("taxType", e.target.value)}
                      options={TAX_TYPES}
                    />
                    <Input
                      type="number"
                      placeholder="Tax Rate %"
                      value={formData.taxRate}
                      onChange={(e) => handleChange("taxRate", e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Calculated Subtotal & Grand Total Display */}
            <div className="rounded-lg bg-surface border border-border p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-0.5 text-xs text-muted">
                <div>
                  Subtotal:{" "}
                  <span className="font-mono font-medium text-foreground">
                    ₹{financialCalculations.subtotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  Discount:{" "}
                  <span className="font-mono font-medium text-success">
                    -₹
                    {financialCalculations.discountAmount.toLocaleString(
                      "en-IN",
                    )}
                  </span>
                </div>
                {formData.taxApplicable && (
                  <div>
                    Tax ({formData.taxRate}%):{" "}
                    <span className="font-mono font-medium text-foreground">
                      +₹
                      {financialCalculations.taxAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-right">
                <span className="text-xs text-muted block">
                  Calculated Grand Total
                </span>
                <span className="font-mono text-2xl font-extrabold text-foreground">
                  ₹{financialCalculations.totalAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 7. Advance Payment & Balance */}
        <Card>
          <CardHeader>
            <CardTitle>7. Advance Payment</CardTitle>
            <CardDescription>
              Record initial payment receipt and track remaining balance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField
                label="Advance Amount (₹)"
                error={errors.advanceAmount}
              >
                {({ id }) => (
                  <Input
                    id={id}
                    type="number"
                    placeholder="0"
                    value={formData.advanceAmount}
                    onChange={(e) =>
                      handleChange("advanceAmount", e.target.value)
                    }
                  />
                )}
              </FormField>

              <FormField label="Payment Mode">
                {({ id }) => (
                  <Select
                    id={id}
                    value={formData.advancePaymentMode}
                    onChange={(e) =>
                      handleChange("advancePaymentMode", e.target.value)
                    }
                    options={PAYMENT_MODES}
                  />
                )}
              </FormField>

              <FormField label="Reference / Transaction No.">
                {({ id }) => (
                  <Input
                    id={id}
                    placeholder="UPI / Cheque / Ref ID"
                    value={formData.advancePaymentReference}
                    onChange={(e) =>
                      handleChange("advancePaymentReference", e.target.value)
                    }
                  />
                )}
              </FormField>

              <FormField label="Payment Date">
                {({ id }) => (
                  <DatePicker
                    id={id}
                    value={formData.advancePaymentDate}
                    onChange={(e) =>
                      handleChange("advancePaymentDate", e.target.value)
                    }
                  />
                )}
              </FormField>
            </div>

            {/* Calculated Balance & Payment Status Banner */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-border">
              <div className="p-3 rounded-md bg-background/50 border border-border flex items-center justify-between">
                <span className="text-xs text-muted">Remaining Balance:</span>
                <span className="font-mono text-lg font-bold text-foreground">
                  ₹{financialCalculations.balanceAmount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="p-3 rounded-md bg-background/50 border border-border flex items-center justify-between">
                <span className="text-xs text-muted">Calculated Status:</span>
                <span className="text-xs font-bold uppercase tracking-wider capitalize">
                  {financialCalculations.paymentStatus.replace("_", " ")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 8. Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>8. General Notes</CardTitle>
            <CardDescription>
              Special requests, itinerary remarks, or customer communication
              logs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={3}
              placeholder="e.g. VIP client, preferred AC temperature 22°C, toll receipts required for reimbursement..."
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
            />
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-end gap-2 border-t border-border p-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/trips")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleSubmit("draft")}
              disabled={isSubmitting}
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => handleSubmit("confirmed")}
              disabled={isSubmitting}
            >
              {isEditMode ? "Save Changes" : "Confirm Booking"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
