import ThemeToggle from "./components/ThemeToggle";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
        <h1 className="text-xl font-semibold">Tauri App</h1>

        <ThemeToggle />
      </header>

      <main className="p-6">
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold">Theme System</h2>

          <p className="mt-2 text-muted">Switch between light and dark mode.</p>
        </div>
      </main>
    </div>
  );
}

export default App;
