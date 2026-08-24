export default function SidebarSection({ title, isCollapsed, children }) {
  return (
    <div className="flex flex-col gap-1">
      {!isCollapsed ? (
        <h2 className="px-3 mb-1 text-[11px] font-semibold tracking-wider uppercase text-[#64748b] dark:text-[#8e909c]">
          {title}
        </h2>
      ) : (
        <div className="h-px bg-[#e2e8f0] dark:bg-[#494454]/30 my-2 mx-2" />
      )}
      {children}
    </div>
  );
}
