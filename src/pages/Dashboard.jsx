import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

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

      <div className="mt-8 max-w-md">
        <h2 className="text-lg font-semibold">Input</h2>

        <div className="mt-3 space-y-3">
          <Input placeholder="Customer name" />

          <Input type="email" placeholder="Customer email" />

          <Input type="number" placeholder="Invoice amount" />

          <Input disabled placeholder="Disabled input" />
        </div>
      </div>
    </div>
  );
}
