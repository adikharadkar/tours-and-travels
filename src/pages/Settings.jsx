import { useState } from "react";

import useToast from "../contexts/useToast";
import Button from "../components/ui/Button";
import Loading from "../components/ui/Loading";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import Badge from "../components/ui/Badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../components/ui/Table";
import Pagination from "../components/ui/Pagination";
import Tabs, {
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/Tabs";
import Tooltip from "../components/ui/Tooltip";
import DatePicker from "../components/ui/Datepicker";
import SearchInput from "../components/ui/SearchInput";

export default function Settings() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  return (
    <div>
      <h1 className="text-2xl font-semibold">Settings</h1>

      <p className="mt-2 text-muted">Manage your application settings.</p>

      <SearchInput
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search invoices..."
      />

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          onClick={() =>
            toast.success({
              title: "Success",
              message: "Invoice created successfully.",
            })
          }
        >
          Success Toast
        </Button>

        <Button
          variant="danger"
          onClick={() =>
            toast.error({
              title: "Error",
              message: "Failed to create invoice.",
            })
          }
        >
          Error Toast
        </Button>

        <Button
          variant="secondary"
          onClick={() =>
            toast.warning({
              title: "Warning",
              message: "Your invoice is missing some information.",
            })
          }
        >
          Warning Toast
        </Button>

        <Button
          variant="secondary"
          onClick={() =>
            toast.info({
              title: "Information",
              message: "Your invoice is being processed.",
            })
          }
        >
          Info Toast
        </Button>
      </div>

      <div className="space-y-6 my-6">
        <Loading label="Loading dashboard..." size="xl2" />
      </div>

      <EmptyState
        title="No invoices yet"
        description="Create your first invoice to start managing your invoices."
        action={<Button>Create Invoice</Button>}
      />

      <ErrorState
        title="Unable to load dashboard"
        description="We couldn't load your dashboard data. Please try again."
        action={<Button>Try Again</Button>}
      />

      <Badge variant="success">Active</Badge>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <TableRow>
            <TableCell>INV-001</TableCell>
            <TableCell>John Doe</TableCell>
            <TableCell>₹12,500</TableCell>
            <TableCell>
              <Badge variant="success">Paid</Badge>
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell>INV-002</TableCell>
            <TableCell>Jane Doe</TableCell>
            <TableCell>₹8,750</TableCell>
            <TableCell>
              <Badge variant="warning">Pending</Badge>
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell>INV-003</TableCell>
            <TableCell>Acme Pvt. Ltd.</TableCell>
            <TableCell>₹21,300</TableCell>
            <TableCell>
              <Badge variant="error">Overdue</Badge>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Pagination
        currentPage={1}
        totalPages={10}
        onPageChange={(page) => {
          console.log("Page:", page);
        }}
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>

          <TabsTrigger value="invoices">Invoices</TabsTrigger>

          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="rounded-lg border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">Overview</h2>

            <p className="mt-2 text-sm text-muted">
              View your business overview and recent activity.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <div className="rounded-lg border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">Invoices</h2>

            <p className="mt-2 text-sm text-muted">
              Manage your invoices here.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="customers">
          <div className="rounded-lg border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold">Customers</h2>

            <p className="mt-2 text-sm text-muted">
              Manage your customers here.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <Tooltip content="Edit invoice">
        <button type="button" className="rounded-md p-2">
          ✏️
        </button>
      </Tooltip>

      <div className="mt-6 max-w-md space-y-4">
        <h2 className="text-lg font-semibold">Date Picker</h2>

        <DatePicker
          label="Invoice Date"
          value="2026-08-18"
          onChange={() => {}}
        />

        <DatePicker
          label="Due Date"
          value="2026-08-25"
          onChange={() => {}}
          min="2026-08-18"
          helperText="Select a date after the invoice date."
        />

        <DatePicker
          label="Date with Error"
          value=""
          onChange={() => {}}
          error="Please select a valid date."
        />
      </div>
    </div>
  );
}
