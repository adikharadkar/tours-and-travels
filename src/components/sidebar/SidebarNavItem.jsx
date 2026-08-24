import { NavLink } from "react-router-dom";

export default function SidebarNavItem({
  name,
  path,
  icon,
  badge,
  badgeType = "primary",
  isCollapsed = false,
  onClick,
  isExact = false,
}) {
  return (
    <NavLink
      to={path}
      end={isExact}
      onClick={onClick}
      title={isCollapsed ? name : undefined}
      className={({ isActive }) =>
        [
          "group relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer active:scale-[0.98]",
          isCollapsed ? "justify-center px-2" : "",
          isActive
            ? [
                // Light active state (Stitch light theme: rich primary-container with crisp white text & primary left border)
                "bg-[#8455ef] text-white font-bold border-l-4 border-[#6b38d4] shadow-xs",
                // Dark active state (Stitch dark theme: violet-10% tint, secondary cyan left bar & ambient glow)
                "dark:bg-[#d0bcff]/10 dark:text-[#d0bcff] dark:border-[#4cd7f6] dark:shadow-[0_0_12px_rgba(139,92,246,0.3)]",
              ].join(" ")
            : [
                // Inactive state
                "text-[#64748b] hover:text-[#6b38d4] hover:bg-[#f1f5f9] border-l-4 border-transparent",
                "dark:text-[#cbc3d7] dark:hover:text-[#e2e2eb] dark:hover:bg-[#33343b]/50",
              ].join(" "),
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          {/* Icon */}
          <span
            className={[
              "material-symbols-outlined shrink-0 text-xl transition-colors",
              isActive
                ? "text-white dark:text-[#4cd7f6]"
                : "text-[#64748b] group-hover:text-[#6b38d4] dark:text-[#cbc3d7] dark:group-hover:text-[#d0bcff]",
            ].join(" ")}
            style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            {icon}
          </span>

          {/* Label */}
          {!isCollapsed && (
            <span className="flex-1 truncate text-left">{name}</span>
          )}

          {/* Badge */}
          {!isCollapsed && badge !== undefined && badge !== null && (
            <span
              className={[
                "text-[10px] font-bold px-2 py-0.5 rounded-full text-center shrink-0 min-w-[20px] transition-colors",
                isActive
                  ? "bg-white/20 text-white dark:bg-[#4cd7f6]/20 dark:text-[#4cd7f6] dark:border dark:border-[#4cd7f6]/30"
                  : badgeType === "cyan" || badgeType === "secondary"
                    ? "bg-[#57dffe] text-[#00424e] dark:bg-[#4cd7f6]/20 dark:text-[#4cd7f6] dark:border dark:border-[#4cd7f6]/30"
                    : badgeType === "amber" || badgeType === "warning"
                      ? "bg-[#fed7aa] text-[#7c2d12] dark:bg-[#fbbf24]/20 dark:text-[#fbbf24] dark:border dark:border-[#fbbf24]/30"
                      : "bg-[#e0e7ff] text-[#3730a3] dark:bg-[#d0bcff]/20 dark:text-[#d0bcff] dark:border dark:border-[#d0bcff]/30",
              ].join(" ")}
            >
              {badge}
            </span>
          )}

          {/* Floating badge for collapsed mode */}
          {isCollapsed && badge !== undefined && badge !== null && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#06b6d4] dark:bg-[#4cd7f6]" />
          )}
        </>
      )}
    </NavLink>
  );
}
