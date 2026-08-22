import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Button from "../../components/ui/Button";
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/Card";
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
import { getCustomers, deleteCustomer } from "../../services/customerService";
import { getCustomerAccountStatus } from "../../utils/customerAccountStatus";
import CustomerDetailsModal from "../../components/customer/CustomerDetailsModal";

const CUSTOMER_STATUS_OPTIONS = [
  {
    label: "All Statuses",
    value: "all",
  },
  {
    label: "Active",
    value: "active",
  },
  {
    label: "Inactive",
    value: "inactive",
  },
];

const ACCOUNT_STATUS_OPTIONS = [
  {
    label: "All Accounts",
    value: "all",
  },
  {
    label: "No Dues",
    value: "no_dues",
  },
  {
    label: "Due",
    value: "due",
  },
  {
    label: "Overdue",
    value: "overdue",
  },
  {
    label: "Credit",
    value: "credit",
  },
];

const STATUS_CLASSES = {
  active: "bg-success/10 text-success",
  inactive: "bg-muted/20 text-muted",

  no_dues: "bg-success/10 text-success",
  due: "bg-warning/10 text-warning",
  overdue: "bg-error/10 text-error",
  credit: "bg-primary/10 text-primary",
};

function StatusBadge({ value, label }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1",
        "text-xs font-medium",
        STATUS_CLASSES[value] ?? "bg-muted/20 text-muted",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [customerStatus, setCustomerStatus] = useState("all");
  const [accountStatus, setAccountStatus] = useState("all");
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState(null);
  const [highlightedCustomerId, setHighlightedCustomerId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const updatedCustomerId = location.state?.updatedCustomerId ?? null;

  const loadCustomers = () => {
    try {
      setLoadError("");

      const storedCustomers = getCustomers();

      setCustomers(storedCustomers);
    } catch (error) {
      console.error("Failed to load customers:", error);

      setLoadError("Unable to load customers.");

      setCustomers([]);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (!updatedCustomerId) {
      return;
    }

    const updatedCustomer = customers.find(
      (customer) => customer.id === updatedCustomerId,
    );

    setHighlightedCustomerId(updatedCustomerId);

    if (updatedCustomer) {
      setToast({
        id: crypto.randomUUID(),
        title: "Customer updated",
        message: `${updatedCustomer.customerCode} has been updated successfully.`,
        variant: "success",
        duration: 5000,
      });
    }

    navigate("/customers", {
      replace: true,
      state: {},
    });

    const timeout = setTimeout(() => {
      setHighlightedCustomerId(null);
    }, 4000);

    return () => {
      clearTimeout(timeout);
    };
  }, [updatedCustomerId, customers, navigate]);

  const handleToastClose = () => {
    setToast(null);
  };

  const handleDelete = (customer) => {
    setCustomerToDelete(customer);
  };

  const handleConfirmDelete = () => {
    if (!customerToDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      deleteCustomer(customerToDelete.id);

      setCustomers((previous) =>
        previous.filter((customer) => customer.id !== customerToDelete.id),
      );

      setToast({
        id: crypto.randomUUID(),
        title: "Customer deleted",
        message: `${customerToDelete.customerCode} has been deleted successfully.`,
        variant: "success",
        duration: 5000,
      });

      setCustomerToDelete(null);
    } catch (error) {
      console.error("Failed to delete customer:", error);

      setToast({
        id: crypto.randomUUID(),
        title: "Unable to delete customer",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        variant: "error",
        duration: 5000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteDialog = () => {
    if (isDeleting) {
      return;
    }

    setCustomerToDelete(null);
  };

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          customer.name,
          customer.customerCode,
          customer.mobile1,
          customer.gstNumber,
          customer.contactPerson,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedSearch),
          );

      const matchesCustomerStatus =
        customerStatus === "all" ||
        (customerStatus === "active" && customer.isActive) ||
        (customerStatus === "inactive" && !customer.isActive);

      const customerAccountStatus = getCustomerAccountStatus(customer);

      const matchesAccountStatus =
        accountStatus === "all" ||
        customerAccountStatus.value === accountStatus;

      return matchesSearch && matchesCustomerStatus && matchesAccountStatus;
    });
  }, [customers, search, customerStatus, accountStatus]);

  const handleView = (customer) => {
    setSelectedCustomer(customer);
  };

  const handleCloseCustomerDetails = () => {
    setSelectedCustomer(null);
  };

  const handleEditFromModal = (customer) => {
    setSelectedCustomer(null);

    navigate(`/customers/${customer.id}/edit`);
  };

  const handleEdit = (customer) => {
    navigate(`/customers/${customer.id}/edit`);
  };

  const handleAddCustomer = () => {
    navigate("/customers/new");
  };

  return (
    <>
      {toast && (
        <div className="fixed right-6 top-6 z-50">
          <Toast
            id={toast.id}
            title={toast.title}
            message={toast.message}
            variant={toast.variant}
            duration={toast.duration}
            onClose={handleToastClose}
          />
        </div>
      )}
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Customers
            </h1>

            <p className="mt-1 text-sm text-muted">
              Manage customers and monitor their account status.
            </p>
          </div>

          <Button type="button" onClick={handleAddCustomer}>
            Add Customer
          </Button>
        </div>

        {/* Load error */}
        {loadError && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-error">{loadError}</p>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="flex min-h-[110px] items-center p-4">
            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customers..."
              />

              <Select
                value={customerStatus}
                onChange={(event) => setCustomerStatus(event.target.value)}
                options={CUSTOMER_STATUS_OPTIONS}
              />

              <Select
                value={accountStatus}
                onChange={(event) => setAccountStatus(event.target.value)}
                options={ACCOUNT_STATUS_OPTIONS}
              />
            </div>
          </CardContent>
        </Card>

        {/* Result count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            {filteredCustomers.length}{" "}
            {filteredCustomers.length === 1 ? "customer" : "customers"}
          </p>
        </div>

        {/* ============================
          DESKTOP TABLE
      ============================= */}
        <div className="hidden md:block">
          <Card>
            <CardHeader>
              <CardTitle>Customer List</CardTitle>

              <CardDescription>
                All customers stored in the application.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center">
                        <p className="text-sm font-medium text-foreground">
                          No customers found
                        </p>

                        <p className="mt-1 text-sm text-muted">
                          Add a customer or change your search filters.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => {
                      const accountStatus = getCustomerAccountStatus(customer);

                      const customerStatus = customer.isActive
                        ? {
                            value: "active",
                            label: "Active",
                          }
                        : {
                            value: "inactive",
                            label: "Inactive",
                          };

                      return (
                        <TableRow
                          key={customer.id}
                          className={
                            highlightedCustomerId === customer.id
                              ? "bg-primary/10 ring-1 ring-inset ring-primary/30"
                              : ""
                          }
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">
                                {customer.name}
                              </p>

                              <p className="mt-0.5 text-xs text-muted">
                                {customer.customerCode}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>
                            {customer.customerType === "company"
                              ? "Company"
                              : "Individual"}
                          </TableCell>

                          <TableCell>{customer.contactPerson || "-"}</TableCell>

                          <TableCell>{customer.mobile1 || "-"}</TableCell>

                          <TableCell>
                            <StatusBadge
                              value={accountStatus.value}
                              label={accountStatus.label}
                            />
                          </TableCell>

                          <TableCell>
                            <StatusBadge
                              value={customerStatus.value}
                              label={customerStatus.label}
                            />
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => handleView(customer)}
                              >
                                View
                              </Button>

                              <Button
                                type="button"
                                onClick={() => handleEdit(customer)}
                              >
                                Edit
                              </Button>

                              <Button
                                type="button"
                                variant="danger"
                                onClick={() => handleDelete(customer)}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* ============================
          MOBILE CARDS
      ============================= */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {filteredCustomers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-sm font-medium text-foreground">
                  No customers found
                </p>

                <p className="mt-1 text-sm text-muted">
                  Add a customer or change your search filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredCustomers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                highlighted={highlightedCustomerId === customer.id}
              />
            ))
          )}
        </div>
      </div>
      <ConfirmDialog
        open={Boolean(customerToDelete)}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete customer?"
        description={
          customerToDelete
            ? `Are you sure you want to delete ${customerToDelete.name} (${customerToDelete.customerCode})? This action cannot be undone.`
            : ""
        }
        confirmText="Delete Customer"
        cancelText="Cancel"
        variant="danger"
        loading={isDeleting}
      />

      <CustomerDetailsModal
        open={Boolean(selectedCustomer)}
        customer={selectedCustomer}
        onClose={handleCloseCustomerDetails}
        onEdit={handleEditFromModal}
      />
    </>
  );
}
