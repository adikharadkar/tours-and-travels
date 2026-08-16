import Button from "../components/ui/Button";

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <p className="mt-2 text-muted">Welcome to your dashboard.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button>Create Invoice</Button>

        <Button variant="secondary">View Invoices</Button>

        <Button variant="danger">Delete</Button>

        <Button variant="ghost">Cancel</Button>
      </div>
    </div>
  );
}
