import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Button from "../../components/ui/Button";
import Card, { CardContent } from "../../components/ui/Card";
import Dropdown, { DropdownItem } from "../../components/ui/Dropdown";
import Checkbox from "../../components/ui/Checkbox";
import Pagination from "../../components/ui/Pagination";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Toast from "../../components/ui/Toast";
import CustomerCard from "./CustomerCard";
import CustomerDetailsModal from "../../components/customer/CustomerDetailsModal";
import { getCustomers, deleteCustomer } from "../../services/customerService";

const CUSTOMER_TYPE_OPTIONS = [
  { label: "All Customer Types", value: "all" },
  { label: "Company", value: "company" },
  { label: "Individual", value: "individual" },
];

const PAYMENT_STATUS_OPTIONS = [
  { label: "All Payment Statuses", value: "all" },
  { label: "Healthy (Current)", value: "healthy" },
  { label: "Warning (Overdue)", value: "warning" },
  { label: "Critical (Collections)", value: "critical" },
];

const ITEMS_PER_PAGE = 8;

function getCustomerInitials(name) {
  if (!name) return "CU";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name, type, financialStatus) {
  if (financialStatus === "critical") {
    return "bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-700/50";
  }

  const normalizedType = String(type || "").toLowerCase();
  if (normalizedType === "individual") {
    // Distinct Amber/Teal/Indigo contrast for Individual
    return "bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700/50";
  }

  // Default Company avatar: Crisp indigo/violet with high contrast in light & dark mode
  return "bg-indigo-100 text-indigo-900 border border-indigo-300 dark:bg-indigo-950/70 dark:text-indigo-200 dark:border-indigo-700/50";
}

