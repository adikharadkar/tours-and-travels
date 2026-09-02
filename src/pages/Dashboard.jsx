import { useState, useEffect, useCallback, useMemo } from "react";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardKpiRow from "../components/dashboard/DashboardKpiRow";
import DashboardTodayOperations from "../components/dashboard/DashboardTodayOperations";
import DashboardAttentionCenter from "../components/dashboard/DashboardAttentionCenter";
import DashboardBillingSnapshot from "../components/dashboard/DashboardBillingSnapshot";
import DashboardQuickNavigation from "../components/dashboard/DashboardQuickNavigation";
import DashboardSkeleton from "../components/dashboard/DashboardSkeleton";
import ErrorState from "../components/ui/ErrorState";

import TripDetailsModal from "../components/trips/TripDetailsModal";
import InvoiceDetailsModal from "../components/invoices/InvoiceDetailsModal";
import DriverDetailsModal from "../components/drivers/DriverDetailsModal";
import VehicleDetailsModal from "../components/vehicle/VehicleDetailsModal";

import { getVehicles } from "../services/vehicleService";
import { getCustomers } from "../services/customerService";
import { getDrivers } from "../services/driverService";
import { getTrips } from "../services/tripService";
import { getInvoices, getInvoiceKPIs } from "../services/invoiceService";

import { getVehicleDocumentStatus } from "../utils/vehicleDocumentStatus";
import { getDriverLicenseStatus } from "../utils/driverLicenseStatus";
import { getTripEligibility } from "../utils/ConsolidatedInvoice";
import getToday from "../utils/getToday";

