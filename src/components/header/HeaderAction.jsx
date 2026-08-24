import { useNavigate } from "react-router-dom";

export default function HeaderAction({ action }) {
  const navigate = useNavigate();

  if (!action || !action.label) {
    return null;
  }

  const handleClick = () => {
    if (typeof action.onClick === "function") {
      action.onClick();
    } else if (action.path) {
      navigate(action.path);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        "shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b38d4] dark:focus-visible:ring-[#d0bcff]",
        "active:scale-95",
        // Light Theme: Clean outlined pill / elevated button with primary accent
        "bg-white border border-[#6b38d4]/40 text-[#6b38d4] hover:bg-[#eaedff]/50 hover:border-[#6b38d4] shadow-xs",
        // Dark Theme: Radiant violet gradient with luminous accent
        "dark:bg-gradient-to-r dark:from-[#a078ff] dark:to-[#6d3bd7] dark:text-white dark:border-transparent dark:shadow-[0_0_15px_rgba(160,120,255,0.25)] dark:hover:brightness-110",
      ].join(" ")}
    >
      <span
        className="material-symbols-outlined text-[18px] md:text-[20px]"
        aria-hidden="true"
      >
        {action.icon || "add"}
      </span>
      <span>{action.label}</span>
    </button>
  );
}
