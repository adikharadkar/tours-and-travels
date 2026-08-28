import { forwardRef, useMemo, useState } from "react";
import { useNavigate, useInRouterContext } from "react-router-dom";
import {
  getDriverLicenseStatus,
  isDriverEligible,
} from "../../utils/driverLicenseStatus";
import {
  DRIVER_TYPE_LABELS,
  PREFIX_LABELS,
  LICENSE_TYPE_LABELS,
} from "../../constants/drivers";
import { states } from "../../constants/india";
import { getTrips } from "../../services/tripService";
import { getVehicles } from "../../services/vehicleService";
import formatValue from "../../utils/formatValue";

const formatDate = (value) => {
  if (!value) {
    return "—";
  }
  const parts = String(value).split("T")[0].split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return value;
};

const calculateAge = (dobString) => {
  if (!dobString) return null;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? `${age} years` : null;
};

const STATUS_BADGES = {
  valid:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  expiring_soon:
    "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  expired: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
  not_provided:
    "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
};

function DetailItem({ label, value, children, subtext, action }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#958ea0]">
          {label}
        </p>
        {action}
      </div>
      <div className="mt-1 break-words text-sm font-medium text-slate-900 dark:text-[#e3e2e3]">
        {children || formatValue(value)}
      </div>
      {subtext && (
        <p className="mt-0.5 text-xs text-slate-500 dark:text-[#958ea0]">
          {subtext}
        </p>
      )}
    </div>
  );
}

