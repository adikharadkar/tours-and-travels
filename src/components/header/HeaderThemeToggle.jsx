import { useTheme } from "../../contexts/useTheme";

export default function HeaderThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className={[
        "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b38d4] dark:focus-visible:ring-[#d0bcff]",
        // Light theme
        "text-[#6b38d4] bg-[#eaedff] border border-[#6b38d4]/20 hover:bg-[#dae2fd]",
        // Dark theme
        "dark:text-[#cbc3d7] dark:bg-transparent dark:border-transparent dark:hover:text-[#e2e2eb] dark:hover:bg-[#33343b]/50",
      ].join(" ")}
    >
      <span
        className="material-symbols-outlined text-[20px]"
        data-weight="fill"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {theme === "dark" ? "dark_mode" : "light_mode"}
      </span>
    </button>
  );
}
