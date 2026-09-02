import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import InvoiceOverview from "../../components/invoices/InvoiceOverview";
import InvoiceToolbar from "../../components/invoices/InvoiceToolbar";
import InvoiceTable from "../../components/invoices/InvoiceTable";
import InvoiceMobileCard from "../../components/invoices/InvoiceMobileCard";
import InvoiceMobileSkeleton from "../../components/invoices/InvoiceMobileSkeleton";
import InvoiceMobileFilterDrawer from "../../components/invoices/InvoiceMobileFilterDrawer";
import InvoiceDetailsModal from "../../components/invoices/InvoiceDetailsModal";
import InvoiceActionsDrawer from "../../components/invoices/InvoiceActionsDrawer";
import RecordPaymentModal from "../../components/invoices/RecordPaymentModal";
import NewInvoiceModal from "../../components/invoices/NewInvoiceModal";
import ConsolidatedInvoiceModal from "../../components/invoices/ConsolidatedInvoiceModal";
import ExportModal from "../../components/invoices/ExportModal";
import Pagination from "../../components/ui/Pagination";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Toast from "../../components/ui/Toast";

import {
  getInvoices,
  saveInvoice,
  recordPayment,
  markInvoiceIssued,
  cancelInvoice,
  getInvoiceKPIs,
} from "../../services/invoiceService";
import { getCustomers } from "../../services/customerService";
import { getTrips } from "../../services/tripService";

const ITEMS_PER_PAGE = 8;

