import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import { formatINR } from "../../utils/invoiceStatus";

export default function DashboardAttentionCenter({
  vehicleAlerts = [],
  driverAlerts = [],
  overdueInvoices = [],
  onViewInvoice,
  onViewDriver,
  onViewVehicle,
}) {
  const navigate = useNavigate();

  const totalAlerts =
    vehicleAlerts.length + driverAlerts.length + overdueInvoices.length;

  return (
    <div
      id="dashboard-attention-section"
      className="flex flex-col h-full rounded-xl bg-white dark:bg-[#18191b] border border-slate-200/90 dark:border-[#27272a] shadow-xs"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-[#27272a]">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-lg ${
              totalAlerts > 0
                ? "bg-rose-500/10 text-rose-600 dark:bg-rose-400/15 dark:text-rose-400"
                : "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400"
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {totalAlerts > 0 ? "error_outline" : "verified"}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Needs Attention
              </h2>
              {totalAlerts > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                  {totalAlerts} items
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  All Clear
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Expiring documents, driver licenses, and overdue payments
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 sm:p-4">
        {totalAlerts === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-xl">
                check_circle
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              All compliance items are in good standing
            </p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 max-w-xs mt-1">
              All vehicle permits, driver licenses, and billing cycles are up to
              date.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Overdue Invoices Alerts */}
            {overdueInvoices.slice(0, 2).map((inv) => (
              <div
                key={`alert_inv_${inv.id}`}
                onClick={() => {
                  if (onViewInvoice) {
                    onViewInvoice(inv);
                  } else {
                    navigate(`/invoices?status=overdue&invoiceId=${inv.id}`);
                  }
                }}
                className="p-3 rounded-lg border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs cursor-pointer hover:border-amber-500/40 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                      Overdue Payment
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">
                      {inv.invoiceNumber}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-zinc-300 text-[11px] mt-1 truncate">
                    {inv.customerName} &bull; Outstanding:{" "}
                    <span className="font-semibold font-mono text-slate-900 dark:text-zinc-100">
                      {formatINR(inv.outstandingAmount || inv.totalAmount)}
                    </span>
                  </p>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onViewInvoice) {
                      onViewInvoice(inv);
                    } else {
                      navigate(`/invoices?status=overdue&invoiceId=${inv.id}`);
                    }
                  }}
                  className="h-7 text-xs shrink-0 self-start sm:self-center"
                >
                  View Invoice
                </Button>
              </div>
            ))}

            {/* Driver License Alerts */}
            {driverAlerts.slice(0, 2).map(({ driver, status }, idx) => {
              const isExpired = status.value === "expired";
              return (
                <div
                  key={`alert_drv_${driver.id || idx}`}
                  onClick={() => {
                    if (onViewDriver) {
                      onViewDriver(driver);
                    } else {
                      navigate(`/drivers?licenseStatus=${status.value}`);
                    }
                  }}
                  className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs cursor-pointer hover:opacity-95 transition-all ${
                    isExpired
                      ? "border-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20 hover:border-rose-500/40"
                      : "border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-500/40"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isExpired
                            ? "bg-rose-500/20 text-rose-800 dark:text-rose-300"
                            : "bg-amber-500/20 text-amber-800 dark:text-amber-300"
                        }`}
                      >
                        {status.label ||
                          (isExpired ? "License Expired" : "Expiring Soon")}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-zinc-100 truncate">
                        {driver.name}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-zinc-300 text-[11px] mt-1 truncate">
                      {driver.driverCode} &bull;{" "}
                      {status.message || `DL: ${driver.licenseNumber}`}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/drivers/${driver.id}/edit`);
                    }}
                    className="h-7 text-xs shrink-0 self-start sm:self-center"
                  >
                    Update License
                  </Button>
                </div>
              );
            })}

            {/* Vehicle Document Alerts */}
            {vehicleAlerts.slice(0, 2).map(({ vehicle, status }, idx) => {
              const isExpired = status.value === "expired";
              return (
                <div
                  key={`alert_veh_${vehicle.id || idx}`}
                  onClick={() => {
                    if (onViewVehicle) {
                      onViewVehicle(vehicle);
                    } else {
                      navigate(`/vehicles?documentStatus=${status.value}`);
                    }
                  }}
                  className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs cursor-pointer hover:opacity-95 transition-all ${
                    isExpired
                      ? "border-rose-500/20 bg-rose-50/50 dark:bg-rose-950/20 hover:border-rose-500/40"
                      : "border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-500/40"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isExpired
                            ? "bg-rose-500/20 text-rose-800 dark:text-rose-300"
                            : "bg-amber-500/20 text-amber-800 dark:text-amber-300"
                        }`}
                      >
                        {status.label ||
                          (isExpired ? "Docs Expired" : "Expiring Soon")}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-zinc-100">
                        {vehicle.vehicleNumber}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-zinc-300 text-[11px] mt-1 truncate">
                      {vehicle.vehicleCode} &bull;{" "}
                      {status.summary ||
                        "Compliance documentation renewal needed"}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/vehicles/${vehicle.id}/edit`);
                    }}
                    className="h-7 text-xs shrink-0 self-start sm:self-center"
                  >
                    Update Docs
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
