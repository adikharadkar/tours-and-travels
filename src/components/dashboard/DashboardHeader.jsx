import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";

export default function DashboardHeader({ onRefresh, isRefreshing = false }) {
  const navigate = useNavigate();

  // Format today's human-readable date
  const todayFormatted = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-1 border-b border-slate-200/80 dark:border-[#27272a]/80">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
            Operations Dashboard
          </h1>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live System
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
          <span>{todayFormatted}</span>
          <span className="text-slate-300 dark:text-zinc-600">&bull;</span>
          <span>
            High-level fleet dispatch, billing, and operational readiness
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-8.5 text-xs font-medium"
          title="Refresh dashboard metrics"
        >
          <span
            className={`material-symbols-outlined text-base ${
              isRefreshing ? "animate-spin" : ""
            }`}
          >
            refresh
          </span>
          <span className="hidden sm:inline">Refresh</span>
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => navigate("/invoices/generate")}
          className="h-8.5 text-xs font-medium"
        >
          <span className="material-symbols-outlined text-base">
            receipt_long
          </span>
          <span>+ Invoice</span>
        </Button>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => navigate("/trips/new")}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#06b6d4] to-[#8b5cf6] hover:from-[#0891b2] hover:to-[#7c3aed] active:opacity-90 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-base">add_road</span>
          <span>+ New Booking</span>
        </Button>
      </div>
    </div>
  );
}
