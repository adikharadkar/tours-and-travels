import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";

import Toast from "../../components/ui/Toast";

import {
  LICENSE_TYPES,
  DRIVER_TYPES,
  DRIVER_PREFIXES,
  PREFIX_LABELS,
  DRIVER_TYPE_LABELS,
} from "../../constants/drivers";
import { states } from "../../constants/india";
import {
  saveDriver,
  updateDriver,
  getDriverById,
} from "../../services/driverService";
import { getTrips } from "../../services/tripService";
import { validateDriver } from "../../utils/validation/driverValidation";
import { getDriverLicenseStatus } from "../../utils/driverLicenseStatus";

const initialFormData = {
  driverCode: "Will be generated automatically",
  prefix: "mr",
  name: "",
  dateOfBirth: "",

  mobile: "",
  alternateMobile: "",
  email: "",
  address: "",
  state: "",
  city: "",
  pinCode: "",

  licenseNumber: "",
  licenseType: "commercial",
  licenseIssueDate: "",
  licenseExpiryDate: "",
  issuingAuthority: "",

  driverType: "own",
  joiningDate: "",
  employeeReferenceId: "",
  dailyRate: "",

  isActive: true,
  notes: "",
};

export default function DriverForm() {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(driverId);

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [allTrips, setAllTrips] = useState([]);

  // Load Trips to power real operational snapshot in edit mode
  useEffect(() => {
    try {
      const trips = getTrips();
      setAllTrips(trips || []);
    } catch (err) {
      console.warn("Could not load trips for driver snapshot:", err);
    }
  }, []);

  // Load Driver data in Edit Mode
  useEffect(() => {
    if (!isEditMode) {
      setFormData(initialFormData);
      setIsLoading(false);
      return;
    }

    try {
      const existingDriver = getDriverById(driverId);
      if (!existingDriver) {
        setToast({
          id: Date.now(),
          variant: "error",
          title: "Driver Not Found",
          message: "The requested driver record could not be found.",
        });
        setTimeout(() => navigate("/drivers", { replace: true }), 1500);
        return;
      }

      setFormData({
        ...initialFormData,
        ...existingDriver,
        dailyRate:
          existingDriver.dailyRate !== null &&
          existingDriver.dailyRate !== undefined
            ? String(existingDriver.dailyRate)
            : "",
        isActive: existingDriver.isActive !== false,
      });
      setErrors({});
    } catch (err) {
      console.error("Error loading driver:", err);
      setToast({
        id: Date.now(),
        variant: "error",
        title: "Error",
        message: "Failed to load driver data.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [driverId, isEditMode, navigate]);

  // Derived Cities list based on selected State
  const cityOptions = useMemo(() => {
    const selectedState = states.find((s) => s.value === formData.state);
    return selectedState?.cities ?? [];
  }, [formData.state]);

  // Real-time calculated license status
  const licenseStatus = useMemo(() => {
    return getDriverLicenseStatus({
      licenseExpiryDate: formData.licenseExpiryDate,
    });
  }, [formData.licenseExpiryDate]);

  // Trip Eligibility logic
  const eligibility = useMemo(() => {
    if (!formData.isActive) {
      return {
        status: "inactive",
        label: "Not Eligible",
        reason: "Driver is marked inactive in Driver Master.",
        badgeClass:
          "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700",
        icon: "block",
      };
    }

    if (
      licenseStatus.value === "expired" ||
      licenseStatus.value === "not_provided"
    ) {
      return {
        status: "ineligible",
        label: "Not Eligible",
        reason:
          licenseStatus.value === "expired"
            ? "License expired. Grounded from dispatch."
            : "Valid license required for trips.",
        badgeClass:
          "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800",
        icon: "do_not_disturb_on",
      };
    }

    if (licenseStatus.value === "expiring_soon") {
      return {
        status: "attention",
        label: "Needs Attention",
        reason: `License expires soon (${licenseStatus.daysLeft}d left). Plan renewal.`,
        badgeClass:
          "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800",
        icon: "warning",
      };
    }

    return {
      status: "eligible",
      label: "Eligible for Assignment",
      reason: "Compliant & ready for upcoming trips.",
      badgeClass:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      icon: "check_circle",
    };
  }, [formData.isActive, licenseStatus]);

  // Real active trip assignment in Edit Mode
  const activeTripAssignment = useMemo(() => {
    if (!isEditMode || !driverId) return null;
    return allTrips.find(
      (t) =>
        (t.driverId === driverId ||
          (t.driverName && t.driverName === formData.name)) &&
        (t.status === "in_progress" || t.status === "confirmed"),
    );
  }, [allTrips, isEditMode, driverId, formData.name]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleStateChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      state: value,
      city: "",
    }));

    setErrors((prev) => {
      const next = { ...prev };
      delete next.state;
      delete next.city;
      return next;
    });
  };

  const handleBlur = (field) => {
    const validation = validateDriver(formData);
    if (validation.errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: validation.errors[field] }));
    }
  };

  const handleDiscard = () => {
    navigate("/drivers");
  };

  const handleSubmit = (e) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    setToast(null);

    const { isValid, errors: validationErrors } = validateDriver(formData);

    if (!isValid) {
      setErrors(validationErrors);
      const errorCount = Object.keys(validationErrors).length;
      setToast({
        id: Date.now(),
        variant: "warning",
        title: "Please check the form",
        message:
          errorCount === 1
            ? "Please correct the highlighted field before saving."
            : `Please correct the ${errorCount} highlighted fields before saving.`,
      });

      // Auto scroll to first error field
      const firstErrorFieldKey = Object.keys(validationErrors)[0];
      const el = document.getElementById(firstErrorFieldKey);
      if (el) {
        if (typeof el.scrollIntoView === "function") {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        el.focus?.();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditMode) {
        const updated = updateDriver(driverId, formData);
        navigate("/drivers", {
          state: {
            toast: {
              variant: "success",
              title: "Driver Updated",
              message: `Driver ${updated.name} (${updated.driverCode}) was updated successfully.`,
            },
            highlightedDriverId: updated.id,
          },
        });
      } else {
        const created = saveDriver(formData);
        navigate("/drivers", {
          state: {
            toast: {
              variant: "success",
              title: "Driver Added",
              message: `Driver ${created.name} (${created.driverCode}) was registered successfully.`,
            },
            highlightedDriverId: created.id,
          },
        });
      }
    } catch (err) {
      console.error("Failed to save driver:", err);
      setToast({
        id: Date.now(),
        variant: "error",
        title: isEditMode ? "Unable to update driver" : "Unable to save driver",
        message: err.message || "An unexpected error occurred.",
      });
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#8b5cf6] border-t-transparent" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Loading driver profile...
        </p>
      </div>
    );
  }

  const prefixLabel = PREFIX_LABELS[formData.prefix] || "";
  const displayName = formData.name
    ? `${prefixLabel ? `${prefixLabel} ` : ""}${formData.name}`
    : isEditMode
      ? "Driver Profile"
      : "New Driver";
  const driverTypeLabel = DRIVER_TYPE_LABELS[formData.driverType] || "Driver";

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

      {/* Breadcrumb Navigation */}
      <div className="mb-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Link
          to="/drivers"
          className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[14px]">
            arrow_back
          </span>
          Drivers
        </Link>
        <span className="material-symbols-outlined text-[14px]">
          chevron_right
        </span>
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {isEditMode ? "Edit Driver" : "Add Driver"}
        </span>
      </div>

      {/* Sticky Top Header with Primary Actions */}
      <div className="sticky top-0 z-30 -mx-4 -mt-2 mb-6 px-4 py-3 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8 bg-[#f8fafc]/95 dark:bg-[#0f1117]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {isEditMode ? "Edit Driver" : "Add Driver"}
              </h1>

              {isEditMode && (
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-[#191b22] px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {formData.driverCode}
                  </span>
                  {formData.name && (
                    <span className="rounded-md border border-[#8b5cf6]/20 bg-[#8b5cf6]/10 px-2.5 py-0.5 font-sans text-xs font-bold tracking-wide text-[#6b38d4] dark:text-[#d0bcff]">
                      {formData.name}
                    </span>
                  )}
                </div>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isEditMode
                ? `${formData.name || "Driver"} · ${formData.driverCode || ""}`
                : "Create a new driver profile and license record."}
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
              Cancel
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
                <span>{isEditMode ? "Save Changes" : "Save Driver"}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Form Layout - 12 Columns */}
      <div className="max-w-7xl mx-auto w-full pb-20">
        <form
          id="driver-form"
          onSubmit={handleSubmit}
          noValidate
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
        >
          {/* Main Form Sections (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* SECTION 1: Identity & Personal Information */}
            <section className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
              <div className="pb-4 mb-5 border-b border-slate-200 dark:border-[#262837] flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#8b5cf6] dark:text-[#a078ff] text-[20px]">
                      person
                    </span>
                    Driver Identity
                  </h2>
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    Personal identity details and master identification code
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-12">
                  {/* Driver Code (Read-Only) */}
                  <div className="sm:col-span-4">
                    <label
                      htmlFor="driverCode"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Driver Code
                    </label>
                    <input
                      id="driverCode"
                      name="driverCode"
                      type="text"
                      readOnly
                      disabled
                      value={formData.driverCode}
                      className="w-full h-11 px-3 py-2 font-mono text-sm bg-slate-100 dark:bg-[#0f1117] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 cursor-not-allowed select-none"
                    />
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      System-generated unique identifier
                    </p>
                  </div>

                  {/* Prefix */}
                  <div className="sm:col-span-3">
                    <label
                      htmlFor="prefix"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Prefix
                    </label>
                    <select
                      id="prefix"
                      name="prefix"
                      value={formData.prefix}
                      onChange={(e) => handleChange("prefix", e.target.value)}
                      className="w-full h-11 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all text-slate-900 dark:text-slate-100"
                    >
                      {DRIVER_PREFIXES.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Full Name */}
                  <div className="sm:col-span-5">
                    <label
                      htmlFor="name"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Driver Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="e.g. Rajesh Patil"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      onBlur={() => handleBlur("name")}
                      className={`w-full h-11 px-3 py-2 text-sm font-medium bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                        errors.name
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    />
                    {errors.name ? (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.name}
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        Primary name used across trip assignments and manifests
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* Date of Birth */}
                  <div>
                    <label
                      htmlFor="dateOfBirth"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Date of Birth
                    </label>
                    <div className="relative">
                      <input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        aria-label="Date of Birth"
                        value={formData.dateOfBirth}
                        onChange={(e) =>
                          handleChange("dateOfBirth", e.target.value)
                        }
                        onBlur={() => handleBlur("dateOfBirth")}
                        className={`w-full h-11 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                          errors.dateOfBirth
                            ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                            : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                        }`}
                      />
                    </div>
                    {errors.dateOfBirth && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.dateOfBirth}
                      </p>
                    )}
                  </div>

                  {/* Driver Classification Preview */}
                  <div>
                    <label
                      htmlFor="driverType"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Driver Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="driverType"
                      name="driverType"
                      value={formData.driverType}
                      onChange={(e) =>
                        handleChange("driverType", e.target.value)
                      }
                      onBlur={() => handleBlur("driverType")}
                      className={`w-full h-11 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                        errors.driverType
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    >
                      {DRIVER_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    {errors.driverType && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.driverType}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: Contact & Residential Information */}
            <section className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-5 sm:p-6 shadow-xs">
              <div className="pb-4 mb-5 border-b border-slate-200 dark:border-[#262837]">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#06b6d4] dark:text-[#4cd7f6] text-[20px]">
                    contact_phone
                  </span>
                  Contact Information &amp; Address
                </h2>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Primary communication channels and residential location
                </p>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  {/* Primary Mobile */}
                  <div>
                    <label
                      htmlFor="mobile"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Mobile Phone (Primary){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="mobile"
                      name="mobile"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="9876543210"
                      value={formData.mobile}
                      onChange={(e) =>
                        handleChange(
                          "mobile",
                          e.target.value.replace(/\D/g, ""),
                        )
                      }
                      onBlur={() => handleBlur("mobile")}
                      className={`w-full h-11 px-3 py-2 font-mono text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                        errors.mobile
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    />
                    {errors.mobile && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.mobile}
                      </p>
                    )}
                  </div>

                  {/* Alternate Mobile */}
                  <div>
                    <label
                      htmlFor="alternateMobile"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Alternate Mobile
                    </label>
                    <input
                      id="alternateMobile"
                      name="alternateMobile"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="9876543211"
                      value={formData.alternateMobile}
                      onChange={(e) =>
                        handleChange(
                          "alternateMobile",
                          e.target.value.replace(/\D/g, ""),
                        )
                      }
                      onBlur={() => handleBlur("alternateMobile")}
                      className={`w-full h-11 px-3 py-2 font-mono text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                        errors.alternateMobile
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    />
                    {errors.alternateMobile && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.alternateMobile}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="driver@example.com"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      onBlur={() => handleBlur("email")}
                      className={`w-full h-11 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                        errors.email
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Residential Address */}
                <div>
                  <label
                    htmlFor="address"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Residential Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={2}
                    placeholder="Enter complete residential address or home base"
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  {/* State */}
                  <div>
                    <label
                      htmlFor="state"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      State
                    </label>
                    <select
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="w-full h-11 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all text-slate-900 dark:text-slate-100"
                    >
                      <option value="">Select State</option>
                      {states.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* City */}
                  <div>
                    <label
                      htmlFor="city"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      City
                    </label>
                    <select
                      id="city"
                      name="city"
                      disabled={!formData.state}
                      value={formData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      className="w-full h-11 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all text-slate-900 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-[#0f1117]/50 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {formData.state ? "Select City" : "Select State First"}
                      </option>
                      {cityOptions.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* PIN Code */}
                  <div>
                    <label
                      htmlFor="pinCode"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      PIN Code
                    </label>
                    <input
                      id="pinCode"
                      name="pinCode"
                      type="text"
                      maxLength={6}
                      inputMode="numeric"
                      placeholder="411038"
                      value={formData.pinCode}
                      onChange={(e) =>
                        handleChange(
                          "pinCode",
                          e.target.value.replace(/\D/g, ""),
                        )
                      }
                      onBlur={() => handleBlur("pinCode")}
                      className={`w-full h-11 px-3 py-2 font-mono text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                        errors.pinCode
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    />
                    {errors.pinCode && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.pinCode}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 3: Driving License & Compliance (Prominent Stitch Visual Element) */}
            <section className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-200 dark:border-[#262837]">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#ca801e] dark:text-[#ffb869] text-[20px]">
                      badge
                    </span>
                    Driving License &amp; Compliance
                  </h2>
                  <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    Statutory license credentials &amp; trip dispatch
                    eligibility
                  </p>
                </div>

                {/* Status Pill in Header */}
                {formData.licenseExpiryDate && (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${
                      licenseStatus.value === "valid"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                        : licenseStatus.value === "expiring_soon"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        licenseStatus.value === "valid"
                          ? "bg-emerald-500"
                          : licenseStatus.value === "expiring_soon"
                            ? "bg-amber-500 animate-pulse"
                            : "bg-rose-500"
                      }`}
                    />
                    {licenseStatus.label}
                  </span>
                )}
              </div>

              {/* Dynamic Compliance Alert Banner */}
              {licenseStatus.value === "expired" && (
                <div className="mb-5 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50/80 dark:bg-rose-950/30 p-4 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-3">
                  <span className="material-symbols-outlined text-rose-600 dark:text-rose-400 text-[20px] shrink-0 mt-0.5">
                    dangerous
                  </span>
                  <div>
                    <p className="font-bold text-rose-900 dark:text-rose-100">
                      Driving License is Expired ({licenseStatus.message})
                    </p>
                    <p className="mt-0.5 text-rose-700 dark:text-rose-300">
                      This driver is grounded and cannot be assigned to new
                      trips until a renewed license expiry date is recorded.
                    </p>
                  </div>
                </div>
              )}

              {licenseStatus.value === "expiring_soon" && (
                <div className="mb-5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/30 p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[20px] shrink-0 mt-0.5">
                    warning
                  </span>
                  <div>
                    <p className="font-bold text-amber-900 dark:text-amber-100">
                      Driving License Expiring Soon ({licenseStatus.message})
                    </p>
                    <p className="mt-0.5 text-amber-700 dark:text-amber-300">
                      Renewal documentation required soon. Driver will become
                      ineligible once the expiration date passes.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {/* License Number */}
                  <div>
                    <label
                      htmlFor="licenseNumber"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Driving License Number{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="licenseNumber"
                      name="licenseNumber"
                      type="text"
                      placeholder="e.g. MH1220100012345"
                      value={formData.licenseNumber}
                      onChange={(e) =>
                        handleChange(
                          "licenseNumber",
                          e.target.value.toUpperCase(),
                        )
                      }
                      onBlur={() => handleBlur("licenseNumber")}
                      className={`w-full h-11 px-3 py-2 font-mono font-bold uppercase tracking-wider text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                        errors.licenseNumber
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    />
                    {errors.licenseNumber ? (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.licenseNumber}
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        Must be unique across all driver records
                      </p>
                    )}
                  </div>

                  {/* License Type / Category */}
                  <div>
                    <label
                      htmlFor="licenseType"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      License Category / Class{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="licenseType"
                      name="licenseType"
                      value={formData.licenseType}
                      onChange={(e) =>
                        handleChange("licenseType", e.target.value)
                      }
                      onBlur={() => handleBlur("licenseType")}
                      className={`w-full h-11 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                        errors.licenseType
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    >
                      {LICENSE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    {errors.licenseType && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.licenseType}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  {/* Issuing Authority */}
                  <div>
                    <label
                      htmlFor="issuingAuthority"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Issuing Authority / RTO
                    </label>
                    <input
                      id="issuingAuthority"
                      name="issuingAuthority"
                      type="text"
                      placeholder="e.g. RTO Pune (MH-12)"
                      value={formData.issuingAuthority}
                      onChange={(e) =>
                        handleChange("issuingAuthority", e.target.value)
                      }
                      className="w-full h-11 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  {/* License Issue Date */}
                  <div>
                    <label
                      htmlFor="licenseIssueDate"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      License Issue Date
                    </label>
                    <input
                      id="licenseIssueDate"
                      name="licenseIssueDate"
                      type="date"
                      aria-label="License Issue Date"
                      value={formData.licenseIssueDate}
                      onChange={(e) =>
                        handleChange("licenseIssueDate", e.target.value)
                      }
                      onBlur={() => handleBlur("licenseIssueDate")}
                      className={`w-full h-11 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                        errors.licenseIssueDate
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    />
                    {errors.licenseIssueDate && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.licenseIssueDate}
                      </p>
                    )}
                  </div>

                  {/* License Expiry Date */}
                  <div>
                    <label
                      htmlFor="licenseExpiryDate"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      License Expiration Date{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="licenseExpiryDate"
                      name="licenseExpiryDate"
                      type="date"
                      aria-label="License Expiration Date"
                      value={formData.licenseExpiryDate}
                      onChange={(e) =>
                        handleChange("licenseExpiryDate", e.target.value)
                      }
                      onBlur={() => handleBlur("licenseExpiryDate")}
                      className={`w-full h-11 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 ${
                        errors.licenseExpiryDate
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    />
                    {errors.licenseExpiryDate && (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.licenseExpiryDate}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 4: Employment & Assignment Details */}
            <section className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-5 sm:p-6 shadow-xs">
              <div className="pb-4 mb-5 border-b border-slate-200 dark:border-[#262837]">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8b5cf6] dark:text-[#a078ff] text-[20px]">
                    work
                  </span>
                  Employment &amp; Assignment
                </h2>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Driver wage parameters, joining timeline, and internal
                  references
                </p>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  {/* Joining Date */}
                  <div>
                    <label
                      htmlFor="joiningDate"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Joining Date
                    </label>
                    <input
                      id="joiningDate"
                      name="joiningDate"
                      type="date"
                      aria-label="Joining Date"
                      value={formData.joiningDate}
                      onChange={(e) =>
                        handleChange("joiningDate", e.target.value)
                      }
                      className="w-full h-11 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* Employee Reference ID */}
                  <div>
                    <label
                      htmlFor="employeeReferenceId"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Employee / Reference ID
                    </label>
                    <input
                      id="employeeReferenceId"
                      name="employeeReferenceId"
                      type="text"
                      placeholder="e.g. EMP-DRV-01"
                      value={formData.employeeReferenceId}
                      onChange={(e) =>
                        handleChange("employeeReferenceId", e.target.value)
                      }
                      className="w-full h-11 px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono"
                    />
                  </div>

                  {/* Daily Rate */}
                  <div>
                    <label
                      htmlFor="dailyRate"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Daily Rate (₹)
                    </label>
                    <input
                      id="dailyRate"
                      name="dailyRate"
                      type="number"
                      min="0"
                      step="50"
                      placeholder="e.g. 850"
                      value={formData.dailyRate}
                      onChange={(e) =>
                        handleChange("dailyRate", e.target.value)
                      }
                      onBlur={() => handleBlur("dailyRate")}
                      className={`w-full h-11 px-3 py-2 font-mono text-sm bg-white dark:bg-[#0f1117] border rounded-lg outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
                        errors.dailyRate
                          ? "border-rose-400 dark:border-rose-500 ring-2 ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-700 focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                      }`}
                    />
                    {errors.dailyRate ? (
                      <p className="mt-1 text-xs text-rose-500 font-medium">
                        {errors.dailyRate}
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        Standard daily wage / bata calculation base
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 5: Internal Notes & Skills */}
            <section className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-5 sm:p-6 shadow-xs">
              <div className="pb-4 mb-5 border-b border-slate-200 dark:border-[#262837]">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8b5cf6] dark:text-[#a078ff] text-[20px]">
                    description
                  </span>
                  Notes &amp; Internal Remarks
                </h2>
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  Special driving certifications, route experience, or
                  performance notes
                </p>
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Internal Driver Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="e.g. Experienced in ghat routes, hill station driving, multilingual (Hindi, Marathi, English)..."
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
                />
              </div>
            </section>
          </div>

          {/* Right Sticky Sidebar (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Profile Identity Summary Card */}
            <div className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl p-6 flex flex-col items-center text-center shadow-xs">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#6b38d4] to-[#a078ff] text-white flex items-center justify-center font-bold text-2xl shadow-md border-2 border-white dark:border-[#262837] mb-3">
                {formData.name ? (
                  formData.name
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()
                ) : (
                  <span className="material-symbols-outlined text-3xl">
                    badge
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 break-words max-w-full">
                {displayName}
              </h3>

              <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#0f1117] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                  {formData.driverCode}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-violet-50 dark:bg-violet-950/60 text-[#6b38d4] dark:text-[#d0bcff] border border-violet-200 dark:border-violet-800">
                  {driverTypeLabel}
                </span>
              </div>
            </div>

            {/* Operational Master Status & Health Panel */}
            <div className="bg-white dark:bg-[#161822] border border-slate-200 dark:border-[#262837] rounded-xl flex flex-col divide-y divide-slate-200 dark:divide-[#262837] shadow-xs">
              {/* Master Status Switch */}
              <div className="p-5 flex items-center justify-between">
                <div>
                  <span className="block text-sm font-bold text-slate-900 dark:text-slate-100">
                    Driver Master Status
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        formData.isActive ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    <span
                      className={`text-xs font-semibold ${
                        formData.isActive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {formData.isActive
                        ? "Active in Fleet"
                        : "Inactive / Grounded"}
                    </span>
                  </div>
                </div>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <div className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      role="switch"
                      aria-label="Driver Master Status"
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

              {/* License Health Card */}
              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    License Health
                  </span>
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      licenseStatus.value === "valid"
                        ? "text-emerald-500"
                        : licenseStatus.value === "expiring_soon"
                          ? "text-amber-500"
                          : "text-rose-500"
                    }`}
                  >
                    {licenseStatus.value === "valid"
                      ? "verified"
                      : licenseStatus.value === "expiring_soon"
                        ? "warning"
                        : "error"}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-lg border text-xs flex flex-col gap-1 ${
                    licenseStatus.value === "valid"
                      ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                      : licenseStatus.value === "expiring_soon"
                        ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                        : "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                  }`}
                >
                  <span className="font-bold">{licenseStatus.label}</span>
                  <span className="text-[11px] opacity-90">
                    {licenseStatus.message}
                  </span>
                </div>
              </div>

              {/* Trip Eligibility Card */}
              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Trip Eligibility
                  </span>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-[#0f1117]/80 border border-slate-200 dark:border-slate-800">
                  <span
                    className={`material-symbols-outlined text-[20px] shrink-0 ${
                      eligibility.status === "eligible"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : eligibility.status === "attention"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {eligibility.icon}
                  </span>
                  <div>
                    <span className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                      {eligibility.label}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {eligibility.reason}
                    </span>
                  </div>
                </div>
              </div>

              {/* Read-Only Operational Assignment Snapshot */}
              {isEditMode && (
                <div className="p-5 space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Current Operational Status
                  </span>

                  {activeTripAssignment ? (
                    <div className="p-3 rounded-lg bg-violet-50/80 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#6b38d4] dark:text-[#d0bcff]">
                          On Trip: {activeTripAssignment.tripCode}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-200/80 dark:bg-violet-900/60 text-violet-800 dark:text-violet-200">
                          In Progress
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        <p>
                          <strong className="text-slate-700 dark:text-slate-200">
                            Vehicle:
                          </strong>{" "}
                          {activeTripAssignment.vehicleNumber || "Assigned"}
                        </p>
                        <p className="mt-0.5">
                          <strong className="text-slate-700 dark:text-slate-200">
                            Route:
                          </strong>{" "}
                          {activeTripAssignment.pickupLocation} →{" "}
                          {activeTripAssignment.dropLocation}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0f1117]/80 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          formData.isActive && licenseStatus.value !== "expired"
                            ? "bg-emerald-500"
                            : "bg-slate-400"
                        }`}
                      />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {formData.isActive && licenseStatus.value !== "expired"
                          ? "Available for Trip Dispatch"
                          : "Not Available for Dispatch"}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons Panel */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] active:opacity-90 shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">
                      save
                    </span>
                    <span>{isEditMode ? "Save Changes" : "Save Driver"}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDiscard}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-[#161822] border border-slate-300 dark:border-[#262837] hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
