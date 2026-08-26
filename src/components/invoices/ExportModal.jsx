import { useState } from "react";
import Modal, {
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
} from "../ui/Modal";
import Button from "../ui/Button";
import { formatINR } from "../../utils/invoiceStatus";
import {
  exportInvoicesToCsv,
  exportInvoicesToExcel,
} from "../../services/invoiceExportService";

export default function ExportModal({
  isOpen,
  open,
  onClose,
  invoices = [],
  filteredInvoices = [],
}) {
  const isModalOpen = open !== undefined ? open : isOpen;
  const [exportFormat, setExportFormat] = useState("csv"); // 'csv' | 'excel' | 'json' | 'print'
  const [scope, setScope] = useState("filtered"); // 'filtered' | 'all'
  const [isExporting, setIsExporting] = useState(false);

  const activeInvoices =
    scope === "filtered" && filteredInvoices.length > 0
      ? filteredInvoices
      : invoices;

  const totalAmount = activeInvoices.reduce(
    (sum, inv) => sum + Number(inv.totalAmount || 0),
    0,
  );
  const totalPaid = activeInvoices.reduce(
    (sum, inv) => sum + Number(inv.paidAmount || 0),
    0,
  );
  const totalDue = Math.max(0, totalAmount - totalPaid);

  const handleExport = async () => {
    if (isExporting || activeInvoices.length === 0) return;
    setIsExporting(true);

    try {
      if (exportFormat === "print") {
        window.print();
        onClose();
        return;
      }

      if (exportFormat === "csv") {
        exportInvoicesToCsv(activeInvoices, {
          filenamePrefix: `fleetcore_invoices_${new Date().toISOString().split("T")[0]}`,
        });
        onClose();
        return;
      }

      if (exportFormat === "excel") {
        await exportInvoicesToExcel(activeInvoices, {
          filenamePrefix: `fleetcore_invoices_${new Date().toISOString().split("T")[0]}`,
        });
        onClose();
        return;
      }

      if (exportFormat === "json") {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(activeInvoices, null, 2),
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
    } catch (err) {
      console.error("Bulk export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal open={isModalOpen} onClose={onClose} className="max-w-lg">
      <ModalHeader className="p-5 border-b border-border bg-surface/50">
        <ModalTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
          Export Invoices
        </ModalTitle>
        <ModalDescription className="text-xs text-slate-500 dark:text-zinc-400">
          Download high-fidelity financial data formatted for accounting
          software, ERPs, and spreadsheets.
        </ModalDescription>
      </ModalHeader>

      <ModalContent className="space-y-4 text-xs p-5 max-h-[70vh] overflow-y-auto">
        {/* Scope Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">
            Select Data Scope
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setScope("filtered")}
              className={[
                "px-3 py-2 text-left rounded-lg border transition-all cursor-pointer",
                scope === "filtered"
                  ? "bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500 text-indigo-950 dark:text-indigo-200 shadow-2xs"
                  : "bg-surface border-border text-muted hover:border-slate-300 dark:hover:border-zinc-700",
              ].join(" ")}
            >
              <div className="font-semibold text-xs text-foreground">
                Current Filtered View
              </div>
              <div className="text-[11px] text-muted">
                {filteredInvoices.length} invoices ({formatINR(totalAmount)})
              </div>
            </button>

            <button
              type="button"
              onClick={() => setScope("all")}
              className={[
                "px-3 py-2 text-left rounded-lg border transition-all cursor-pointer",
                scope === "all"
                  ? "bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-500 text-indigo-950 dark:text-indigo-200 shadow-2xs"
                  : "bg-surface border-border text-muted hover:border-slate-300 dark:hover:border-zinc-700",
              ].join(" ")}
            >
              <div className="font-semibold text-xs text-foreground">
                All Recorded Invoices
              </div>
              <div className="text-[11px] text-muted">
                {invoices.length} invoices total
              </div>
            </button>
          </div>
        </div>

        {/* Format Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 block">
            Choose Export Format
          </label>

          <div className="grid grid-cols-1 gap-2">
            {/* 1. CSV Option */}
            <label
              className={[
                "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                exportFormat === "csv"
                  ? "bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-500 text-indigo-950 dark:text-indigo-200 shadow-2xs"
                  : "bg-surface border-border text-foreground hover:bg-surface-hover",
              ].join(" ")}
            >
              <input
                type="radio"
                name="exportFormat"
                value="csv"
                checked={exportFormat === "csv"}
                onChange={() => setExportFormat("csv")}
                className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold flex items-center justify-between">
                  <span>CSV Spreadsheet (.csv)</span>
                  <span className="text-[10px] font-mono uppercase text-indigo-600 dark:text-indigo-400 font-bold">
                    Standard
                  </span>
                </div>
                <span className="text-[11px] text-muted block mt-0.5 leading-snug">
                  Structured flat relational table compatible with Microsoft
                  Excel, Google Sheets, Tally ERP, and Zoho Books.
                </span>
              </div>
            </label>

            {/* 2. Excel Option */}
            <label
              className={[
                "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                exportFormat === "excel"
                  ? "bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-500 text-indigo-950 dark:text-indigo-200 shadow-2xs"
                  : "bg-surface border-border text-foreground hover:bg-surface-hover",
              ].join(" ")}
            >
              <input
                type="radio"
                name="exportFormat"
                value="excel"
                checked={exportFormat === "excel"}
                onChange={() => setExportFormat("excel")}
                className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold flex items-center justify-between">
                  <span>Excel Workbook (.xlsx)</span>
                  <span className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 font-bold">
                    Multi-Sheet
                  </span>
                </div>
                <span className="text-[11px] text-muted block mt-0.5 leading-snug">
                  Native binary spreadsheet with formatted columns, auto-width
                  headers, and multi-sheet summaries.
                </span>
              </div>
            </label>

            {/* 3. JSON Option */}
            <label
              className={[
                "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                exportFormat === "json"
                  ? "bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-500 text-indigo-950 dark:text-indigo-200 shadow-2xs"
                  : "bg-surface border-border text-foreground hover:bg-surface-hover",
              ].join(" ")}
            >
              <input
                type="radio"
                name="exportFormat"
                value="json"
                checked={exportFormat === "json"}
                onChange={() => setExportFormat("json")}
                className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold">JSON Data Backup (.json)</div>
                <span className="text-[11px] text-muted block mt-0.5 leading-snug">
                  Complete lossless data schema backup with line item
                  hierarchies and full payment records.
                </span>
              </div>
            </label>

            {/* 4. Print / PDF Summary Option */}
            <label
              className={[
                "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                exportFormat === "print"
                  ? "bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-500 text-indigo-950 dark:text-indigo-200 shadow-2xs"
                  : "bg-surface border-border text-foreground hover:bg-surface-hover",
              ].join(" ")}
            >
              <input
                type="radio"
                name="exportFormat"
                value="print"
                checked={exportFormat === "print"}
                onChange={() => setExportFormat("print")}
                className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold">Print / Browser PDF Summary</div>
                <span className="text-[11px] text-muted block mt-0.5 leading-snug">
                  Opens browser system print dialog for instant printing or PDF
                  archival.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Summary Metrics Box */}
        <div className="p-3 rounded-lg border border-border bg-surface/70 flex items-center justify-between text-[11px]">
          <div>
            <span className="text-muted font-medium block">
              Total Records to Export
            </span>
            <span className="font-mono font-bold text-foreground text-xs">
              {activeInvoices.length}{" "}
              {activeInvoices.length === 1 ? "Invoice" : "Invoices"}
            </span>
          </div>
          <div className="text-right">
            <span className="text-muted font-medium block">
              Total Value (INR)
            </span>
            <span className="font-mono font-bold text-foreground text-xs">
              {formatINR(totalAmount)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-muted font-medium block">
              Pending Balance
            </span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-xs">
              {formatINR(totalDue)}
            </span>
          </div>
        </div>
      </ModalContent>

      <ModalFooter className="border-t border-border p-4 bg-surface/50 flex items-center justify-between gap-3">
        <Button variant="secondary" onClick={onClose} disabled={isExporting}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleExport}
          disabled={isExporting || activeInvoices.length === 0}
          className="flex items-center gap-1.5"
        >
          {isExporting ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[16px]">
                file_download
              </span>
              <span>
                Export {activeInvoices.length}{" "}
                {activeInvoices.length === 1 ? "Invoice" : "Invoices"}
              </span>
            </>
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
