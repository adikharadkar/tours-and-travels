import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import CustomerList from "./pages/customers/CustomerList";
import CustomerForm from "./pages/customers/CustomerForm";
import VehicleList from "./pages/vehicles/VehicleList";
import VehicleForm from "./pages/vehicles/VehicleForm";
import DriverList from "./pages/drivers/DriverList";
import DriverForm from "./pages/drivers/DriverForm";
import TripList from "./pages/trips/TripList";
import TripForm from "./pages/trips/TripForm";
import Calendar from "./pages/Calendar";
import InvoiceList from "./pages/invoices/InvoiceList";
import GenerateInvoice from "./pages/invoices/GenerateInvoice";

import { invoke } from "@tauri-apps/api/core";



function App() {

  const databasePath = invoke("get_database_path");

console.log("FleetCore database:", databasePath);
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/invoices" element={<InvoiceList />} />
        <Route path="/invoices/generate" element={<GenerateInvoice />} />
        <Route
          path="/invoices/generate/:tripId"
          element={<GenerateInvoice />}
        />

        <Route path="/trips" element={<TripList />} />
        <Route path="/trips/new" element={<TripForm />} />
        <Route path="/trips/:tripId/edit" element={<TripForm />} />

        <Route path="/calendar" element={<Calendar />} />

        <Route path="/vehicles" element={<VehicleList />} />
        <Route path="/vehicles/new" element={<VehicleForm />} />
        <Route path="/vehicles/:vehicleId/edit" element={<VehicleForm />} />

        <Route path="/drivers" element={<DriverList />} />
        <Route path="/drivers/new" element={<DriverForm />} />
        <Route path="/drivers/:driverId/edit" element={<DriverForm />} />

        <Route path="/customers" element={<CustomerList />} />
        <Route path="/customers/new" element={<CustomerForm />} />
        <Route path="/customers/:customerId/edit" element={<CustomerForm />} />

        <Route path="/settings" element={<Settings />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
