import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/header/Header";
import Sidebar from "../components/sidebar/Sidebar";

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] dark:bg-[#0f1117] text-[#0f172a] dark:text-[#e2e2eb]">
      {/* FleetCore Sidebar */}
      <Sidebar isOpenMobile={isSidebarOpen} onCloseMobile={closeSidebar} />

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Redesigned FleetCore Header */}
        <Header onOpenMobile={() => setIsSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
