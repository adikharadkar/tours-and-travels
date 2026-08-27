import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import Toast from "../../components/ui/Toast";

import {
  VEHICLE_TYPES,
  FUEL_TYPES,
  OWNERSHIP_TYPES,
  VEHICLE_TYPE_LABELS,
  FUEL_TYPE_LABELS,
  OWNERSHIP_TYPE_LABELS,
} from "../../constants/vehicles";
import {
  validateVehicle,
  normalizeVehicleNumber,
} from "../../utils/validation/vehicleValidation";
import {
  saveVehicle,
  updateVehicle,
  getVehicleById,
} from "../../services/vehicleService";
import { getTrips } from "../../services/tripService";
import { checkSingleDocumentStatus } from "../../utils/vehicleDocumentStatus";
import { getVehicleOperationalState } from "../../utils/vehicleOperationalStatus";

const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const initialFormData = {
  vehicleCode: "Will be generated automatically",
  vehicleNumber: "",
  vehicleType: "bus",
  registrationDate: getToday(),
  make: "",
  model: "",
  manufacturingYear: String(new Date().getFullYear()),
  seatingCapacity: "",
  fuelType: "diesel",

  ownershipType: "own",
  ownerName: "",
  ownerContact: "",

  insuranceNumber: "",
  insuranceExpiry: "",
  fitnessCertificateNumber: "",
  fitnessExpiry: "",
  permitNumber: "",
  permitExpiry: "",
  pucNumber: "",
  pucExpiry: "",

  notes: "",
  isActive: true,
};

function DocumentStatusPill({ dateString, docName, isOptional = false }) {
  if (!dateString) {
    if (isOptional) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          Optional
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        Not Set
      </span>
    );
  }

  const check = checkSingleDocumentStatus(dateString, docName);

  if (check.status === "expired") {
    const daysAgo = Math.abs(check.daysLeft || 0);
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        Expired {daysAgo > 0 ? `(${daysAgo}d ago)` : ""}
      </span>
    );
  }

  if (check.status === "expiring_soon") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
        Expiring Soon ({check.daysLeft}d)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Valid
    </span>
  );
}

