import { useState, useEffect, useMemo } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
  useLocation,
} from "react-router-dom";

import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Toast from "../../components/ui/Toast";

import CustomerBillingProfileCard from "../../components/invoices/CustomerBillingProfileCard";
import TripSummaryCard from "../../components/invoices/TripSummaryCard";
import BillableItemsTable from "../../components/invoices/BillableItemsTable";
import InvoiceSummaryCard from "../../components/invoices/InvoiceSummaryCard";
import CustomerEditInlineModal from "../../components/invoices/CustomerEditInlineModal";
import InvoicePreviewModal from "../../components/invoices/InvoicePreviewModal";
import IssueConfirmModal from "../../components/invoices/IssueConfirmModal";
import IssueSuccessModal from "../../components/invoices/IssueSuccessModal";
import InvoiceDetailsModal from "../../components/invoices/InvoiceDetailsModal";
import RecordPaymentModal from "../../components/invoices/RecordPaymentModal";
import TripDetailsModal from "../../components/trips/TripDetailsModal";

import { getTrips, getTripById } from "../../services/tripService";
import { getCustomers, getCustomerById } from "../../services/customerService";
import { getVehicles, getVehicleById } from "../../services/vehicleService";
import { getDrivers, getDriverById } from "../../services/driverService";
import {
  getInvoices,
  saveInvoice,
  updateInvoice,
  recordPayment,
} from "../../services/invoiceService";
import { getNextInvoiceCode } from "../../services/invoiceCodeService";

import {
  populateBillableItemsFromTrip,
  calculateDueDate,
  checkCustomerBillingValidation,
  formatPaymentTerms,
} from "../../utils/tripToInvoice";
import { calculateInvoiceTaxes } from "../../utils/taxCalculation";

const DOCUMENT_TYPE_OPTIONS = [
  { label: "Tax Invoice (Standard GST)", value: "tax_invoice" },
  { label: "Proforma Invoice / Quotation", value: "proforma" },
  { label: "Consolidated Billing Invoice", value: "consolidated" },
];

