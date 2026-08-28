import { useNavigate } from "react-router-dom";

export default function DashboardQuickNavigation({
  totalTrips = 0,
  totalVehicles = 0,
  activeVehicles = 0,
  totalDrivers = 0,
  activeDrivers = 0,
  totalCustomers = 0,
  totalInvoices = 0,
}) {
  const navigate = useNavigate();

  const navigationCards = [
    {
      id: "nav-trips",
      name: "Trips & Bookings",
      count: totalTrips,
      subtext: "Live schedules & logs",
      icon: "route",
      path: "/trips",
      colorClass:
        "bg-blue-500/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-400",
    },
    {
      id: "nav-vehicles",
      name: "Fleet Vehicles",
      count: totalVehicles,
      subtext: `${activeVehicles} active in service`,
      icon: "directions_bus",
      path: "/vehicles",
      colorClass:
        "bg-cyan-500/10 text-cyan-600 dark:bg-[#4cd7f6]/15 dark:text-[#4cd7f6]",
    },
    {
      id: "nav-drivers",
      name: "Driver Master",
      count: totalDrivers,
      subtext: `${activeDrivers} verified drivers`,
      icon: "badge",
      path: "/drivers",
      colorClass:
        "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400",
    },
    {
      id: "nav-customers",
      name: "Customer Directory",
      count: totalCustomers,
      subtext: "Corporate & private clients",
      icon: "corporate_fare",
      path: "/customers",
      colorClass:
        "bg-violet-500/10 text-violet-600 dark:bg-[#d0bcff]/15 dark:text-[#d0bcff]",
    },
    {
      id: "nav-invoices",
      name: "Invoices & Billing",
      count: totalInvoices,
      subtext: "Tax invoices & payments",
      icon: "receipt_long",
      path: "/invoices",
      colorClass:
        "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-400",
    },
  ];

  return (
    <div className="rounded-xl bg-white dark:bg-[#18191b] border border-slate-200/90 dark:border-[#27272a] shadow-xs p-4 sm:p-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#27272a]">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
            Dedicated Modules
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400">
            Jump to full management views for comprehensive records and
            operations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3">
        {navigationCards.map((card) => (
          <button
            key={card.id}
            id={card.id}
            type="button"
            onClick={() => navigate(card.path)}
            className="group flex flex-col p-3 rounded-lg bg-slate-50/70 dark:bg-[#121314] border border-slate-200/80 dark:border-[#27272a] hover:border-slate-300 dark:hover:border-zinc-600 text-left transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.colorClass}`}
              >
                <span className="material-symbols-outlined text-base">
                  {card.icon}
                </span>
              </div>
              <span className="material-symbols-outlined text-sm text-slate-400 group-hover:text-slate-700 dark:group-hover:text-zinc-200 transition-transform group-hover:translate-x-0.5">
                arrow_forward
              </span>
            </div>

            <div className="mt-2.5">
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-primary transition-colors block truncate">
                {card.name}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                <span className="font-semibold text-slate-700 dark:text-zinc-300">
                  {card.count}
                </span>{" "}
                &bull; {card.subtext}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
