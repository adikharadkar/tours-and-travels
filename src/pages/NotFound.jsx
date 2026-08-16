import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold">404</h1>

      <p className="mt-4 text-lg text-muted">
        The page you're looking for doesn't exist.
      </p>

      <Link
        to="/dashboard"
        className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
