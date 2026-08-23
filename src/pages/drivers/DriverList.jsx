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
import DriverCard from "../../components/drivers/DriverCard";
import DriverDetailsModal from "../../components/drivers/DriverDetailsModal";
import { getDrivers, deleteDriver } from "../../services/driverService";
import { getDriverLicenseStatus } from "../../utils/driverLicenseStatus";
import {
  DRIVER_TYPES,
  DRIVER_STATUS_OPTIONS,
  LICENSE_STATUS_OPTIONS,
  DRIVER_TYPE_LABELS,
  PREFIX_LABELS,
  LICENSE_TYPE_LABELS,
} from "../../constants/drivers";

const DRIVER_TYPE_FILTER_OPTIONS = [
  { label: "All Driver Types", value: "all" },
  ...DRIVER_TYPES,
];

const STATUS_CLASSES = {
  active: "bg-success/10 text-success border border-success/20",
  inactive: "bg-muted/20 text-muted border border-border",

  valid: "bg-success/10 text-success border border-success/20",
  expiring_soon: "bg-warning/10 text-warning border border-warning/20",
  expired: "bg-error/10 text-error border border-error/20",
  not_provided: "bg-muted/20 text-muted border border-border",
};

function StatusBadge({ value, label, title }) {
  return (
    <span
      title={title}
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5",
        "text-xs font-medium whitespace-nowrap",
        STATUS_CLASSES[value] ?? "bg-muted/20 text-muted border border-border",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

export default function DriverList() {
  const navigate = useNavigate();
  const location = useLocation();

  const [drivers, setDrivers] = useState([]);
  const [driverToDelete, setDriverToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [licenseStatusFilter, setLicenseStatusFilter] = useState("all");
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState(null);
  const [highlightedDriverId, setHighlightedDriverId] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);

  useEffect(() => {
    try {
      const data = getDrivers();
      setDrivers(data);
      setLoadError("");
    } catch (err) {
      console.error("Failed to load drivers:", err);
      setLoadError("Failed to load drivers from storage.");
    }
  }, []);

  useEffect(() => {
    if (location.state?.toast) {
      setToast({
        id: Date.now(),
        ...location.state.toast,
      });
    }

    if (location.state?.highlightedDriverId) {
      setHighlightedDriverId(location.state.highlightedDriverId);
      const timer = setTimeout(() => {
        setHighlightedDriverId(null);
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const filteredDrivers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return drivers.filter((driver) => {
      // 1. Search: Driver Code, Name, Mobile, License Number, Employee Ref ID
      if (query) {
        const matchCode = (driver.driverCode || "")
          .toLowerCase()
          .includes(query);
        const matchName = (driver.name || "").toLowerCase().includes(query);
        const matchMobile = (driver.mobile || "").toLowerCase().includes(query);
        const matchLicense = (driver.licenseNumber || "")
          .toLowerCase()
          .includes(query);
        const matchRef = (driver.employeeReferenceId || "")
          .toLowerCase()
          .includes(query);

        if (
          !matchCode &&
          !matchName &&
          !matchMobile &&
          !matchLicense &&
          !matchRef
        ) {
          return false;
        }
      }

      // 2. Driver Type Filter (own, contract, attached)
      if (typeFilter !== "all" && driver.driverType !== typeFilter) {
        return false;
      }

      // 3. Status Filter (active, inactive)
      if (statusFilter !== "all") {
        const isActive = driver.isActive !== false;
        if (statusFilter === "active" && !isActive) return false;
        if (statusFilter === "inactive" && isActive) return false;
      }

      // 4. License Status Filter (valid, expiring_soon, expired)
      if (licenseStatusFilter !== "all") {
        const licStatus = getDriverLicenseStatus(driver);
        if (licStatus.value !== licenseStatusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [drivers, search, typeFilter, statusFilter, licenseStatusFilter]);

  const stats = useMemo(() => {
    let activeCount = 0;
    let expiredLicCount = 0;
    let expiringSoonLicCount = 0;

    drivers.forEach((d) => {
      if (d.isActive !== false) activeCount++;
      const lic = getDriverLicenseStatus(d);
      if (lic.value === "expired") expiredLicCount++;
      else if (lic.value === "expiring_soon") expiringSoonLicCount++;
    });

    return {
      total: drivers.length,
      active: activeCount,
      inactive: drivers.length - activeCount,
      expiredLicenses: expiredLicCount,
      expiringSoonLicenses: expiringSoonLicCount,
    };
  }, [drivers]);

  const hasActiveFilters =
    search.trim() !== "" ||
    typeFilter !== "all" ||
    statusFilter !== "all" ||
    licenseStatusFilter !== "all";

  const handleClearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    setLicenseStatusFilter("all");
  };

  const handleEdit = (driver) => {
    navigate(`/drivers/${driver.id}/edit`);
  };

  const handleConfirmDelete = () => {
    if (!driverToDelete) return;
    setIsDeleting(true);

    try {
      deleteDriver(driverToDelete.id);
      setDrivers((prev) => prev.filter((d) => d.id !== driverToDelete.id));

      if (selectedDriver?.id === driverToDelete.id) {
        setSelectedDriver(null);
      }

      setToast({
        id: Date.now(),
        variant: "success",
        title: "Driver Deleted",
        message: `Driver ${driverToDelete.name} (${driverToDelete.driverCode}) was removed successfully.`,
      });
      setDriverToDelete(null);
    } catch (err) {
      console.error("Delete driver error:", err);
      setToast({
        id: Date.now(),
        variant: "error",
        title: "Delete Failed",
        message: err.message || "Failed to delete driver.",
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
            Drivers
          </h1>
          <p className="text-sm text-muted">
            Manage your driver master, license validity compliance, employment
            categories, and trip eligibility.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={() => navigate("/drivers/new")}
          className="shrink-0"
        >
          + Add Driver
        </Button>
      </div>

      {/* Overview Metric Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <div className="rounded-lg border border-border bg-surface p-3.5">
          <p className="text-xs font-medium text-muted">Total Drivers</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-foreground">
            {stats.total}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-3.5">
          <p className="text-xs font-medium text-muted">Active Drivers</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-success">
            {stats.active}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-3.5">
          <p className="text-xs font-medium text-muted">Inactive</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-muted">
            {stats.inactive}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-3.5">
          <p className="text-xs font-medium text-muted">Expiring Soon (30d)</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-warning">
            {stats.expiringSoonLicenses}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-3.5 col-span-2 sm:col-span-1">
          <p className="text-xs font-medium text-muted">Expired Licenses</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-error">
            {stats.expiredLicenses}
          </p>
        </div>
      </div>

      {/* Search and Filters Card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div>
              <Input
                placeholder="Search code, name, mobile, license..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {/* Driver Type Filter */}
            <div>
              <Select
                value={typeFilter}
                options={DRIVER_TYPE_FILTER_OPTIONS}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {/* Driver Status Filter */}
            <div>
              <Select
                value={statusFilter}
                options={DRIVER_STATUS_OPTIONS}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {/* License Status Filter */}
            <div>
              <Select
                value={licenseStatusFilter}
                options={LICENSE_STATUS_OPTIONS}
                onChange={(e) => setLicenseStatusFilter(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted">
              <span>
                Showing {filteredDrivers.length} of {drivers.length} drivers
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
      ) : drivers.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl">
              🧑‍✈️
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                No drivers added yet
              </h3>
              <p className="mt-1 text-sm text-muted">
                Add your drivers with their license information to establish
                trip assignment eligibility.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate("/drivers/new")}
            >
              + Add First Driver
            </Button>
          </CardContent>
        </Card>
      ) : filteredDrivers.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent className="space-y-3">
            <h3 className="text-base font-semibold text-foreground">
              No matching drivers found
            </h3>
            <p className="text-sm text-muted">
              No driver records matched your search query and filter criteria.
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
            {filteredDrivers.map((driver, idx) => (
              <DriverCard
                key={driver.id || driver.driverCode || `drv_card_${idx}`}
                driver={driver}
                highlighted={driver.id === highlightedDriverId}
                onView={(d) => setSelectedDriver(d)}
                onEdit={(d) => handleEdit(d)}
                onDelete={(d) => setDriverToDelete(d)}
              />
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block">
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver Code</TableHead>
                    <TableHead>Driver Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>License Number</TableHead>
                    <TableHead>Driver Type</TableHead>
                    <TableHead>License Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredDrivers.map((driver, idx) => {
                    const licStatus = getDriverLicenseStatus(driver);
                    const isHighlighted = driver.id === highlightedDriverId;
                    const prefixLabel = PREFIX_LABELS[driver.prefix] || "";
                    const displayName = prefixLabel
                      ? `${prefixLabel} ${driver.name}`
                      : driver.name;
                    const driverTypeLabel =
                      DRIVER_TYPE_LABELS[driver.driverType] ||
                      driver.driverType;
                    const licenseTypeLabel =
                      LICENSE_TYPE_LABELS[driver.licenseType] ||
                      driver.licenseType;

                    return (
                      <TableRow
                        key={driver.id || driver.driverCode || `drv_row_${idx}`}
                        className={
                          isHighlighted
                            ? "bg-primary/5 transition-colors duration-500 ring-1 ring-inset ring-primary/30"
                            : ""
                        }
                      >
                        <TableCell className="font-mono text-xs text-muted whitespace-nowrap">
                          {driver.driverCode}
                        </TableCell>

                        <TableCell className="font-bold tracking-tight text-foreground whitespace-nowrap">
                          {displayName}
                        </TableCell>

                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {driver.mobile || "—"}
                        </TableCell>

                        <TableCell className="whitespace-nowrap">
                          <span className="font-mono font-medium text-foreground">
                            {driver.licenseNumber}
                          </span>
                          <span className="ml-1.5 text-xs text-muted">
                            ({licenseTypeLabel})
                          </span>
                        </TableCell>

                        <TableCell className="whitespace-nowrap">
                          <span className="capitalize">{driverTypeLabel}</span>
                        </TableCell>

                        <TableCell className="whitespace-nowrap">
                          <StatusBadge
                            value={licStatus.value}
                            label={licStatus.label}
                            title={licStatus.message}
                          />
                        </TableCell>

                        <TableCell className="whitespace-nowrap">
                          <StatusBadge
                            value={
                              driver.isActive !== false ? "active" : "inactive"
                            }
                            label={
                              driver.isActive !== false ? "Active" : "Inactive"
                            }
                          />
                        </TableCell>

                        <TableCell className="text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedDriver(driver)}
                              className="h-8 px-2.5 text-xs"
                            >
                              View
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(driver)}
                              className="h-8 px-2.5 text-xs text-primary hover:text-primary"
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setDriverToDelete(driver)}
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

      {/* Driver Details Modal */}
      <DriverDetailsModal
        open={Boolean(selectedDriver)}
        driver={selectedDriver}
        onClose={() => setSelectedDriver(null)}
        onEdit={(d) => handleEdit(d)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(driverToDelete)}
        title="Delete Driver?"
        message={`Are you sure you want to delete driver ${driverToDelete?.name} (${driverToDelete?.driverCode})?`}
        confirmLabel="Delete Driver"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDriverToDelete(null)}
      />
    </div>
  );
}
