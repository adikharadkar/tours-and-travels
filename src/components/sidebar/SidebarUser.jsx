import { Link } from "react-router-dom";

export default function SidebarUser({
  isCollapsed,
  userName = "J. Reynolds",
  userRole = "System Admin",
}) {
  if (isCollapsed) {
    return (
      <Link
        to="/settings"
        title={`${userName} (${userRole})`}
        className="flex items-center justify-center p-2 rounded-lg hover:bg-[#f1f5f9] dark:hover:bg-[#33343b]/50 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6b38d4] to-[#4cd7f6] flex items-center justify-center text-white text-xs font-bold shadow-xs">
          JR
        </div>
      </Link>
    );
  }

  return (
    <Link
      to="/settings"
      className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#f1f5f9] dark:hover:bg-[#33343b]/50 transition-all duration-200 w-full text-left group cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b38d4] dark:focus-visible:ring-[#d0bcff]"
      title="User Settings"
    >
      {/* Avatar with gradient border */}
      <div className="w-9 h-9 rounded-full bg-[#f1f5f9] dark:bg-[#262a36] border border-[#e2e8f0] dark:border-white/10 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
        <span className="material-symbols-outlined text-[#6b38d4] dark:text-[#d0bcff] text-2xl group-hover:scale-110 transition-transform">
          account_circle
        </span>
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0 flex flex-col">
        <span className="text-sm font-semibold truncate text-[#0f172a] dark:text-[#e2e2eb] group-hover:text-[#6b38d4] dark:group-hover:text-[#d0bcff] transition-colors">
          {userName}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b] dark:text-[#cbc3d7] truncate">
          {userRole}
        </span>
      </div>

      {/* More indicator */}
      <span className="material-symbols-outlined text-[#64748b] dark:text-[#cbc3d7] text-base shrink-0 group-hover:translate-x-0.5 transition-transform">
        unfold_more
      </span>
    </Link>
  );
}
