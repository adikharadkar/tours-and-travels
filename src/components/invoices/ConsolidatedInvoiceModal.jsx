import { useState, useEffect, useMemo } from "react";
import Modal, { ModalTitle, ModalDescription } from "../ui/Modal";
import Button from "../ui/Button";
import { formatINR } from "../../utils/invoiceStatus";
import {
  BILLING_PERIOD_PRESETS,
  getBillingPeriodDates,
  getTripEligibility,
  aggregateTripCharges,
  getCustomerBillingContext,
  isCustomerMatch,
} from "../../utils/ConsolidatedInvoice";
import CorporateCustomerSelector from "./CorporateCustomerSelector";
import PaymentTermsSelector from "./PaymentTermsSelector";

function ConsolidatedInvoiceModal({
  isOpen,
  open,
  onClose,
  customers = [],
  trips = [],
  invoices = [],
  onSaveInvoice,
  initialCustomerId = "",
}) {
  const isModalOpen = open !== undefined ? open : isOpen;

  // Selected customer
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  // Billing Period
  const [datePreset, setDatePreset] = useState("this_month");
  const [customStartDate, setCustomStartDate] = useState("2026-08-01");
  const [customEndDate, setCustomEndDate] = useState("2026-08-31");

  // Selected Trip IDs for the consolidated invoice
  const [selectedTripIds, setSelectedTripIds] = useState(new Set());

  // Trip filter view inside the table: 'all' | 'eligible' | 'ineligible'
  const [tripFilterTab, setTripFilterTab] = useState("all");

  // Custom adjustments (e.g., volume discount, special detention surcharge)
  const [adjustments, setAdjustments] = useState([]);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [newAdjDesc, setNewAdjDesc] = useState("");
  const [newAdjAmount, setNewAdjAmount] = useState("");

  // Invoice parameters
  const [issueDate, setIssueDate] = useState("2026-08-25");
  const [dueDate, setDueDate] = useState("2026-09-24");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  // Initialize customer on modal open
  useEffect(() => {
    if (isModalOpen) {
      setError("");
      const initialCust =
        initialCustomerId ||
        (customers.length > 0
          ? customers[0].id || customers[0].customerCode
          : "");
      setSelectedCustomerId(initialCust);

      const period = getBillingPeriodDates("this_month", "", "", "2026-08-25");
      setCustomStartDate(period.startDate);
      setCustomEndDate(period.endDate);
      setDatePreset("this_month");
    }
  }, [isModalOpen, initialCustomerId, customers]);

  // Current active customer record
  const currentCustomer = useMemo(() => {
    return (
      customers.find(
        (c) =>
          c.id === selectedCustomerId ||
          c.customerCode === selectedCustomerId ||
          isCustomerMatch(c.id, selectedCustomerId),
      ) || null
    );
  }, [customers, selectedCustomerId]);

  // Billing period date calculation
  const {
    startDate,
    endDate,
    label: periodLabel,
  } = useMemo(() => {
    return getBillingPeriodDates(
      datePreset,
      customStartDate,
      customEndDate,
      "2026-08-25",
    );
  }, [datePreset, customStartDate, customEndDate]);

  // Customer billing & credit metadata context
  const billingContext = useMemo(() => {
    return getCustomerBillingContext(currentCustomer);
  }, [currentCustomer]);

  // Update payment terms and due date when customer changes
  useEffect(() => {
    if (billingContext.paymentTerms) {
      setPaymentTerms(billingContext.paymentTerms);
      // Auto compute due date based on payment terms
      const d = new Date(issueDate || "2026-08-25");
      let daysToAdd = 30;
      if (billingContext.paymentTerms.includes("15")) daysToAdd = 15;
      else if (billingContext.paymentTerms.includes("45")) daysToAdd = 45;
      else if (billingContext.paymentTerms.includes("60")) daysToAdd = 60;
      else if (billingContext.paymentTerms.includes("Immediate")) daysToAdd = 0;

      d.setDate(d.getDate() + daysToAdd);
      setDueDate(d.toISOString().split("T")[0]);
    }
  }, [billingContext.paymentTerms, issueDate]);

  // Evaluate eligibility for all trips matching this customer and timeframe
  const evaluatedTrips = useMemo(() => {
    if (!selectedCustomerId) return [];

    return trips.map((trip) => {
      const eligibility = getTripEligibility(
        trip,
        invoices,
        selectedCustomerId,
        startDate,
        endDate,
      );
      return {
        ...trip,
        eligibility,
      };
    });
  }, [trips, invoices, selectedCustomerId, startDate, endDate]);

  // Filtered trips for display in the table
  const displayedTrips = useMemo(() => {
    // First filter to trips for this customer or trips within date range
    const customerTrips = evaluatedTrips.filter(
      (t) =>
        isCustomerMatch(t.customerId, selectedCustomerId) ||
        t.eligibility.reasonCode !== "CUSTOMER_MISMATCH",
    );

    if (tripFilterTab === "eligible") {
      return customerTrips.filter((t) => t.eligibility.isEligible);
    }
    if (tripFilterTab === "ineligible") {
      return customerTrips.filter((t) => !t.eligibility.isEligible);
    }
    return customerTrips;
  }, [evaluatedTrips, selectedCustomerId, tripFilterTab]);

  // Automatically select all eligible trips by default when customer or date range changes
  useEffect(() => {
    const eligibleIds = new Set();
    evaluatedTrips.forEach((trip) => {
      if (
        trip.eligibility.isEligible &&
        isCustomerMatch(trip.customerId, selectedCustomerId)
      ) {
        eligibleIds.add(trip.id);
      }
    });
    setSelectedTripIds(eligibleIds);
  }, [evaluatedTrips, selectedCustomerId]);

  // Array of actual selected trip objects
  const selectedTripObjects = useMemo(() => {
    return trips.filter((t) => selectedTripIds.has(t.id));
  }, [trips, selectedTripIds]);

  // Consolidated financial calculations & tax breakdown
  const financialSummary = useMemo(() => {
    return aggregateTripCharges(
      selectedTripObjects,
      adjustments,
      currentCustomer,
    );
  }, [selectedTripObjects, adjustments, currentCustomer]);

  // Toggle single trip selection
  const handleToggleTrip = (trip) => {
    if (!trip.eligibility.isEligible) return;

    setSelectedTripIds((prev) => {
      const next = new Set(prev);
      if (next.has(trip.id)) {
        next.delete(trip.id);
      } else {
        next.add(trip.id);
      }
      return next;
    });
  };

  // Toggle select all eligible trips
  const eligibleCount = evaluatedTrips.filter(
    (t) =>
      t.eligibility.isEligible &&
      isCustomerMatch(t.customerId, selectedCustomerId),
  ).length;

  const areAllEligibleSelected =
    eligibleCount > 0 && selectedTripIds.size >= eligibleCount;

  const handleToggleSelectAll = () => {
    if (areAllEligibleSelected) {
      setSelectedTripIds(new Set());
    } else {
      const allEligible = new Set();
      evaluatedTrips.forEach((t) => {
        if (
          t.eligibility.isEligible &&
          isCustomerMatch(t.customerId, selectedCustomerId)
        ) {
          allEligible.add(t.id);
        }
      });
      setSelectedTripIds(allEligible);
    }
  };

  // Add custom adjustment line
  const handleAddAdjustment = (e) => {
    e.preventDefault();
    if (!newAdjDesc || !newAdjAmount) return;

    setAdjustments((prev) => [
      ...prev,
      {
        id: `adj_${Date.now()}`,
        description: newAdjDesc,
        amount: Number(newAdjAmount),
        taxRate: 12,
      },
    ]);
    setNewAdjDesc("");
    setNewAdjAmount("");
    setShowAdjustmentForm(false);
  };

  const handleRemoveAdjustment = (index) => {
    setAdjustments((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit consolidated invoice
  const handleCreateConsolidated = (targetStatus = "issued") => {
    if (!selectedCustomerId) {
      setError("Please select a valid customer.");
      return;
    }
    if (selectedTripObjects.length === 0) {
      setError("Please select at least one completed trip to consolidate.");
      return;
    }

    const periodDescription =
      datePreset === "custom"
        ? `${startDate} to ${endDate}`
        : `${periodLabel} (${startDate} to ${endDate})`;

    const invoicePayload = {
      customerId: selectedCustomerId,
      customerName: currentCustomer ? currentCustomer.name : "Customer",
      customerCode: currentCustomer ? currentCustomer.customerCode : "",
      customerGstin: billingContext.gstin,
      documentType: "consolidated",
      documentStatus: targetStatus, // 'issued' or 'draft'
      isConsolidated: true,
      consolidatedTripsCount: selectedTripObjects.length,
      consolidatedPeriod: periodDescription,
      tripIds: selectedTripObjects.map((t) => t.id),
      trips: selectedTripObjects.map((t) => ({
        id: t.id,
        tripCode: t.tripCode,
        date: (t.startDateTime || t.bookingDate || "").split("T")[0],
        route: `${t.pickupLocation || ""} → ${t.dropLocation || ""}`,
        vehicleNumber: t.vehicleNumber || "",
        totalAmount: t.totalAmount || t.baseRate || 0,
      })),
      route: `Consolidated Billing (${selectedTripObjects.length} Trips) &bull; ${periodDescription}`,
      issueDate,
      dueDate,
      paymentTerms,
      subtotal: financialSummary.subtotal,
      taxAmount: financialSummary.totalTax,
      totalAmount: financialSummary.grandTotal,
      paidAmount: 0,
      outstandingAmount: financialSummary.grandTotal,
      paymentStatus: "unpaid",
      notes:
        notes ||
        `Consolidated billing for ${selectedTripObjects.length} corporate trips during ${periodDescription}. Payment due per ${paymentTerms} terms.`,
      items: financialSummary.lineItems,
      taxBreakdown: {
        isInterState: financialSummary.isInterState,
        taxRows: financialSummary.taxRows,
        totalCgst: financialSummary.totalCgst,
        totalSgst: financialSummary.totalSgst,
        totalIgst: financialSummary.totalIgst,
        totalTax: financialSummary.totalTax,
        roundOff: financialSummary.roundOff,
      },
    };

    onSaveInvoice(invoicePayload);
    onClose();
  };

  return (
    <Modal
      open={isModalOpen}
      onClose={onClose}
      className="max-w-5xl w-[96vw] max-h-[92vh] flex flex-col p-0 overflow-hidden"
    >
      {/* 1. MODAL HEADER */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-[#121314]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <span className="material-symbols-outlined text-2xl">
              receipt_long
            </span>
          </div>
          <div>
            <ModalTitle className="text-lg font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              Generate Consolidated Invoice
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Multi-Trip Batch
              </span>
            </ModalTitle>
            <ModalDescription className="text-xs text-slate-500 dark:text-zinc-400">
              Combine multiple completed corporate trips into a single
              GST-compliant tax invoice.
            </ModalDescription>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
          aria-label="Close dialog"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      {/* 2. SCROLLABLE BODY CONTENT */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs bg-slate-50/50 dark:bg-[#0c0d0e]">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* 2.1 TOP CONTROLS: Customer Selection & Billing Period */}
        <div className="p-4 rounded-xl bg-white dark:bg-[#151718] border border-slate-200/80 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            {/* Customer stylish selector & drawer */}
            <div className="md:col-span-6 space-y-1.5">
              <CorporateCustomerSelector
                customers={customers}
                trips={trips}
                invoices={invoices}
                selectedCustomerId={selectedCustomerId}
                onSelectCustomer={(cId) => {
                  setSelectedCustomerId(cId);
                  setError("");
                }}
              />
            </div>

            {/* Billing Period Presets */}
            <div className="md:col-span-6 space-y-1.5 pt-0.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-200 flex items-center justify-between">
                <span>Billing Period *</span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                  {startDate} to {endDate}
                </span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {BILLING_PERIOD_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setDatePreset(preset.value)}
                    className={`px-2.5 py-1.5 rounded-md font-medium text-xs transition-all cursor-pointer ${
                      datePreset === preset.value
                        ? "bg-indigo-600 text-white shadow-sm dark:bg-indigo-600"
                        : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Date Range picker inputs if preset is 'custom' */}
          {datePreset === "custom" && (
            <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                  From Date:
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#1b1d1e] text-slate-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                  To Date:
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#1b1d1e] text-slate-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* 2.2 CUSTOMER BILLING & CREDIT CONTEXT STRIP */}
        <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-[#151718] border border-slate-200 dark:border-zinc-800 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 block">
                GSTIN / State
              </span>
              <span className="font-semibold text-slate-900 dark:text-zinc-100">
                {billingContext.gstin || (
                  <span className="text-amber-600 dark:text-amber-400">
                    Not Registered (B2C)
                  </span>
                )}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 block">
                Billing Cycle & Terms
              </span>
              <span className="font-semibold text-slate-900 dark:text-zinc-100">
                {billingContext.billingCycle} &bull; {paymentTerms}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 block">
                Credit Limit
              </span>
              <span className="font-semibold text-slate-900 dark:text-zinc-100">
                {formatINR(billingContext.creditLimit)}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-zinc-400 block">
                Current Outstanding
              </span>
              <span className="font-semibold text-slate-900 dark:text-zinc-100">
                {formatINR(billingContext.outstandingAmount)}
              </span>
            </div>
          </div>

          {/* Context warnings */}
          {billingContext.hasMissingGstin && (
            <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-zinc-800 flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-[11px]">
              <span className="material-symbols-outlined text-sm">warning</span>
              <span>
                GSTIN is missing on client profile. Tax invoice will default to
                Intra-State GST (CGST+SGST).
              </span>
            </div>
          )}

          {billingContext.isPerTripCycle && (
            <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-zinc-800 flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400 text-[11px]">
              <span className="material-symbols-outlined text-sm">info</span>
              <span>
                Note: Client profile is configured for Per-Trip invoicing.
                Consolidating trips will batch all movements into one bill.
              </span>
            </div>
          )}
        </div>

        {/* 2.3 TRIP SELECTION & AUDIT TABLE */}
        <div className="rounded-xl bg-white dark:bg-[#151718] border border-slate-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
          {/* Table Header toolbar with filter tabs */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 dark:bg-[#181a1b]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 dark:text-zinc-200 text-xs">
                Trips in Billing Period
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {selectedTripIds.size} of {eligibleCount} Eligible Selected
              </span>
            </div>

            {/* Quick Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-zinc-800 p-0.5 rounded-lg text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setTripFilterTab("all")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  tripFilterTab === "all"
                    ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                }`}
              >
                All ({displayedTrips.length})
              </button>
              <button
                type="button"
                onClick={() => setTripFilterTab("eligible")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  tripFilterTab === "eligible"
                    ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                }`}
              >
                Eligible ({eligibleCount})
              </button>
              <button
                type="button"
                onClick={() => setTripFilterTab("ineligible")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  tripFilterTab === "ineligible"
                    ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                }`}
              >
                Ineligible (
                {evaluatedTrips.filter((t) => !t.eligibility.isEligible).length}
                )
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="max-h-[300px] overflow-y-auto">
            {displayedTrips.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-zinc-400 space-y-2">
                <span className="material-symbols-outlined text-3xl text-slate-400">
                  search_off
                </span>
                <p className="font-medium text-xs">
                  No completed trips found for the selected customer and billing
                  period.
                </p>
                <p className="text-[11px] text-slate-400">
                  Try adjusting the billing period preset or date range above.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-[#1a1c1d] text-slate-600 dark:text-zinc-300 font-semibold border-b border-slate-200 dark:border-zinc-800 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={areAllEligibleSelected}
                        onChange={handleToggleSelectAll}
                        disabled={eligibleCount === 0}
                        aria-label="Select all eligible trips"
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3">Trip ID & Date</th>
                    <th className="py-2.5 px-3">Route & Vehicle</th>
                    <th className="py-2.5 px-3 text-right">Km / Duration</th>
                    <th className="py-2.5 px-3 text-right">Base / Extra</th>
                    <th className="py-2.5 px-3 text-right">Total (₹)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {displayedTrips.map((trip) => {
                    const isSelected = selectedTripIds.has(trip.id);
                    const isEligible = trip.eligibility.isEligible;
                    const tripDate = (
                      trip.startDateTime ||
                      trip.bookingDate ||
                      ""
                    ).split("T")[0];

                    return (
                      <tr
                        key={trip.id}
                        onClick={() => isEligible && handleToggleTrip(trip)}
                        className={`transition-colors ${
                          !isEligible
                            ? "bg-slate-50/50 dark:bg-zinc-900/30 opacity-60 cursor-not-allowed"
                            : isSelected
                              ? "bg-indigo-50/40 dark:bg-indigo-950/30 hover:bg-indigo-50/60 cursor-pointer"
                              : "hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer"
                        }`}
                      >
                        {/* Checkbox */}
                        <td
                          className="py-2.5 px-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={!isEligible}
                            onChange={() => handleToggleTrip(trip)}
                            aria-label={`Select trip ${trip.tripCode}`}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                          />
                        </td>

                        {/* Trip ID & Date */}
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 block">
                            {trip.tripCode}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                            {tripDate}
                          </span>
                        </td>

                        {/* Route & Vehicle */}
                        <td className="py-2.5 px-3">
                          <span className="font-medium text-slate-800 dark:text-zinc-200 block truncate max-w-[220px]">
                            {trip.pickupLocation} → {trip.dropLocation}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                            {trip.vehicleNumber || "Fleet Vehicle"}{" "}
                            {trip.driverName ? `&bull; ${trip.driverName}` : ""}
                          </span>
                        </td>

                        {/* Distance / Duration */}
                        <td className="py-2.5 px-3 text-right font-mono text-[11px]">
                          <div>{trip.totalKm ? `${trip.totalKm} km` : "—"}</div>
                          <div className="text-slate-400">
                            {trip.duration || "Standard"}
                          </div>
                        </td>

                        {/* Base / Extra */}
                        <td className="py-2.5 px-3 text-right font-mono text-[11px]">
                          <div>{formatINR(trip.baseRate || 0)}</div>
                          {(trip.tollCharges > 0 ||
                            trip.extraKmCharges > 0 ||
                            trip.driverCharges > 0) && (
                            <div className="text-slate-500">
                              +
                              {formatINR(
                                (trip.tollCharges || 0) +
                                  (trip.parkingCharges || 0) +
                                  (trip.extraKmCharges || 0) +
                                  (trip.driverCharges || 0),
                              )}
                            </div>
                          )}
                        </td>

                        {/* Total Amount */}
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-zinc-100">
                          {formatINR(trip.totalAmount || trip.baseRate || 0)}
                        </td>

                        {/* Status / Eligibility Reason */}
                        <td className="py-2.5 px-3 text-center">
                          {isEligible ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Eligible
                            </span>
                          ) : (
                            <span
                              title={trip.eligibility.reason}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400 truncate max-w-[130px]"
                            >
                              {trip.eligibility.reason}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 2.4 CONSOLIDATED FINANCIAL SUMMARY & TAX BREAKDOWN */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left metrics & invoice terms */}
          <div className="lg:col-span-6 space-y-4">
            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#151718] border border-slate-200 dark:border-zinc-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Trips Included
                </span>
                <span className="text-base font-bold font-mono text-indigo-600 dark:text-indigo-400">
                  {financialSummary.tripsCount}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#151718] border border-slate-200 dark:border-zinc-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Vehicles Used
                </span>
                <span className="text-base font-bold font-mono text-slate-800 dark:text-zinc-200">
                  {financialSummary.vehiclesUsedCount}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#151718] border border-slate-200 dark:border-zinc-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Total Distance
                </span>
                <span className="text-base font-bold font-mono text-slate-800 dark:text-zinc-200">
                  {financialSummary.totalDistanceKm} km
                </span>
              </div>
            </div>

            {/* Invoice Date & Term Settings */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#151718] border border-slate-200 dark:border-zinc-800 space-y-3">
              <div className="font-bold text-slate-800 dark:text-zinc-200 text-xs">
                Invoice Details & Payment Terms
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-indigo-600 dark:text-indigo-400">
                      calendar_today
                    </span>
                    <span>Issue Date *</span>
                  </label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#1b1d1e] text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                <div className="space-y-1">
                  <PaymentTermsSelector
                    value={paymentTerms}
                    onChange={(val) => setPaymentTerms(val)}
                    issueDate={issueDate}
                    dueDate={dueDate}
                    onDueDateChange={(newDue) => setDueDate(newDue)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-indigo-600 dark:text-indigo-400">
                      event_available
                    </span>
                    <span>Invoice Due Date *</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#1b1d1e] text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-indigo-600 dark:text-indigo-400">
                      description
                    </span>
                    <span>PO / Reference # (Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PO-CORP-2026-AUG"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#1b1d1e] text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Remarks textarea */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-indigo-600 dark:text-indigo-400">
                    notes
                  </span>
                  <span>Consolidated Billing Notes / Instructions</span>
                </label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={`e.g. Consolidated corporate monthly logistics bill for ${periodLabel}...`}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-[#1b1d1e] text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Right: Detailed Financial Rollup & Tax Calculation Card */}
          <div className="lg:col-span-6 p-4 rounded-xl bg-white dark:bg-[#151718] border border-slate-200 dark:border-zinc-800 space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400 text-base">
                    account_balance
                  </span>
                  <span className="font-bold text-slate-800 dark:text-zinc-200 text-xs">
                    Financial Breakdown & GST
                  </span>
                </div>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {financialSummary.isInterState
                    ? "Inter-State (IGST 12%)"
                    : "Intra-State (CGST 6% + SGST 6%)"}
                </span>
              </div>

              {/* Line item summaries */}
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                  <span>
                    Base Trip Fares ({financialSummary.tripsCount} trips):
                  </span>
                  <span>{formatINR(financialSummary.baseChargesSum)}</span>
                </div>

                {financialSummary.tollAndMiscChargesSum > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                    <span>Tolls, Parking, Driver & Detention:</span>
                    <span>
                      {formatINR(financialSummary.tollAndMiscChargesSum)}
                    </span>
                  </div>
                )}

                {/* Adjustments */}
                {adjustments.map((adj, idx) => (
                  <div
                    key={adj.id || idx}
                    className="flex justify-between items-center text-indigo-600 dark:text-indigo-400"
                  >
                    <span className="flex items-center gap-1">
                      <span>{adj.description}:</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAdjustment(idx)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        &times;
                      </button>
                    </span>
                    <span>{formatINR(adj.amount)}</span>
                  </div>
                ))}

                {/* Button to add adjustment */}
                {!showAdjustmentForm ? (
                  <button
                    type="button"
                    onClick={() => setShowAdjustmentForm(true)}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 pt-1 cursor-pointer font-sans font-medium"
                  >
                    <span className="material-symbols-outlined text-xs">
                      add_circle
                    </span>
                    <span>Add Credit / Adjustment Line</span>
                  </button>
                ) : (
                  <form
                    onSubmit={handleAddAdjustment}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 flex gap-2 items-center font-sans"
                  >
                    <input
                      type="text"
                      placeholder="e.g. Corporate Discount"
                      value={newAdjDesc}
                      onChange={(e) => setNewAdjDesc(e.target.value)}
                      required
                      className="flex-1 px-2 py-1 text-xs rounded border border-slate-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100"
                    />
                    <input
                      type="number"
                      placeholder="Amount (₹)"
                      value={newAdjAmount}
                      onChange={(e) => setNewAdjAmount(e.target.value)}
                      required
                      className="w-24 px-2 py-1 text-xs rounded border border-slate-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100"
                    />
                    <Button size="xs" variant="primary" type="submit">
                      Add
                    </Button>
                    <button
                      type="button"
                      onClick={() => setShowAdjustmentForm(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  </form>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex justify-between font-semibold text-slate-800 dark:text-zinc-200">
                  <span>Taxable Subtotal:</span>
                  <span className="font-bold">
                    {formatINR(financialSummary.subtotal)}
                  </span>
                </div>

                {/* Explicit GST Taxes Breakdown Box */}
                <div className="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-[#191b1d] border border-slate-200/80 dark:border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-sans font-bold text-slate-700 dark:text-zinc-300 pb-1 border-b border-slate-200/60 dark:border-zinc-800/60">
                    <span>GST Breakdown & Tax Calculation</span>
                    <span className="text-[10px] font-normal text-slate-500 dark:text-zinc-400">
                      Rate: 12% Total
                    </span>
                  </div>

                  {!financialSummary.isInterState ? (
                    // Intra-State: Explicit CGST and SGST Cost Breakdown
                    <div className="space-y-1.5">
                      {/* CGST Row */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-sans">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            CGST
                          </span>
                          <span className="text-slate-700 dark:text-zinc-300 font-medium">
                            Central GST (6%)
                          </span>
                        </div>
                        <span className="font-bold font-mono text-slate-900 dark:text-zinc-100">
                          {formatINR(financialSummary.totalCgst)}
                        </span>
                      </div>

                      {/* SGST Row */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-sans">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            SGST
                          </span>
                          <span className="text-slate-700 dark:text-zinc-300 font-medium">
                            State GST (6%)
                          </span>
                        </div>
                        <span className="font-bold font-mono text-slate-900 dark:text-zinc-100">
                          {formatINR(financialSummary.totalSgst)}
                        </span>
                      </div>

                      {/* Total Combined GST */}
                      <div className="pt-1.5 border-t border-dashed border-slate-200 dark:border-zinc-800 flex justify-between text-[11px] text-slate-600 dark:text-zinc-400">
                        <span>Total Tax (CGST + SGST):</span>
                        <span className="font-semibold text-slate-800 dark:text-zinc-200">
                          {formatINR(
                            financialSummary.totalCgst +
                              financialSummary.totalSgst,
                          )}
                        </span>
                      </div>
                    </div>
                  ) : (
                    // Inter-State: Explicit IGST Cost Breakdown
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-sans">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            IGST
                          </span>
                          <span className="text-slate-700 dark:text-zinc-300 font-medium">
                            Integrated GST (12%)
                          </span>
                        </div>
                        <span className="font-bold font-mono text-slate-900 dark:text-zinc-100">
                          {formatINR(financialSummary.totalIgst)}
                        </span>
                      </div>

                      <div className="pt-1.5 border-t border-dashed border-slate-200 dark:border-zinc-800 flex justify-between text-[11px] text-slate-600 dark:text-zinc-400">
                        <span>Total Inter-State Tax (IGST):</span>
                        <span className="font-semibold text-slate-800 dark:text-zinc-200">
                          {formatINR(financialSummary.totalIgst)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {financialSummary.roundOff !== 0 && (
                  <div className="flex justify-between text-slate-500 dark:text-zinc-400 text-[11px] pt-1">
                    <span>Round Off Adjustment:</span>
                    <span>{formatINR(financialSummary.roundOff)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Grand Total banner */}
            <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block">
                  Consolidated Grand Total
                </span>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400">
                  Includes all applicable taxes & adjustments
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl font-black font-mono text-indigo-950 dark:text-indigo-100">
                  {formatINR(financialSummary.grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. MODAL FOOTER ACTIONS */}
      <div className="px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-[#121314] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
          Ready to consolidate {financialSummary.tripsCount} trips into 1 GST
          tax invoice.
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>

          <Button
            variant="outline"
            onClick={() => handleCreateConsolidated("draft")}
            type="button"
            disabled={selectedTripObjects.length === 0}
          >
            Save as Draft
          </Button>

          <Button
            variant="primary"
            onClick={() => handleCreateConsolidated("issued")}
            type="button"
            disabled={selectedTripObjects.length === 0}
            className="shadow-sm"
          >
            Generate & Issue Invoice ({formatINR(financialSummary.grandTotal)})
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ConsolidatedInvoiceModal;
