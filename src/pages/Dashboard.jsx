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
import { getDrivers } from "../services/driverService";
import { getTrips } from "../services/tripService";
import { getVehicleDocumentStatus } from "../utils/vehicleDocumentStatus";
import { getDriverLicenseStatus } from "../utils/driverLicenseStatus";
import { VEHICLE_TYPE_LABELS } from "../constants/vehicles";
import { DRIVER_TYPE_LABELS, PREFIX_LABELS } from "../constants/drivers";
import { TripStatusBadge } from "../components/trips/TripStatusBadge";

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
        "inline-flex items-center rounded-full px-2.5 py-0.5",
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
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    try {
      setVehicles(getVehicles());
      setCustomers(getCustomers());
      setDrivers(getDrivers());
      setTrips(getTrips());
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    }
  }, []);

  const totalTrips = trips.length;
  const activeTrips = trips.filter(
    (t) => t.status === "confirmed" || t.status === "in_progress",
  ).length;

  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter((v) => v.isActive !== false).length;

  const totalDrivers = drivers.length;
  const activeDrivers = drivers.filter((d) => d.isActive !== false).length;

  // Vehicle compliance alerts
  const vehicleComplianceAlerts = vehicles
    .map((v) => ({
      type: "vehicle",
      vehicle: v,
      status: getVehicleDocumentStatus(v),
    }))
    .filter(
      (item) =>
        item.status.value === "expired" ||
        item.status.value === "expiring_soon",
    );

  // Driver license alerts
  const driverLicenseAlerts = drivers
    .map((d) => ({
      type: "driver",
      driver: d,
      status: getDriverLicenseStatus(d),
    }))
    .filter(
      (item) =>
        item.status.value === "expired" ||
        item.status.value === "expiring_soon",
    );

  const totalExpiredAlerts =
    vehicleComplianceAlerts.filter((item) => item.status.value === "expired")
      .length +
    driverLicenseAlerts.filter((item) => item.status.value === "expired")
      .length;

  const totalExpiringSoonAlerts =
    vehicleComplianceAlerts.filter(
      (item) => item.status.value === "expiring_soon",
    ).length +
    driverLicenseAlerts.filter((item) => item.status.value === "expiring_soon")
      .length;

  const totalCustomers = customers.length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Fleet & Operations Dashboard
          </h1>
          <p className="text-sm text-muted">
            Live overview of active bookings, fleet availability, driver
            licenses, and customer accounts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="primary"
            onClick={() => navigate("/trips/new")}
          >
            + New Booking
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/vehicles/new")}
          >
            + New Vehicle
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/drivers/new")}
          >
            + New Driver
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/customers/new")}
          >
            + New Customer
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Trips / Bookings */}
        <Card
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => navigate("/trips")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">
                ACTIVE TRIPS
              </span>
              <span className="text-lg">🗺️</span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {activeTrips}
            </p>
            <p className="mt-1 text-xs text-muted">
              {totalTrips} total scheduled bookings
            </p>
          </CardContent>
        </Card>

        {/* Vehicles */}
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

        {/* Drivers */}
        <Card
          className="cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => navigate("/drivers")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted">
                DRIVER MASTER
              </span>
              <span className="text-lg">🧑‍✈️</span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {totalDrivers}
            </p>
            <p className="mt-1 text-xs text-muted">
              {activeDrivers} active drivers
            </p>
          </CardContent>
        </Card>

        {/* Expiring / Expired Compliance */}
        <Card
          className="cursor-pointer hover:border-warning/50 transition-colors"
          onClick={() => navigate("/drivers")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-warning">
                EXPIRING & EXPIRED (30D)
              </span>
              <span className="text-lg">⚠️</span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-warning">
              {totalExpiringSoonAlerts + totalExpiredAlerts}
            </p>
            <p className="mt-1 text-xs text-muted">
              {totalExpiredAlerts} expired · {totalExpiringSoonAlerts} expiring
              soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active / Recent Trips Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">
              Recent & Upcoming Bookings
            </CardTitle>
            <CardDescription>
              Scheduled journeys, routes, and current trip statuses
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/trips")}
            className="text-xs"
          >
            View All Trips ({totalTrips}) →
          </Button>
        </CardHeader>
        <CardContent>
          {trips.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted">
              No trips recorded yet. Click &quot;+ New Booking&quot; to create
              your first trip.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {trips.slice(0, 4).map((trip) => {
                const cust = customers.find((c) => c.id === trip.customerId);
                const veh = vehicles.find((v) => v.id === trip.vehicleId);
                const drv = drivers.find((d) => d.id === trip.driverId);

                return (
                  <div
                    key={trip.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">
                          {trip.tripCode}
                        </span>
                        <span className="text-muted">·</span>
                        <span className="font-semibold text-foreground truncate">
                          {cust?.name || "Customer"}
                        </span>
                      </div>
                      <p className="text-muted mt-0.5 truncate">
                        {trip.pickupLocation} → {trip.dropLocation} ·{" "}
                        <span className="font-medium text-foreground">
                          {veh ? veh.vehicleNumber : "Vehicle"}
                        </span>{" "}
                        ({drv ? drv.name : "Driver"})
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-bold text-foreground">
                        ₹{Number(trip.totalAmount || 0).toLocaleString("en-IN")}
                      </span>
                      <TripStatusBadge status={trip.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Warnings Section */}
      {(vehicleComplianceAlerts.length > 0 ||
        driverLicenseAlerts.length > 0) && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base text-foreground flex items-center gap-2">
                  <span>🚨</span> Document & Driver License Compliance Attention
                  Required
                </CardTitle>
                <CardDescription>
                  Vehicles and drivers with compliance documents or driving
                  licenses expired or expiring within 30 days.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-2.5">
            {/* Driver License alerts */}
            {driverLicenseAlerts.map(({ driver, status }, idx) => {
              const prefixLabel = PREFIX_LABELS[driver.prefix] || "";
              const displayName = prefixLabel
                ? `${prefixLabel} ${driver.name}`
                : driver.name;

              return (
                <div
                  key={driver.id || `drv_alert_${idx}`}
                  className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        🧑‍✈️ {displayName}
                      </span>
                      <span className="font-mono text-muted">
                        ({driver.driverCode} · DL: {driver.licenseNumber})
                      </span>
                    </div>
                    <p className="text-muted mt-0.5">{status.message}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge value={status.value} label={status.label} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/drivers/${driver.id}/edit`)}
                      className="h-7 text-xs"
                    >
                      Update License
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Vehicle Document alerts */}
            {vehicleComplianceAlerts
              .slice(0, 4)
              .map(({ vehicle, status }, idx) => (
                <div
                  key={vehicle.id || `veh_alert_${idx}`}
                  className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground font-mono">
                        🚌 {vehicle.vehicleNumber}
                      </span>
                      <span className="text-muted">
                        ({vehicle.vehicleCode} ·{" "}
                        {VEHICLE_TYPE_LABELS[vehicle.vehicleType] ||
                          vehicle.vehicleType}
                        )
                      </span>
                    </div>
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
                      Update Docs
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Directory Quick Tables Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Drivers Quick List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Driver Master</CardTitle>
              <CardDescription>Recently registered drivers</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/drivers")}
              className="text-xs"
            >
              All ({totalDrivers}) →
            </Button>
          </CardHeader>

          <CardContent>
            {drivers.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted">
                No drivers registered. Click &quot;+ New Driver&quot; to begin.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {drivers.slice(0, 4).map((driver, idx) => {
                  const lic = getDriverLicenseStatus(driver);
                  const prefixLabel = PREFIX_LABELS[driver.prefix] || "";
                  const displayName = prefixLabel
                    ? `${prefixLabel} ${driver.name}`
                    : driver.name;

                  return (
                    <div
                      key={driver.id || `drv_dash_${idx}`}
                      className="flex items-center justify-between py-2.5 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {displayName}
                        </p>
                        <p className="text-muted truncate">
                          {driver.driverCode} ·{" "}
                          <span className="capitalize">
                            {DRIVER_TYPE_LABELS[driver.driverType] ||
                              driver.driverType}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge value={lic.value} label={lic.label} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicles Quick List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Fleet Master</CardTitle>
              <CardDescription>Registered fleet vehicles</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/vehicles")}
              className="text-xs"
            >
              All ({totalVehicles}) →
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
                      key={vehicle.id || `veh_dash_${idx}`}
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
              <CardDescription>Client accounts</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/customers")}
              className="text-xs"
            >
              All ({totalCustomers}) →
            </Button>
          </CardHeader>

          <CardContent>
            {customers.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted">
                No customer records found.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {customers.slice(0, 4).map((customer, idx) => (
                  <div
                    key={customer.id || `cust_dash_${idx}`}
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
