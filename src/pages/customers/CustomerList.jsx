import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Button from "../../components/ui/Button";
import Card, { CardContent } from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Table, {
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../components/ui/Table";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Toast from "../../components/ui/Toast";
import CustomerCard from "./CustomerCard";
import CustomerDetailsModal from "../../components/customer/CustomerDetailsModal";
import { getCustomers, deleteCustomer } from "../../services/customerService";

const CUSTOMER_TYPE_FILTER_OPTIONS = [
  { label: "All Customer Types", value: "all" },
  { label: "Corporate / Company", value: "company" },
  { label: "Individual", value: "individual" },
];

const ACCOUNT_STATUS_FILTER_OPTIONS = [
  { label: "All Statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const STATUS_CLASSES = {
  active: "bg-success/10 text-success border border-success/20",
  inactive: "bg-muted/20 text-muted border border-border",
};

function StatusBadge({ value, label }) {
  const normalized = String(value || "").toLowerCase();
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5",
        "text-xs font-medium whitespace-nowrap",
        STATUS_CLASSES[normalized] ??
          "bg-muted/20 text-muted border border-border",
      ].join(" ")}
    >
      {label || (normalized === "active" ? "Active" : "Inactive")}
    </span>
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
  const [statusFilter, setStatusFilter] = useState("all");
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
    // Handle both new format (toast + highlightedCustomerId) and legacy format (updatedCustomerId)
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

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      // 1. Search: Name, Customer Code, Mobile, Email, GST Number, City
      if (query) {
        const matchName = (customer.name || "").toLowerCase().includes(query);
        const matchCode = (customer.customerCode || "")
          .toLowerCase()
          .includes(query);
        const matchMobile1 = (customer.mobile1 || "")
          .toLowerCase()
          .includes(query);
        const matchMobile2 = (customer.mobile2 || "")
          .toLowerCase()
          .includes(query);
        const matchEmail = (customer.email || "").toLowerCase().includes(query);
        const matchGst = (customer.gstNumber || "")
          .toLowerCase()
          .includes(query);
        const matchCity = (customer.billingCity || customer.city || "")
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

      // 2. Type Filter
      if (typeFilter !== "all" && customer.customerType !== typeFilter) {
        return false;
      }

      // 3. Status Filter
      if (statusFilter !== "all") {
        const isActive = customer.isActive !== false;
        if (statusFilter === "active" && !isActive) return false;
        if (statusFilter === "inactive" && isActive) return false;
      }

      return true;
    });
  }, [customers, search, typeFilter, statusFilter]);

  const stats = useMemo(() => {
    let activeCount = 0;
    let corporateCount = 0;
    let individualCount = 0;

    customers.forEach((c) => {
      const isActive = c.isActive !== false;
      if (isActive) activeCount++;
      if (c.customerType === "company") corporateCount++;
      else individualCount++;
    });

    return {
      total: customers.length,
      active: activeCount,
      corporate: corporateCount,
      individual: individualCount,
    };
  }, [customers]);

  const hasActiveFilters =
    search.trim() !== "" || typeFilter !== "all" || statusFilter !== "all";

  const handleClearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
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
        message: `Customer ${customerToDelete.name} (${customerToDelete.customerCode}) was removed successfully.`,
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
    <div className="space-y-6 pb-12">
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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Customers
          </h1>
          <p className="text-sm text-muted">
            Manage your client master, corporate GST details, contact books, and
            credit terms.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={() => navigate("/customers/new")}
          className="shrink-0"
        >
          + Add Customer
        </Button>
      </div>

      {/* Overview Metric Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-border bg-surface p-3.5">
          <p className="text-xs font-medium text-muted">Total Customers</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-foreground">
            {stats.total}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-3.5">
          <p className="text-xs font-medium text-muted">Active Accounts</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-success">
            {stats.active}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-3.5">
          <p className="text-xs font-medium text-muted">
            Corporate / Companies
          </p>
          <p className="mt-1 text-xl font-bold tracking-tight text-primary">
            {stats.corporate}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-3.5">
          <p className="text-xs font-medium text-muted">Individuals</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-foreground">
            {stats.individual}
          </p>
        </div>
      </div>

      {/* Search and Filters Card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Search */}
            <div>
              <Input
                placeholder="Search name, code, phone, GSTIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {/* Type Filter */}
            <div>
              <Select
                value={typeFilter}
                options={CUSTOMER_TYPE_FILTER_OPTIONS}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {/* Status Filter */}
            <div>
              <Select
                value={statusFilter}
                options={ACCOUNT_STATUS_FILTER_OPTIONS}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted">
              <span>
                Showing {filteredCustomers.length} of {customers.length}{" "}
                customers
              </span>
              <button
                type="button"
                onClick={handleClearFilters}
                className="font-medium text-primary hover:underline"
              >
                Reset all filters
              </button>
            </div>
          )}
        </CardContent>
      </Card>

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
        <Card className="py-12 text-center">
          <CardContent className="space-y-3">
            <h3 className="text-base font-semibold text-foreground">
              No matching customers found
            </h3>
            <p className="text-sm text-muted">
              No customers matched your search query and filter criteria.
            </p>
            <Button type="button" variant="ghost" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile View: Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:hidden">
            {filteredCustomers.map((customer, idx) => (
              <CustomerCard
                key={customer.id || customer.customerCode || `cust_card_${idx}`}
                customer={customer}
                highlighted={customer.id === highlightedCustomerId}
                onView={(c) => setSelectedCustomer(c)}
                onEdit={(c) => handleEdit(c)}
                onDelete={(c) => setCustomerToDelete(c)}
              />
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block">
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Code</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contact Number</TableHead>
                    <TableHead>City / State</TableHead>
                    <TableHead>GSTIN / Tax ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredCustomers.map((customer, idx) => {
                    const isHighlighted = customer.id === highlightedCustomerId;
                    const isCompany = customer.customerType === "company";
                    const isActive = customer.isActive !== false;
                    const locationCity = [
                      customer.billingCity || customer.city,
                      customer.billingState || customer.state,
                    ]
                      .filter(Boolean)
                      .join(", ");

                    return (
                      <TableRow
                        key={
                          customer.id ||
                          customer.customerCode ||
                          `cust_row_${idx}`
                        }
                        className={
                          isHighlighted
                            ? "bg-primary/5 transition-colors duration-500 ring-1 ring-inset ring-primary/30"
                            : ""
                        }
                      >
                        <TableCell className="font-mono text-xs text-muted whitespace-nowrap">
                          {customer.customerCode}
                        </TableCell>

                        <TableCell className="font-bold tracking-tight text-foreground">
                          <div className="max-w-[200px] truncate">
                            {customer.name}
                          </div>
                          {customer.email && (
                            <span className="block text-xs font-normal text-muted truncate max-w-[200px]">
                              {customer.email}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="whitespace-nowrap">
                          <span className="inline-flex items-center rounded-md bg-surface px-2 py-0.5 text-xs font-medium border border-border">
                            {isCompany ? "Company" : "Individual"}
                          </span>
                        </TableCell>

                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          <div>{customer.mobile1 || "—"}</div>
                          {customer.mobile2 && (
                            <div className="text-[11px] text-muted">
                              {customer.mobile2}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="max-w-[140px] truncate text-xs text-muted">
                          {locationCity || "—"}
                        </TableCell>

                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {customer.gstNumber ? (
                            <span className="font-semibold text-foreground">
                              {customer.gstNumber}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </TableCell>

                        <TableCell className="whitespace-nowrap">
                          <StatusBadge
                            value={isActive ? "active" : "inactive"}
                            label={isActive ? "Active" : "Inactive"}
                          />
                        </TableCell>

                        <TableCell className="text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCustomer(customer)}
                              className="h-8 px-2.5 text-xs"
                            >
                              View
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(customer)}
                              className="h-8 px-2.5 text-xs text-primary hover:text-primary"
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setCustomerToDelete(customer)}
                              className="h-8 px-2.5 text-xs text-error hover:text-error hover:bg-error/10"
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </div>
        </>
      )}

      {/* Customer Details Modal */}
      <CustomerDetailsModal
        open={Boolean(selectedCustomer)}
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onEdit={(c) => handleEdit(c)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(customerToDelete)}
        title="Delete Customer?"
        message={`Are you sure you want to delete ${customerToDelete?.name} (${customerToDelete?.customerCode})?`}
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
