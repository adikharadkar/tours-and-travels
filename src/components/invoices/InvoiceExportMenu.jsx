import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  exportInvoiceToPdf,
  exportInvoiceToExcel,
  exportInvoiceToCsv,
} from "../../services/invoiceExportService";

export default function InvoiceExportMenu({
  invoice,
  buttonVariant = "secondary",
  buttonSize = "md",
  className = "",
  align = "right",
  direction = "auto", // 'auto' | 'up' | 'down'
  onExportSuccess,
  onExportError,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [effectiveDirection, setEffectiveDirection] = useState(
    direction === "up" ? "up" : "down",
  );
  const [coords, setCoords] = useState({ top: 0, left: 0, openUp: false });
  const [loadingFormat, setLoadingFormat] = useState(null); // 'pdf' | 'excel' | 'csv' | null
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }
  const menuRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (!menuRef.current) return;
      const rect = menuRef.current.getBoundingClientRect();
      const menuWidth = 240;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      const openUp =
        direction === "up"
          ? true
          : direction === "down"
            ? false
            : spaceBelow < 240 && spaceAbove > spaceBelow;

      setEffectiveDirection(openUp ? "up" : "down");

      let calculatedLeft;
      if (align === "left") {
        calculatedLeft = rect.left;
      } else {
        calculatedLeft = rect.right - menuWidth;
      }

      // Keep within viewport boundaries
      if (typeof window !== "undefined" && window.innerWidth > 0) {
        calculatedLeft = Math.max(
          8,
          Math.min(window.innerWidth - menuWidth - 8, calculatedLeft),
        );
      }

      let calculatedTop;
      if (openUp) {
        calculatedTop = Math.max(8, rect.top - 6);
      } else {
        calculatedTop = rect.bottom + 6;
      }

      setCoords({
        top: calculatedTop,
        left: calculatedLeft,
        openUp,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, direction, align]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Clear toast notifications after 4 seconds
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      setNotification(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  const handleExport = async (format) => {
    if (loadingFormat) return; // Prevent repeated clicks
    setLoadingFormat(format);
    setIsOpen(false);

    try {
      if (format === "pdf") {
        await exportInvoiceToPdf(invoice);
        const msg = "Invoice PDF exported successfully.";
        setNotification({ type: "success", message: msg });
        onExportSuccess?.("pdf", invoice);
      } else if (format === "excel") {
        await exportInvoiceToExcel(invoice);
        const msg = "Invoice Excel workbook (.xlsx) exported successfully.";
        setNotification({ type: "success", message: msg });
        onExportSuccess?.("excel", invoice);
      } else if (format === "csv") {
        exportInvoiceToCsv(invoice);
        const msg = "Invoice CSV (.csv) exported successfully.";
        setNotification({ type: "success", message: msg });
        onExportSuccess?.("csv", invoice);
      }
    } catch (err) {
      console.error(`Export to ${format} failed:`, err);
      const errMsg = "Unable to export invoice. Please try again.";
      setNotification({ type: "error", message: errMsg });
      onExportError?.(err, format, invoice);
    } finally {
      setLoadingFormat(null);
    }
  };

  const isExecuting = Boolean(loadingFormat);

  const dropdownMenu = isOpen && (
    <div
      ref={dropdownRef}
      role="menu"
      aria-orientation="vertical"
      style={{
        position: "fixed",
        top: coords.openUp ? undefined : `${coords.top}px`,
        bottom: coords.openUp
          ? `${typeof window !== "undefined" ? window.innerHeight - coords.top : 0}px`
          : undefined,
        left: `${coords.left}px`,
        zIndex: 9999,
      }}
      onClick={(e) => e.stopPropagation()}
      className={[
        "w-60 rounded-lg border shadow-2xl py-1 backdrop-blur-sm transition-all animate-in fade-in-0 zoom-in-95",
        effectiveDirection === "up"
          ? "bottom-full origin-bottom"
          : "origin-top",
        "bg-white dark:bg-[#18191b] border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100",
      ].join(" ")}
    >
      <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-zinc-800">
        Select Export Format
      </div>

      {/* 1. PDF Option */}
      <button
        type="button"
        role="menuitem"
        onClick={() => handleExport("pdf")}
        className="w-full flex items-start gap-2.5 px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-zinc-800/80 cursor-pointer transition-colors group"
      >
        <div className="p-1 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform mt-0.5">
          <span className="material-symbols-outlined text-[16px] block">
            picture_as_pdf
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center justify-between">
            <span>PDF Document</span>
            <span className="text-[10px] font-mono font-normal text-slate-400 dark:text-zinc-500">
              .pdf
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
            Customer-facing tax invoice with GST breakdown & branding
          </p>
        </div>
      </button>

      {/* 2. Excel Option */}
      <button
        type="button"
        role="menuitem"
        onClick={() => handleExport("excel")}
        className="w-full flex items-start gap-2.5 px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-zinc-800/80 cursor-pointer transition-colors group"
      >
        <div className="p-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform mt-0.5">
          <span className="material-symbols-outlined text-[16px] block">
            table_view
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center justify-between">
            <span>Excel Workbook</span>
            <span className="text-[10px] font-mono font-normal text-slate-400 dark:text-zinc-500">
              .xlsx
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
            Multi-sheet workbook: Summary, Line Items, Payments & Trips
          </p>
        </div>
      </button>

      {/* 3. CSV Option */}
      <button
        type="button"
        role="menuitem"
        onClick={() => handleExport("csv")}
        className="w-full flex items-start gap-2.5 px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-zinc-800/80 cursor-pointer transition-colors group"
      >
        <div className="p-1 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform mt-0.5">
          <span className="material-symbols-outlined text-[16px] block">
            csv
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center justify-between">
            <span>CSV Spreadsheet</span>
            <span className="text-[10px] font-mono font-normal text-slate-400 dark:text-zinc-500">
              .csv
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug">
            Flat relational tabular data for ERP import & analytics
          </p>
        </div>
      </button>
    </div>
  );

  return (
    <div
      ref={menuRef}
      className={["relative inline-block", className].join(" ")}
    >
      {/* Export Action Trigger */}
      <button
        type="button"
        id={`export-invoice-btn-${invoice?.id || "default"}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Export Invoice"
        disabled={isExecuting || !invoice}
        onClick={() => setIsOpen((prev) => !prev)}
        className={[
          "inline-flex items-center justify-center gap-1.5 font-medium rounded-md transition-colors cursor-pointer select-none",
          buttonSize === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-1.5 text-xs",
          buttonVariant === "secondary"
            ? "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700 active:bg-slate-300 dark:active:bg-zinc-600"
            : buttonVariant === "primary"
              ? "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80"
              : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100",
          isExecuting ? "opacity-75 cursor-not-allowed" : "",
        ].join(" ")}
      >
        {isExecuting ? (
          <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className="material-symbols-outlined text-[16px]">
            file_download
          </span>
        )}
        <span>
          {isExecuting
            ? loadingFormat === "pdf"
              ? "Generating PDF..."
              : loadingFormat === "excel"
                ? "Generating Excel..."
                : "Generating CSV..."
            : "Export"}
        </span>
        <span className="material-symbols-outlined text-[14px] text-slate-400 dark:text-zinc-500">
          {isOpen ? "expand_less" : "expand_more"}
        </span>
      </button>

      {/* Format Selection Dropdown Popover (rendered in body portal to avoid layout clipping) */}
      {typeof document !== "undefined" && dropdownMenu
        ? createPortal(dropdownMenu, document.body)
        : dropdownMenu}

      {/* Floating inline feedback toast notification */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className={[
            "fixed bottom-5 right-5 z-50 max-w-sm rounded-lg border shadow-xl p-3 text-xs flex items-center gap-2.5 animate-in slide-in-from-bottom-2",
            notification.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
              : "bg-rose-50 dark:bg-rose-950/90 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100",
          ].join(" ")}
        >
          <span className="material-symbols-outlined text-[18px] shrink-0">
            {notification.type === "success" ? "check_circle" : "error"}
          </span>
          <span className="font-medium flex-1">{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 cursor-pointer p-0.5"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
