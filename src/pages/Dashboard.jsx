import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../components/ui/Button";
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { getVehicles } from "../services/vehicleService";
import { getCustomers } from "../services/customerService";
import { getVehicleDocumentStatus } from "../utils/vehicleDocumentStatus";
import { VEHICLE_TYPE_LABELS } from "../constants/vehicles";

const STATUS_CLASSES = {
  active: "bg-success/10 text-success border border-success/20",
  inactive: "bg-muted/20 text-muted border border-border",
  valid: "bg-success/10 text-success border border-success/20",
  expiring_soon: "bg-warning/10 text-warning border border-warning/20",
  expired: "bg-error/10 text-error border border-error/20",
};

function StatusBadge({ value, label }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2 py-0.5",
        "text-xs font-medium whitespace-nowrap",
        STATUS_CLASSES[value] ?? "bg-muted/20 text-muted border border-border",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    try {
      setVehicles(getVehicles());
      setCustomers(getCustomers());
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    }
  }, []);

  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter((v) => v.isActive !== false).length;

  const complianceAlerts = vehicles
    .map((v) => ({
      vehicle: v,
      status: getVehicleDocumentStatus(v),
    }))
    .filter(
      (item) =>
        item.status.value === "expired" ||
        item.status.value === "expiring_soon",
    );

  const expiredCount = complianceAlerts.filter(
    (item) => item.status.value === "expired",
  ).length;
  const expiringSoonCount = complianceAlerts.filter(
    (item) => item.status.value === "expiring_soon",
  ).length;

  const totalCustomers = customers.length;
  const companyCustomers = customers.filter(
    (c) => c.customerType === "company",
  ).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Fleet Operations Dashboard
          </h1>
          <p className="text-sm text-muted">
            Overview of fleet capacity, compliance expirations, and client
            management.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/customers/new")}
          >
            + New Customer
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => navigate("/vehicles/new")}
          >
            + New Vehicle
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => navigate("/vehicles")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">
                TOTAL FLEET
              </span>
              <span className="text-lg">🚌</span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {totalVehicles}
            </p>
            <p className="mt-1 text-xs text-muted">
              {activeVehicles} active in service
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-warning/50 transition-colors"
          onClick={() => navigate("/vehicles")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-warning">
                EXPIRING DOCS (30D)
              </span>
              <span className="text-lg">⚠️</span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-warning">
              {expiringSoonCount}
            </p>
            <p className="mt-1 text-xs text-muted">Requires upcoming renewal</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-error/50 transition-colors"
          onClick={() => navigate("/vehicles")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-error">
                EXPIRED DOCUMENTS
              </span>
              <span className="text-lg">🚫</span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-error">
              {expiredCount}
            </p>
            <p className="mt-1 text-xs text-muted">Immediate action needed</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => navigate("/customers")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">
                CUSTOMERS
              </span>
              <span className="text-lg">👥</span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {totalCustomers}
            </p>
            <p className="mt-1 text-xs text-muted">
              {companyCustomers} corporate clients
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Warnings Section */}
      {complianceAlerts.length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-foreground flex items-center gap-2">
                  <span>🚨</span> Document Compliance Attention Required
                </CardTitle>
                <CardDescription>
                  The following vehicles have documents that are expired or
                  expiring within 30 days.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/vehicles")}
                className="text-xs"
              >
                View in Fleet →
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-2">
            {complianceAlerts.slice(0, 5).map(({ vehicle, status }, idx) => (
              <div
                key={vehicle.id || vehicle.vehicleCode || `veh_alert_${idx}`}
                className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-foreground font-mono mr-2">
                    {vehicle.vehicleNumber}
                  </span>
                  <span className="text-muted">
                    ({vehicle.vehicleCode} ·{" "}
                    {VEHICLE_TYPE_LABELS[vehicle.vehicleType] ||
                      vehicle.vehicleType}
                    )
                  </span>
                  <p className="text-muted mt-0.5">{status.summary}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge value={status.value} label={status.label} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/vehicles/${vehicle.id}/edit`)}
                    className="h-7 text-xs"
                  >
                    Update
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Fleet & Recent Activity Quick Table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Vehicles Quick List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Fleet Master</CardTitle>
              <CardDescription>
                Recently registered fleet vehicles
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/vehicles")}
              className="text-xs"
            >
              All Vehicles ({totalVehicles}) →
            </Button>
          </CardHeader>

          <CardContent>
            {vehicles.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted">
                No vehicles registered. Click &quot;+ New Vehicle&quot; to
                begin.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {vehicles.slice(0, 4).map((vehicle, idx) => {
                  const doc = getVehicleDocumentStatus(vehicle);
                  return (
                    <div
                      key={
                        vehicle.id || vehicle.vehicleCode || `veh_list_${idx}`
                      }
                      className="flex items-center justify-between py-2.5 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-bold font-mono text-foreground truncate">
                          {vehicle.vehicleNumber}
                        </p>
                        <p className="text-muted truncate">
                          {vehicle.make} {vehicle.model} ·{" "}
                          {vehicle.seatingCapacity} seats
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge value={doc.value} label={doc.label} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customers Quick List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Customer Directory</CardTitle>
              <CardDescription>Recently added client accounts</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/customers")}
              className="text-xs"
            >
              All Customers ({totalCustomers}) →
            </Button>
          </CardHeader>

          <CardContent>
            {customers.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted">
                No customer records found. Click &quot;+ New Customer&quot; to
                add.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {customers.slice(0, 4).map((customer, idx) => (
                  <div
                    key={
                      customer.id || customer.customerCode || `cust_list_${idx}`
                    }
                    className="flex items-center justify-between py-2.5 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {customer.name}
                      </p>
                      <p className="text-muted truncate">
                        {customer.customerCode} ·{" "}
                        {customer.mobile1 || "No mobile"}
                      </p>
                    </div>

                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize shrink-0">
                      {customer.customerType}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
