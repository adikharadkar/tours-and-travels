import { useTheme } from "../contexts/useTheme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  console.log(theme);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground transition-colors hover:bg-background"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? "Dark" : "Light"}
    </button>
  );
}