function formatFinancialAmount(amount) {
  const num = Number(amount || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function CustomerTypeBadge({ type }) {
  const normalized = String(type || "").toLowerCase();

  if (normalized === "individual") {
    return (
      <span className="inline-flex items-center rounded-md border border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-300 px-2.5 py-0.5 text-xs font-semibold tracking-wide select-none">
        Individual
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-md border border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-500/40 dark:bg-indigo-950/40 dark:text-indigo-300 px-2.5 py-0.5 text-xs font-semibold tracking-wide select-none">
      Company
    </span>
  );
}

function FinancialStatusCell({ customer }) {
  const status =
    customer.financialStatus ||
    (Number(customer.outstandingAmount || customer.openingBalance || 0) > 20000
      ? "critical"
      : Number(customer.outstandingAmount || customer.openingBalance || 0) > 0
        ? "warning"
        : "healthy");

  const amount = Number(
    customer.outstandingAmount !== undefined
      ? customer.outstandingAmount
      : customer.openingBalance || 0,
  );

  const formattedAmount = formatFinancialAmount(amount);

  let barColor = "bg-emerald-500";
  let amountClass = "text-emerald-600 dark:text-emerald-400";
  let iconName = "check_circle";
  let defaultSubtext = "Net 30 (Current)";
  let subtextClass = "text-slate-500 dark:text-slate-400";

  if (status === "warning" || status === "overdue") {
    barColor = "bg-amber-500";
    amountClass = "text-amber-600 dark:text-amber-400";
    iconName = "warning";
    defaultSubtext = "14 Days Overdue";
    subtextClass = "text-amber-600 dark:text-amber-400/90 font-medium";
  } else if (status === "critical" || status === "collections") {
    barColor = "bg-rose-500";
    amountClass = "text-rose-600 dark:text-rose-400";
    iconName = "info";
    defaultSubtext = "Collections - Hold";
    subtextClass = "text-rose-600 dark:text-rose-400/90 font-medium";
  }

  const subtext = customer.paymentStatus || defaultSubtext;

  return (
    <div className="flex items-center gap-2.5">
      <div className={`w-1 h-9 rounded-full shrink-0 ${barColor}`} />
      <div className="flex flex-col">
        <div
          className={`text-sm font-bold tracking-tight flex items-center gap-1.5 ${amountClass}`}
        >
          <span>{formattedAmount}</span>
          <span className="material-symbols-outlined text-[15px] select-none">
            {iconName}
          </span>
        </div>
        <span className={`text-[11px] truncate max-w-[150px] ${subtextClass}`}>
          {subtext}
        </span>
      </div>
    </div>
  );
}

function FilterDropdown({ label, value, options, onChange }) {
  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];
  const isFiltered = value !== "all";

  return (
    <Dropdown
      trigger={
        <button
          type="button"
          className={[
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none",
            isFiltered
              ? "bg-cyan-50 text-cyan-800 border border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-500/50 shadow-xs ring-1 ring-cyan-500/20"
              : "bg-slate-50 dark:bg-[#191b26] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#262837] hover:bg-slate-100 dark:hover:bg-[#202330] hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs",
          ].join(" ")}
        >
          <span>
            {isFiltered ? `${label}: ${selectedOption.label}` : `${label}`}
          </span>
          <span className="material-symbols-outlined text-[16px] text-slate-400 dark:text-slate-400">
            expand_more
          </span>
        </button>
      }
    >
      <div className="py-1 min-w-[210px] max-h-[300px] overflow-y-auto">
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <DropdownItem
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={
                isSelected
                  ? "font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50"
                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#202330]"
              }
            >
              <div className="flex items-center justify-between w-full">
                <span>{opt.label}</span>
                {isSelected && (
                  <span className="material-symbols-outlined text-[16px] text-cyan-600 dark:text-cyan-400">
                    check
                  </span>
                )}
              </div>
            </DropdownItem>
          );
        })}
      </div>
    </Dropdown>
  );
}

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
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState(null);
  const [highlightedCustomerId, setHighlightedCustomerId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const loadData = () => {
    try {
      const data = getCustomers();
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

  // Dynamic State / Region filter options from loaded customers
  const stateOptions = useMemo(() => {
    const stateSet = new Set();
    customers.forEach((c) => {
      const s = c.state || c.billingState;
      if (s && typeof s === "string") stateSet.add(s.trim());
    });

    const statesList = Array.from(stateSet).sort();
    return [
      { label: "All States / Regions", value: "all" },
      ...statesList.map((s) => ({ label: s, value: s })),
    ];
  }, [customers]);

  // Reset pagination on filter change
  const handleTypeFilterChange = (val) => {
    setTypeFilter(val);
    setCurrentPage(1);
  };

  const handlePaymentStatusFilterChange = (val) => {
    setPaymentStatusFilter(val);
    setCurrentPage(1);
  };

  const handleStateFilterChange = (val) => {
    setStateFilter(val);
    setCurrentPage(1);
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    typeFilter !== "all" ||
    paymentStatusFilter !== "all" ||
    stateFilter !== "all";

  const handleClearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setPaymentStatusFilter("all");
    setStateFilter("all");
    setCurrentPage(1);
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

      // 2. Customer Type Filter
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

      return true;
    });
  }, [customers, search, typeFilter, paymentStatusFilter, stateFilter]);

  // Paginated records
  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE),
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredCustomers.length,
  );
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

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

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] p-3 sm:px-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Filter Label & Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase select-none mr-1">
              <span className="material-symbols-outlined text-[18px]">
                filter_list
              </span>
              <span>FILTERS</span>
            </div>

            {/* Customer Type Dropdown */}
            <FilterDropdown
              label="Customer Type"
              value={typeFilter}
              options={CUSTOMER_TYPE_OPTIONS}
              onChange={handleTypeFilterChange}
            />

            {/* Payment Status Dropdown */}
            <FilterDropdown
              label="Payment Status"
              value={paymentStatusFilter}
              options={PAYMENT_STATUS_OPTIONS}
              onChange={handlePaymentStatusFilterChange}
            />

            {/* State / Region Dropdown */}
            <FilterDropdown
              label="State / Region"
              value={stateFilter}
              options={stateOptions}
              onChange={handleStateFilterChange}
            />
          </div>

          {/* Right: Search Input & Clear All */}
          <div className="flex items-center gap-2.5 ml-auto w-full sm:w-auto justify-between sm:justify-end">
            <div className="relative flex items-center flex-1 sm:w-64 max-w-xs">
              <span className="material-symbols-outlined absolute left-2.5 text-[18px] text-slate-400 dark:text-slate-500 select-none pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search customers, ID, GSTIN..."
                className="w-full pl-8 pr-7 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-[#191b26] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-[#262837] placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2 text-slate-400 hover:text-slate-200 text-xs cursor-pointer p-0.5"
                  aria-label="Clear search query"
                >
                  ✕
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors cursor-pointer select-none whitespace-nowrap shrink-0"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

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
      ) : filteredCustomers.length === 0 ? (
        <Card className="py-12 text-center border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822]">
          <CardContent className="space-y-3">
            <h3 className="text-base font-semibold text-foreground">
              No matching customers found
            </h3>
            <p className="text-sm text-muted">
              No customers matched your selected filter criteria.
            </p>
            <Button type="button" variant="ghost" onClick={handleClearFilters}>
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

          {/* Desktop View: High-Density Enterprise Table (>= md) */}
          <div className="hidden md:block">
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-[#262837] bg-white dark:bg-[#161822] shadow-xs">
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-[#262837] bg-slate-50/70 dark:bg-[#13151f]">
                      <th scope="col" className="w-10 px-4 py-3 text-left">
                        <Checkbox
                          checked={isAllPageSelected}
                          onChange={handleToggleSelectAll}
                          aria-label="Select all customers on this page"
                        />
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                      >
                        CUSTOMER
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                      >
                        TYPE
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                      >
                        CONTACT
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                      >
                        GSTIN
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                      >
                        LOCATION
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                      >
                        FINANCIAL STATUS
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                      >
                        ACTIONS
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 dark:divide-[#202330]">
                    {paginatedCustomers.map((customer, idx) => {
                      const isSelected = selectedIds.includes(customer.id);
                      const isHighlighted =
                        customer.id === highlightedCustomerId;

                      return (
                        <tr
                          key={
                            customer.id ||
                            customer.customerCode ||
                            `cust_row_${idx}`
                          }
                          className={[
                            "transition-colors duration-150",
                            isHighlighted
                              ? "bg-cyan-500/10 dark:bg-cyan-950/40 ring-1 ring-inset ring-cyan-400/40"
                              : isSelected
                                ? "bg-slate-100/70 dark:bg-[#1a1d2b]"
                                : "hover:bg-slate-50/80 dark:hover:bg-[#1a1c28]",
                          ].join(" ")}
                        >
                          {/* 0. Row Selection Checkbox */}
                          <td className="px-4 py-3 align-middle">
                            <Checkbox
                              checked={isSelected}
                              onChange={() =>
                                handleToggleSelectRow(customer.id)
                              }
                              aria-label={`Select ${customer.name}`}
                            />
                          </td>

                          {/* 1. Customer Column */}
                          <td className="px-4 py-3 align-middle">
                            <div className="flex items-center gap-3">
                              <div
                                className={[
                                  "h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-2xs",
                                  getAvatarColor(
                                    customer.name,
                                    customer.customerType,
                                    customer.financialStatus,
                                  ),
                                ].join(" ")}
                              >
                                {getCustomerInitials(customer.name)}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate max-w-[190px]">
                                    {customer.name}
                                  </span>
                                  {customer.isActive !== false && (
                                    <span
                                      className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0"
                                      title="Active Profile"
                                    />
                                  )}
                                </div>
                                <span className="text-xs font-mono text-slate-400 dark:text-slate-400 block mt-0.5">
                                  {customer.customerCode ||
                                    customer.customerId ||
                                    "—"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Type Column */}
                          <td className="px-4 py-3 align-middle whitespace-nowrap">
                            <CustomerTypeBadge type={customer.customerType} />
                          </td>

                          {/* 3. Contact Column */}
                          <td className="px-4 py-3 align-middle whitespace-nowrap">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate max-w-[190px]">
                                {customer.email || "—"}
                              </div>
                              <div className="text-xs font-mono text-slate-400 dark:text-slate-400 mt-0.5">
                                {customer.phone || customer.mobile1 || "—"}
                              </div>
                            </div>
                          </td>

                          {/* 4. GSTIN Column */}
                          <td className="px-4 py-3 align-middle whitespace-nowrap font-mono text-xs text-slate-600 dark:text-slate-300">
                            {customer.gstin || customer.gstNumber ? (
                              <span>
                                {customer.gstin || customer.gstNumber}
                              </span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500">
                                —
                              </span>
                            )}
                          </td>

                          {/* 5. Location Column */}
                          <td className="px-4 py-3 align-middle whitespace-nowrap">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-200">
                                {customer.city || customer.billingCity || "—"}
                              </div>
                              <div className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                                {[
                                  customer.state || customer.billingState,
                                  customer.postalCode ||
                                    customer.pinCode ||
                                    customer.billingPincode,
                                ]
                                  .filter(Boolean)
                                  .join(", ") || "—"}
                              </div>
                            </div>
                          </td>

                          {/* 6. Financial Status Column */}
                          <td className="px-4 py-3 align-middle whitespace-nowrap">
                            <FinancialStatusCell customer={customer} />
                          </td>

                          {/* 7. Actions Column */}
                          <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                            <div className="inline-flex items-center justify-end gap-1">
                              <button
                                type="button"
                                title="View Customer Details"
                                onClick={() => setSelectedCustomer(customer)}
                                className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  visibility
                                </span>
                              </button>
                              <button
                                type="button"
                                title="Edit Customer"
                                onClick={() => handleEdit(customer)}
                                className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  edit
                                </span>
                              </button>
                              <button
                                type="button"
                                title="Delete Customer"
                                onClick={() => setCustomerToDelete(customer)}
                                className="h-8 w-8 rounded-md flex items-center justify-center text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  delete
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with Summary and Pagination */}
              <div className="border-t border-slate-200 dark:border-[#262837] px-4 py-3.5 bg-slate-50/50 dark:bg-[#13151f] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500 dark:text-slate-400 select-none">
                  Showing {filteredCustomers.length === 0 ? 0 : startIndex + 1}{" "}
                  to {endIndex} of {filteredCustomers.length} customers
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => setCurrentPage(page)}
                  compact={true}
                />
              </div>
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