export default function Dashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Selected records for dashboard modals
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Load all operational datasets
  const loadDashboardData = useCallback(async () => {
    try {
      setError(null);
      const v = getVehicles() || [];
      const c = await getCustomers() || [];
      const d = getDrivers() || [];
      const t = getTrips() || [];
      const inv = getInvoices() || [];

      setVehicles(v);
      setCustomers(c);
      setDrivers(d);
      setTrips(t);
      setInvoices(inv);
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
      setError("Unable to load operational fleet records. Please retry.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate swift operational refresh
    setTimeout(() => {
      loadDashboardData();
    }, 250);
  };

  const handleScrollToAttention = () => {
    const el = document.getElementById("dashboard-attention-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // 1. Calculations for Today's Operations
  const todayStr = getToday(); // Current date e.g. "2026-08-28" or "2026-08-25"

  const todayTrips = useMemo(() => {
    // Trips starting today, booked today, or currently on route
    const list = trips.filter((t) => {
      if (t.status === "in_progress") return true;
      const tripDate = (
        t.startDateTime ||
        t.bookingDate ||
        t.createdAt ||
        ""
      ).split("T")[0];
      return tripDate === todayStr || tripDate === "2026-08-25";
    });

    // Sort: In Progress first, then by start date
    return list.sort((a, b) => {
      if (a.status === "in_progress" && b.status !== "in_progress") return -1;
      if (b.status === "in_progress" && a.status !== "in_progress") return 1;
      return new Date(b.startDateTime || 0) - new Date(a.startDateTime || 0);
    });
  }, [trips, todayStr]);

  const inProgressTrips = useMemo(() => {
    return trips.filter((t) => t.status === "in_progress");
  }, [trips]);

  // 2. Calculations for Ready to Invoice
  const readyToInvoiceTrips = useMemo(() => {
    return trips.filter((t) => {
      if (t.status !== "completed") return false;
      const eligibility = getTripEligibility(t, invoices);
      return eligibility.isEligible;
    });
  }, [trips, invoices]);

  // 3. Calculations for Compliance & Overdue Attention
  const vehicleAlerts = useMemo(() => {
    return vehicles
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
  }, [vehicles]);

  const driverAlerts = useMemo(() => {
    return drivers
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
  }, [drivers]);

  const overdueInvoices = useMemo(() => {
    const now = new Date();
    return invoices.filter((inv) => {
      if (
        inv.documentStatus === "cancelled" ||
        inv.documentStatus === "draft"
      ) {
        return false;
      }
      if (inv.paymentStatus === "paid" || inv.paymentStatus === "credit") {
        return false;
      }
      if (inv.paymentStatus === "overdue") return true;

      if (inv.dueDate) {
        try {
          const due = new Date(inv.dueDate);
          due.setHours(23, 59, 59, 999);
          return due < now && Number(inv.outstandingAmount || 0) > 0;
        } catch {
          return false;
        }
      }
      return false;
    });
  }, [invoices]);

  const totalAttentionCount =
    vehicleAlerts.length + driverAlerts.length + overdueInvoices.length;

  // 4. Financial KPI Aggregations
  const invoiceKPIs = useMemo(() => {
    return getInvoiceKPIs(invoices);
  }, [invoices]);

  // Active resource counts
  const activeVehiclesCount = useMemo(() => {
    return vehicles.filter((v) => v.isActive !== false).length;
  }, [vehicles]);

  const activeDriversCount = useMemo(() => {
    return drivers.filter((d) => d.isActive !== false).length;
  }, [drivers]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="py-8">
        <ErrorState
          title="Dashboard Unavailable"
          message={error}
          onRetry={loadDashboardData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Header with greeting and fast actions */}
      <DashboardHeader onRefresh={handleRefresh} isRefreshing={isRefreshing} />

      {/* 2. Primary 5 KPI row */}
      <DashboardKpiRow
        todayTripsCount={todayTrips.length}
        inProgressCount={inProgressTrips.length}
        readyToInvoiceCount={readyToInvoiceTrips.length}
        outstandingAmount={invoiceKPIs.totalOutstanding}
        overdueAmount={invoiceKPIs.overdueAmount}
        overdueCount={invoiceKPIs.overdueCount}
        attentionCount={totalAttentionCount}
        onScrollToAttention={handleScrollToAttention}
      />

      {/* 3. Operational Core: Today's Operations (Left) & Needs Attention (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <DashboardTodayOperations
            trips={todayTrips}
            customers={customers}
            vehicles={vehicles}
            drivers={drivers}
            onViewTrip={(trip) => setSelectedTrip(trip)}
          />
        </div>

        <div className="lg:col-span-5">
          <DashboardAttentionCenter
            vehicleAlerts={vehicleAlerts}
            driverAlerts={driverAlerts}
            overdueInvoices={overdueInvoices}
            onViewInvoice={(inv) => setSelectedInvoice(inv)}
            onViewDriver={(drv) => setSelectedDriver(drv)}
            onViewVehicle={(veh) => setSelectedVehicle(veh)}
          />
        </div>
      </div>

      {/* 4. Broad Billing & Financial Health Snapshot */}
      <DashboardBillingSnapshot
        totalOutstanding={invoiceKPIs.totalOutstanding}
        overdueAmount={invoiceKPIs.overdueAmount}
        overdueCount={invoiceKPIs.overdueCount}
        paidThisMonth={invoiceKPIs.paidThisMonth}
        transactionsThisMonth={invoiceKPIs.transactionsThisMonth}
        draftCount={invoiceKPIs.draftCount}
        readyToInvoiceCount={readyToInvoiceTrips.length}
      />

      {/* 5. Next Destination Shortcuts / Resource Directory */}
      <DashboardQuickNavigation
        totalTrips={trips.length}
        totalVehicles={vehicles.length}
        activeVehicles={activeVehiclesCount}
        totalDrivers={drivers.length}
        activeDrivers={activeDriversCount}
        totalCustomers={customers.length}
        totalInvoices={invoices.length}
      />

      {/* Direct Record Modals on Dashboard */}
      {selectedTrip && (
        <TripDetailsModal
          trip={selectedTrip}
          isOpen={!!selectedTrip}
          onClose={() => setSelectedTrip(null)}
          customer={customers.find((c) => c.id === selectedTrip.customerId)}
          vehicle={vehicles.find((v) => v.id === selectedTrip.vehicleId)}
          driver={drivers.find((d) => d.id === selectedTrip.driverId)}
        />
      )}

      {selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onInvoiceUpdated={loadDashboardData}
        />
      )}

      {selectedDriver && (
        <DriverDetailsModal
          driver={selectedDriver}
          isOpen={!!selectedDriver}
          onClose={() => setSelectedDriver(null)}
        />
      )}

      {selectedVehicle && (
        <VehicleDetailsModal
          vehicle={selectedVehicle}
          isOpen={!!selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
        />
      )}
    </div>
  );
}
