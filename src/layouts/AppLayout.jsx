import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

const navigation = [
  {
    name: "Dashboard",
    path: "/dashboard",
  },
  {
    name: "Vehicles",
    path: "/vehicles",
  },
  {
    name: "Drivers",
    path: "/drivers",
  },
  {
    name: "Customers",
    path: "/customers",
  },
  {
    name: "Settings",
    path: "/settings",
  },
];

function navigationClass({ isActive }) {
  return [
    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted hover:bg-background hover:text-foreground",
  ].join(" ");
}

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface",
          "transform transition-transform duration-200 ease-in-out",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          "md:static md:z-auto md:translate-x-0",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
          <h1 className="text-lg font-semibold tracking-tight">
            Tours & Travels
          </h1>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={closeSidebar}
            aria-label="Close navigation"
            className="rounded-md p-2 text-muted hover:bg-background hover:text-foreground md:hidden"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={navigationClass}
              onClick={closeSidebar}
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

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