export default function GenerateInvoice() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tripId: paramTripId } = useParams();
  const [searchParams] = useSearchParams();
  const queryTripId = searchParams.get("tripId");

  const effectiveTripId =
    paramTripId || queryTripId || location.state?.tripId || "";

  // Data collections
  const [allTrips, setAllTrips] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);

  // Selected Entities
  const [selectedTripId, setSelectedTripId] = useState(effectiveTripId);
  const [trip, setTrip] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [driver, setDriver] = useState(null);

  // Invoice Form Fields
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [documentType, setDocumentType] = useState("tax_invoice");
  const [documentStatus] = useState("draft");
  const [issueDate, setIssueDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [dueDate, setDueDate] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [items, setItems] = useState([]);
  const [existingDraftId, setExistingDraftId] = useState(null);

  // Feedback & UI State
  const [toast, setToast] = useState(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isTripDetailsOpen, setIsTripDetailsOpen] = useState(false);
  const [isExistingInvoiceModalOpen, setIsExistingInvoiceModalOpen] =
    useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [issuedInvoice, setIssuedInvoice] = useState(null);

  // Load datasets
  useEffect(async () => {
    try {
      const storedTrips = getTrips();
      const storedCustomers = await getCustomers();
      const storedVehicles = getVehicles();
      const storedDrivers = getDrivers();
      const storedInvoices = getInvoices();

      setAllTrips(storedTrips || []);
      setAllCustomers(storedCustomers || []);
      setAllVehicles(storedVehicles || []);
      setAllDrivers(storedDrivers || []);
      setAllInvoices(storedInvoices || []);

      // If no trip selected and completed trips exist, pick the first completed one or default
      if (!selectedTripId && storedTrips.length > 0) {
        const completedTrip = storedTrips.find((t) => t.status === "completed");
        if (completedTrip) {
          setSelectedTripId(completedTrip.id);
        } else {
          setSelectedTripId(storedTrips[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load initial data:", err);
      setToast({
        message: "Failed to load trip and master records.",
        variant: "error",
      });
    }
  }, [selectedTripId]);

  // When selected trip changes, populate all dependent data
  useEffect(() => {
    if (!selectedTripId) return;

    const currentTrip =
      getTripById(selectedTripId) ||
      allTrips.find((t) => t.id === selectedTripId);
    if (!currentTrip) return;

    setTrip(currentTrip);

    // Resolve Customer
    const currentCustomer =
      getCustomerById(currentTrip.customerId) ||
      allCustomers.find(
        (c) =>
          c.id === currentTrip.customerId ||
          c.customerCode === currentTrip.customerId,
      );
    setCustomer(currentCustomer || null);

    // Resolve Vehicle & Driver
    const currentVehicle =
      getVehicleById(currentTrip.vehicleId) ||
      allVehicles.find((v) => v.id === currentTrip.vehicleId);
    setVehicle(currentVehicle || null);

    const currentDriver =
      getDriverById(currentTrip.driverId) ||
      allDrivers.find((d) => d.id === currentTrip.driverId);
    setDriver(currentDriver || null);

    // Check if an existing invoice or draft is already linked to this trip
    const existingInv = allInvoices.find(
      (inv) =>
        inv.tripId === currentTrip.id ||
        (inv.tripCode && inv.tripCode === currentTrip.tripCode),
    );

    if (existingInv && existingInv.documentStatus === "draft") {
      setExistingDraftId(existingInv.id);
      setInvoiceNumber(existingInv.invoiceNumber);
      setDocumentType(existingInv.documentType || "tax_invoice");
      setIssueDate(
        existingInv.issueDate || new Date().toISOString().split("T")[0],
      );
      setDueDate(
        existingInv.dueDate ||
          calculateDueDate(
            existingInv.issueDate,
            currentCustomer?.paymentTerms,
          ),
      );
      setPoNumber(
        existingInv.paymentReference || currentTrip.referenceNumber || "",
      );
      setInvoiceNotes(existingInv.notes || "");
      if (Array.isArray(existingInv.items) && existingInv.items.length > 0) {
        setItems(existingInv.items);
      } else {
        setItems(populateBillableItemsFromTrip(currentTrip));
      }
    } else {
      setExistingDraftId(null);
      // Generate standard Next Code (e.g. INV-2026-086)
      try {
        const nextCode = getNextInvoiceCode("tax_invoice", false);
        setInvoiceNumber(nextCode);
      } catch {
        setInvoiceNumber("INV-2026-086");
      }

      setPoNumber(currentTrip.referenceNumber || "");
      setInvoiceNotes(
        currentTrip.notes ? `Trip Note: ${currentTrip.notes}` : "",
      );

      // Auto populate Billable Items
      const derivedItems = populateBillableItemsFromTrip(currentTrip);
      setItems(derivedItems);

      // Auto derive Due Date from issueDate + customer payment terms
      const today = new Date().toISOString().split("T")[0];
      setIssueDate(today);
      const computedDue = calculateDueDate(
        today,
        currentCustomer?.paymentTerms || currentCustomer?.creditDays,
      );
      setDueDate(computedDue);
    }
  }, [
    selectedTripId,
    allTrips,
    allCustomers,
    allVehicles,
    allDrivers,
    allInvoices,
  ]);

  // Recalculate Due Date whenever Issue Date or Customer changes (if operator has not customized it manually)
  const handleIssueDateChange = (newDate) => {
    setIssueDate(newDate);
    const updatedDueDate = calculateDueDate(
      newDate,
      customer?.paymentTerms || customer?.creditDays,
    );
    setDueDate(updatedDueDate);
  };

  // Check if an existing issued invoice exists for this trip (duplicate protection)
  const existingIssuedInvoice = useMemo(() => {
    if (!trip) return null;
    return allInvoices.find(
      (inv) =>
        (inv.tripId === trip.id ||
          (inv.tripCode && inv.tripCode === trip.tripCode)) &&
        inv.documentStatus !== "cancelled",
    );
  }, [trip, allInvoices]);

  // Calculate live taxes and totals
  const taxCalculation = useMemo(() => {
    return calculateInvoiceTaxes({
      items,
      customer,
      customerGstin: customer?.gstin || customer?.gstNumber,
      customerState: customer?.billingState || customer?.state,
    });
  }, [items, customer]);

  // Validation status for Customer Billing Profile
  const billingValidation = useMemo(() => {
    return checkCustomerBillingValidation(customer, documentType);
  }, [customer, documentType]);

  // Customer updated from Inline Fix Modal
  const handleCustomerUpdated = (updatedCustomer) => {
    setCustomer(updatedCustomer);
    // Update master customer in allCustomers list
    setAllCustomers((prev) =>
      prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c)),
    );
    // Recalculate due date based on any new payment terms
    const updatedDueDate = calculateDueDate(
      issueDate,
      updatedCustomer.paymentTerms,
    );
    setDueDate(updatedDueDate);
    setToast({
      message: "Customer billing profile updated successfully.",
      variant: "success",
    });
  };

  // Action: Save Draft
  const handleSaveDraft = () => {
    if (!customer) {
      setToast({
        message: "A valid customer must be linked to save draft.",
        variant: "error",
      });
      return;
    }

    setIsSavingDraft(true);
    try {
      const draftPayload = {
        invoiceNumber: invoiceNumber.startsWith("INV-")
          ? `DRAFT-${invoiceNumber.replace("INV-2026-", "")}`
          : invoiceNumber,
        documentType,
        documentStatus: "draft",
        paymentStatus: "unpaid",
        customerId: customer.id,
        customerName: customer.billingName || customer.name,
        customerCode: customer.customerCode || "",
        customerGstin: customer.gstin || customer.gstNumber || "",
        tripId: trip ? trip.id : null,
        tripCode: trip ? trip.tripCode : "",
        route: trip
          ? `${trip.pickupLocation || ""} → ${trip.dropLocation || ""}`
          : "",
        pickupLocation: trip?.pickupLocation || "",
        dropLocation: trip?.dropLocation || "",
        isConsolidated: false,
        consolidatedTripsCount: 1,
        consolidatedPeriod: "",
        issueDate,
        dueDate,
        subtotal: taxCalculation.subtotal,
        taxRate: taxCalculation.isInterState
          ? taxCalculation.taxRows[0]?.rate || 18
          : 18,
        taxAmount: taxCalculation.totalTax,
        discountAmount: 0,
        totalAmount: taxCalculation.grandTotal,
        paidAmount: 0,
        outstandingAmount: taxCalculation.grandTotal,
        paymentTerms: formatPaymentTerms(customer.paymentTerms),
        paymentReference: poNumber,
        notes: invoiceNotes,
        items,
      };

      let saved;
      if (existingDraftId) {
        saved = updateInvoice(existingDraftId, draftPayload);
      } else {
        saved = saveInvoice(draftPayload);
        setExistingDraftId(saved.id);
      }

      setInvoiceNumber(saved.invoiceNumber);
      setToast({
        message: `Draft invoice ${saved.invoiceNumber} saved successfully.`,
        variant: "success",
      });
    } catch (err) {
      console.error("Failed to save draft:", err);
      setToast({
        message: err.message || "Failed to save draft invoice.",
        variant: "error",
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Action: Trigger Issue Workflow
  const handleInitiateIssue = () => {
    if (!customer) {
      setToast({
        message: "Please link a valid customer profile before issuing.",
        variant: "error",
      });
      return;
    }

    if (items.length === 0 || taxCalculation.grandTotal <= 0) {
      setToast({
        message:
          "Invoice must contain at least one billable item with positive amount.",
        variant: "error",
      });
      return;
    }

    // Open explicit confirmation dialog
    setIsConfirmModalOpen(true);
  };

  // Action: Confirm and Finalize Issuance
  const handleConfirmIssue = () => {
    setIsIssuing(true);
    try {
      // Ensure official INV- format
      let finalInvoiceNumber = invoiceNumber;
      if (finalInvoiceNumber.startsWith("DRAFT-")) {
        finalInvoiceNumber = getNextInvoiceCode(documentType, false);
      }

      const invoicePayload = {
        invoiceNumber: finalInvoiceNumber,
        documentType,
        documentStatus: "issued",
        paymentStatus: trip?.paymentStatus === "paid" ? "paid" : "unpaid",
        customerId: customer.id,
        customerName: customer.billingName || customer.name,
        customerCode: customer.customerCode || "",
        customerGstin: customer.gstin || customer.gstNumber || "",
        tripId: trip ? trip.id : null,
        tripCode: trip ? trip.tripCode : "",
        route: trip
          ? `${trip.pickupLocation || ""} → ${trip.dropLocation || ""}`
          : "",
        pickupLocation: trip?.pickupLocation || "",
        dropLocation: trip?.dropLocation || "",
        isConsolidated: false,
        consolidatedTripsCount: 1,
        consolidatedPeriod: "",
        issueDate,
        dueDate,
        subtotal: taxCalculation.subtotal,
        taxRate: taxCalculation.isInterState
          ? taxCalculation.taxRows[0]?.rate || 18
          : 18,
        taxAmount: taxCalculation.totalTax,
        discountAmount: 0,
        totalAmount: taxCalculation.grandTotal,
        paidAmount:
          trip?.paymentStatus === "paid" ? taxCalculation.grandTotal : 0,
        outstandingAmount:
          trip?.paymentStatus === "paid" ? 0 : taxCalculation.grandTotal,
        paymentTerms: formatPaymentTerms(customer.paymentTerms),
        paymentReference: poNumber,
        notes: invoiceNotes,
        items,
      };

      let finalized;
      if (existingDraftId) {
        finalized = updateInvoice(existingDraftId, invoicePayload);
      } else {
        finalized = saveInvoice(invoicePayload);
      }

      // Update local invoice list cache
      setAllInvoices((prev) => [
        finalized,
        ...prev.filter((i) => i.id !== finalized.id),
      ]);
      setIssuedInvoice(finalized);
      setIsConfirmModalOpen(false);
      setIsSuccessModalOpen(true);
    } catch (err) {
      console.error("Failed to issue invoice:", err);
      setToast({
        message: err.message || "Failed to issue invoice document.",
        variant: "error",
      });
    } finally {
      setIsIssuing(false);
    }
  };

  // Record payment from success modal
  const handleOpenPayment = () => {
    setIsSuccessModalOpen(false);
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = (pmtData) => {
    if (!issuedInvoice?.id) return;
    try {
      const updated = recordPayment(issuedInvoice.id, pmtData);
      setIssuedInvoice(updated);
      setToast({
        message: `Payment of ₹${Number(pmtData.amount).toLocaleString("en-IN")} recorded successfully.`,
        variant: "success",
      });
      setIsPaymentModalOpen(false);
    } catch (err) {
      setToast({
        message: err.message || "Failed to record payment.",
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast feedback */}
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      {/* Top Header Row (Stitch Visual Reference) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Generate Invoice
            </h1>
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
              {documentStatus === "draft" ? "DRAFT" : "ISSUED"}
            </span>
          </div>
          <p className="font-mono text-xs text-muted mt-1">
            # {invoiceNumber || "INV-2026-—"}
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            className="text-xs"
          >
            {isSavingDraft ? "Saving..." : "Save Draft"}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsPreviewModalOpen(true)}
            className="text-xs"
          >
            <span className="material-symbols-outlined text-[16px] mr-1">
              preview
            </span>
            Preview
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={handleInitiateIssue}
            disabled={
              isIssuing ||
              Boolean(
                existingIssuedInvoice &&
                existingIssuedInvoice.documentStatus === "issued",
              )
            }
            className="text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-[16px] mr-1">
              send
            </span>
            Issue Invoice
          </Button>
        </div>
      </div>

      {/* Trip Switcher / Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card text-xs">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-muted">
            local_shipping
          </span>
          <span className="font-medium text-foreground">
            Active Source Trip:
          </span>
        </div>
        <div className="w-full sm:w-96">
          <Select
            value={selectedTripId}
            onChange={(e) => {
              setSelectedTripId(e.target.value);
              navigate(`/invoices/generate?tripId=${e.target.value}`, {
                replace: true,
              });
            }}
            options={allTrips.map((t) => {
              const cust = allCustomers.find((c) => c.id === t.customerId);
              return {
                value: t.id,
                label: `${t.tripCode} · ${cust?.name || "Customer"} · ${t.pickupLocation} → ${t.dropLocation} (${t.status})`,
              };
            })}
          />
        </div>
      </div>

      {/* Duplicate Invoice Alert (Protection against accidental double billing) */}
      {existingIssuedInvoice &&
        existingIssuedInvoice.documentStatus === "issued" && (
          <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200">
                <span className="material-symbols-outlined text-[18px]">
                  info
                </span>
              </div>
              <div>
                <span className="font-bold text-sm block">
                  Invoice Already Generated
                </span>
                <p className="mt-0.5 text-amber-700 dark:text-amber-300">
                  An active invoice{" "}
                  <span className="font-mono font-bold text-foreground">
                    {existingIssuedInvoice.invoiceNumber}
                  </span>{" "}
                  was already issued for trip {trip?.tripCode}.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsExistingInvoiceModalOpen(true)}
              className="text-xs shrink-0"
            >
              View Existing Invoice
            </Button>
          </div>
        )}

      {/* Missing Information Alert Banner (Stitch visual match) */}
      {billingValidation.hasCriticalMissing && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 flex flex-wrap items-center justify-between gap-3 text-xs text-rose-900 dark:text-rose-200">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-200 dark:bg-rose-900 text-rose-700 dark:text-rose-200">
              <span className="material-symbols-outlined text-[18px]">
                error
              </span>
            </div>
            <div>
              <span className="font-bold text-sm block">
                {billingValidation.missing[0]?.title ||
                  "Missing Critical Billing Information"}
              </span>
              <p className="mt-0.5 text-rose-700 dark:text-rose-300">
                {billingValidation.missing[0]?.description ||
                  "The customer profile is missing a valid GSTIN. This is required for generating tax-compliant invoices."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCustomerModalOpen(true)}
            className="font-bold text-xs text-rose-700 dark:text-rose-300 hover:underline px-3 py-1 rounded bg-rose-100 dark:bg-rose-900/50 transition-colors shrink-0"
          >
            Fix
          </button>
        </div>
      )}

      {/* Main 2-Column Responsive Layout (Stitch Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 Cols on large, full on mobile) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Customer Billing Profile Card */}
          <CustomerBillingProfileCard
            customer={customer}
            onEditCustomer={() => setIsCustomerModalOpen(true)}
            isMissingGstin={!customer?.gstin && !customer?.gstNumber}
            isMissingAddress={!customer?.billingAddress && !customer?.address}
          />

          {/* Trip Summary Card */}
          <TripSummaryCard
            trip={trip}
            vehicle={vehicle}
            driver={driver}
            onViewTrip={() => setIsTripDetailsOpen(true)}
          />

          {/* Invoice Metadata Section */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-xs transition-colors space-y-4">
            <div className="border-b border-border pb-3">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted">
                INVOICE METADATA & SCHEDULE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Invoice Date */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Invoice Date
                </label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => handleIssueDateChange(e.target.value)}
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Due Date ({formatPaymentTerms(customer?.paymentTerms)})
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Document Type */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Document Type
                </label>
                <Select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  options={DOCUMENT_TYPE_OPTIONS}
                />
              </div>

              {/* Customer PO / Reference */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Customer PO / Reference
                </label>
                <Input
                  type="text"
                  placeholder="e.g. PO-8821 / BK-APX"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                />
              </div>
            </div>

            {/* Billing Notes / Instructions */}
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Invoice Notes / Billing Remarks
              </label>
              <textarea
                rows={2}
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                placeholder="Add payment terms, banking notes, or service remarks..."
                className="w-full rounded-md border border-border bg-input px-3 py-2 text-xs text-foreground placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              />
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols on large, full on mobile) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Billable Items Table */}
          <BillableItemsTable
            items={items}
            onUpdateItems={(newItems) => setItems(newItems)}
          />

          {/* Invoice Summary Card */}
          <InvoiceSummaryCard taxCalculationResult={taxCalculation} />
        </div>
      </div>

      {/* MODALS */}

      {/* Customer Fix / Edit Inline Modal */}
      {isCustomerModalOpen && (
        <CustomerEditInlineModal
          open={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          customer={customer}
          onCustomerUpdated={handleCustomerUpdated}
        />
      )}

      {/* Trip Details Modal */}
      {isTripDetailsOpen && trip && (
        <TripDetailsModal
          open={isTripDetailsOpen}
          onClose={() => setIsTripDetailsOpen(false)}
          trip={trip}
          customer={customer}
          vehicle={vehicle}
          driver={driver}
        />
      )}

      {/* Invoice Full Preview Modal */}
      {isPreviewModalOpen && (
        <InvoicePreviewModal
          open={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          invoiceNumber={invoiceNumber}
          customer={customer}
          trip={trip}
          vehicle={vehicle}
          driver={driver}
          issueDate={issueDate}
          dueDate={dueDate}
          paymentTerms={formatPaymentTerms(customer?.paymentTerms)}
          items={items}
          taxCalculationResult={taxCalculation}
          notes={invoiceNotes}
          poNumber={poNumber}
          onProceedToIssue={handleInitiateIssue}
        />
      )}

      {/* Issue Confirmation Modal */}
      {isConfirmModalOpen && (
        <IssueConfirmModal
          open={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          invoiceNumber={invoiceNumber}
          customerName={customer?.billingName || customer?.name || "Customer"}
          tripCode={trip?.tripCode}
          grandTotal={taxCalculation.grandTotal}
          dueDate={dueDate}
          onConfirm={handleConfirmIssue}
          isIssuing={isIssuing}
        />
      )}

      {/* Issue Success Modal */}
      {isSuccessModalOpen && issuedInvoice && (
        <IssueSuccessModal
          open={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
          invoice={issuedInvoice}
          onViewInvoice={() => {
            setIsSuccessModalOpen(false);
            setIsExistingInvoiceModalOpen(true);
          }}
          onRecordPayment={handleOpenPayment}
          onNavigateTrips={() => navigate("/trips")}
          onNavigateInvoices={() => navigate("/invoices")}
        />
      )}

      {/* View Existing Invoice Modal */}
      {isExistingInvoiceModalOpen &&
        (existingIssuedInvoice || issuedInvoice) && (
          <InvoiceDetailsModal
            open={isExistingInvoiceModalOpen}
            onClose={() => setIsExistingInvoiceModalOpen(false)}
            invoice={issuedInvoice || existingIssuedInvoice}
            onRecordPayment={() => {
              setIsExistingInvoiceModalOpen(false);
              setIsPaymentModalOpen(true);
            }}
          />
        )}

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (issuedInvoice || existingIssuedInvoice) && (
        <RecordPaymentModal
          open={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          invoice={issuedInvoice || existingIssuedInvoice}
          onSavePayment={handleSavePayment}
        />
      )}
    </div>
  );
}
