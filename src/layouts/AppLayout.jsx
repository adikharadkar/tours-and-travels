import { useState } from "react";
import { Outlet } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import Sidebar from "../components/sidebar/Sidebar";

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* FleetCore Sidebar */}
      <Sidebar isOpenMobile={isSidebarOpen} onCloseMobile={closeSidebar} />

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-4 md:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open navigation"
              className="rounded-md p-2 text-muted hover:bg-background hover:text-foreground md:hidden"
            >
              ☰
            </button>

            <h2 className="text-lg font-semibold">Application</h2>
          </div>

          <ThemeToggle />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
