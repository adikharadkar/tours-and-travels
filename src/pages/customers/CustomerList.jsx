import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Button from "../../components/ui/Button";
import Card, { CardContent } from "../../components/ui/Card";
import Pagination from "../../components/ui/Pagination";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Toast from "../../components/ui/Toast";
import CustomerToolbar from "../../components/customer/CustomerToolbar";
import CustomerTable from "../../components/customer/CustomerTable";
import CustomerCard from "./CustomerCard";
import CustomerDetailsModal from "../../components/customer/CustomerDetailsModal";
import { getCustomers, deleteCustomer } from "../../services/customerService";
import { PAYMENT_STATUS_OPTIONS } from "../../constants/customers";

const ITEMS_PER_PAGE = 8;

export default function CustomerList() {
  const navigate = useNavigate();
  const location = useLocation();

  const [customers, setCustomers] = useState([]);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [financialStatusFilter, setFinancialStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState(null);
  const [highlightedCustomerId, setHighlightedCustomerId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const loadData = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
      setLoadError("");
    } catch (err) {
      console.error("Failed to load customers:", err);
      setLoadError("Failed to load customers from storage.");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (location.state?.toast) {
      setToast({
        id: Date.now(),
        ...location.state.toast,
      });
    }

    const targetId =
      location.state?.highlightedCustomerId ||
      location.state?.updatedCustomerId;

    if (targetId) {
      setHighlightedCustomerId(targetId);
      const timer = setTimeout(() => {
        setHighlightedCustomerId(null);
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Handle URL query parameters for deep linking and filters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const typeParam = params.get("type") || params.get("customerType");
    const pmtParam = params.get("paymentStatus");
    const stateParam = params.get("state");
    const statusParam = params.get("status");
    const searchParam = params.get("search") || params.get("q");
    const customerIdParam = params.get("customerId") || params.get("id");

    if (typeParam) {
      setTypeFilter(typeParam);
    }
    if (pmtParam) {
      setPaymentStatusFilter(pmtParam);
    }
    if (stateParam) {
      setStateFilter(stateParam);
    }
    if (statusParam) {
      setStatusFilter(statusParam);
    }
    if (searchParam) {
      setSearch(searchParam);
    }
    if (customerIdParam && customers.length > 0) {
      const found = customers.find(
        (c) => c.id === customerIdParam || c.customerCode === customerIdParam,
      );
      if (found) {
        setSelectedCustomer(found);
      }
    }
  }, [location.search, customers]);

  // Tab counts
  const tabCounts = useMemo(() => {
    let company = 0;
    let individual = 0;
    customers.forEach((c) => {
      const t = String(c.customerType || "").toLowerCase();
      if (t === "individual") individual++;
      else company++;
    });
    return {
      all: customers.length,
      company,
      individual,
    };
  }, [customers]);

  // Dynamic State / Region filter options from loaded customers
  const availableStates = useMemo(() => {
    const stateSet = new Set();
    customers.forEach((c) => {
      const s = c.state || c.billingState;
      if (s && typeof s === "string") stateSet.add(s.trim());
    });
    return Array.from(stateSet).sort();
  }, [customers]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (paymentStatusFilter !== "all") count++;
    if (stateFilter !== "all") count++;
    if (statusFilter !== "all") count++;
    if (financialStatusFilter !== "all") count++;
    return count;
  }, [paymentStatusFilter, stateFilter, statusFilter, financialStatusFilter]);

  const handleResetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setPaymentStatusFilter("all");
    setStateFilter("all");
    setStatusFilter("all");
    setFinancialStatusFilter("all");
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filtered customer set
  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      // 1. Search Query
      if (query) {
        const matchName = (customer.name || "").toLowerCase().includes(query);
        const matchCode = (customer.customerCode || customer.customerId || "")
          .toLowerCase()
          .includes(query);
        const matchMobile1 = (customer.mobile1 || customer.phone || "")
          .toLowerCase()
          .includes(query);
        const matchMobile2 = (customer.mobile2 || "")
          .toLowerCase()
          .includes(query);
        const matchEmail = (customer.email || "").toLowerCase().includes(query);
        const matchGst = (customer.gstin || customer.gstNumber || "")
          .toLowerCase()
          .includes(query);
        const matchCity = (customer.city || customer.billingCity || "")
          .toLowerCase()
          .includes(query);
        const matchContact = (customer.contactPerson || "")
          .toLowerCase()
          .includes(query);

        if (
          !matchName &&
          !matchCode &&
          !matchMobile1 &&
          !matchMobile2 &&
          !matchEmail &&
          !matchGst &&
          !matchCity &&
          !matchContact
        ) {
          return false;
        }
      }

      // 2. Customer Type Tab / Filter
      if (typeFilter !== "all") {
        const cType = String(customer.customerType || "").toLowerCase();
        if (typeFilter === "individual") {
          if (cType !== "individual") return false;
        } else if (typeFilter === "company") {
          if (cType === "individual") return false;
        }
      }

      // 3. Payment Status Filter
      if (paymentStatusFilter !== "all") {
        const status =
          customer.financialStatus ||
          (Number(customer.outstandingAmount || customer.openingBalance || 0) >
          20000
            ? "critical"
            : Number(
                  customer.outstandingAmount || customer.openingBalance || 0,
                ) > 0
              ? "warning"
              : "healthy");

        if (paymentStatusFilter === "healthy") {
          if (status !== "healthy" && status !== "current") return false;
        } else if (paymentStatusFilter === "warning") {
          if (status !== "warning" && status !== "overdue") return false;
        } else if (paymentStatusFilter === "critical") {
          if (status !== "critical" && status !== "collections") return false;
        }
      }

      // 4. State / Region Filter
      if (stateFilter !== "all") {
        const cState = customer.state || customer.billingState || "";
        const cCode = customer.stateCode || "";
        const target = stateFilter.toLowerCase();
        if (cState.toLowerCase() !== target && cCode.toLowerCase() !== target) {
          return false;
        }
      }

      // 5. Account Status Filter (active / inactive)
      if (statusFilter !== "all") {
        if (statusFilter === "active" && customer.isActive === false)
          return false;
        if (statusFilter === "inactive" && customer.isActive !== false)
          return false;
      }

      // 6. Financial Status Filter
      if (financialStatusFilter !== "all") {
        const status =
          customer.financialStatus ||
          (Number(customer.outstandingAmount || customer.openingBalance || 0) >
          20000
            ? "critical"
            : Number(
                  customer.outstandingAmount || customer.openingBalance || 0,
                ) > 0
              ? "warning"
              : "healthy");
        if (financialStatusFilter === "healthy" && status !== "healthy")
          return false;
        if (financialStatusFilter === "warning" && status !== "warning")
          return false;
        if (financialStatusFilter === "critical" && status !== "critical")
          return false;
      }

      return true;
    });
  }, [
    customers,
    search,
    typeFilter,
    paymentStatusFilter,
    stateFilter,
    statusFilter,
    financialStatusFilter,
  ]);

  // Sorted customer set
  const sortedCustomers = useMemo(() => {
    return [...filteredCustomers].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === "name") {
        aVal = (a.name || "").toLowerCase();
        bVal = (b.name || "").toLowerCase();
      } else if (sortField === "outstandingAmount") {
        aVal = Number(a.outstandingAmount || 0);
        bVal = Number(b.outstandingAmount || 0);
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredCustomers, sortField, sortDirection]);

  // Paginated records
  const totalPages = Math.max(
    1,
    Math.ceil(sortedCustomers.length / ITEMS_PER_PAGE),
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(
    startIndex + ITEMS_PER_PAGE,
    sortedCustomers.length,
  );
  const paginatedCustomers = sortedCustomers.slice(startIndex, endIndex);

  // Selection handlers
  const isAllPageSelected =
    paginatedCustomers.length > 0 &&
    paginatedCustomers.every((c) => selectedIds.includes(c.id));

  const handleToggleSelectAll = () => {
    if (isAllPageSelected) {
      const pageIds = paginatedCustomers.map((c) => c.id);
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      const pageIds = paginatedCustomers.map((c) => c.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleEdit = (customer) => {
    navigate(`/customers/${customer.id}/edit`);
  };

  const handleConfirmDelete = () => {
    if (!customerToDelete) return;
    setIsDeleting(true);

    try {
      deleteCustomer(customerToDelete.id);
      setCustomers((prev) => prev.filter((c) => c.id !== customerToDelete.id));

      if (selectedCustomer?.id === customerToDelete.id) {
        setSelectedCustomer(null);
      }

      setToast({
        id: Date.now(),
        variant: "success",
        title: "Customer Deleted",
        message: `Customer ${customerToDelete.name} (${customerToDelete.customerCode || customerToDelete.customerId}) was removed successfully.`,
      });
      setCustomerToDelete(null);
    } catch (err) {
      console.error("Delete customer error:", err);
      setToast({
        id: Date.now(),
        variant: "error",
        title: "Delete Failed",
        message: err.message || "Failed to delete customer.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {toast && (
        <Toast
          id={toast.id}
          variant={toast.variant}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Customers Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage active accounts, financial standing, and logistics profiles.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/customers/new")}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] active:opacity-90 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New Customer</span>
        </button>
      </div>

      {/* Toolbar */}
      <CustomerToolbar
        activeTab={typeFilter}
        onTabChange={(tab) => {
          setTypeFilter(tab);
          setCurrentPage(1);
        }}
        tabCounts={tabCounts}
        searchQuery={search}
        onSearchChange={(q) => {
          setSearch(q);
          setCurrentPage(1);
        }}
        paymentStatus={paymentStatusFilter}
        onPaymentStatusChange={(s) => {
          setPaymentStatusFilter(s);
          setCurrentPage(1);
        }}
        paymentStatusOptions={PAYMENT_STATUS_OPTIONS}
        stateFilter={stateFilter}
        onStateFilterChange={(s) => {
          setStateFilter(s);
          setCurrentPage(1);
        }}
        availableStates={availableStates}
        statusFilter={statusFilter}
        onStatusFilterChange={(s) => {
          setStatusFilter(s);
          setCurrentPage(1);
        }}
        financialStatusFilter={financialStatusFilter}
        onFinancialStatusFilterChange={(f) => {
          setFinancialStatusFilter(f);
          setCurrentPage(1);
        }}
        onResetFilters={handleResetFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* Main Content Area */}
      {loadError ? (
        <Card className="border-error/30 bg-error/5 p-6 text-center">
          <p className="text-sm font-medium text-error">{loadError}</p>
        </Card>
      ) : customers.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl">
              👥
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                No customers added yet
              </h3>
              <p className="mt-1 text-sm text-muted">
                Add your first customer to start tracking bookings and
                invoicing.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate("/customers/new")}
            >
              + Add First Customer
            </Button>
          </CardContent>
        </Card>
      ) : sortedCustomers.length === 0 ? (
        <Card className="py-12 text-center border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822]">
          <CardContent className="space-y-3">
            <h3 className="text-base font-semibold text-foreground">
              No matching customers found
            </h3>
            <p className="text-sm text-muted">
              No customers matched your selected filter criteria.
            </p>
            <Button type="button" variant="ghost" onClick={handleResetFilters}>
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile View: Responsive Cards (< md) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:hidden">
            {paginatedCustomers.map((customer, idx) => (
              <CustomerCard
                key={customer.id || customer.customerCode || `cust_mob_${idx}`}
                customer={customer}
                highlighted={customer.id === highlightedCustomerId}
                onView={(c) => setSelectedCustomer(c)}
                onEdit={(c) => handleEdit(c)}
                onDelete={(c) => setCustomerToDelete(c)}
              />
            ))}
          </div>

          {/* Desktop View: Shared Table Design (>= md) */}
          <div className="hidden md:block">
            <CustomerTable
              customers={paginatedCustomers}
              selectedCustomerIds={selectedIds}
              onToggleSelectCustomer={handleToggleSelectRow}
              onToggleSelectAll={handleToggleSelectAll}
              isAllSelected={isAllPageSelected}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              onViewCustomer={(c) => setSelectedCustomer(c)}
              onEditCustomer={(c) => handleEdit(c)}
              onDeleteCustomer={(c) => setCustomerToDelete(c)}
              highlightedCustomerId={highlightedCustomerId}
            />

            {/* Table Footer with Summary and Pagination */}
            <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="select-none">
                Showing {sortedCustomers.length === 0 ? 0 : startIndex + 1} to{" "}
                {endIndex} of {sortedCustomers.length} customers
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
                compact={true}
              />
            </div>
          </div>
        </>
      )}

      {/* Customer Details Modal */}
      <CustomerDetailsModal
        open={Boolean(selectedCustomer)}
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onEdit={(c) => handleEdit(c)}
        onCreateTrip={(c) => {
          setSelectedCustomer(null);
          navigate("/trips/new", {
            state: { customerId: c.id, customerName: c.name },
          });
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(customerToDelete)}
        title="Delete Customer?"
        message={`Are you sure you want to delete ${customerToDelete?.name} (${customerToDelete?.customerCode || customerToDelete?.customerId})?`}
        confirmLabel="Delete Customer"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setCustomerToDelete(null)}
      />
    </div>
  );
}