export default function VehicleForm() {
  const navigate = useNavigate();
  const { vehicleId } = useParams();
  const isEditMode = Boolean(vehicleId);

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);

  // Load Trips to power real operational snapshot in edit mode
  const [allTrips, setAllTrips] = useState([]);

  useEffect(() => {
    try {
      const trips = getTrips();
      setAllTrips(trips || []);
    } catch (err) {
      console.warn("Could not load trips for snapshot:", err);
    }
  }, []);

  useEffect(() => {
    if (!isEditMode) {
      setFormData(initialFormData);
      setIsLoading(false);
      return;
    }

    try {
      const existingVehicle = getVehicleById(vehicleId);

      if (!existingVehicle) {
        setToast({
          id: Date.now(),
          variant: "error",
          title: "Vehicle Not Found",
          message: "The requested vehicle record could not be found.",
        });
        setTimeout(() => navigate("/vehicles"), 1500);
        return;
      }

      const loaded = {
        vehicleCode: existingVehicle.vehicleCode || "",
        vehicleNumber: existingVehicle.vehicleNumber || "",
        vehicleType: existingVehicle.vehicleType || "bus",
        registrationDate: existingVehicle.registrationDate || getToday(),
        make: existingVehicle.make || "",
        model: existingVehicle.model || "",
        manufacturingYear: String(existingVehicle.manufacturingYear || ""),
        seatingCapacity: String(existingVehicle.seatingCapacity || ""),
        fuelType: existingVehicle.fuelType || "diesel",

        ownershipType: existingVehicle.ownershipType || "own",
        ownerName: existingVehicle.ownerName || "",
        ownerContact: existingVehicle.ownerContact || "",

        insuranceNumber: existingVehicle.insuranceNumber || "",
        insuranceExpiry: existingVehicle.insuranceExpiry || "",
        fitnessCertificateNumber:
          existingVehicle.fitnessCertificateNumber || "",
        fitnessExpiry: existingVehicle.fitnessExpiry || "",
        permitNumber: existingVehicle.permitNumber || "",
        permitExpiry: existingVehicle.permitExpiry || "",
        pucNumber: existingVehicle.pucNumber || "",
        pucExpiry: existingVehicle.pucExpiry || "",

        notes: existingVehicle.notes || "",
        isActive: existingVehicle.isActive !== false,
      };

      setFormData(loaded);
    } catch (err) {
      console.error("Error loading vehicle:", err);
      setToast({
        id: Date.now(),
        variant: "error",
        title: "Error",
        message: "Failed to load vehicle data.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId, isEditMode, navigate]);

  // Derived real operational statistics for this vehicle from trips
  const operationalStats = useMemo(() => {
    if (!isEditMode || !vehicleId) return null;

    const normalizedVehicleNumber = (formData.vehicleNumber || "")
      .replace(/\s+/g, "")
      .toUpperCase();

    const vehicleTrips = allTrips.filter(
      (t) =>
        t.vehicleId === vehicleId ||
        (t.vehicleNumber &&
          t.vehicleNumber.replace(/\s+/g, "").toUpperCase() ===
            normalizedVehicleNumber),
    );

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const tripsThisMonth = vehicleTrips.filter((t) => {
      const tripDate = t.bookingDate ? new Date(t.bookingDate) : null;
      return (
        tripDate &&
        tripDate.getMonth() === currentMonth &&
        tripDate.getFullYear() === currentYear
      );
    }).length;

    const completedTrips = vehicleTrips.filter((t) => t.status === "completed");
    const totalKm = completedTrips.reduce(
      (acc, t) => acc + (Number(t.totalKm) || 0),
      0,
    );

    const sortedByDate = [...completedTrips].sort(
      (a, b) =>
        new Date(b.endDateTime || b.bookingDate || 0) -
        new Date(a.endDateTime || a.bookingDate || 0),
    );
    const lastTrip = sortedByDate[0] || null;

    const activeTrip = vehicleTrips.find(
      (t) => t.status === "in_progress" || t.status === "confirmed",
    );

    const operationalState = getVehicleOperationalState(
      {
        id: vehicleId,
        vehicleNumber: formData.vehicleNumber,
        isActive: formData.isActive,
      },
      allTrips,
    );

    return {
      totalTrips: vehicleTrips.length,
      tripsThisMonth,
      totalKm,
      lastTrip,
      activeTrip,
      operationalState,
    };
  }, [
    isEditMode,
    vehicleId,
    formData.vehicleNumber,
    formData.isActive,
    allTrips,
  ]);

  // Overall compliance evaluation for summary badge
  const complianceOverview = useMemo(() => {
    const docs = [
      { name: "Insurance", date: formData.insuranceExpiry, required: true },
      { name: "Fitness", date: formData.fitnessExpiry, required: true },
      { name: "PUC", date: formData.pucExpiry, required: true },
    ];

    if (formData.permitNumber || formData.permitExpiry) {
      docs.push({
        name: "Permit",
        date: formData.permitExpiry,
        required: Boolean(formData.permitNumber),
      });
    }

    let expiredCount = 0;
    let expiringSoonCount = 0;
    let validCount = 0;

    docs.forEach((doc) => {
      if (!doc.date) return;
      const st = checkSingleDocumentStatus(doc.date, doc.name);
      if (st.status === "expired") expiredCount++;
      else if (st.status === "expiring_soon") expiringSoonCount++;
      else if (st.status === "valid") validCount++;
    });

    if (expiredCount > 0) {
      return {
        status: "expired",
        label: `${expiredCount} Expired`,
        className:
          "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      };
    }
    if (expiringSoonCount > 0) {
      return {
        status: "expiring_soon",
        label: `${expiringSoonCount} Expiring Soon`,
        className:
          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      };
    }
    if (validCount > 0) {
      return {
        status: "valid",
        label: "All Documents Healthy",
        className:
          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      };
    }
    return {
      status: "pending",
      label: "Pending Expiry Dates",
      className:
        "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    };
  }, [
    formData.insuranceExpiry,
    formData.fitnessExpiry,
    formData.pucExpiry,
    formData.permitExpiry,
    formData.permitNumber,
  ]);

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      // Reset owner details if switched to 'own'
      if (field === "ownershipType" && value === "own") {
        next.ownerName = "";
        next.ownerContact = "";
      }

      // Auto-uppercase vehicle registration number
      if (field === "vehicleNumber") {
        next.vehicleNumber = String(value).toUpperCase();
      }

      return next;
    });

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleBlur = (field) => {
    const result = validateVehicle(formData);
    if (result.errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: result.errors[field] }));
    }
  };

  const handleDiscard = () => {
    navigate("/vehicles");
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    setIsSubmitting(true);

    const validation = validateVehicle(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      setToast({
        id: Date.now(),
        variant: "warning",
        title: "Validation Error",
        message: "Please correct the highlighted fields before saving.",
      });
      setIsSubmitting(false);

      // Scroll to the first error
      const firstErrorField = Object.keys(validation.errors)[0];
      const el = document.getElementById(firstErrorField);
      if (el) {
        if (typeof el.scrollIntoView === "function") {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        el.focus?.();
      }
      return;
    }

    try {
      const payload = {
        ...formData,
        vehicleNumber: normalizeVehicleNumber(formData.vehicleNumber),
        manufacturingYear: Number(formData.manufacturingYear),
        seatingCapacity: Number(formData.seatingCapacity),
      };

      if (isEditMode) {
        const updated = updateVehicle(vehicleId, payload);
        navigate("/vehicles", {
          state: {
            toast: {
              variant: "success",
              title: "Vehicle Updated",
              message: `Vehicle ${updated.vehicleNumber} (${updated.vehicleCode}) was updated successfully.`,
            },
            highlightedVehicleId: updated.id,
          },
        });
      } else {
        const saved = saveVehicle(payload);
        navigate("/vehicles", {
          state: {
            toast: {
              variant: "success",
              title: "Vehicle Added",
              message: `Vehicle ${saved.vehicleNumber} (${saved.vehicleCode}) was created successfully.`,
            },
            highlightedVehicleId: saved.id,
          },
        });
      }
    } catch (err) {
      console.error("Save error:", err);
      setToast({
        id: Date.now(),
        variant: "error",
        title: "Save Failed",
        message:
          err.message ||
          "An unexpected error occurred while saving the vehicle.",
      });
      setIsSubmitting(false);
    }
  };

  const isAttachedOrLeased =
    formData.ownershipType === "attached" ||
    formData.ownershipType === "leased";

  if (isLoading) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#8b5cf6] border-t-transparent" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Loading vehicle profile...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {toast && (
        <div className="fixed right-6 top-6 z-50">
          <Toast
            id={toast.id}
            variant={toast.variant}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Breadcrumb path for enterprise context */}
      <div className="mb-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Link
          to="/vehicles"
          className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          Vehicles
        </Link>
        <span className="material-symbols-outlined text-[14px]">
          chevron_right
        </span>
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {isEditMode ? "Edit Vehicle" : "Add Vehicle"}
        </span>
      </div>

      {/* Sticky Header with Actions */}
      <div className="sticky top-0 z-30 -mx-4 -mt-2 mb-6 px-4 py-3 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 bg-[#f8fafc]/95 dark:bg-[#0f1117]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {isEditMode ? "Edit Vehicle Profile" : "Add Vehicle"}
              </h1>

              {isEditMode && formData.vehicleCode && (
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-[#191b22] px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {formData.vehicleCode}
                  </span>
                  {formData.vehicleNumber && (
                    <span className="rounded-md border border-[#8b5cf6]/20 bg-[#8b5cf6]/10 px-2.5 py-0.5 font-mono text-xs font-bold uppercase tracking-wider text-[#6b38d4] dark:text-[#d0bcff]">
                      {formData.vehicleNumber}
                    </span>
                  )}
                </div>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isEditMode
                ? "Update vehicle identity, technical specifications, ownership, and compliance documents."
                : "Register a new fleet asset into the operational master database."}
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#191b22] border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400/20 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              Discard Changes
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] active:opacity-90 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditMode ? "Save Changes" : "Save Vehicle"}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Form Body - 12-Column Responsive Layout */}
      <div className="max-w-7xl mx-auto w-full pb-20">
        <form
          id="vehicle-form"
          onSubmit={handleSubmit}
          noValidate
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* Left / Main Column (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* SECTION 1: Vehicle Identity */}
            <section className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-5 sm:p-6 shadow-xs">
              <div className="pb-4 mb-5 border-b border-slate-200 dark:border-[#262837]">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8b5cf6] dark:text-[#a078ff] text-[20px]">
                    directions_bus
                  </span>
                  Vehicle Identity
                </h2>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Primary registration number and internal fleet identifier
                </p>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="vehicleNumber"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Vehicle Registration Number{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="vehicleNumber"
                      name="vehicleNumber"
                      type="text"
                      placeholder="MH20AB1234"
                      value={formData.vehicleNumber}
                      onChange={(e) =>
                        handleChange("vehicleNumber", e.target.value)
                      }
                      onBlur={() => handleBlur("vehicleNumber")}
                      className={`w-full h-11 px-3 py-2 font-mono font-bold uppercase text-base tracking-wider bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                        errors.vehicleNumber
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    />
                    {errors.vehicleNumber ? (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.vehicleNumber}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        e.g. MH20AB1234 or DL01XY9988
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="vehicleCode"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Internal Fleet ID (Code)
                    </label>
                    <div className="relative">
                      <input
                        id="vehicleCode"
                        name="vehicleCode"
                        type="text"
                        value={formData.vehicleCode}
                        readOnly
                        disabled
                        className="w-full h-11 px-3 py-2 text-sm bg-slate-100 dark:bg-[#0f1117]/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-mono cursor-not-allowed pr-9"
                      />
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[18px] pointer-events-none">
                        lock
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      System-assigned unique fleet code
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="registrationDate"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Registration Date <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[20px] pointer-events-none">
                        calendar_month
                      </span>
                      <input
                        id="registrationDate"
                        name="registrationDate"
                        type="date"
                        aria-label="Registration Date"
                        value={formData.registrationDate}
                        onChange={(e) =>
                          handleChange("registrationDate", e.target.value)
                        }
                        onBlur={() => handleBlur("registrationDate")}
                        className={`w-full h-10 pl-10 pr-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                          errors.registrationDate
                            ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                            : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                        }`}
                      />
                    </div>
                    {errors.registrationDate && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.registrationDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="vehicleType"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Vehicle Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="vehicleType"
                      name="vehicleType"
                      aria-label="Vehicle Type"
                      value={formData.vehicleType}
                      onChange={(e) =>
                        handleChange("vehicleType", e.target.value)
                      }
                      onBlur={() => handleBlur("vehicleType")}
                      className={`w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                        errors.vehicleType
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    >
                      {VEHICLE_TYPES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    {errors.vehicleType && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.vehicleType}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: Technical Specifications */}
            <section className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-5 sm:p-6 shadow-xs">
              <div className="pb-4 mb-5 border-b border-slate-200 dark:border-[#262837]">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#06b6d4] dark:text-[#4cd7f6] text-[20px]">
                    tune
                  </span>
                  Technical Specifications
                </h2>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Manufacturer, model, seating capacity, and powertrain type
                </p>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="make"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Make / Manufacturer{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="make"
                      name="make"
                      type="text"
                      placeholder="e.g. Tata, BharatBenz, Ashok Leyland"
                      value={formData.make}
                      onChange={(e) => handleChange("make", e.target.value)}
                      onBlur={() => handleBlur("make")}
                      className={`w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                        errors.make
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    />
                    {errors.make && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.make}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="model"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Model <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="model"
                      name="model"
                      type="text"
                      placeholder="e.g. Starbus Ultra, Urbania 17S"
                      value={formData.model}
                      onChange={(e) => handleChange("model", e.target.value)}
                      onBlur={() => handleBlur("model")}
                      className={`w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                        errors.model
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    />
                    {errors.model && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.model}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="manufacturingYear"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Year of Manufacture{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="manufacturingYear"
                      name="manufacturingYear"
                      type="number"
                      placeholder="YYYY"
                      min="1970"
                      max={new Date().getFullYear() + 1}
                      value={formData.manufacturingYear}
                      onChange={(e) =>
                        handleChange("manufacturingYear", e.target.value)
                      }
                      onBlur={() => handleBlur("manufacturingYear")}
                      className={`w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                        errors.manufacturingYear
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    />
                    {errors.manufacturingYear && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.manufacturingYear}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="seatingCapacity"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Seating Capacity <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="seatingCapacity"
                      name="seatingCapacity"
                      type="number"
                      placeholder="e.g. 45"
                      min="1"
                      max="150"
                      value={formData.seatingCapacity}
                      onChange={(e) =>
                        handleChange("seatingCapacity", e.target.value)
                      }
                      onBlur={() => handleBlur("seatingCapacity")}
                      className={`w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                        errors.seatingCapacity
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    />
                    {errors.seatingCapacity && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.seatingCapacity}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="fuelType"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Fuel Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="fuelType"
                      name="fuelType"
                      aria-label="Fuel Type"
                      value={formData.fuelType}
                      onChange={(e) => handleChange("fuelType", e.target.value)}
                      onBlur={() => handleBlur("fuelType")}
                      className={`w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                        errors.fuelType
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    >
                      {FUEL_TYPES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    {errors.fuelType && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.fuelType}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 3: Ownership Information */}
            <section className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-5 sm:p-6 shadow-xs">
              <div className="pb-4 mb-5 border-b border-slate-200 dark:border-[#262837]">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8b5cf6] dark:text-[#a078ff] text-[20px]">
                    badge
                  </span>
                  Ownership Information
                </h2>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Company asset vs. attached/leased vendor ownership
                </p>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div>
                    <label
                      htmlFor="ownershipType"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Ownership Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="ownershipType"
                      name="ownershipType"
                      aria-label="Ownership Type"
                      value={formData.ownershipType}
                      onChange={(e) =>
                        handleChange("ownershipType", e.target.value)
                      }
                      onBlur={() => handleBlur("ownershipType")}
                      className={`w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                        errors.ownershipType
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    >
                      {OWNERSHIP_TYPES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    {errors.ownershipType && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.ownershipType}
                      </p>
                    )}
                  </div>

                  {isAttachedOrLeased && (
                    <>
                      <div>
                        <label
                          htmlFor="ownerName"
                          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                        >
                          Owner / Vendor Name{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="ownerName"
                          name="ownerName"
                          type="text"
                          placeholder="Owner or Agency Name"
                          value={formData.ownerName}
                          onChange={(e) =>
                            handleChange("ownerName", e.target.value)
                          }
                          onBlur={() => handleBlur("ownerName")}
                          className={`w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                            errors.ownerName
                              ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                              : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                          }`}
                        />
                        {errors.ownerName && (
                          <p className="mt-1 text-xs text-rose-500 font-medium">
                            {errors.ownerName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="ownerContact"
                          className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                        >
                          Owner Contact Number{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="ownerContact"
                          name="ownerContact"
                          type="tel"
                          placeholder="10-digit mobile number"
                          value={formData.ownerContact}
                          onChange={(e) =>
                            handleChange("ownerContact", e.target.value)
                          }
                          onBlur={() => handleBlur("ownerContact")}
                          className={`w-full h-10 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                            errors.ownerContact
                              ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                              : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                          }`}
                        />
                        {errors.ownerContact && (
                          <p className="mt-1 text-xs text-rose-500 font-medium">
                            {errors.ownerContact}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {!isAttachedOrLeased && (
                  <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f1117]/60 p-3 text-xs text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined text-[#06b6d4] dark:text-[#4cd7f6] text-base">
                      info
                    </span>
                    <span>
                      Direct company-owned vehicle. No third-party contractor or
                      lease agreements required.
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* SECTION 4: Vehicle Operational Snapshot / Fleet Master Preview */}
            <section className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-200 dark:border-[#262837] gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#06b6d4] dark:text-[#4cd7f6] text-[20px]">
                      analytics
                    </span>
                    {isEditMode
                      ? "Vehicle Operational Snapshot"
                      : "Fleet Master Preview"}
                  </h2>
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    {isEditMode
                      ? "Real dispatch history, logged mileage, and trip metrics"
                      : "Summary of vehicle attributes registered into the fleet pool"}
                  </p>
                </div>

                {isEditMode && operationalStats?.operationalState && (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-[#8b5cf6]/10 text-[#6b38d4] dark:text-[#d0bcff] border border-[#8b5cf6]/20 self-start sm:self-auto">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#8b5cf6]" />
                    {operationalStats.operationalState.label}
                  </span>
                )}
              </div>

              {isEditMode && operationalStats ? (
                <div className="space-y-4">
                  {/* Metric Tiles */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#0f1117]/60 p-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Trips This Month
                      </p>
                      <p className="mt-1 text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                        {operationalStats.tripsThisMonth}
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#0f1117]/60 p-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Total Trips
                      </p>
                      <p className="mt-1 text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                        {operationalStats.totalTrips}
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#0f1117]/60 p-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Distance Logged
                      </p>
                      <p className="mt-1 text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                        {operationalStats.totalKm.toLocaleString()}{" "}
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                          km
                        </span>
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#0f1117]/60 p-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Capacity
                      </p>
                      <p className="mt-1 text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                        {formData.seatingCapacity || "—"}{" "}
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                          Seats
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Last Trip & Recent Movement */}
                  {operationalStats.lastTrip ? (
                    <div className="rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50/70 dark:bg-[#0f1117]/40 p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[#8b5cf6] dark:text-[#a078ff] text-sm">
                            route
                          </span>
                          Last Completed Trip:{" "}
                          <span className="font-mono text-[#6b38d4] dark:text-[#d0bcff] font-bold">
                            {operationalStats.lastTrip.tripCode}
                          </span>
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {operationalStats.lastTrip.endDateTime
                            ? new Date(
                                operationalStats.lastTrip.endDateTime,
                              ).toLocaleDateString()
                            : operationalStats.lastTrip.bookingDate || "Recent"}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-1">
                        <span>
                          <strong className="text-slate-800 dark:text-slate-200 font-medium">
                            Route:
                          </strong>{" "}
                          {operationalStats.lastTrip.pickupLocation || "Origin"}{" "}
                          →{" "}
                          {operationalStats.lastTrip.dropLocation ||
                            "Destination"}
                        </span>
                        {operationalStats.lastTrip.driverName && (
                          <span>
                            <strong className="text-slate-800 dark:text-slate-200 font-medium">
                              Driver:
                            </strong>{" "}
                            {operationalStats.lastTrip.driverName}
                          </span>
                        )}
                        {operationalStats.lastTrip.totalKm && (
                          <span>
                            <strong className="text-slate-800 dark:text-slate-200 font-medium">
                              Trip Distance:
                            </strong>{" "}
                            {operationalStats.lastTrip.totalKm} km
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50/70 dark:bg-[#0f1117]/40 p-4 text-xs text-slate-500 dark:text-slate-400 text-center">
                      No past trips completed yet. Operational trip history will
                      appear here once trips are scheduled.
                    </div>
                  )}
                </div>
              ) : (
                /* Add Mode Summary Preview */
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#0f1117]/60 p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Vehicle Type
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                      {VEHICLE_TYPE_LABELS[formData.vehicleType] ||
                        formData.vehicleType ||
                        "Bus"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#0f1117]/60 p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Fuel System
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                      {FUEL_TYPE_LABELS[formData.fuelType] ||
                        formData.fuelType ||
                        "Diesel"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#0f1117]/60 p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Seating
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                      {formData.seatingCapacity
                        ? `${formData.seatingCapacity} Seats`
                        : "Pending"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 dark:border-[#262837] bg-slate-50 dark:bg-[#0f1117]/60 p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Ownership
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                      {OWNERSHIP_TYPE_LABELS[formData.ownershipType] || "Own"}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* SECTION 5: Notes & Remarks */}
            <section className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-5 sm:p-6 shadow-xs">
              <div className="pb-4 mb-5 border-b border-slate-200 dark:border-[#262837]">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8b5cf6] dark:text-[#a078ff] text-[20px]">
                    description
                  </span>
                  Notes &amp; Internal Remarks
                </h2>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Internal fleet maintenance records, special accessories, or
                  equipment remarks
                </p>
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Additional Vehicle Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Add special maintenance notes, fleet history, emergency equipment or onboard GPS hardware info..."
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
                />
              </div>
            </section>
          </div>

          {/* Right / Secondary Column (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* SECTION 6: Operational Master Status */}
            <section className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-5 shadow-xs">
              <div className="pb-4 mb-5 border-b border-slate-200 dark:border-[#262837]">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8b5cf6] dark:text-[#a078ff] text-[20px]">
                    toggle_on
                  </span>
                  Operational Status
                </h2>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Fleet master availability toggle
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0f1117]/80 border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Vehicle Active Status
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Master dispatch status
                      </p>
                    </div>

                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <div className="relative inline-flex items-center">
                        <input
                          type="checkbox"
                          role="switch"
                          aria-label="Vehicle Active Status"
                          checked={formData.isActive}
                          onChange={(e) =>
                            handleChange("isActive", e.target.checked)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8b5cf6]"></div>
                      </div>
                    </label>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Current Master State:
                    </span>
                    {formData.isActive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold text-[#6b38d4] dark:text-[#d0bcff] bg-[#8b5cf6]/10 border border-[#8b5cf6]/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#8b5cf6]" />
                        Active / In Service
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        Inactive / Out of Service
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  <strong className="text-slate-700 dark:text-slate-300">
                    Rule:
                  </strong>{" "}
                  Inactive vehicles cannot be scheduled or assigned to new
                  bookings in the trip dispatcher.
                </p>
              </div>
            </section>

            {/* SECTION 7: Compliance & Documents */}
            <section className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200 dark:border-[#262837] gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#06b6d4] dark:text-[#4cd7f6] text-[20px]">
                      verified_user
                    </span>
                    Compliance &amp; Documents
                  </h2>
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    Monitor legal certificates &amp; expiries
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border ${complianceOverview.className}`}
                >
                  {complianceOverview.label}
                </span>
              </div>

              <div className="space-y-4">
                {/* Document 1: Insurance Policy */}
                <div className="rounded-xl border border-slate-200 dark:border-[#262837] bg-slate-50/70 dark:bg-[#0f1117]/60 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#8b5cf6] dark:text-[#a078ff] text-base">
                        policy
                      </span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Insurance Policy
                      </h4>
                    </div>
                    <DocumentStatusPill
                      dateString={formData.insuranceExpiry}
                      docName="Insurance"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="insuranceNumber"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Policy Number
                    </label>
                    <input
                      id="insuranceNumber"
                      name="insuranceNumber"
                      type="text"
                      placeholder="e.g. POL-12345678"
                      value={formData.insuranceNumber}
                      onChange={(e) =>
                        handleChange("insuranceNumber", e.target.value)
                      }
                      className="w-full h-9 px-3 py-1.5 text-xs bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="insuranceExpiry"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Insurance Expiry Date{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[18px] pointer-events-none">
                        calendar_month
                      </span>
                      <input
                        id="insuranceExpiry"
                        name="insuranceExpiry"
                        type="date"
                        aria-label="Insurance Expiry Date"
                        value={formData.insuranceExpiry}
                        onChange={(e) =>
                          handleChange("insuranceExpiry", e.target.value)
                        }
                        onBlur={() => handleBlur("insuranceExpiry")}
                        className={`w-full h-9 pl-8 pr-2.5 py-1.5 text-xs bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                          errors.insuranceExpiry
                            ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                            : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                        }`}
                      />
                    </div>
                    {errors.insuranceExpiry && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.insuranceExpiry}
                      </p>
                    )}
                  </div>
                </div>

                {/* Document 2: Fitness Certificate */}
                <div className="rounded-xl border border-slate-200 dark:border-[#262837] bg-slate-50/70 dark:bg-[#0f1117]/60 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#06b6d4] dark:text-[#4cd7f6] text-base">
                        health_and_safety
                      </span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Fitness Certificate
                      </h4>
                    </div>
                    <DocumentStatusPill
                      dateString={formData.fitnessExpiry}
                      docName="Fitness"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="fitnessCertificateNumber"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Certificate Number
                    </label>
                    <input
                      id="fitnessCertificateNumber"
                      name="fitnessCertificateNumber"
                      type="text"
                      placeholder="e.g. FC-987654"
                      value={formData.fitnessCertificateNumber}
                      onChange={(e) =>
                        handleChange("fitnessCertificateNumber", e.target.value)
                      }
                      className="w-full h-9 px-3 py-1.5 text-xs bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="fitnessExpiry"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Fitness Expiry Date{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[18px] pointer-events-none">
                        calendar_month
                      </span>
                      <input
                        id="fitnessExpiry"
                        name="fitnessExpiry"
                        type="date"
                        aria-label="Fitness Expiry Date"
                        value={formData.fitnessExpiry}
                        onChange={(e) =>
                          handleChange("fitnessExpiry", e.target.value)
                        }
                        onBlur={() => handleBlur("fitnessExpiry")}
                        className={`w-full h-9 pl-8 pr-2.5 py-1.5 text-xs bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                          errors.fitnessExpiry
                            ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                            : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                        }`}
                      />
                    </div>
                    {errors.fitnessExpiry && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.fitnessExpiry}
                      </p>
                    )}
                  </div>
                </div>

                {/* Document 3: PUC */}
                <div className="rounded-xl border border-slate-200 dark:border-[#262837] bg-slate-50/70 dark:bg-[#0f1117]/60 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#8b5cf6] dark:text-[#a078ff] text-base">
                        eco
                      </span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        PUC (Pollution Under Control)
                      </h4>
                    </div>
                    <DocumentStatusPill
                      dateString={formData.pucExpiry}
                      docName="PUC"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="pucNumber"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                    >
                      PUC Number
                    </label>
                    <input
                      id="pucNumber"
                      name="pucNumber"
                      type="text"
                      placeholder="e.g. PUC-2024-889"
                      value={formData.pucNumber}
                      onChange={(e) =>
                        handleChange("pucNumber", e.target.value)
                      }
                      className="w-full h-9 px-3 py-1.5 text-xs bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="pucExpiry"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                    >
                      PUC Expiry Date <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[18px] pointer-events-none">
                        calendar_month
                      </span>
                      <input
                        id="pucExpiry"
                        name="pucExpiry"
                        type="date"
                        aria-label="PUC Expiry Date"
                        value={formData.pucExpiry}
                        onChange={(e) =>
                          handleChange("pucExpiry", e.target.value)
                        }
                        onBlur={() => handleBlur("pucExpiry")}
                        className={`w-full h-9 pl-8 pr-2.5 py-1.5 text-xs bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                          errors.pucExpiry
                            ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                            : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                        }`}
                      />
                    </div>
                    {errors.pucExpiry && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.pucExpiry}
                      </p>
                    )}
                  </div>
                </div>

                {/* Document 4: Transport Permit (Optional) */}
                <div className="rounded-xl border border-slate-200 dark:border-[#262837] bg-slate-50/70 dark:bg-[#0f1117]/60 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#06b6d4] dark:text-[#4cd7f6] text-base">
                        assignment
                      </span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Transport Permit
                      </h4>
                    </div>
                    <DocumentStatusPill
                      dateString={formData.permitExpiry}
                      docName="Permit"
                      isOptional={!formData.permitNumber}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="permitNumber"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Permit Number
                    </label>
                    <input
                      id="permitNumber"
                      name="permitNumber"
                      type="text"
                      placeholder="e.g. ALL-INDIA-44"
                      value={formData.permitNumber}
                      onChange={(e) =>
                        handleChange("permitNumber", e.target.value)
                      }
                      className="w-full h-9 px-3 py-1.5 text-xs bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="permitExpiry"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Permit Expiry Date
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[18px] pointer-events-none">
                        calendar_month
                      </span>
                      <input
                        id="permitExpiry"
                        name="permitExpiry"
                        type="date"
                        aria-label="Permit Expiry Date"
                        value={formData.permitExpiry}
                        onChange={(e) =>
                          handleChange("permitExpiry", e.target.value)
                        }
                        onBlur={() => handleBlur("permitExpiry")}
                        className={`w-full h-9 pl-8 pr-2.5 py-1.5 text-xs bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                          errors.permitExpiry
                            ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                            : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                        }`}
                      />
                    </div>
                    {errors.permitExpiry && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.permitExpiry}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Bottom Action Area */}
          <div className="lg:col-span-12 flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[#262837]">
            <button
              type="button"
              onClick={handleDiscard}
              className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#191b22] border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              Discard
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] active:opacity-90 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditMode ? "Save Changes" : "Save Vehicle"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
