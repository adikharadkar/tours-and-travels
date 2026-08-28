import { useNavigate } from "react-router-dom";
import { TripStatusBadge } from "../trips/TripStatusBadge";
import Button from "../ui/Button";
import { formatINR } from "../../utils/invoiceStatus";

export default function DashboardTodayOperations({
  trips = [],
  customers = [],
  vehicles = [],
  drivers = [],
}) {
  const navigate = useNavigate();

  // Find customer, vehicle, driver helpers
  const getCustomer = (id) => customers.find((c) => c.id === id);
  const getVehicle = (id) => vehicles.find((v) => v.id === id);
  const getDriver = (id) => drivers.find((d) => d.id === id);

  return (
    <div className="flex flex-col h-full rounded-xl bg-white dark:bg-[#18191b] border border-slate-200/90 dark:border-[#27272a] shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-[#27272a]">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 dark:bg-[#4cd7f6]/15 dark:text-[#4cd7f6]">
            <span className="material-symbols-outlined text-base">near_me</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
              Today&apos;s Operations
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              Active routes and trips scheduled for today
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => navigate("/trips")}
          className="text-xs h-7 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
        >
          <span>All Trips</span>
          <span className="material-symbols-outlined text-sm">
            arrow_forward
          </span>
        </Button>
      </div>

      {/* Content / List */}
      <div className="flex-1 p-3 sm:p-4">
        {trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#222326] flex items-center justify-center text-slate-400 dark:text-zinc-500 mb-3">
              <span className="material-symbols-outlined text-xl">
                event_available
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
              No active or scheduled journeys for today
            </p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 max-w-xs mt-1">
              Fleet vehicles and drivers are currently available for new
              assignments.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => navigate("/trips/new")}
              className="mt-3.5 text-xs h-7.5"
            >
              + Create Booking
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#222326]">
            {trips.slice(0, 5).map((trip) => {
              const cust = getCustomer(trip.customerId);
              const veh = getVehicle(trip.vehicleId);
              const drv = getDriver(trip.driverId);

              const isOngoing = trip.status === "in_progress";

              return (
                <div
                  key={trip.id}
                  className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    {/* Top Row: Trip Code, Customer & Live indicator */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-zinc-100">
                        {trip.tripCode}
                      </span>
                      <span className="text-slate-300 dark:text-zinc-600">
                        &bull;
                      </span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-200 truncate">
                        {cust?.name || "Corporate Client"}
                      </span>
                      {isOngoing && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-700 dark:text-[#4cd7f6]">
                          <span className="w-1 h-1 rounded-full bg-cyan-500 animate-ping" />
                          On Route
                        </span>
                      )}
                    </div>

                    {/* Route Line */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-300 mt-1">
                      <span className="material-symbols-outlined text-xs text-slate-400 dark:text-zinc-500">
                        route
                      </span>
                      <span className="truncate font-medium">
                        {trip.pickupLocation || "Origin"}
                      </span>
                      <span className="material-symbols-outlined text-[10px] text-slate-400">
                        arrow_forward
                      </span>
                      <span className="truncate font-medium">
                        {trip.dropLocation || "Destination"}
                      </span>
                    </div>

                    {/* Vehicle & Driver metadata */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">
                          directions_bus
                        </span>
                        <span className="font-mono">
                          {veh?.vehicleNumber ||
                            trip.vehicleNumber ||
                            "Vehicle"}
                        </span>
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1 truncate">
                        <span className="material-symbols-outlined text-xs">
                          person
                        </span>
                        <span>{drv?.name || trip.driverName || "Driver"}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right side: Amount, Status & Quick Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-[#222326]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-zinc-100">
                        {formatINR(trip.totalAmount || trip.baseRate || 0)}
                      </span>
                      <TripStatusBadge status={trip.status} />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/trips`)}
                      className="text-[11px] h-6 px-2 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    >
                      View Trip
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
