import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import CustomerList from "./pages/customers/CustomerList";
import CustomerForm from "./pages/customers/CustomerForm";
import VehicleList from "./pages/vehicles/VehicleList";
import VehicleForm from "./pages/vehicles/VehicleForm";

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/settings" element={<Settings />} />

        <Route path="/customers" element={<CustomerList />} />
        <Route path="/customers/new" element={<CustomerForm />} />
        <Route path="/customers/:customerId/edit" element={<CustomerForm />} />

        <Route path="/vehicles" element={<VehicleList />} />
        <Route path="/vehicles/new" element={<VehicleForm />} />
        <Route path="/vehicles/:vehicleId/edit" element={<VehicleForm />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
