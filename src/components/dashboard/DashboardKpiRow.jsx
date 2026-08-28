import { useNavigate } from "react-router-dom";
import { formatINR } from "../../utils/invoiceStatus";

export default function DashboardKpiRow({
  todayTripsCount = 0,
  inProgressCount = 0,
  readyToInvoiceCount = 0,
  outstandingAmount = 0,
  overdueAmount = 0,
  overdueCount = 0,
  attentionCount = 0,
  onScrollToAttention,
}) {
  const navigate = useNavigate();

  const kpis = [
    {
      id: "kpi-today-trips",
      label: "Today's Trips",
      value: todayTripsCount,
      subtext: `${inProgressCount} active on road`,
      icon: "calendar_today",
      colorClass: {
        iconBg:
          "bg-[#8455ef]/10 text-[#8455ef] dark:bg-[#d0bcff]/15 dark:text-[#d0bcff]",
        cardHover: "hover:border-[#8455ef]/40 dark:hover:border-[#d0bcff]/30",
        borderAccent: "group-hover:border-[#8455ef]/30",
      },
      onClick: () => navigate("/trips"),
    },
    {
      id: "kpi-in-progress",
      label: "In Progress",
      value: inProgressCount,
      subtext: inProgressCount > 0 ? "Live fleet moving" : "No active transits",
      icon: "local_shipping",
      isLive: inProgressCount > 0,
      colorClass: {
        iconBg:
          "bg-cyan-500/10 text-cyan-600 dark:bg-[#4cd7f6]/15 dark:text-[#4cd7f6]",
        cardHover: "hover:border-cyan-500/40 dark:hover:border-[#4cd7f6]/30",
        borderAccent: "group-hover:border-cyan-500/30",
      },
      onClick: () => navigate("/trips"),
    },
    {
      id: "kpi-ready-to-invoice",
      label: "Ready to Invoice",
      value: readyToInvoiceCount,
      subtext:
        readyToInvoiceCount > 0 ? "Completed unbilled" : "All trips billed",
      icon: "receipt_long",
      colorClass: {
        iconBg:
          "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400",
        cardHover:
          "hover:border-emerald-500/40 dark:hover:border-emerald-400/30",
        borderAccent: "group-hover:border-emerald-500/30",
      },
      onClick: () => navigate("/invoices/generate"),
    },
    {
      id: "kpi-outstanding-payments",
      label: "Outstanding Receivables",
      value: formatINR(outstandingAmount, { compact: false }),
      isCurrency: true,
      subtext:
        overdueCount > 0
          ? `${formatINR(overdueAmount)} overdue (${overdueCount})`
          : "All payments on schedule",
      icon: "account_balance_wallet",
      colorClass: {
        iconBg:
          overdueCount > 0
            ? "bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400"
            : "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-400",
        cardHover:
          overdueCount > 0
            ? "hover:border-amber-500/40 dark:hover:border-amber-400/30"
            : "hover:border-indigo-500/40 dark:hover:border-indigo-400/30",
        borderAccent: "group-hover:border-amber-500/30",
      },
      onClick: () => navigate("/invoices"),
    },
    {
      id: "kpi-attention-required",
      label: "Attention Required",
      value: attentionCount,
      subtext:
        attentionCount > 0
          ? "Docs, licenses & overdue"
          : "All compliance clear",
      icon: attentionCount > 0 ? "warning" : "verified",
      isAlert: attentionCount > 0,
      colorClass: {
        iconBg:
          attentionCount > 0
            ? "bg-rose-500/10 text-rose-600 dark:bg-rose-400/15 dark:text-rose-400"
            : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400",
        cardHover:
          attentionCount > 0
            ? "hover:border-rose-500/40 dark:hover:border-rose-400/30"
            : "hover:border-emerald-500/40 dark:hover:border-emerald-400/30",
        borderAccent: "group-hover:border-rose-500/30",
      },
      onClick: () => {
        if (onScrollToAttention) {
          onScrollToAttention();
        } else {
          navigate("/vehicles");
        }
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.id}
          id={kpi.id}
          role="button"
          tabIndex={0}
          onClick={kpi.onClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              kpi.onClick();
            }
          }}
          className={`group relative flex flex-col justify-between p-4 rounded-xl bg-white dark:bg-[#18191b] border border-slate-200/90 dark:border-[#27272a] shadow-xs transition-all duration-200 cursor-pointer active:scale-[0.99] ${kpi.colorClass.cardHover}`}
        >
          {/* Top Label & Icon */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 truncate">
              {kpi.label}
            </span>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${kpi.colorClass.iconBg}`}
            >
              <span className="material-symbols-outlined text-lg">
                {kpi.icon}
              </span>
            </div>
          </div>

          {/* Metric Value */}
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 ${
                  kpi.isCurrency ? "text-xl sm:text-2xl font-mono" : ""
                }`}
              >
                {kpi.value}
              </span>
              {kpi.isLive && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-700 dark:text-[#4cd7f6] uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
                  Live
                </span>
              )}
              {kpi.isAlert && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  Urgent
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1 truncate">
              {kpi.subtext}
            </p>
          </div>

          {/* Bottom subtle indicator */}
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-[#222326] flex items-center justify-between text-[11px] font-medium text-slate-400 dark:text-zinc-500 group-hover:text-slate-700 dark:group-hover:text-zinc-300 transition-colors">
            <span>View details</span>
            <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-0.5">
              arrow_forward
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