export default function InvoiceList() {
  const navigate = useNavigate();
  const location = useLocation();

  // Primary data state
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter and search state
  const [documentType, setDocumentType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [documentStatus, setDocumentStatus] = useState("all");
  const [datePreset, setDatePreset] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");

  // Mobile Filter Drawer state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Sorting and pagination state
  const [sortField, setSortField] = useState("issueDate");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal, drawer and toast state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [actionDrawerInvoice, setActionDrawerInvoice] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [isConsolidatedOpen, setIsConsolidatedOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [invoiceToCancel, setInvoiceToCancel] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Load initial data
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const storedInvoices = getInvoices();
      const storedCustomers = await getCustomers();
      const storedTrips = getTrips();
      setInvoices(storedInvoices || []);
      setCustomers(storedCustomers || []);
      setTrips(storedTrips || []);
    } catch (err) {
      console.error("Failed to load invoice data:", err);
      setError("Unable to load invoices. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle URL query parameters for context-aware filters and modals
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get("status") || params.get("paymentStatus");
    const docStatusParam =
      params.get("documentStatus") || params.get("docStatus");
    const dateParam = params.get("date") || params.get("datePreset");
    const searchParam = params.get("search") || params.get("q");
    const invoiceIdParam = params.get("invoiceId") || params.get("id");
    const customerParam = params.get("customer") || params.get("customerId");
    const docTypeParam = params.get("documentType") || params.get("type");

    if (statusParam) {
      if (statusParam === "overdue") {
        setPaymentStatus("overdue");
      } else if (statusParam === "outstanding" || statusParam === "unpaid") {
        setPaymentStatus("unpaid");
      } else {
        setPaymentStatus(statusParam);
      }
    }
    if (docStatusParam) {
      setDocumentStatus(docStatusParam);
    }
    if (dateParam) {
      setDatePreset(dateParam);
    }
    if (searchParam) {
      setSearchQuery(searchParam);
    }
    if (customerParam) {
      setCustomerFilter(customerParam);
    }
    if (docTypeParam) {
      setDocumentType(docTypeParam);
    }
    if (invoiceIdParam && invoices.length > 0) {
      const found = invoices.find(
        (inv) =>
          inv.id === invoiceIdParam || inv.invoiceNumber === invoiceIdParam,
      );
      if (found) {
        setSelectedInvoice(found);
        setIsDetailsOpen(true);
      }
    }
  }, [location.search, invoices]);

  // Compute live KPIs from actual invoice dataset
  const kpis = useMemo(() => {
    return getInvoiceKPIs(invoices);
  }, [invoices]);

  // Active filters count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (documentType !== "all") count++;
    if (paymentStatus !== "all") count++;
    if (documentStatus !== "all") count++;
    if (customerFilter !== "all") count++;
    if (datePreset !== "all" && datePreset !== "last_30_days") count++;
    if (datePreset === "custom" && (customStartDate || customEndDate)) count++;
    return count;
  }, [
    documentType,
    paymentStatus,
    documentStatus,
    customerFilter,
    datePreset,
    customStartDate,
    customEndDate,
  ]);

  // Reset filters
  const handleResetFilters = () => {
    setDocumentType("all");
    setSearchQuery("");
    setPaymentStatus("all");
    setDocumentStatus("all");
    setDatePreset("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setCustomerFilter("all");
    setCurrentPage(1);
  };

  // Sorting handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  // Filtered & Sorted Invoices
  const filteredInvoices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const now = new Date();

    return invoices
      .filter((inv) => {
        // 1. Document Type Filter
        if (documentType !== "all" && inv.documentType !== documentType) {
          return false;
        }

        // 2. Payment Status Filter
        if (paymentStatus !== "all") {
          if (paymentStatus === "overdue") {
            // Check if actually overdue
            if (
              inv.paymentStatus === "paid" ||
              inv.paymentStatus === "credit" ||
              inv.documentStatus === "draft" ||
              inv.documentStatus === "cancelled"
            ) {
              return false;
            }
            if (!inv.dueDate) return false;
            const due = new Date(inv.dueDate);
            due.setHours(23, 59, 59, 999);
            if (due >= now) return false;
          } else if (inv.paymentStatus !== paymentStatus) {
            return false;
          }
        }

        // 3. Document Status Filter
        if (documentStatus !== "all" && inv.documentStatus !== documentStatus) {
          return false;
        }

        // 4. Customer Filter
        if (customerFilter !== "all") {
          if (
            inv.customerId !== customerFilter &&
            inv.customerCode !== customerFilter
          ) {
            return false;
          }
        }

        // 5. Date Presets Filter
        if (datePreset !== "all" && inv.issueDate) {
          try {
            const invDate = new Date(inv.issueDate);
            const startOfToday = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
            );

            if (datePreset === "today") {
              if (invDate < startOfToday) return false;
            } else if (datePreset === "this_week") {
              const startOfWeek = new Date(startOfToday);
              startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
              if (invDate < startOfWeek) return false;
            } else if (datePreset === "this_month") {
              const startOfMonth = new Date(
                now.getFullYear(),
                now.getMonth(),
                1,
              );
              if (invDate < startOfMonth) return false;
            } else if (datePreset === "last_30_days") {
              const thirtyDaysAgo = new Date(
                now.getTime() - 30 * 24 * 60 * 60 * 1000,
              );
              if (invDate < thirtyDaysAgo) return false;
            } else if (datePreset === "last_month") {
              const startOfLastMonth = new Date(
                now.getFullYear(),
                now.getMonth() - 1,
                1,
              );
              const endOfLastMonth = new Date(
                now.getFullYear(),
                now.getMonth(),
                0,
                23,
                59,
                59,
              );
              if (invDate < startOfLastMonth || invDate > endOfLastMonth)
                return false;
            } else if (datePreset === "this_quarter") {
              const currentQuarter = Math.floor(now.getMonth() / 3);
              const startOfQuarter = new Date(
                now.getFullYear(),
                currentQuarter * 3,
                1,
              );
              if (invDate < startOfQuarter) return false;
            } else if (datePreset === "custom") {
              if (
                customStartDate &&
                new Date(inv.issueDate) < new Date(customStartDate)
              ) {
                return false;
              }
              if (customEndDate) {
                const end = new Date(customEndDate);
                end.setHours(23, 59, 59, 999);
                if (new Date(inv.issueDate) > end) return false;
              }
            }
          } catch {
            // ignore date parse issue
          }
        }

        // 6. Search Query Filter
        if (query) {
          const matchesNumber = (inv.invoiceNumber || "")
            .toLowerCase()
            .includes(query);
          const matchesCustomer = (inv.customerName || "")
            .toLowerCase()
            .includes(query);
          const matchesCustomerCode = (inv.customerCode || "")
            .toLowerCase()
            .includes(query);
          const matchesGstin = (inv.customerGstin || "")
            .toLowerCase()
            .includes(query);
          const matchesTripCode = (inv.tripCode || "")
            .toLowerCase()
            .includes(query);
          const matchesRoute = (inv.route || "").toLowerCase().includes(query);
          const matchesPaymentRef = (inv.paymentReference || "")
            .toLowerCase()
            .includes(query);

          if (
            !matchesNumber &&
            !matchesCustomer &&
            !matchesCustomerCode &&
            !matchesGstin &&
            !matchesTripCode &&
            !matchesRoute &&
            !matchesPaymentRef
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortField === "invoiceNumber") {
          comparison = (a.invoiceNumber || "").localeCompare(
            b.invoiceNumber || "",
          );
        } else if (sortField === "customerName") {
          comparison = (a.customerName || "").localeCompare(
            b.customerName || "",
          );
        } else if (sortField === "issueDate") {
          comparison = new Date(a.issueDate || 0) - new Date(b.issueDate || 0);
        } else if (sortField === "dueDate") {
          comparison = new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
        } else if (sortField === "totalAmount") {
          comparison = Number(a.totalAmount || 0) - Number(b.totalAmount || 0);
        } else if (sortField === "outstandingAmount") {
          comparison =
            Number(a.outstandingAmount || 0) - Number(b.outstandingAmount || 0);
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
  }, [
    invoices,
    documentType,
    searchQuery,
    paymentStatus,
    documentStatus,
    datePreset,
    customStartDate,
    customEndDate,
    customerFilter,
    sortField,
    sortDirection,
  ]);

  // Paginated Invoices
  const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInvoices.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInvoices, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredInvoices.length,
  );

  // Actions
  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailsOpen(true);
  };

  const handleOpenRecordPayment = (invoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentOpen(true);
  };

  const handleSavePayment = (invoiceId, paymentData) => {
    try {
      const updated = recordPayment(invoiceId, paymentData);
      setInvoices(getInvoices());
      setToastMessage({
        type: "success",
        title: "Payment Recorded",
        message: `Successfully recorded payment of ₹${paymentData.amount.toLocaleString()} for ${updated.invoiceNumber}.`,
      });
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice(updated);
      }
    } catch (err) {
      setToastMessage({
        type: "error",
        title: "Payment Failed",
        message: err.message || "Unable to record payment.",
      });
    }
  };

  const handleIssueInvoice = (invoice) => {
    try {
      const updated = markInvoiceIssued(invoice.id);
      setInvoices(getInvoices());
      setToastMessage({
        type: "success",
        title: "Invoice Issued",
        message: `Invoice ${updated.invoiceNumber} has been officially issued.`,
      });
      if (selectedInvoice && selectedInvoice.id === invoice.id) {
        setSelectedInvoice(updated);
      }
    } catch (err) {
      setToastMessage({
        type: "error",
        title: "Action Failed",
        message: err.message || "Unable to issue invoice.",
      });
    }
  };

  const handleConfirmCancelInvoice = () => {
    if (!invoiceToCancel) return;
    try {
      cancelInvoice(invoiceToCancel.id, "Cancelled by user request");
      setInvoices(getInvoices());
      setToastMessage({
        type: "info",
        title: "Invoice Cancelled",
        message: `Invoice ${invoiceToCancel.invoiceNumber} was marked as cancelled.`,
      });
      setInvoiceToCancel(null);
    } catch (err) {
      setToastMessage({
        type: "error",
        title: "Action Failed",
        message: err.message || "Unable to cancel invoice.",
      });
    }
  };

  const handleSaveNewInvoice = (invoiceData) => {
    try {
      const created = saveInvoice(invoiceData);
      setInvoices(getInvoices());
      setToastMessage({
        type: "success",
        title: "Invoice Created",
        message: `Invoice ${created.invoiceNumber} was successfully created.`,
      });
    } catch (err) {
      setToastMessage({
        type: "error",
        title: "Creation Failed",
        message: err.message || "Unable to create invoice.",
      });
    }
  };

  // Human-readable count label for mobile (e.g., "14 Invoices" or "14 Results")
  const mobileCountLabel = useMemo(() => {
    const count = filteredInvoices.length;
    if (activeFilterCount > 0 || searchQuery) {
      return `${count} ${count === 1 ? "Result" : "Results"}`;
    }
    if (paymentStatus === "overdue") {
      return `${count} ${count === 1 ? "Overdue" : "Overdue"}`;
    }
    return `${count} ${count === 1 ? "Invoice" : "Invoices"}`;
  }, [filteredInvoices.length, activeFilterCount, searchQuery, paymentStatus]);

  return (
    <div className="p-3 sm:p-5 md:p-8 max-w-[1400px] mx-auto w-full relative">
      {/* Toast message */}
      {toastMessage && (
        <Toast
          variant={toastMessage.type === "error" ? "error" : "success"}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* ======================================================== */}
      {/* DESKTOP VIEW HEADER & CONTROLS (hidden on mobile/tablet) */}
      {/* ======================================================== */}
      <div className="hidden lg:block">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 font-sans">
              Invoices
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Create, manage and track customer invoices and collections.
            </p>
          </div>

          {/* Header Actions: Export + Consolidated + Generate from Trip + + New Invoice */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="header-export-invoices-btn"
              aria-label="Export Invoices"
              onClick={() => setIsExportOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md border border-slate-200 dark:border-[#27272a] bg-white dark:bg-[#121314] text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-[#1a1b1d] transition-all cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px]">
                file_download
              </span>
              <span>Export</span>
            </button>

            <button
              type="button"
              onClick={() => setIsConsolidatedOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px] text-indigo-600 dark:text-indigo-400">
                receipt_long
              </span>
              <span>Consolidated Invoice</span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/invoices/generate")}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md border border-slate-200 dark:border-[#27272a] bg-white dark:bg-[#121314] text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-[#1a1b1d] transition-all cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">
                bolt
              </span>
              <span>Generate from Trip</span>
            </button>

            <button
              type="button"
              onClick={() => setIsNewInvoiceOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-[#6b38d4] hover:bg-[#5b2cc2] dark:bg-[#a078ff] dark:hover:bg-[#8e5efc] text-white dark:text-[#1e004d] shadow-sm transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[17px] font-bold">
                add
              </span>
              <span>+ New Invoice</span>
            </button>
          </div>
        </div>

        {/* 1. Overview KPIs */}
        <InvoiceOverview kpis={kpis} isLoading={isLoading} />

        {/* 2. Desktop Search and Filter Toolbar */}
        <InvoiceToolbar
          documentType={documentType}
          onDocumentTypeChange={(type) => {
            setDocumentType(type);
            setCurrentPage(1);
          }}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setCurrentPage(1);
          }}
          paymentStatus={paymentStatus}
          onPaymentStatusChange={(s) => {
            setPaymentStatus(s);
            setCurrentPage(1);
          }}
          documentStatus={documentStatus}
          onDocumentStatusChange={(s) => {
            setDocumentStatus(s);
            setCurrentPage(1);
          }}
          datePreset={datePreset}
          onDatePresetChange={(d) => {
            setDatePreset(d);
            setCurrentPage(1);
          }}
          customStartDate={customStartDate}
          onCustomStartDateChange={setCustomStartDate}
          customEndDate={customEndDate}
          onCustomEndDateChange={setCustomEndDate}
          customerFilter={customerFilter}
          onCustomerFilterChange={(c) => {
            setCustomerFilter(c);
            setCurrentPage(1);
          }}
          customers={customers}
          onResetFilters={handleResetFilters}
          activeFilterCount={activeFilterCount}
        />
      </div>

      {/* ======================================================== */}
      {/* MOBILE EXPERIENCE (lg:hidden) - STITCH DESIGN SYSTEM       */}
      {/* ======================================================== */}
      <div className="block lg:hidden space-y-4 mb-4">
        {/* Mobile Search + Filter Row (Stitch style) */}
        <div className="flex items-center gap-2">
          {/* Search input */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 dark:text-zinc-500 pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-8 py-2.5 text-xs rounded-lg bg-white dark:bg-[#121314] border border-slate-200 dark:border-[#27272a] text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  close
                </span>
              </button>
            )}
          </div>

          {/* Filter Button */}
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            aria-label="Filter invoices"
            className={[
              "flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer shadow-2xs shrink-0",
              activeFilterCount > 0
                ? "bg-indigo-50 dark:bg-[#1e1730] border-indigo-300 dark:border-[#a078ff]/60 text-indigo-700 dark:text-[#d0bcff]"
                : "bg-white dark:bg-[#121314] border-slate-200 dark:border-[#27272a] text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-[#1a1b1d]",
            ].join(" ")}
          >
            <span className="material-symbols-outlined text-[17px]">tune</span>
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-[#a078ff]" />
            )}
          </button>
        </div>

        {/* Mobile Title & Results Count Row (Stitch style: Invoices ... 14 Invoices) */}
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 font-sans">
            Invoices
          </h2>
          <span className="font-mono text-xs font-semibold text-slate-500 dark:text-zinc-400 tracking-wider">
            {mobileCountLabel}
          </span>
        </div>

        {/* Mobile Quick Action Buttons Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setIsConsolidatedOpen(true)}
            className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 shadow-2xs cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[16px] text-indigo-600 dark:text-indigo-400">
              receipt_long
            </span>
            <span>Consolidated</span>
          </button>

          <button
            type="button"
            onClick={() => navigate("/invoices/generate")}
            className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white dark:bg-[#121314] border border-slate-200 dark:border-[#27272a] text-slate-700 dark:text-zinc-200 shadow-2xs cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">
              bolt
            </span>
            <span>From Trip</span>
          </button>
        </div>

        {/* Active Filter Chips (if any) */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {documentType !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-[#191a1c] border border-slate-200 dark:border-[#27272a] text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                Type: {documentType.replace("_", " ")}
                <button
                  type="button"
                  onClick={() => setDocumentType("all")}
                  className="hover:text-rose-500 ml-0.5 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}
            {paymentStatus !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-[#191a1c] border border-slate-200 dark:border-[#27272a] text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                Payment: {paymentStatus}
                <button
                  type="button"
                  onClick={() => setPaymentStatus("all")}
                  className="hover:text-rose-500 ml-0.5 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}
            {documentStatus !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-[#191a1c] border border-slate-200 dark:border-[#27272a] text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                Doc: {documentStatus}
                <button
                  type="button"
                  onClick={() => setDocumentStatus("all")}
                  className="hover:text-rose-500 ml-0.5 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}
            {customerFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-[#191a1c] border border-slate-200 dark:border-[#27272a] text-slate-700 dark:text-zinc-300 whitespace-nowrap">
                Customer filtered
                <button
                  type="button"
                  onClick={() => setCustomerFilter("all")}
                  className="hover:text-rose-500 ml-0.5 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-semibold text-indigo-600 dark:text-[#a078ff] hover:underline whitespace-nowrap px-1 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. LOADING & ERROR STATES (Shared across viewports)      */}
      {/* ======================================================== */}
      {isLoading && (
        <>
          {/* Mobile skeleton */}
          <div className="block lg:hidden">
            <InvoiceMobileSkeleton count={3} />
          </div>
          {/* Desktop skeleton placeholder */}
          <div className="hidden lg:block space-y-3">
            <div className="h-12 w-full bg-slate-100 dark:bg-zinc-800/60 rounded-md animate-pulse" />
            <div className="h-64 w-full bg-slate-100 dark:bg-zinc-800/40 rounded-md animate-pulse" />
          </div>
        </>
      )}

      {error && !isLoading && (
        <div className="rounded-xl p-8 border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-center my-6">
          <span className="material-symbols-outlined text-3xl text-rose-500 mb-2">
            error
          </span>
          <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">
            {error}
          </p>
          <button
            type="button"
            onClick={loadData}
            className="mt-3 px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 cursor-pointer shadow-xs transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. EMPTY STATES                                          */}
      {/* ======================================================== */}
      {!isLoading && !error && filteredInvoices.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-[#27272a] bg-white/50 dark:bg-[#121314]/50 p-8 sm:p-12 text-center my-4">
          <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-zinc-600 mb-3 block">
            receipt_long
          </span>

          {invoices.length === 0 ? (
            <>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-zinc-200 mb-1">
                No invoices yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
                Create your first invoice from a completed trip or direct bill.
              </p>
              <button
                type="button"
                onClick={() => setIsNewInvoiceOpen(true)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 dark:bg-[#a078ff] text-white dark:text-[#1e004d] cursor-pointer shadow-sm"
              >
                + New Invoice
              </button>
            </>
          ) : (
            <>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-zinc-200 mb-1">
                No matching invoices found
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
                No invoices match your current search and filter criteria.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 cursor-pointer shadow-2xs"
              >
                Clear Filters
              </button>
            </>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. DESKTOP TABLE VIEW (hidden on mobile)                 */}
      {/* ======================================================== */}
      {!isLoading && !error && filteredInvoices.length > 0 && (
        <div className="hidden lg:block">
          <InvoiceTable
            invoices={paginatedInvoices}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onViewInvoice={handleViewInvoice}
            onOpenActionsDrawer={(invoice) => setActionDrawerInvoice(invoice)}
            onRecordPayment={handleOpenRecordPayment}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MOBILE CARD LIST VIEW (hidden on desktop)             */}
      {/* ======================================================== */}
      {!isLoading && !error && filteredInvoices.length > 0 && (
        <div className="block lg:hidden space-y-3">
          {paginatedInvoices.map((inv) => (
            <InvoiceMobileCard
              key={inv.id}
              invoice={inv}
              onViewInvoice={handleViewInvoice}
              onRecordPayment={handleOpenRecordPayment}
              onIssueInvoice={handleIssueInvoice}
              onCancelInvoice={(invoice) => setInvoiceToCancel(invoice)}
            />
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. PAGINATION FOOTER                                     */}
      {/* ======================================================== */}
      {!isLoading && !error && filteredInvoices.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 pt-3 border-t border-slate-100 dark:border-zinc-800/80 text-xs text-slate-500 dark:text-zinc-400 font-mono">
          <div>
            Showing {startIndex}–{endIndex} of {filteredInvoices.length}{" "}
            {filteredInvoices.length === 1 ? "Invoice" : "Invoices"}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            compact={true}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. FLOATING ACTION BUTTON (+ New Invoice) for Mobile     */}
      {/* ======================================================== */}
      <button
        type="button"
        onClick={() => setIsNewInvoiceOpen(true)}
        aria-label="Create New Invoice"
        className="fixed bottom-6 right-6 z-30 lg:hidden w-14 h-14 rounded-2xl bg-[#d0bcff] hover:bg-[#c2abfc] text-[#1e004d] dark:bg-[#d0bcff] dark:hover:bg-[#c2abfc] dark:text-[#1e004d] shadow-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
      >
        <span className="material-symbols-outlined text-[30px] font-bold">
          add
        </span>
      </button>

      {/* ======================================================== */}
      {/* 9. MOBILE FILTER BOTTOM SHEET DRAWER                     */}
      {/* ======================================================== */}
      <InvoiceMobileFilterDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        documentType={documentType}
        onDocumentTypeChange={(type) => {
          setDocumentType(type);
          setCurrentPage(1);
        }}
        paymentStatus={paymentStatus}
        onPaymentStatusChange={(status) => {
          setPaymentStatus(status);
          setCurrentPage(1);
        }}
        documentStatus={documentStatus}
        onDocumentStatusChange={(status) => {
          setDocumentStatus(status);
          setCurrentPage(1);
        }}
        datePreset={datePreset}
        onDatePresetChange={(preset) => {
          setDatePreset(preset);
          setCurrentPage(1);
        }}
        customStartDate={customStartDate}
        onCustomStartDateChange={setCustomStartDate}
        customEndDate={customEndDate}
        onCustomEndDateChange={setCustomEndDate}
        customerFilter={customerFilter}
        onCustomerFilterChange={(cust) => {
          setCustomerFilter(cust);
          setCurrentPage(1);
        }}
        customers={customers}
        onResetFilters={handleResetFilters}
        activeFilterCount={activeFilterCount}
        resultCount={filteredInvoices.length}
      />

      {/* ======================================================== */}
      {/* 10. MODALS & DRAWERS (Shared across Desktop and Mobile)  */}
      {/* ======================================================== */}
      {/* 0. Invoice Actions Drawer */}
      <InvoiceActionsDrawer
        open={Boolean(actionDrawerInvoice)}
        onClose={() => setActionDrawerInvoice(null)}
        invoice={actionDrawerInvoice}
        customer={customers?.find(
          (c) =>
            c.id === actionDrawerInvoice?.customerId ||
            c.customerCode === actionDrawerInvoice?.customerCode ||
            c.name === actionDrawerInvoice?.customerName,
        )}
        trip={trips?.find(
          (t) =>
            t.id === actionDrawerInvoice?.tripId ||
            t.tripCode === actionDrawerInvoice?.tripCode,
        )}
        onViewDetails={(inv) => {
          setActionDrawerInvoice(null);
          handleViewInvoice(inv);
        }}
        onRecordPayment={(inv) => {
          setActionDrawerInvoice(null);
          handleOpenRecordPayment(inv);
        }}
        onIssueInvoice={(inv) => {
          setActionDrawerInvoice(null);
          handleIssueInvoice(inv);
        }}
        onCancelInvoice={(inv) => {
          setActionDrawerInvoice(null);
          setInvoiceToCancel(inv);
        }}
        onNavigateToTrip={() => {
          setActionDrawerInvoice(null);
          navigate("/trips");
        }}
      />

      {/* 1. Details Modal */}
      <InvoiceDetailsModal
        open={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        onRecordPayment={handleOpenRecordPayment}
        onIssueInvoice={handleIssueInvoice}
        onCancelInvoice={(inv) => setInvoiceToCancel(inv)}
      />

      {/* 2. Record Payment Modal */}
      <RecordPaymentModal
        open={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false);
        }}
        invoice={selectedInvoice}
        onSavePayment={handleSavePayment}
      />

      {/* 3. New Invoice Modal */}
      <NewInvoiceModal
        open={isNewInvoiceOpen}
        onClose={() => setIsNewInvoiceOpen(false)}
        customers={customers}
        trips={trips}
        onSaveInvoice={handleSaveNewInvoice}
      />

      {/* 3.1 Consolidated Multi-Trip Invoice Modal */}
      <ConsolidatedInvoiceModal
        open={isConsolidatedOpen}
        onClose={() => setIsConsolidatedOpen(false)}
        customers={customers}
        trips={trips}
        invoices={invoices}
        onSaveInvoice={handleSaveNewInvoice}
      />

      {/* 4. Export Modal */}
      <ExportModal
        open={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        invoices={filteredInvoices}
      />

      {/* 5. Cancel Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(invoiceToCancel)}
        title="Cancel Invoice"
        description={`Are you sure you want to cancel invoice ${invoiceToCancel?.invoiceNumber}? This action cannot be reversed.`}
        confirmText="Cancel Invoice"
        variant="danger"
        onConfirm={handleConfirmCancelInvoice}
        onClose={() => setInvoiceToCancel(null)}
      />
    </div>
  );
}
