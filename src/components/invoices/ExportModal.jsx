import { useState } from "react";
import Modal, {
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
} from "../ui/Modal";
import Button from "../ui/Button";

export default function ExportModal({ isOpen, open, onClose, invoices = [] }) {
  const isModalOpen = open !== undefined ? open : isOpen;
  const [exportFormat, setExportFormat] = useState("csv");

  const handleExport = () => {
    if (exportFormat === "print") {
      window.print();
      onClose();
      return;
    }

    if (exportFormat === "json") {
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(invoices, null, 2),
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute(
        "download",
        `fleetcore_invoices_${new Date().toISOString().split("T")[0]}.json`,
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      onClose();
      return;
    }

    // Default: CSV format
    const headers = [
      "Invoice Number",
      "Document Type",
      "Document Status",
      "Payment Status",
      "Customer Name",
      "Customer Code",
      "Customer GSTIN",
      "Trip Code",
      "Route",
      "Issue Date",
      "Due Date",
      "Subtotal",
      "Tax Rate (%)",
      "Tax Amount",
      "Discount",
      "Total Amount",
      "Paid Amount",
      "Outstanding Amount",
      "Payment Terms",
      "Payment Reference",
    ];

    const rows = invoices.map((inv) => [
      `"${inv.invoiceNumber || ""}"`,
      `"${inv.documentType || ""}"`,
      `"${inv.documentStatus || ""}"`,
      `"${inv.paymentStatus || ""}"`,
      `"${inv.customerName || ""}"`,
      `"${inv.customerCode || ""}"`,
      `"${inv.customerGstin || ""}"`,
      `"${inv.tripCode || ""}"`,
      `"${(inv.route || "").replace(/"/g, '""')}"`,
      `"${inv.issueDate || ""}"`,
      `"${inv.dueDate || ""}"`,
      inv.subtotal || 0,
      inv.taxRate || 0,
      inv.taxAmount || 0,
      inv.discountAmount || 0,
      inv.totalAmount || 0,
      inv.paidAmount || 0,
      inv.outstandingAmount || 0,
      `"${inv.paymentTerms || ""}"`,
      `"${inv.paymentReference || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `fleetcore_invoices_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    onClose();
  };

  return (
    <Modal open={isModalOpen} onClose={onClose} className="max-w-md">
      <ModalHeader>
        <ModalTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
          Export Invoices
        </ModalTitle>
        <ModalDescription className="text-xs text-slate-500 dark:text-zinc-400">
          Export {invoices.length}{" "}
          {invoices.length === 1 ? "invoice" : "invoices"} based on your current
          view and filters.
        </ModalDescription>
      </ModalHeader>

      <ModalContent className="space-y-3 text-xs">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">
            Choose Export Format
          </label>

          <div className="grid grid-cols-1 gap-2">
            <label
              className={[
                "flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all",
                exportFormat === "csv"
                  ? "bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-500 text-indigo-950 dark:text-indigo-200"
                  : "bg-white dark:bg-[#121314] border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300",
              ].join(" ")}
            >
              <input
                type="radio"
                name="exportFormat"
                value="csv"
                checked={exportFormat === "csv"}
                onChange={() => setExportFormat("csv")}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-semibold block">
                  CSV / Excel Spreadsheet
                </span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Standard tabular format compatible with Microsoft Excel,
                  Google Sheets, and Tally
                </span>
              </div>
            </label>

            <label
              className={[
                "flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all",
                exportFormat === "json"
                  ? "bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-500 text-indigo-950 dark:text-indigo-200"
                  : "bg-white dark:bg-[#121314] border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300",
              ].join(" ")}
            >
              <input
                type="radio"
                name="exportFormat"
                value="json"
                checked={exportFormat === "json"}
                onChange={() => setExportFormat("json")}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-semibold block">JSON Data Backup</span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Structured machine-readable format for ERP integrations and
                  backup
                </span>
              </div>
            </label>

            <label
              className={[
                "flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all",
                exportFormat === "print"
                  ? "bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-500 text-indigo-950 dark:text-indigo-200"
                  : "bg-white dark:bg-[#121314] border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300",
              ].join(" ")}
            >
              <input
                type="radio"
                name="exportFormat"
                value="print"
                checked={exportFormat === "print"}
                onChange={() => setExportFormat("print")}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-semibold block">Print / PDF Summary</span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Trigger browser print dialogue to print or save summary as PDF
                </span>
              </div>
            </label>
          </div>
        </div>
      </ModalContent>

      <ModalFooter className="border-t border-slate-200 dark:border-[#27272a] pt-3">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleExport}>
          Export Now
        </Button>
      </ModalFooter>
    </Modal>
  );
}
