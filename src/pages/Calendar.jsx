import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";

import TripCalendar from "../components/trips/TripCalendar";
import TripDetailsModal from "../components/trips/TripDetailsModal";
import TripActionsDrawer from "../components/trips/TripActionsDrawer";
import VehicleDetailsModal from "../components/vehicle/VehicleDetailsModal";
import DriverDetailsModal from "../components/drivers/DriverDetailsModal";
import InvoiceDetailsModal from "../components/invoices/InvoiceDetailsModal";
import Toast from "../components/ui/Toast";

import {
  getTrips,
  deleteTrip,
  confirmTrip,
  startTrip,
  completeTrip,
  cancelTrip,
} from "../services/tripService";
import { getCustomers } from "../services/customerService";
import { getVehicles } from "../services/vehicleService";
import { getDrivers } from "../services/driverService";
import { getInvoices } from "../services/invoiceService";

export default function Calendar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [trips, setTrips] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Selected item states for modals and drawers
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [actionDrawerTrip, setActionDrawerTrip] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const [toast, setToast] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const customers = await getCustomers();
    try {
      setTrips(getTrips() || []);
      setCustomers(customers || []);
      setVehicles(getVehicles() || []);
      setDrivers(getDrivers() || []);
      setInvoices(getInvoices() || []);
    } catch (err) {
      console.error("Failed to load calendar data:", err);
      setToast({
        id: Date.now(),
        message: "Failed to load operational records.",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle location navigation state (e.g. toasts passed from other views)
  useEffect(() => {
    if (location.state?.toast) {
      setToast({
        id: Date.now(),
        ...location.state.toast,
      });
    }
  }, [location.state]);

  // Lookup maps
  const customerMap = useMemo(() => {
    const map = new Map();
    customers.forEach((c) => map.set(c.id, c));
    return map;
  }, [customers]);

  const vehicleMap = useMemo(() => {
    const map = new Map();
    vehicles.forEach((v) => map.set(v.id, v));
    return map;
  }, [vehicles]);

  const driverMap = useMemo(() => {
    const map = new Map();
    drivers.forEach((d) => map.set(d.id, d));
    return map;
  }, [drivers]);

  const invoiceByTripIdMap = useMemo(() => {
    const map = new Map();
    invoices.forEach((inv) => {
      if (inv.documentStatus !== "cancelled") {
        if (inv.tripId) map.set(inv.tripId, inv);
        if (inv.tripCode) map.set(inv.tripCode, inv);
      }
    });
    return map;
  }, [invoices]);

  const getTripInvoice = useCallback(
    (trip) => {
      if (!trip) return null;
      return (
        invoiceByTripIdMap.get(trip.id) ||
        invoiceByTripIdMap.get(trip.tripCode) ||
        null
      );
    },
    [invoiceByTripIdMap],
  );

  const handleViewInvoice = useCallback(
    (target, explicitInvoice) => {
      let resolvedInvoice = explicitInvoice;
      if (!resolvedInvoice) {
        if (target?.invoiceNumber || (target?.documentType && target?.items)) {
          resolvedInvoice = target;
        } else if (target) {
          resolvedInvoice = getTripInvoice(target);
        }
      }

      if (!resolvedInvoice && target) {
        try {
          const allInvoices = getInvoices() || [];
          resolvedInvoice = allInvoices.find(
            (inv) =>
              inv.documentStatus !== "cancelled" &&
              ((target.id && inv.tripId === target.id) ||
                (target.tripCode && inv.tripCode === target.tripCode) ||
                (target.invoiceId && inv.id === target.invoiceId) ||
                (target.invoiceNumber &&
                  inv.invoiceNumber === target.invoiceNumber)),
          );
        } catch (err) {
          console.error("Error looking up invoice:", err);
        }
      }

      if (resolvedInvoice) {
        setSelectedTrip(null);
        setActionDrawerTrip(null);
        setViewingInvoice(resolvedInvoice);
      } else {
        setToast({
          id: Date.now(),
          message:
            "Unable to open invoice details. No active invoice found for this trip.",
          variant: "error",
        });
      }
    },
    [getTripInvoice],
  );

  // Initial schedule mode and view from URL query params if provided
  const initialScheduleMode = searchParams.get("mode") || "trips";
  const initialView = searchParams.get("view") || "week";
  const initialDate = searchParams.get("date") || undefined;

  return (
    <div className="space-y-6 pb-12">
      {toast && (
        <Toast
          id={toast.id}
          variant={toast.variant}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Main Calendar View Engine */}
      <TripCalendar
        trips={trips}
        customers={customers}
        vehicles={vehicles}
        drivers={drivers}
        customerMap={customerMap}
        vehicleMap={vehicleMap}
        driverMap={driverMap}
        initialScheduleMode={initialScheduleMode}
        initialView={initialView}
        initialDate={initialDate}
        isLoading={isLoading}
        onSelectTrip={(t) => setSelectedTrip(t)}
        onSelectVehicle={(v) => setSelectedVehicle(v)}
        onSelectDriver={(d) => setSelectedDriver(d)}
        onEditTrip={(t) => navigate(`/trips/${t.id}/edit`)}
        onNewTrip={() => navigate("/trips/new")}
      />

      {/* Trip Details Modal */}
      <TripDetailsModal
        open={Boolean(selectedTrip)}
        trip={selectedTrip}
        customer={
          selectedTrip ? customerMap.get(selectedTrip.customerId) : null
        }
        vehicle={selectedTrip ? vehicleMap.get(selectedTrip.vehicleId) : null}
        driver={selectedTrip ? driverMap.get(selectedTrip.driverId) : null}
        invoice={selectedTrip ? getTripInvoice(selectedTrip) : null}
        onClose={() => setSelectedTrip(null)}
        onViewInvoice={(inv) => handleViewInvoice(selectedTrip, inv)}
        onCreateInvoice={(t) => {
          setSelectedTrip(null);
          navigate(`/invoices/generate/${t.id}`);
        }}
        onEdit={(t) => {
          setSelectedTrip(null);
          navigate(`/trips/${t.id}/edit`);
        }}
        onOpenActions={(t) => {
          setSelectedTrip(null);
          setActionDrawerTrip(t);
        }}
      />

      {/* Trip Actions Drawer */}
      <TripActionsDrawer
        open={Boolean(actionDrawerTrip)}
        trip={actionDrawerTrip}
        customer={
          actionDrawerTrip ? customerMap.get(actionDrawerTrip.customerId) : null
        }
        vehicle={
          actionDrawerTrip ? vehicleMap.get(actionDrawerTrip.vehicleId) : null
        }
        driver={
          actionDrawerTrip ? driverMap.get(actionDrawerTrip.driverId) : null
        }
        invoice={actionDrawerTrip ? getTripInvoice(actionDrawerTrip) : null}
        onClose={() => setActionDrawerTrip(null)}
        onViewInvoice={(t, inv) => {
          setActionDrawerTrip(null);
          handleViewInvoice(t, inv);
        }}
        onViewDetails={(t) => {
          setActionDrawerTrip(null);
          setSelectedTrip(t);
        }}
        onGenerateInvoice={(t) => {
          setActionDrawerTrip(null);
          navigate(`/invoices/generate/${t.id}`);
        }}
        onEdit={(t) => {
          setActionDrawerTrip(null);
          navigate(`/trips/${t.id}/edit`);
        }}
        onConfirm={(t) => {
          try {
            confirmTrip(t.id);
            loadData();
            setToast({
              id: Date.now(),
              message: `${t.tripCode} confirmed successfully.`,
              variant: "success",
            });
          } catch (err) {
            setToast({
              id: Date.now(),
              message: err.message || "Failed to confirm trip.",
              variant: "error",
            });
          }
        }}
        onStart={(t) => {
          try {
            startTrip(t.id, {});
            loadData();
            setToast({
              id: Date.now(),
              message: `${t.tripCode} started successfully.`,
              variant: "success",
            });
          } catch (err) {
            setToast({
              id: Date.now(),
              message: err.message || "Failed to start trip.",
              variant: "error",
            });
          }
        }}
        onComplete={(t) => {
          try {
            completeTrip(t.id, {});
            loadData();
            setToast({
              id: Date.now(),
              message: `${t.tripCode} completed successfully. Ready for invoice.`,
              variant: "success",
            });
          } catch (err) {
            setToast({
              id: Date.now(),
              message: err.message || "Failed to complete trip.",
              variant: "error",
            });
          }
        }}
        onCancel={(t) => {
          try {
            cancelTrip(t.id, "Cancelled from calendar");
            loadData();
            setToast({
              id: Date.now(),
              message: `${t.tripCode} cancelled.`,
              variant: "success",
            });
          } catch (err) {
            setToast({
              id: Date.now(),
              message: err.message || "Failed to cancel trip.",
              variant: "error",
            });
          }
        }}
        onDelete={(t) => {
          try {
            deleteTrip(t.id);
            loadData();
            setToast({
              id: Date.now(),
              message: `${t.tripCode} deleted successfully.`,
              variant: "success",
            });
          } catch (err) {
            setToast({
              id: Date.now(),
              message: err.message || "Failed to delete trip.",
              variant: "error",
            });
          }
        }}
      />

      {/* Vehicle Details Modal */}
      <VehicleDetailsModal
        open={Boolean(selectedVehicle)}
        vehicle={selectedVehicle}
        trips={trips}
        onClose={() => setSelectedVehicle(null)}
        onEdit={(v) => navigate(`/vehicles/${v.id}/edit`)}
      />

      {/* Driver Details Modal */}
      <DriverDetailsModal
        open={Boolean(selectedDriver)}
        driver={selectedDriver}
        propTrips={trips}
        propVehicles={vehicles}
        onClose={() => setSelectedDriver(null)}
        onEdit={(d) => navigate(`/drivers/${d.id}/edit`)}
      />

      {/* Invoice Details Modal */}
      <InvoiceDetailsModal
        open={Boolean(viewingInvoice)}
        invoice={viewingInvoice}
        onClose={() => setViewingInvoice(null)}
      />
    </div>
  );
}
