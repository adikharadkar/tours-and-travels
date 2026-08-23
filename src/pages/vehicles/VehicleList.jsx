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
import VehicleCard from "../../components/vehicle/VehicleCard";
import VehicleDetailsModal from "../../components/vehicle/VehicleDetailsModal";
import { getVehicles, deleteVehicle } from "../../services/vehicleService";
import { getVehicleDocumentStatus } from "../../utils/vehicleDocumentStatus";
import {
  VEHICLE_TYPES,
  OWNERSHIP_TYPES,
  VEHICLE_STATUS_OPTIONS,
  DOCUMENT_STATUS_OPTIONS,
  VEHICLE_TYPE_LABELS,
  OWNERSHIP_TYPE_LABELS,
} from "../../constants/vehicles";

const VEHICLE_TYPE_FILTER_OPTIONS = [
  { label: "All Vehicle Types", value: "all" },
  ...VEHICLE_TYPES,
];

const OWNERSHIP_FILTER_OPTIONS = [
  { label: "All Ownerships", value: "all" },
  ...OWNERSHIP_TYPES,
];

const STATUS_CLASSES = {
  active: "bg-success/10 text-success border border-success/20",
  inactive: "bg-muted/20 text-muted border border-border",

  valid: "bg-success/10 text-success border border-success/20",
  expiring_soon: "bg-warning/10 text-warning border border-warning/20",
  expired: "bg-error/10 text-error border border-error/20",
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

export default function VehicleList() {
  const navigate = useNavigate();
  const location = useLocation();

  const [vehicles, setVehicles] = useState([]);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [ownershipFilter, setOwnershipFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [docStatusFilter, setDocStatusFilter] = useState("all");
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState(null);
  const [highlightedVehicleId, setHighlightedVehicleId] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    try {
      const data = getVehicles();
      setVehicles(data);
      setLoadError("");
    } catch (err) {
      console.error("Failed to load vehicles:", err);
      setLoadError("Failed to load vehicles from storage.");
    }
  }, []);

  useEffect(() => {
    if (location.state?.toast) {
      setToast({
        id: Date.now(),
        ...location.state.toast,
      });
    }

    if (location.state?.highlightedVehicleId) {
      setHighlightedVehicleId(location.state.highlightedVehicleId);
      const timer = setTimeout(() => {
        setHighlightedVehicleId(null);
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      // 1. Search filter: Vehicle Code, Vehicle Number, Make, Model, Owner Name
      if (query) {
        const matchCode = (vehicle.vehicleCode || "")
          .toLowerCase()
          .includes(query);
        const matchNumber = (vehicle.vehicleNumber || "")
          .toLowerCase()
          .includes(query);
        const matchMake = (vehicle.make || "").toLowerCase().includes(query);
        const matchModel = (vehicle.model || "").toLowerCase().includes(query);
        const matchOwner = (vehicle.ownerName || "")
          .toLowerCase()
          .includes(query);

        if (
          !matchCode &&
          !matchNumber &&
          !matchMake &&
          !matchModel &&
          !matchOwner
        ) {
          return false;
        }
      }

      // 2. Vehicle Type filter
      if (typeFilter !== "all" && vehicle.vehicleType !== typeFilter) {
        return false;
      }

      // 3. Ownership filter
      if (
        ownershipFilter !== "all" &&
        vehicle.ownershipType !== ownershipFilter
      ) {
        return false;
      }

      // 4. Status filter (Active/Inactive)
      if (statusFilter !== "all") {
        const isActive = vehicle.isActive !== false;
        if (statusFilter === "active" && !isActive) return false;
        if (statusFilter === "inactive" && isActive) return false;
      }

      // 5. Document Status filter
      if (docStatusFilter !== "all") {
        const docStatus = getVehicleDocumentStatus(vehicle);
        if (docStatus.value !== docStatusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [
    vehicles,
    search,
    typeFilter,
    ownershipFilter,
    statusFilter,
    docStatusFilter,
  ]);

  const stats = useMemo(() => {
    let activeCount = 0;
    let expiredDocsCount = 0;
    let expiringDocsCount = 0;

    vehicles.forEach((v) => {
      if (v.isActive !== false) activeCount++;
      const doc = getVehicleDocumentStatus(v);
      if (doc.value === "expired") expiredDocsCount++;
      else if (doc.value === "expiring_soon") expiringDocsCount++;
    });

    return {
      total: vehicles.length,
      active: activeCount,
      inactive: vehicles.length - activeCount,
      expired: expiredDocsCount,
      expiringSoon: expiringDocsCount,
    };
  }, [vehicles]);

  const hasActiveFilters =
    search.trim() !== "" ||
    typeFilter !== "all" ||
    ownershipFilter !== "all" ||
    statusFilter !== "all" ||
    docStatusFilter !== "all";

  const handleClearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setOwnershipFilter("all");
    setStatusFilter("all");
    setDocStatusFilter("all");
  };

  const handleEdit = (vehicle) => {
    navigate(`/vehicles/${vehicle.id}/edit`);
  };

  const handleConfirmDelete = () => {
    if (!vehicleToDelete) return;
    setIsDeleting(true);

    try {
      deleteVehicle(vehicleToDelete.id);
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleToDelete.id));

      if (selectedVehicle?.id === vehicleToDelete.id) {
        setSelectedVehicle(null);
      }

      setToast({
        id: Date.now(),
        variant: "success",
        title: "Vehicle Deleted",
        message: `Vehicle ${vehicleToDelete.vehicleNumber} (${vehicleToDelete.vehicleCode}) was removed successfully.`,
      });
      setVehicleToDelete(null);
    } catch (err) {
      console.error("Delete vehicle error:", err);
      setToast({
        id: Date.now(),
        variant: "error",
        title: "Delete Failed",
        message: err.message || "Failed to delete vehicle.",
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
            Vehicles
          </h1>
          <p className="text-sm text-muted">
            Manage your fleet master, ownership types, seating capacities, and
            document compliance.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          onClick={() => navigate("/vehicles/new")}
          className="shrink-0"
        >
          + Add Vehicle
        </Button>
      </div>

      {/* Overview Metric Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <div className="rounded-lg border border-border bg-surface p-3.5">
          <p className="text-xs font-medium text-muted">Total Fleet</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-foreground">
            {stats.total}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-3.5">
          <p className="text-xs font-medium text-muted">Active Vehicles</p>
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
          <p className="text-xs font-medium text-muted">Expiring Soon Docs</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-warning">
            {stats.expiringSoon}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-3.5 col-span-2 sm:col-span-1">
          <p className="text-xs font-medium text-muted">Expired Docs</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-error">
            {stats.expired}
          </p>
        </div>
      </div>

      {/* Search and Filters Card */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {/* Search */}
            <div className="lg:col-span-1">
              <Input
                placeholder="Search code, reg #, make..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {/* Type Filter */}
            <div>
              <Select
                value={typeFilter}
                options={VEHICLE_TYPE_FILTER_OPTIONS}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {/* Ownership Filter */}
            <div>
              <Select
                value={ownershipFilter}
                options={OWNERSHIP_FILTER_OPTIONS}
                onChange={(e) => setOwnershipFilter(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {/* Status Filter */}
            <div>
              <Select
                value={statusFilter}
                options={VEHICLE_STATUS_OPTIONS}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {/* Document Status Filter */}
            <div>
              <Select
                value={docStatusFilter}
                options={DOCUMENT_STATUS_OPTIONS}
                onChange={(e) => setDocStatusFilter(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted">
              <span>
                Showing {filteredVehicles.length} of {vehicles.length} vehicles
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
      ) : vehicles.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
              🚌
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                No vehicles added yet
              </h3>
              <p className="mt-1 text-sm text-muted">
                Create your first vehicle master record to start managing your
                fleet.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate("/vehicles/new")}
            >
              + Add First Vehicle
            </Button>
          </CardContent>
        </Card>
      ) : filteredVehicles.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent className="space-y-3">
            <h3 className="text-base font-semibold text-foreground">
              No matching vehicles found
            </h3>
            <p className="text-sm text-muted">
              No vehicles matched your search query and filter criteria.
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
            {filteredVehicles.map((vehicle, idx) => (
              <VehicleCard
                key={vehicle.id || vehicle.vehicleCode || `veh_card_${idx}`}
                vehicle={vehicle}
                highlighted={vehicle.id === highlightedVehicleId}
                onView={(v) => setSelectedVehicle(v)}
                onEdit={(v) => handleEdit(v)}
                onDelete={(v) => setVehicleToDelete(v)}
              />
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block">
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle Code</TableHead>
                    <TableHead>Vehicle Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Make / Model</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Ownership</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Document Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredVehicles.map((vehicle, idx) => {
                    const docStatus = getVehicleDocumentStatus(vehicle);
                    const isHighlighted = vehicle.id === highlightedVehicleId;
                    const typeLabel =
                      VEHICLE_TYPE_LABELS[vehicle.vehicleType] ||
                      vehicle.vehicleType;
                    const ownershipLabel =
                      OWNERSHIP_TYPE_LABELS[vehicle.ownershipType] ||
                      vehicle.ownershipType;

                    return (
                      <TableRow
                        key={
                          vehicle.id || vehicle.vehicleCode || `veh_row_${idx}`
                        }
                        className={
                          isHighlighted
                            ? "bg-primary/5 transition-colors duration-500 ring-1 ring-inset ring-primary/30"
                            : ""
                        }
                      >
                        <TableCell className="font-mono text-xs text-muted whitespace-nowrap">
                          {vehicle.vehicleCode}
                        </TableCell>

                        <TableCell className="font-bold font-mono tracking-tight text-foreground whitespace-nowrap">
                          {vehicle.vehicleNumber}
                        </TableCell>

                        <TableCell className="whitespace-nowrap">
                          {typeLabel}
                        </TableCell>

                        <TableCell className="max-w-[160px] truncate">
                          <span className="font-medium text-foreground">
                            {vehicle.make}
                          </span>{" "}
                          <span className="text-muted">{vehicle.model}</span>
                        </TableCell>

                        <TableCell className="whitespace-nowrap">
                          {vehicle.seatingCapacity} Seats
                        </TableCell>

                        <TableCell className="whitespace-nowrap">
                          <span>{ownershipLabel}</span>
                          {(vehicle.ownershipType === "attached" ||
                            vehicle.ownershipType === "leased") &&
                            vehicle.ownerName && (
                              <span className="block text-[11px] text-muted truncate max-w-[120px]">
                                {vehicle.ownerName}
                              </span>
                            )}
                        </TableCell>

                        <TableCell className="whitespace-nowrap">
                          <StatusBadge
                            value={
                              vehicle.isActive !== false ? "active" : "inactive"
                            }
                            label={
                              vehicle.isActive !== false ? "Active" : "Inactive"
                            }
                          />
                        </TableCell>

                        <TableCell className="whitespace-nowrap">
                          <StatusBadge
                            value={docStatus.value}
                            label={docStatus.label}
                            title={docStatus.summary}
                          />
                        </TableCell>

                        <TableCell className="text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedVehicle(vehicle)}
                              className="h-8 px-2.5 text-xs"
                            >
                              View
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(vehicle)}
                              className="h-8 px-2.5 text-xs text-primary hover:text-primary"
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setVehicleToDelete(vehicle)}
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

      {/* Vehicle Details Modal */}
      <VehicleDetailsModal
        open={Boolean(selectedVehicle)}
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onEdit={(v) => handleEdit(v)}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(vehicleToDelete)}
        title="Delete Vehicle?"
        message={`Are you sure you want to delete ${vehicleToDelete?.vehicleNumber} (${vehicleToDelete?.vehicleCode})?`}
        confirmLabel="Delete Vehicle"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setVehicleToDelete(null)}
      />
    </div>
  );
}