function DetailSection({ title, children, rightElement, className = "" }) {
  return (
    <section className={className}>
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#27272a] pb-2 mb-3.5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
          {title}
        </h3>
        {rightElement}
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function useSafeNavigate() {
  const inRouter = useInRouterContext();
  if (!inRouter) {
    return () => {};
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useNavigate();
}

const DriverDetailsModal = forwardRef(function DriverDetailsModal(
  { open, driver, trips: propTrips, vehicles: propVehicles, onClose, onEdit },
  ref,
) {
  const navigate = useSafeNavigate();
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 2000);
  };

  // Safely resolve trips and vehicles from props or services
  const allTrips = useMemo(() => {
    if (Array.isArray(propTrips)) return propTrips;
    try {
      return getTrips() || [];
    } catch {
      return [];
    }
  }, [propTrips]);

  const allVehicles = useMemo(() => {
    if (Array.isArray(propVehicles)) return propVehicles;
    try {
      return getVehicles() || [];
    } catch {
      return [];
    }
  }, [propVehicles]);

  const vehicleMap = useMemo(() => {
    const map = new Map();
    allVehicles.forEach((v) => {
      if (v.id) map.set(v.id, v);
      if (v.vehicleNumber) map.set(v.vehicleNumber, v);
    });
    return map;
  }, [allVehicles]);

  // Operational Context & Driver's Trips
  const operational = useMemo(() => {
    if (!driver) {
      return {
        activeTrip: null,
        activeVehicle: null,
        upcomingTrips: [],
        recentTrips: [],
        availabilityState: "inactive",
        availabilityLabel: "Inactive",
      };
    }

    const driverTrips = allTrips.filter(
      (t) =>
        (t.driverId && t.driverId === driver.id) ||
        (t.driverName &&
          t.driverName.toLowerCase() === driver.name?.toLowerCase()),
    );

    const todayStr = new Date().toISOString().split("T")[0];
    const now = new Date();

    // Priority 1: In-Progress
    let activeTrip = driverTrips.find((t) => t.status === "in_progress");

    // Priority 2: Confirmed for today
    if (!activeTrip) {
      activeTrip = driverTrips.find(
        (t) =>
          t.status === "confirmed" &&
          t.startDateTime &&
          t.startDateTime.startsWith(todayStr),
      );
    }

    // Active vehicle resolution
    let activeVehicle = null;
    if (activeTrip) {
      activeVehicle =
        (activeTrip.vehicleId && vehicleMap.get(activeTrip.vehicleId)) ||
        (activeTrip.vehicleNumber &&
          vehicleMap.get(activeTrip.vehicleNumber)) ||
        (activeTrip.vehicleNumber
          ? { vehicleNumber: activeTrip.vehicleNumber, model: "" }
          : null);
    }

    // Upcoming Trips
    const upcomingTrips = driverTrips
      .filter((t) => {
        if (t.id === activeTrip?.id) return false;
        if (t.status === "cancelled" || t.status === "completed") return false;
        if (!t.startDateTime) return false;
        const startDate = new Date(t.startDateTime);
        return startDate > now;
      })
      .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

    // Recent Trips (completed / past trips not currently active or upcoming)
    const recentTrips = driverTrips
      .filter(
        (t) =>
          t.id !== activeTrip?.id && !upcomingTrips.some((u) => u.id === t.id),
      )
      .sort(
        (a, b) =>
          new Date(b.startDateTime || b.bookingDate || 0) -
          new Date(a.startDateTime || a.bookingDate || 0),
      )
      .slice(0, 4);

    let availabilityState = "available";
    let availabilityLabel = "Available";

    if (driver.isActive === false) {
      availabilityState = "inactive";
      availabilityLabel = "Inactive";
    } else if (activeTrip) {
      availabilityState = "on_trip";
      availabilityLabel = "On Trip";
    }

    return {
      activeTrip,
      activeVehicle,
      upcomingTrips,
      recentTrips,
      availabilityState,
      availabilityLabel,
    };
  }, [driver, allTrips, vehicleMap]);

  if (!open || !driver) {
    return null;
  }

  const licenseStatus = getDriverLicenseStatus(driver);
  const eligibleForTrips = isDriverEligible(driver);

  const prefixLabel = PREFIX_LABELS[driver.prefix] || "";
  const fullDisplayName = prefixLabel
    ? `${prefixLabel} ${driver.name}`
    : driver.name;

  const driverTypeLabel =
    DRIVER_TYPE_LABELS[driver.driverType] || driver.driverType || "—";
  const licenseTypeLabel =
    LICENSE_TYPE_LABELS[driver.licenseType] || driver.licenseType || "—";

  // Match state and city labels
  const stateObj = states.find((s) => s.value === driver.state);
  const stateName = stateObj?.label || driver.state || "—";
  const cityObj = stateObj?.cities?.find((c) => c.value === driver.city);
  const cityName = cityObj?.label || driver.city || "—";

  const age = calculateAge(driver.dateOfBirth);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEditClick = () => {
    onClose();
    if (onEdit) {
      onEdit(driver);
    } else {
      navigate(`/drivers/${driver.id}/edit`);
    }
  };

  const handleViewAllTrips = () => {
    onClose();
    navigate("/trips", {
      state: {
        search: driver.name || driver.driverCode,
        driverFilter: driver.id,
      },
    });
  };

  const handleViewTrip = (trip) => {
    if (!trip) return;
    onClose();
    navigate("/trips", {
      state: {
        search: trip.tripCode,
        highlightedTripId: trip.id,
      },
    });
  };

  // Determine Banner Variant & Messaging
  const isExpiringSoon =
    eligibleForTrips && licenseStatus.value === "expiring_soon";
  const isExpired = licenseStatus.value === "expired";
  const isInactive = driver.isActive === false;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 dark:bg-black/80 backdrop-blur-xs p-3 sm:p-4 md:p-6 overflow-y-auto"
      onMouseDown={handleBackdropClick}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="driver-profile-title"
        className="relative bg-white dark:bg-[#121315] w-full max-w-5xl rounded-2xl border border-slate-200 dark:border-[#27272a] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-900 dark:text-[#e3e2e3] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Close Button Top Right */}
        <button
          type="button"
          aria-label="Close modal"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#1f2021] transition-colors cursor-pointer"
        >
          <span
            className="material-symbols-outlined text-[20px]"
            aria-hidden="true"
          >
            close
          </span>
        </button>

        {/* HEADER SECTION - Stitch Design Foundation */}
        <header className="flex flex-col sm:flex-row sm:items-start justify-between p-5 sm:p-6 md:p-7 border-b border-slate-200 dark:border-[#27272a] bg-slate-50/70 dark:bg-[#16181b]/90 gap-4 shrink-0">
          <div className="flex items-start gap-4 min-w-0 pr-8 sm:pr-0">
            {/* Driver Avatar / Badge */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-violet-500/15 to-cyan-500/15 dark:bg-[#1f2021] flex items-center justify-center border border-violet-500/20 dark:border-[#27272a] shrink-0 text-violet-600 dark:text-[#d0bcff] font-bold text-xl sm:text-2xl shadow-xs">
              <span
                className="material-symbols-outlined text-3xl"
                aria-hidden="true"
              >
                person
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5 mb-1">
                <h1
                  id="driver-profile-title"
                  className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate"
                >
                  {fullDisplayName}
                </h1>
                <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-[#292a2b] text-slate-700 dark:text-[#e3e2e3] border border-slate-200 dark:border-[#38393a] flex items-center gap-1">
                  <span>ID: {driver.driverCode}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(driver.driverCode, "driverCode")}
                    title="Copy Driver Code"
                    aria-label="Copy Driver Code"
                    className="text-slate-400 hover:text-violet-600 dark:hover:text-[#d0bcff] transition-colors cursor-pointer"
                  >
                    <span
                      className="material-symbols-outlined text-[14px]"
                      aria-hidden="true"
                    >
                      {copiedKey === "driverCode" ? "check" : "content_copy"}
                    </span>
                  </button>
                </span>
              </div>

              <p className="text-sm font-medium text-slate-600 dark:text-[#958ea0] mb-3 flex items-center gap-2">
                <span>Fleet Driver Profile</span>
              </p>

              {/* Status Indicators */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Master Status */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-xs font-semibold border ${
                    driver.isActive !== false
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      driver.isActive !== false
                        ? "bg-emerald-500"
                        : "bg-slate-400"
                    }`}
                  />
                  {driver.isActive !== false ? "Active" : "Inactive"}
                </span>

                {/* Operational Availability */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-xs font-semibold border ${
                    operational.availabilityState === "on_trip"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                      : operational.availabilityState === "available"
                        ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20"
                        : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      operational.availabilityState === "on_trip"
                        ? "bg-amber-500 animate-pulse"
                        : operational.availabilityState === "available"
                          ? "bg-cyan-500"
                          : "bg-slate-400"
                    }`}
                  />
                  {operational.availabilityLabel}
                </span>

                {/* License Badge */}
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-mono text-xs font-semibold border ${
                    STATUS_BADGES[licenseStatus.value] ||
                    STATUS_BADGES.not_provided
                  }`}
                >
                  License: {licenseStatus.label}
                </span>
              </div>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto pt-1 sm:pt-0">
            {driver.mobile && (
              <a
                href={`tel:${driver.mobile}`}
                className="px-3 py-1.5 text-xs font-medium text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span
                  className="material-symbols-outlined text-[16px]"
                  aria-hidden="true"
                >
                  call
                </span>
                <span>Call Driver</span>
              </a>
            )}
            <button
              type="button"
              onClick={handleViewAllTrips}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-[#e3e2e3] bg-white dark:bg-[#1f2021] border border-slate-200 dark:border-[#27272a] hover:bg-slate-50 dark:hover:bg-[#292a2b] rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              View All Trips
            </button>
          </div>
        </header>

        {/* SCROLLABLE CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 md:p-8 space-y-6">
          {/* OPERATIONAL TRIP ASSIGNMENT STATUS BANNER */}
          <div
            className={`rounded-xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-150 shadow-xs ${
              !eligibleForTrips
                ? "bg-[#FEF2F2] dark:bg-rose-950/30 border-[#FECACA] dark:border-rose-800/50 text-[#991B1B] dark:text-rose-300"
                : isExpiringSoon
                  ? "bg-[#FFFBEB] dark:bg-amber-950/30 border-[#FDE68A] dark:border-amber-800/50 text-[#92400E] dark:text-amber-300"
                  : "bg-[#F0FDF4] dark:bg-emerald-950/30 border-[#BBF7D0] dark:border-emerald-800/50 text-[#166534] dark:text-emerald-300"
            }`}
          >
            <div className="flex items-start gap-3.5 min-w-0">
              <span
                className={`material-symbols-outlined text-2xl shrink-0 mt-0.5 ${
                  !eligibleForTrips
                    ? "text-rose-600 dark:text-rose-400"
                    : isExpiringSoon
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-[#16A34A] dark:text-emerald-400"
                }`}
                aria-hidden="true"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {!eligibleForTrips
                  ? "cancel"
                  : isExpiringSoon
                    ? "warning"
                    : "check_circle"}
              </span>

              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold tracking-tight">
                  Trip Assignment Status:{" "}
                  {!eligibleForTrips
                    ? "Not Eligible"
                    : isExpiringSoon
                      ? "Needs Attention"
                      : "Eligible"}
                </h2>
                <p className="text-xs sm:text-sm mt-0.5 opacity-90 leading-relaxed">
                  {isInactive
                    ? "Driver is set to Inactive master status."
                    : isExpired
                      ? "Driving license is expired. Cannot be assigned to new trips."
                      : isExpiringSoon
                        ? "Driver is eligible for trips, but driving license is expiring soon and requires renewal."
                        : "Driver is active with a valid driving license."}
                </p>
              </div>
            </div>

            <span
              className={`inline-flex shrink-0 items-center justify-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border self-start sm:self-auto ${
                !eligibleForTrips
                  ? "bg-rose-500/20 text-rose-800 dark:text-rose-300 border-rose-400/40"
                  : isExpiringSoon
                    ? "bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-400/40"
                    : "bg-[#DCFCE7] dark:bg-emerald-900/50 text-[#166534] dark:text-emerald-300 border-[#BBF7D0] dark:border-emerald-700/50"
              }`}
            >
              {!eligibleForTrips
                ? "Ineligible"
                : isExpiringSoon
                  ? "Needs Attention"
                  : "Ready For Trips"}
            </span>
          </div>

          {/* MAIN 2-COLUMN GRID (Data Sections + Operational Context) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT 8 COLS: Master Data & Details */}
            <div className="lg:col-span-8 space-y-6">
              {/* SECTION 1: Personal Information */}
              <div className="bg-slate-50/50 dark:bg-[#16181b] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-xs">
                <DetailSection title="1. Personal Information">
                  <DetailItem label="Driver Code" value={driver.driverCode} />
                  <DetailItem label="Driver Name" value={fullDisplayName} />
                  <DetailItem label="Date of Birth">
                    <span>{formatDate(driver.dateOfBirth)}</span>
                    {age && (
                      <span className="ml-1.5 text-slate-500 dark:text-[#958ea0] font-normal">
                        ({age})
                      </span>
                    )}
                  </DetailItem>
                  <DetailItem label="Master Status">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                        driver.isActive !== false
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20"
                      }`}
                    >
                      {driver.isActive !== false ? "Active" : "Inactive"}
                    </span>
                  </DetailItem>
                </DetailSection>
              </div>

              {/* SECTION 2: Driving License Information */}
              <div className="bg-slate-50/50 dark:bg-[#16181b] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-xs">
                <DetailSection
                  title="2. Driving License Information"
                  rightElement={
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border whitespace-nowrap ${
                        STATUS_BADGES[licenseStatus.value] ||
                        STATUS_BADGES.not_provided
                      }`}
                    >
                      {licenseStatus.label}
                    </span>
                  }
                >
                  <DetailItem
                    label="License Number"
                    action={
                      driver.licenseNumber ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(driver.licenseNumber, "licenseNumber")
                          }
                          title="Copy License Number"
                          aria-label="Copy License Number"
                          className="text-slate-400 hover:text-violet-600 dark:hover:text-[#d0bcff] transition-colors cursor-pointer"
                        >
                          <span
                            className="material-symbols-outlined text-[13px]"
                            aria-hidden="true"
                          >
                            {copiedKey === "licenseNumber"
                              ? "check"
                              : "content_copy"}
                          </span>
                        </button>
                      ) : null
                    }
                  >
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {driver.licenseNumber || "—"}
                    </span>
                  </DetailItem>

                  <DetailItem label="License Type" value={licenseTypeLabel} />

                  <DetailItem
                    label="License Issue Date"
                    value={formatDate(driver.licenseIssueDate)}
                  />

                  <DetailItem label="License Expiry Date">
                    <span
                      className={`font-bold ${
                        licenseStatus.value === "expired"
                          ? "text-rose-600 dark:text-rose-400"
                          : licenseStatus.value === "expiring_soon"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {formatDate(driver.licenseExpiryDate)}
                    </span>
                  </DetailItem>

                  <DetailItem
                    label="Issuing Authority / RTO"
                    value={driver.issuingAuthority}
                  />

                  <DetailItem label="License Status Notice">
                    <p
                      className={`text-xs italic ${
                        licenseStatus.value === "expired"
                          ? "text-rose-600 dark:text-rose-400 font-medium"
                          : licenseStatus.value === "expiring_soon"
                            ? "text-amber-600 dark:text-amber-400 font-medium"
                            : "text-slate-500 dark:text-[#958ea0]"
                      }`}
                    >
                      {licenseStatus.message || "No notice"}
                    </p>
                  </DetailItem>
                </DetailSection>
              </div>

              {/* SECTION 3: Contact Information */}
              <div className="bg-slate-50/50 dark:bg-[#16181b] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-xs">
                <DetailSection title="3. Contact Information">
                  <DetailItem
                    label="Primary Mobile"
                    action={
                      driver.mobile ? (
                        <button
                          type="button"
                          onClick={() => handleCopy(driver.mobile, "mobile")}
                          title="Copy Mobile"
                          aria-label="Copy Mobile"
                          className="text-slate-400 hover:text-violet-600 dark:hover:text-[#d0bcff] transition-colors cursor-pointer"
                        >
                          <span
                            className="material-symbols-outlined text-[13px]"
                            aria-hidden="true"
                          >
                            {copiedKey === "mobile" ? "check" : "content_copy"}
                          </span>
                        </button>
                      ) : null
                    }
                  >
                    {driver.mobile ? (
                      <a
                        href={`tel:${driver.mobile}`}
                        className="font-mono font-bold text-violet-600 dark:text-[#d0bcff] hover:underline"
                      >
                        {driver.mobile}
                      </a>
                    ) : (
                      <span className="font-mono text-slate-400">—</span>
                    )}
                  </DetailItem>

                  <DetailItem label="Alternate Mobile">
                    <span className="font-mono text-slate-700 dark:text-[#e3e2e3]">
                      {driver.alternateMobile || "—"}
                    </span>
                  </DetailItem>

                  <DetailItem label="Email Address">
                    {driver.email ? (
                      <a
                        href={`mailto:${driver.email}`}
                        className="text-violet-600 dark:text-[#d0bcff] hover:underline truncate block"
                      >
                        {driver.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </DetailItem>

                  <div className="col-span-full sm:col-span-2">
                    <DetailItem
                      label="Residential Address"
                      value={driver.address}
                    />
                  </div>

                  <DetailItem label="City" value={cityName} />
                  <DetailItem label="State" value={stateName} />
                  <DetailItem label="PIN Code" value={driver.pinCode} />
                </DetailSection>
              </div>

              {/* SECTION 4: Employment Information */}
              <div className="bg-slate-50/50 dark:bg-[#16181b] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-xs">
                <DetailSection title="4. Employment Information">
                  <DetailItem label="Driver Type" value={driverTypeLabel} />

                  <DetailItem
                    label="Joining Date"
                    value={formatDate(driver.joiningDate)}
                  />

                  <DetailItem
                    label="Employee / Reference ID"
                    value={driver.employeeReferenceId}
                  />

                  <DetailItem label="Daily Rate">
                    {driver.dailyRate !== null &&
                    driver.dailyRate !== undefined &&
                    driver.dailyRate !== "" ? (
                      <span className="font-bold text-slate-900 dark:text-white">
                        ₹{Number(driver.dailyRate).toLocaleString("en-IN")} /
                        day
                      </span>
                    ) : (
                      "—"
                    )}
                  </DetailItem>
                </DetailSection>
              </div>

              {/* SECTION 5: Notes & Audit Information */}
              <div className="bg-slate-50/50 dark:bg-[#16181b] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-xs">
                <DetailSection title="5. Additional Notes & System Audit">
                  <div className="col-span-full">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-[#958ea0] mb-1">
                      Notes
                    </p>
                    <p className="text-sm text-slate-700 dark:text-[#e3e2e3] whitespace-pre-wrap rounded-lg bg-white dark:bg-[#121315] border border-slate-200 dark:border-[#27272a] p-3 min-h-[48px] leading-relaxed">
                      {driver.notes || "No additional notes entered."}
                    </p>
                  </div>

                  <DetailItem
                    label="Record Created"
                    value={
                      driver.createdAt
                        ? new Date(driver.createdAt).toLocaleString("en-IN")
                        : "—"
                    }
                  />

                  <DetailItem
                    label="Last Updated"
                    value={
                      driver.updatedAt
                        ? new Date(driver.updatedAt).toLocaleString("en-IN")
                        : "—"
                    }
                  />
                </DetailSection>
              </div>
            </div>

            {/* RIGHT 4 COLS: Trip Operations & Real-Time Context */}
            <div className="lg:col-span-4 space-y-6">
              {/* CURRENT ASSIGNMENT CARD */}
              <div className="bg-slate-50/50 dark:bg-[#16181b] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 relative overflow-hidden shadow-xs">
                {/* Accent line */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    operational.activeTrip
                      ? "bg-gradient-to-r from-cyan-500 to-violet-600"
                      : "bg-slate-200 dark:bg-[#27272a]"
                  }`}
                />

                <div className="flex items-center justify-between mb-4 mt-0.5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <span
                      className="material-symbols-outlined text-violet-600 dark:text-[#d0bcff] text-[20px]"
                      aria-hidden="true"
                    >
                      local_shipping
                    </span>
                    Current Assignment
                  </h3>
                  {operational.activeTrip && (
                    <span className="font-mono text-xs font-bold text-violet-600 dark:text-[#d0bcff] bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                      {operational.activeTrip.tripCode}
                    </span>
                  )}
                </div>

                {operational.activeTrip ? (
                  <div className="space-y-3.5">
                    {/* Visual Route */}
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center pt-1 shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-400 dark:border-slate-500" />
                        <div className="w-0.5 h-7 bg-slate-300 dark:bg-[#343536] my-0.5" />
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                      </div>
                      <div className="flex flex-col h-14 justify-between min-w-0">
                        <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                          {operational.activeTrip.pickupLocation ||
                            "Pickup Location"}
                        </p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {operational.activeTrip.dropLocation ||
                            "Drop Location"}
                        </p>
                      </div>
                    </div>

                    {/* Vehicle Context */}
                    <div className="rounded-lg bg-white dark:bg-[#121315] border border-slate-200 dark:border-[#27272a] p-3 text-xs space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#958ea0]">
                        Assigned Vehicle
                      </p>
                      <p className="font-mono font-bold text-slate-900 dark:text-white">
                        {operational.activeVehicle?.vehicleNumber ||
                          operational.activeTrip.vehicleNumber ||
                          "—"}
                        {operational.activeVehicle?.model
                          ? ` · ${operational.activeVehicle.model}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200/70 dark:border-[#27272a] pt-3 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-[#958ea0]">
                          Status:{" "}
                        </span>
                        <span className="font-semibold capitalize text-amber-600 dark:text-amber-400">
                          {operational.activeTrip.status?.replace("_", " ")}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleViewTrip(operational.activeTrip)}
                        className="text-violet-600 dark:text-[#d0bcff] hover:underline font-bold text-xs cursor-pointer flex items-center gap-1"
                      >
                        <span>View Trip</span>
                        <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <div className="inline-flex p-2.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mb-2">
                      <span
                        className="material-symbols-outlined text-[22px]"
                        aria-hidden="true"
                      >
                        check_circle
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-[#e3e2e3]">
                      Available for Assignment
                    </p>
                    <p className="text-xs text-slate-500 dark:text-[#958ea0] mt-1">
                      No active trip in progress for this driver.
                    </p>
                  </div>
                )}
              </div>

              {/* UPCOMING TRIP (if exists) */}
              {operational.upcomingTrips.length > 0 && (
                <div className="bg-slate-50/50 dark:bg-[#16181b] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-xs">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                    <span
                      className="material-symbols-outlined text-cyan-600 dark:text-cyan-400 text-[20px]"
                      aria-hidden="true"
                    >
                      event_upcoming
                    </span>
                    Next Trip
                  </h3>

                  {(() => {
                    const nextTrip = operational.upcomingTrips[0];
                    return (
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-violet-600 dark:text-[#d0bcff]">
                            {nextTrip.tripCode}
                          </span>
                          <span className="text-slate-500 dark:text-[#958ea0]">
                            {formatDate(nextTrip.startDateTime)}
                          </span>
                        </div>
                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                          {nextTrip.pickupLocation} → {nextTrip.dropLocation}
                        </p>
                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleViewTrip(nextTrip)}
                            className="text-xs text-violet-600 dark:text-[#d0bcff] hover:underline font-semibold cursor-pointer"
                          >
                            <span>View Details</span>
                            <span aria-hidden="true"> →</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* RECENT TRIPS CARD */}
              <div className="bg-slate-50/50 dark:bg-[#16181b] border border-slate-200 dark:border-[#27272a] rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <span
                      className="material-symbols-outlined text-violet-600 dark:text-[#d0bcff] text-[20px]"
                      aria-hidden="true"
                    >
                      history
                    </span>
                    Recent Trips
                  </h3>
                  {operational.recentTrips.length > 0 && (
                    <button
                      type="button"
                      onClick={handleViewAllTrips}
                      className="text-[11px] text-violet-600 dark:text-[#d0bcff] hover:underline font-bold cursor-pointer"
                    >
                      View All
                    </button>
                  )}
                </div>

                {operational.recentTrips &&
                operational.recentTrips.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-[#27272a]">
                          <th className="font-mono uppercase text-slate-400 dark:text-[#958ea0] pb-2 font-semibold text-[10px]">
                            Trip ID
                          </th>
                          <th className="font-mono uppercase text-slate-400 dark:text-[#958ea0] pb-2 font-semibold text-[10px] pl-2">
                            Route
                          </th>
                          <th className="font-mono uppercase text-slate-400 dark:text-[#958ea0] pb-2 font-semibold text-[10px] text-right">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-[#27272a]">
                        {operational.recentTrips.map((t) => (
                          <tr
                            key={t.id || t.tripCode}
                            onClick={() => handleViewTrip(t)}
                            className="hover:bg-slate-100/70 dark:hover:bg-[#1f2021] transition-colors cursor-pointer group"
                          >
                            <td className="font-mono py-2 font-medium text-slate-700 dark:text-slate-300 group-hover:text-violet-600 dark:group-hover:text-[#d0bcff]">
                              {t.tripCode}
                            </td>
                            <td className="py-2 pl-2 text-slate-600 dark:text-slate-300 max-w-[120px] truncate">
                              {t.pickupLocation} → {t.dropLocation}
                            </td>
                            <td className="py-2 text-right text-slate-400 dark:text-[#958ea0]">
                              {formatDate(t.bookingDate || t.startDateTime)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-[#958ea0] italic py-2">
                    No recent trip history recorded for this driver.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <footer className="p-4 sm:p-5 md:p-6 border-t border-slate-200 dark:border-[#27272a] bg-slate-50/70 dark:bg-[#16181b]/90 flex flex-wrap justify-between items-center gap-3 shrink-0 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg border border-slate-300 dark:border-[#38393a] text-slate-700 dark:text-[#e3e2e3] font-semibold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-[#202227] transition-colors cursor-pointer"
          >
            Close
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleEditClick}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-700 text-white font-semibold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <span
                className="material-symbols-outlined text-[18px]"
                aria-hidden="true"
              >
                edit
              </span>
              <span>Edit Driver</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
});

export default DriverDetailsModal;
