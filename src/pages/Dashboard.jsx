import { useState } from "react";

import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import Select from "../components/ui/Select";
import Checkbox from "../components/ui/Checkbox";
import Switch from "../components/ui/Switch";
import Label from "../components/ui/Label";
import FormField from "../components/ui/FormField";
import Card, {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import Modal, {
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Dropdown, {
  DropdownDivider,
  DropdownItem,
} from "../components/ui/Dropdown";

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  function handleDelete() {
    console.log("Invoice deleted");

    setIsConfirmOpen(false);
  }
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

      <div className="mt-8 max-w-md">
        <h2 className="text-lg font-semibold">Textarea</h2>

        <div className="mt-3 space-y-3">
          <Textarea placeholder="Add invoice notes..." />

          <Textarea rows={6} placeholder="Additional details..." />

          <Textarea disabled placeholder="Disabled textarea" />
        </div>
      </div>

      <div className="mt-8 max-w-md">
        <h2 className="text-lg font-semibold">Select</h2>

        <div className="mt-3 space-y-3">
          <Select defaultValue="">
            <option value="" disabled>
              Select invoice status
            </option>

            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </Select>

          <Select defaultValue="india">
            <option value="india">India</option>
            <option value="usa">United States</option>
            <option value="uk">United Kingdom</option>
          </Select>

          <Select disabled defaultValue="">
            <option value="" disabled>
              Disabled select
            </option>
          </Select>
        </div>
      </div>

      <div className="mt-8 max-w-md">
        <h2 className="text-lg font-semibold">Checkbox</h2>

        <div className="mt-3 space-y-3">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox />
            Send invoice by email
          </label>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox defaultChecked />
            Include payment details
          </label>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox disabled />
            Disabled option
          </label>
        </div>
      </div>

      <div className="mt-8 max-w-md">
        <h2 className="text-lg font-semibold">Switch</h2>

        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email notifications</p>

              <p className="text-sm text-muted">
                Receive invoice notifications by email.
              </p>
            </div>

            <Switch aria-label="Email notifications" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Automatic backups</p>

              <p className="text-sm text-muted">
                Automatically back up application data.
              </p>
            </div>

            <Switch aria-label="Automatic backups" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Disabled option</p>

              <p className="text-sm text-muted">
                This option is currently unavailable.
              </p>
            </div>

            <Switch aria-label="Disabled option" disabled />
          </div>
        </div>
      </div>

      <div className="mt-8 max-w-md">
        <h2 className="text-lg font-semibold">Label</h2>

        <div className="mt-4 space-y-2">
          <Label htmlFor="demo-customer-name">Customer name</Label>

          <Input id="demo-customer-name" placeholder="Enter customer name" />
        </div>
      </div>

      <div className="mt-8 max-w-md">
        <h2 className="text-lg font-semibold">FormField</h2>

        <div className="mt-4 space-y-6">
          <FormField
            label="Customer name"
            required
            description="Enter the customer's full name."
          >
            {(fieldProps) => <Input {...fieldProps} placeholder="John Doe" />}
          </FormField>

          <FormField label="Customer email" required>
            {(fieldProps) => (
              <Input
                {...fieldProps}
                type="email"
                placeholder="customer@example.com"
              />
            )}
          </FormField>

          <FormField
            label="Invoice notes"
            description="Optional notes for this invoice."
          >
            {(fieldProps) => (
              <Textarea {...fieldProps} placeholder="Add notes..." />
            )}
          </FormField>

          <FormField label="Customer name" error="Customer name is required.">
            {(fieldProps) => (
              <Input {...fieldProps} placeholder="Enter customer name" />
            )}
          </FormField>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Card</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>

              <CardDescription>
                Your latest invoices will appear here.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted">No recent invoices.</p>
            </CardContent>

            <CardFooter>
              <Button>Create Invoice</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Summary</CardTitle>

              <CardDescription>Overview of your account.</CardDescription>
            </CardHeader>

            <CardContent>
              <p className="text-2xl font-semibold">₹0.00</p>

              <p className="mt-1 text-sm text-muted">Outstanding amount</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Modal</h2>
        <div className="mt-4">
          <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
        </div>
        <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <ModalHeader>
            <div>
              <ModalTitle>Delete Invoice</ModalTitle>

              <ModalDescription>This action cannot be undone.</ModalDescription>
            </div>

            <ModalClose onClose={() => setIsModalOpen(false)} />
          </ModalHeader>

          <ModalContent>
            <p className="text-sm text-foreground">
              Are you sure you want to delete this invoice?
            </p>

            <p className="mt-2 text-sm text-muted">
              The invoice and its associated data will be permanently removed.
            </p>
          </ModalContent>

          <ModalFooter>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>

            <Button variant="danger" onClick={() => setIsModalOpen(false)}>
              Delete
            </Button>
          </ModalFooter>
        </Modal>
        {/* Existing Dashboard content */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold">Confirm Dialog</h2>

          <div className="mt-4">
            <Button variant="danger" onClick={() => setIsConfirmOpen(true)}>
              Delete Invoice
            </Button>
          </div>
        </div>
        <ConfirmDialog
          open={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={handleDelete}
          title="Delete invoice?"
          description="This action cannot be undone. The invoice will be permanently deleted."
          confirmText="Delete"
          cancelText="Cancel"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Dropdown</h2>

        <div className="mt-4">
          <Dropdown trigger={<Button variant="secondary">Actions</Button>}>
            <DropdownItem onClick={() => console.log("Edit clicked")}>
              Edit
            </DropdownItem>

            <DropdownItem onClick={() => console.log("Duplicate clicked")}>
              Duplicate
            </DropdownItem>

            <DropdownDivider />

            <DropdownItem onClick={() => console.log("Delete clicked")}>
              Delete
            </DropdownItem>
          </Dropdown>
        </div>
      </div>
    </div>
  );
}
