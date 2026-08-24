import { Link } from "react-router-dom";

export default function HeaderUser({
  userName = "Sarah Jenkins",
  userRole = "Fleet Director",
  avatarUrl = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=160",
}) {
  return (
    <Link
      to="/settings"
      title={`${userName} (${userRole})`}
      className="flex items-center gap-2.5 sm:gap-3 pl-1 sm:pl-2 group cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b38d4] dark:focus-visible:ring-[#d0bcff] rounded-lg"
    >
      {/* Text Info: Left on dark mode or Right on light mode */}
      <div className="hidden sm:block text-right">
        <p className="text-xs sm:text-sm font-semibold text-[#0f172a] dark:text-[#e2e2eb] leading-none mb-0.5 group-hover:text-[#6b38d4] dark:group-hover:text-[#d0bcff] transition-colors truncate">
          {userName}
        </p>
        <p className="text-[10px] sm:text-[11px] font-medium text-[#64748b] dark:text-[#cbc3d7]/70 leading-none truncate">
          {userRole}
        </p>
      </div>

      {/* Avatar with ring hover */}
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-[#e2e8f0] dark:border-white/10 ring-2 ring-transparent group-hover:ring-[#6b38d4] dark:group-hover:ring-[#d0bcff] transition-all shadow-xs bg-[#f1f5f9] dark:bg-[#262a36] shrink-0">
        <img
          src={avatarUrl}
          alt={userName}
          onError={(e) => {
            e.target.style.display = "none";
            if (e.target.nextSibling) {
              e.target.nextSibling.style.display = "flex";
            }
          }}
          className="w-full h-full object-cover"
        />
        <div
          style={{ display: "none" }}
          className="w-full h-full bg-gradient-to-tr from-[#6b38d4] to-[#06b6d4] text-white text-xs font-bold items-center justify-center"
        >
          SJ
        </div>
      </div>
    </Link>
  );
}
