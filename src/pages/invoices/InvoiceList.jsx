import { useState, useEffect, useMemo } from "react";

import InvoiceOverview from "../../components/invoices/InvoiceOverview";
import InvoiceToolbar from "../../components/invoices/InvoiceToolbar";
import InvoiceTable from "../../components/invoices/InvoiceTable";
import InvoiceMobileCard from "../../components/invoices/InvoiceMobileCard";
import InvoiceDetailsModal from "../../components/invoices/InvoiceDetailsModal";
import RecordPaymentModal from "../../components/invoices/RecordPaymentModal";
import NewInvoiceModal from "../../components/invoices/NewInvoiceModal";
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
  const [datePreset, setDatePreset] = useState("last_30_days");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [customerFilter, setCustomerFilter] = useState("all");

  // Sorting and pagination state
  const [sortField, setSortField] = useState("issueDate");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal and toast state
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [invoiceToCancel, setInvoiceToCancel] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Load initial data
  const loadData = () => {
    setIsLoading(true);
    setError(null);
    try {
      const storedInvoices = getInvoices();
      const storedCustomers = getCustomers();
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

  // Compute live KPIs from actual invoice dataset
  const kpis = useMemo(() => {
    return getInvoiceKPIs(invoices);
  }, [invoices]);

  // Active filters count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (paymentStatus !== "all") count++;
    if (documentStatus !== "all") count++;
    if (customerFilter !== "all") count++;
    if (datePreset === "custom" && (customStartDate || customEndDate)) count++;
    return count;
  }, [
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

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-[1400px] mx-auto w-full">
      {/* Toast message */}
      {toastMessage && (
        <Toast
          variant={toastMessage.type === "error" ? "error" : "success"}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}

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

        {/* Header Actions: Export + + New Invoice */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
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

      {/* 1. Overview KPIs (Inspired by Stitch design) */}
      <InvoiceOverview kpis={kpis} isLoading={isLoading} />

      {/* 2. Search and Filter Toolbar */}
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

      {/* 3. Error State */}
      {error && (
        <div className="rounded-md p-8 border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-center my-6">
          <span className="material-symbols-outlined text-3xl text-rose-500 mb-2">
            error
          </span>
          <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">
            {error}
          </p>
          <button
            type="button"
            onClick={loadData}
            className="mt-3 px-3 py-1.5 text-xs font-semibold rounded bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4. Empty States */}
      {!isLoading && !error && filteredInvoices.length === 0 && (
        <div className="rounded-md border border-dashed border-slate-300 dark:border-[#27272a] bg-white/50 dark:bg-[#121314]/50 p-12 text-center my-4">
          <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-zinc-600 mb-3 block">
            receipt_long
          </span>

          {invoices.length === 0 ? (
            <>
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 mb-1">
                No invoices yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
                Create your first invoice from a completed trip or direct bill.
              </p>
              <button
                type="button"
                onClick={() => setIsNewInvoiceOpen(true)}
                className="px-4 py-2 text-xs font-semibold rounded-md bg-[#6b38d4] dark:bg-[#a078ff] text-white dark:text-[#1e004d] cursor-pointer"
              >
                + New Invoice
              </button>
            </>
          ) : (
            <>
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 mb-1">
                No matching invoices found
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
                No invoices match your current search and filter criteria.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 cursor-pointer"
              >
                Clear Filters
              </button>
            </>
          )}
        </div>
      )}

      {/* 5. Desktop Table View */}
      {!isLoading && !error && filteredInvoices.length > 0 && (
        <div className="hidden lg:block">
          <InvoiceTable
            invoices={paginatedInvoices}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            onViewInvoice={handleViewInvoice}
            onRecordPayment={handleOpenRecordPayment}
          />
        </div>
      )}

      {/* 6. Tablet / Mobile Card List View */}
      {!isLoading && !error && filteredInvoices.length > 0 && (
        <div className="block lg:hidden space-y-3">
          {paginatedInvoices.map((inv) => (
            <InvoiceMobileCard
              key={inv.id}
              invoice={inv}
              onViewInvoice={handleViewInvoice}
              onRecordPayment={handleOpenRecordPayment}
            />
          ))}
        </div>
      )}

      {/* 7. Pagination Footer */}
      {!isLoading && !error && filteredInvoices.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 text-xs text-slate-500 dark:text-zinc-400 font-mono">
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

      {/* Modals */}
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
