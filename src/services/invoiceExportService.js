import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  formatINR,
  formatInvoiceDate,
  getDocumentTypeStyles,
  getDocumentStatusStyles,
  getPaymentStatusStyles,
  getOverdueInfo,
} from "../utils/invoiceStatus";
import { numberToWordsINR } from "../utils/numberToWords";
import {
  DEFAULT_COMPANY_GSTIN,
  DEFAULT_COMPANY_STATE_NAME,
  calculateInvoiceTaxes,
} from "../utils/taxCalculation";

// Seller profile constants
export const COMPANY_DETAILS = {
  name: "FleetCore Logistics Private Limited",
  brandName: "FleetCore Logistics",
  tagline: "Enterprise Fleet Solutions & Freight Logistics",
  address: "Fleet Tower, Complex Road, BKC, Mumbai",
  state: DEFAULT_COMPANY_STATE_NAME,
  stateCode: "27",
  pincode: "400051",
  gstin: DEFAULT_COMPANY_GSTIN,
  pan: "AABCF1234F",
  cin: "U63090MH2020PTC345678",
  phone: "+91 (022) 4890-7000",
  email: "billing@fleetcore.in",
  website: "www.fleetcore.in",
  bankDetails: {
    bankName: "HDFC Bank Ltd",
    accountName: "FleetCore Logistics Pvt Ltd",
    accountNumber: "50200084920193",
    ifscCode: "HDFC0000240",
    branch: "BKC Branch, Mumbai",
  },
};

/**
 * Sanitizes filename to prevent invalid filesystem characters.
 */
export function sanitizeFilename(name, extension) {
  const cleanName = (name || "invoice")
    .toString()
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_");
  const ext = extension.startsWith(".") ? extension : `.${extension}`;
  return `${cleanName}${ext}`;
}

/**
 * Browser download helper for Blobs.
 */
export function downloadBlob(blob, filename) {
  if (typeof window === "undefined") return;

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Normalizes all invoice fields for consistent export across PDF, Excel, and CSV.
 */
export function normalizeInvoiceForExport(invoice) {
  if (!invoice) return null;

  const invoiceNumber = invoice.invoiceNumber || invoice.id || "INV-DRAFT";
  const docTypeStyles = getDocumentTypeStyles(invoice.documentType);
  const docStatusStyles = getDocumentStatusStyles(invoice.documentStatus);
  const overdueInfo = getOverdueInfo(
    invoice.dueDate,
    invoice.paymentStatus,
    invoice.documentStatus,
  );
  const isOverdue = overdueInfo.isOverdue;
  const pmtStatusStyles = getPaymentStatusStyles(
    invoice.paymentStatus,
    isOverdue,
  );

  const isDraft = invoice.documentStatus === "draft";
  const isCancelled = invoice.documentStatus === "cancelled";
  const isProforma = invoice.documentType === "proforma";
  const isCreditNote = invoice.documentType === "credit_note";
  const isDebitNote = invoice.documentType === "debit_note";
  const isConsolidated = Boolean(
    invoice.isConsolidated ||
    invoice.documentType === "consolidated" ||
    (Array.isArray(invoice.trips) && invoice.trips.length > 0),
  );

  // Address
  const addressParts = [
    invoice.customerBillingAddress ||
      invoice.customerAddress ||
      invoice.billingAddress ||
      invoice.customer?.address,
    invoice.customerCity ||
      invoice.billingCity ||
      invoice.city ||
      invoice.customer?.city,
    invoice.customerState ||
      invoice.billingState ||
      invoice.state ||
      invoice.customer?.state,
    invoice.customerPinCode ||
      invoice.customerPincode ||
      invoice.billingPincode ||
      invoice.pinCode ||
      invoice.customer?.pinCode,
  ].filter(Boolean);
  const formattedAddress = addressParts.join(", ") || "—";

  const customerName =
    invoice.customerName ||
    invoice.customer?.billingName ||
    invoice.customer?.name ||
    "Cash Customer";
  const customerCode = invoice.customerCode || invoice.customer?.code || "—";
  const customerGstin =
    invoice.customerGstin ||
    invoice.customer?.gstin ||
    invoice.customer?.gstNumber ||
    "";
  const customerPan =
    invoice.customerPan ||
    invoice.customer?.pan ||
    (customerGstin.length >= 12 ? customerGstin.substring(2, 12) : "—");

  // Dates
  const issueDate = invoice.issueDate || invoice.createdAt || "—";
  const dueDate = invoice.dueDate || "—";
  const paymentTerms = invoice.paymentTerms || "30 Days";
  const poNumber =
    invoice.poNumber || invoice.poReference || invoice.customerReference || "—";
  const customerVendorCode =
    invoice.customerVendorCode || invoice.vendorCode || "—";
  const billingPeriod =
    invoice.consolidatedPeriod || invoice.billingPeriod || "—";

  // Financials
  const subtotal = Number(invoice.subtotal || invoice.totalAmount || 0);
  const discountAmount = Number(invoice.discountAmount || 0);
  const totalAmount = Number(invoice.totalAmount || 0);
  const paidAmount = Number(invoice.paidAmount || 0);
  const outstandingAmount = Math.max(0, totalAmount - paidAmount);
  const roundOff = Number(invoice.roundOff || 0);

  // Taxes
  let taxRows = [];
  let cgstAmount = Number(invoice.cgstAmount || 0);
  let sgstAmount = Number(invoice.sgstAmount || 0);
  let igstAmount = Number(invoice.igstAmount || 0);

  if (Array.isArray(invoice.taxRows) && invoice.taxRows.length > 0) {
    taxRows = invoice.taxRows;
  } else if (cgstAmount > 0 || sgstAmount > 0 || igstAmount > 0) {
    if (igstAmount > 0) {
      taxRows = [
        { name: `IGST (${invoice.taxRate || 18}%)`, amount: igstAmount },
      ];
    } else {
      const halfRate = invoice.taxRate
        ? (Number(invoice.taxRate) / 2).toFixed(0)
        : 9;
      taxRows = [
        { name: `CGST (${halfRate}%)`, amount: cgstAmount },
        { name: `SGST (${halfRate}%)`, amount: sgstAmount },
      ];
    }
  } else if (invoice.items && invoice.items.length > 0) {
    const taxCalc = calculateInvoiceTaxes({
      items: invoice.items,
      customerGstin,
      customerState:
        invoice.customerState || invoice.billingState || invoice.state,
    });
    if (taxCalc.taxRows && taxCalc.taxRows.length > 0) {
      taxRows = taxCalc.taxRows;
    }
  }

  // Fallback tax calculation if not populated
  if (
    taxRows.length === 0 &&
    (Number(invoice.taxAmount) > 0 || Number(invoice.taxRate) > 0)
  ) {
    const totalTax = Number(invoice.taxAmount || 0);
    const halfRate = invoice.taxRate
      ? (Number(invoice.taxRate) / 2).toFixed(0)
      : 9;
    const halfTax =
      totalTax > 0
        ? totalTax / 2
        : (subtotal * (Number(invoice.taxRate) / 2)) / 100;
    taxRows = [
      { name: `CGST (${halfRate}%)`, amount: halfTax },
      { name: `SGST (${halfRate}%)`, amount: halfTax },
    ];
    cgstAmount = halfTax;
    sgstAmount = halfTax;
  }

  // Extract individual taxes from taxRows
  taxRows.forEach((r) => {
    const nameUpper = (r.name || "").toUpperCase();
    if (nameUpper.includes("CGST")) cgstAmount = Number(r.amount || 0);
    if (nameUpper.includes("SGST")) sgstAmount = Number(r.amount || 0);
    if (nameUpper.includes("IGST")) igstAmount = Number(r.amount || 0);
  });
  const totalTax =
    Number(invoice.taxAmount || 0) ||
    taxRows.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  // Line items
  let items =
    Array.isArray(invoice.items) && invoice.items.length > 0
      ? invoice.items
      : [
          {
            description:
              invoice.route ||
              (isConsolidated
                ? "Consolidated Fleet Freight Batch"
                : "Freight Transportation Service"),
            quantity: 1,
            unitRate: subtotal,
            amount: subtotal,
          },
        ];

  // Transport details
  const totalKm =
    isConsolidated && Array.isArray(invoice.trips)
      ? invoice.trips.reduce((sum, t) => sum + (Number(t.totalKm) || 0), 0)
      : invoice.totalKm || "—";

  const trips = Array.isArray(invoice.trips) ? invoice.trips : [];
  const paymentHistory = Array.isArray(invoice.paymentHistory)
    ? invoice.paymentHistory
    : [];

  return {
    raw: invoice,
    invoiceNumber,
    documentType: invoice.documentType || "tax_invoice",
    documentTypeLabel: docTypeStyles.label,
    documentStatus: invoice.documentStatus || "draft",
    documentStatusLabel: docStatusStyles.label,
    paymentStatus: invoice.paymentStatus || "pending",
    paymentStatusLabel: pmtStatusStyles.label,
    isDraft,
    isCancelled,
    isOverdue,
    isProforma,
    isCreditNote,
    isDebitNote,
    isConsolidated,
    issueDate,
    dueDate,
    paymentTerms,
    poNumber,
    customerVendorCode,
    billingPeriod,
    customerName,
    customerCode,
    customerGstin,
    customerPan,
    billingAddress: formattedAddress,
    contactPerson:
      invoice.contactPerson || invoice.customer?.contactPerson || "—",
    contactPhone: invoice.customerPhone || invoice.customer?.phone || "—",
    contactEmail: invoice.customerEmail || invoice.customer?.email || "—",
    tripCode: invoice.tripCode || (isConsolidated ? "Consolidated Batch" : "—"),
    route:
      invoice.route ||
      (isConsolidated
        ? "Multi-Route Fleet Batch"
        : "Point to Point Transportation"),
    vehicleNumber: invoice.vehicleNumber || "—",
    driverName: invoice.driverName || "—",
    totalKm,
    items,
    trips,
    paymentHistory,
    subtotal,
    discountAmount,
    taxRate: Number(invoice.taxRate || 18),
    taxAmount: totalTax,
    taxRows,
    cgstAmount,
    sgstAmount,
    igstAmount,
    roundOff,
    grandTotal: totalAmount,
    paidAmount,
    outstandingAmount,
    amountInWords: numberToWordsINR(totalAmount),
    notes:
      invoice.notes ||
      "Standard transportation freight contract. Subject to local state jurisdiction. Cheques / RTGS payable to FleetCore Logistics Pvt Ltd.",
    originalInvoiceReference:
      invoice.originalInvoiceReference || invoice.originalInvoiceNumber || "—",
  };
}

/**
 * ----------------------------------------------------------------------------
 * 1. PDF EXPORT (Customer-facing invoice document)
 * ----------------------------------------------------------------------------
 */
export async function exportInvoiceToPdf(invoice, options = {}) {
  const inv = normalizeInvoiceForExport(invoice);
  if (!inv) throw new Error("Invalid invoice data provided for export.");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Header Colors
  const primaryColor = [30, 27, 75]; // Deep Indigo #1e1b4b
  const accentColor = [79, 70, 229]; // Indigo #4f46e5
  const slateDark = [30, 41, 59]; // Slate 800
  const slateMuted = [100, 116, 139]; // Slate 500
  const borderGray = [226, 232, 240]; // Slate 200

  // 1. Watermark / Status Stamp for Draft / Proforma / Cancelled / Paid
  if (inv.isDraft) {
    doc.saveGraphicsState?.();
    doc.setTextColor(230, 230, 230);
    doc.setFontSize(55);
    doc.setFont("helvetica", "bold");
    doc.text("DRAFT INVOICE", pageWidth / 2, pageHeight / 2, {
      align: "center",
      angle: 45,
    });
    doc.restoreGraphicsState?.();
  } else if (inv.isCancelled) {
    doc.saveGraphicsState?.();
    doc.setTextColor(254, 226, 226);
    doc.setFontSize(55);
    doc.setFont("helvetica", "bold");
    doc.text("CANCELLED", pageWidth / 2, pageHeight / 2, {
      align: "center",
      angle: 45,
    });
    doc.restoreGraphicsState?.();
  }

  let y = margin;

  // 2. Company Brand & Document Title Header
  doc.setFillColor(...primaryColor);
  doc.rect(margin, y, contentWidth, 24, "F");

  // Left Brand Text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(COMPANY_DETAILS.brandName, margin + 5, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(218, 222, 235);
  doc.text(
    `${COMPANY_DETAILS.address}, ${COMPANY_DETAILS.state} - ${COMPANY_DETAILS.pincode}`,
    margin + 5,
    y + 14,
  );
  doc.text(
    `GSTIN: ${COMPANY_DETAILS.gstin} | PAN: ${COMPANY_DETAILS.pan} | Ph: ${COMPANY_DETAILS.phone}`,
    margin + 5,
    y + 19,
  );

  // Right Document Type & Invoice Number
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  const docTitle = (
    inv.isProforma
      ? "PROFORMA INVOICE"
      : inv.isCreditNote
        ? "CREDIT NOTE"
        : inv.isDebitNote
          ? "DEBIT NOTE"
          : inv.isConsolidated
            ? "CONSOLIDATED TAX INVOICE"
            : "TAX INVOICE"
  ).toUpperCase();
  doc.text(docTitle, pageWidth - margin - 5, y + 8, { align: "right" });

  doc.setFontSize(10);
  doc.setFont("courier", "bold");
  doc.text(inv.invoiceNumber, pageWidth - margin - 5, y + 14, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    `Date: ${formatInvoiceDate(inv.issueDate)}`,
    pageWidth - margin - 5,
    y + 19,
    { align: "right" },
  );

  y += 28;

  // 3. Status Badges & References Ribbon
  doc.setDrawColor(...borderGray);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 9, 1, 1, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...slateDark);
  doc.text(
    `STATUS: ${inv.documentStatusLabel.toUpperCase()}`,
    margin + 4,
    y + 6,
  );
  doc.text(
    `PAYMENT: ${inv.paymentStatusLabel.toUpperCase()}`,
    margin + 50,
    y + 6,
  );
  doc.text(`DUE DATE: ${formatInvoiceDate(inv.dueDate)}`, margin + 105, y + 6);
  doc.text(`TERMS: ${inv.paymentTerms}`, pageWidth - margin - 4, y + 6, {
    align: "right",
  });

  y += 13;

  // 4. Two-Column Context (Billed To vs Operational Context)
  const colWidth = (contentWidth - 6) / 2;

  // Left: Billed To
  doc.setDrawColor(...borderGray);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, colWidth, 38, 1, 1, "D");

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, colWidth, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...primaryColor);
  doc.text("BILLED TO (CUSTOMER DETAILS)", margin + 3, y + 4.2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...slateDark);
  doc.text(inv.customerName, margin + 3, y + 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...slateMuted);
  const splitAddress = doc.splitTextToSize(inv.billingAddress, colWidth - 6);
  doc.text(splitAddress, margin + 3, y + 16);

  const addressOffset = Math.min(splitAddress.length * 3.5, 10);
  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...slateDark);
  doc.text(
    `GSTIN: ${inv.customerGstin || "Unregistered"}`,
    margin + 3,
    y + 17 + addressOffset,
  );
  doc.text(
    `PAN  : ${inv.customerPan} | Code: ${inv.customerCode}`,
    margin + 3,
    y + 21 + addressOffset,
  );

  // Right: Operational Context / Transport References
  const rightX = margin + colWidth + 6;
  doc.setDrawColor(...borderGray);
  doc.roundedRect(rightX, y, colWidth, 38, 1, 1, "D");

  doc.setFillColor(241, 245, 249);
  doc.rect(rightX, y, colWidth, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...primaryColor);
  doc.text(
    inv.isConsolidated
      ? "CONSOLIDATED BATCH CONTEXT"
      : "TRANSPORT & TRIP DETAILS",
    rightX + 3,
    y + 4.2,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...slateDark);

  if (inv.isConsolidated) {
    doc.text(`Billing Period: ${inv.billingPeriod}`, rightX + 3, y + 12);
    doc.text(
      `Included Trips: ${inv.trips.length || 1} Movements`,
      rightX + 3,
      y + 17,
    );
    doc.text(`Total Fleet Mileage: ${inv.totalKm} KM`, rightX + 3, y + 22);
    doc.text(`PO / Ref No: ${inv.poNumber}`, rightX + 3, y + 27);
  } else {
    doc.text(`Trip Code : ${inv.tripCode}`, rightX + 3, y + 12);
    doc.text(`Route     : ${inv.route.substring(0, 32)}`, rightX + 3, y + 17);
    doc.text(
      `Vehicle   : ${inv.vehicleNumber} | Driver: ${inv.driverName}`,
      rightX + 3,
      y + 22,
    );
    doc.text(
      `Distance  : ${inv.totalKm} KM | PO: ${inv.poNumber}`,
      rightX + 3,
      y + 27,
    );
  }

  if (inv.isCreditNote || inv.isDebitNote) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...accentColor);
    doc.text(
      `Orig. Inv Ref: ${inv.originalInvoiceReference}`,
      rightX + 3,
      y + 33,
    );
  }

  y += 42;

  // 5. Line Items & Charges Table
  const tableRows = inv.items.map((item, idx) => [
    idx + 1,
    item.description || "Transport Freight Service",
    item.quantity || 1,
    formatINR(item.unitRate || item.rate || item.amount),
    `${item.taxRate || inv.taxRate || 18}%`,
    formatINR(item.amount),
  ]);

  autoTable(doc, {
    startY: y,
    head: [
      [
        "#",
        "Description & Charge Details",
        "Qty",
        "Rate (INR)",
        "Tax %",
        "Amount (INR)",
      ],
    ],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: slateDark,
      lineColor: borderGray,
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 16, halign: "center" },
      3: { cellWidth: 28, halign: "right" },
      4: { cellWidth: 18, halign: "center" },
      5: { cellWidth: 32, halign: "right", fontStyle: "bold" },
    },
    margin: { left: margin, right: margin },
  });

  y = doc.lastAutoTable.finalY + 4;

  // 6. If Consolidated, Add Included Trips Sub-Table
  if (inv.isConsolidated && inv.trips.length > 0) {
    if (y + 35 > pageHeight) {
      doc.addPage();
      y = margin;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...primaryColor);
    doc.text("INCLUDED FLEET TRIPS BREAKDOWN", margin, y + 2);
    y += 4;

    const tripRows = inv.trips.map((t) => [
      t.tripCode || "—",
      t.date || "—",
      t.route || "—",
      t.vehicleNumber || "—",
      `${t.totalKm || 0} KM`,
      formatINR(t.totalAmount || 0),
    ]);

    autoTable(doc, {
      startY: y,
      head: [
        ["Trip Code", "Date", "Route", "Vehicle", "Distance", "Amount (INR)"],
      ],
      body: tripRows,
      theme: "plain",
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: primaryColor,
        fontStyle: "bold",
        fontSize: 7.5,
      },
      styles: {
        fontSize: 7,
        cellPadding: 1.8,
        textColor: slateDark,
        lineColor: borderGray,
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 26, fontStyle: "bold" },
        1: { cellWidth: 22 },
        2: { cellWidth: "auto" },
        3: { cellWidth: 26 },
        4: { cellWidth: 20, halign: "right" },
        5: { cellWidth: 26, halign: "right", fontStyle: "bold" },
      },
      margin: { left: margin, right: margin },
    });

    y = doc.lastAutoTable.finalY + 4;
  }

  // Check if financial totals block fits on current page
  if (y + 55 > pageHeight) {
    doc.addPage();
    y = margin;
  }

  // 7. Financial Breakdown & Remarks Section
  const totalsBoxWidth = 75;
  const remarksBoxWidth = contentWidth - totalsBoxWidth - 6;

  // Left: Amount in words, Bank Details & Remarks
  doc.setDrawColor(...borderGray);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(margin, y, remarksBoxWidth, 48, 1, 1, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...primaryColor);
  doc.text("AMOUNT IN WORDS:", margin + 3, y + 5);

  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(7.5);
  doc.setTextColor(...slateDark);
  const wordsLines = doc.splitTextToSize(
    inv.amountInWords,
    remarksBoxWidth - 6,
  );
  doc.text(wordsLines, margin + 3, y + 10);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...primaryColor);
  doc.text("BANK PAYMENT INSTRUCTIONS:", margin + 3, y + 21);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...slateDark);
  doc.text(
    `Bank: ${COMPANY_DETAILS.bankDetails.bankName} | A/C: ${COMPANY_DETAILS.bankDetails.accountNumber}`,
    margin + 3,
    y + 26,
  );
  doc.text(
    `IFSC: ${COMPANY_DETAILS.bankDetails.ifscCode} | Branch: ${COMPANY_DETAILS.bankDetails.branch}`,
    margin + 3,
    y + 30,
  );

  doc.setFont("helvetica", "italic");
  doc.setFontSize(6.5);
  doc.setTextColor(...slateMuted);
  const noteLines = doc.splitTextToSize(inv.notes, remarksBoxWidth - 6);
  doc.text(noteLines, margin + 3, y + 36);

  // Right: Totals Box
  const totalsX = margin + remarksBoxWidth + 6;
  doc.setDrawColor(...borderGray);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(totalsX, y, totalsBoxWidth, 48, 1, 1, "D");

  let totalY = y + 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...slateMuted);

  // Subtotal
  doc.text("Subtotal:", totalsX + 3, totalY);
  doc.text(formatINR(inv.subtotal), totalsX + totalsBoxWidth - 3, totalY, {
    align: "right",
  });
  totalY += 4.5;

  // Discount
  if (inv.discountAmount > 0) {
    doc.setTextColor(16, 185, 129);
    doc.text("Discount:", totalsX + 3, totalY);
    doc.text(
      `-${formatINR(inv.discountAmount)}`,
      totalsX + totalsBoxWidth - 3,
      totalY,
      {
        align: "right",
      },
    );
    totalY += 4.5;
  }

  // Tax Breakdown (CGST, SGST, IGST)
  doc.setTextColor(...slateMuted);
  if (inv.taxRows && inv.taxRows.length > 0) {
    inv.taxRows.forEach((r) => {
      doc.text(`${r.name}:`, totalsX + 3, totalY);
      doc.text(formatINR(r.amount), totalsX + totalsBoxWidth - 3, totalY, {
        align: "right",
      });
      totalY += 4.2;
    });
  }

  // Round off
  if (inv.roundOff !== 0) {
    doc.text("Round Off:", totalsX + 3, totalY);
    doc.text(
      `${inv.roundOff > 0 ? "+" : ""}${formatINR(inv.roundOff)}`,
      totalsX + totalsBoxWidth - 3,
      totalY,
      { align: "right" },
    );
    totalY += 4.2;
  }

  // Grand Total Line
  doc.setDrawColor(...borderGray);
  doc.line(totalsX + 2, totalY, totalsX + totalsBoxWidth - 2, totalY);
  totalY += 4.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...primaryColor);
  doc.text("Grand Total:", totalsX + 3, totalY);
  doc.text(formatINR(inv.grandTotal), totalsX + totalsBoxWidth - 3, totalY, {
    align: "right",
  });
  totalY += 4.5;

  // Paid & Outstanding
  doc.setFontSize(7.5);
  doc.setTextColor(16, 185, 129);
  doc.text("Paid to Date:", totalsX + 3, totalY);
  doc.text(formatINR(inv.paidAmount), totalsX + totalsBoxWidth - 3, totalY, {
    align: "right",
  });
  totalY += 4.5;

  doc.setTextColor(
    inv.outstandingAmount > 0 ? 225 : 16,
    inv.outstandingAmount > 0 ? 29 : 185,
    inv.outstandingAmount > 0 ? 72 : 129,
  );
  doc.text("Outstanding Due:", totalsX + 3, totalY);
  doc.text(
    formatINR(inv.outstandingAmount),
    totalsX + totalsBoxWidth - 3,
    totalY,
    { align: "right" },
  );

  // 8. Bottom Signatory
  y += 52;
  if (y + 18 <= pageHeight) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...slateMuted);
    doc.text(
      "This is a computer-generated invoice and requires no physical signature.",
      margin,
      y + 8,
    );
    doc.text(`For ${COMPANY_DETAILS.name}`, pageWidth - margin, y + 4, {
      align: "right",
    });
    doc.setFont("helvetica", "bold");
    doc.text("Authorized Signatory", pageWidth - margin, y + 10, {
      align: "right",
    });
  }

  const filename = sanitizeFilename(inv.invoiceNumber, "pdf");
  if (options.returnBlob) {
    return doc.output("blob");
  }
  doc.save(filename);
  return { filename, success: true };
}

/**
 * ----------------------------------------------------------------------------
 * 2. EXCEL EXPORT (Operational / Accounting Multi-Sheet Workbook)
 * ----------------------------------------------------------------------------
 */
export async function exportInvoiceToExcel(invoice, options = {}) {
  const inv = normalizeInvoiceForExport(invoice);
  if (!inv) throw new Error("Invalid invoice data provided for export.");

  const wb = XLSX.utils.book_new();

  // --------------------------------------------------------------------------
  // Sheet 1: Invoice Summary
  // --------------------------------------------------------------------------
  const summaryData = [
    ["FLEETCORE LOGISTICS - INVOICE METADATA & SUMMARY", ""],
    ["Generated On", new Date().toLocaleString("en-IN")],
    ["", ""],
    ["--- INVOICE IDENTIFICATION ---", ""],
    ["Invoice Number", inv.invoiceNumber],
    ["Document Type", inv.documentTypeLabel],
    ["Document Status", inv.documentStatusLabel],
    ["Payment Status", inv.paymentStatusLabel],
    ["Issue Date", inv.issueDate],
    ["Due Date", inv.dueDate],
    ["Payment Terms", inv.paymentTerms],
    ["PO / Customer Reference", inv.poNumber],
    ["Customer Vendor Code", inv.customerVendorCode],
    ["Billing Period", inv.billingPeriod],
    ["Original Invoice Reference", inv.originalInvoiceReference],
    ["", ""],
    ["--- SELLER (FLEETCORE) ---", ""],
    ["Company Name", COMPANY_DETAILS.name],
    ["GSTIN", COMPANY_DETAILS.gstin],
    ["PAN", COMPANY_DETAILS.pan],
    [
      "State / Place of Supply",
      `${COMPANY_DETAILS.state} (${COMPANY_DETAILS.stateCode})`,
    ],
    ["HQ Address", COMPANY_DETAILS.address],
    ["", ""],
    ["--- BUYER / CUSTOMER ---", ""],
    ["Customer Name", inv.customerName],
    ["Customer Code", inv.customerCode],
    ["Customer GSTIN", inv.customerGstin || "Unregistered"],
    ["Customer PAN", inv.customerPan],
    ["Billing Address", inv.billingAddress],
    ["Contact Person", inv.contactPerson],
    ["Contact Phone", inv.contactPhone],
    ["Contact Email", inv.contactEmail],
    ["", ""],
    ["--- TRANSPORT CONTEXT ---", ""],
    ["Trip Code", inv.tripCode],
    ["Route", inv.route],
    ["Vehicle Number", inv.vehicleNumber],
    ["Driver Name", inv.driverName],
    ["Total Distance (KM)", inv.totalKm],
    ["", ""],
    ["--- FINANCIAL TOTALS & TAXES ---", ""],
    ["Subtotal (INR)", inv.subtotal],
    ["Discount (INR)", inv.discountAmount],
    ["Taxable Value (INR)", Math.max(0, inv.subtotal - inv.discountAmount)],
    ["CGST (INR)", inv.cgstAmount],
    ["SGST (INR)", inv.sgstAmount],
    ["IGST (INR)", inv.igstAmount],
    ["Total Tax (INR)", inv.taxAmount],
    ["Round Off (INR)", inv.roundOff],
    ["Grand Total (INR)", inv.grandTotal],
    ["Paid Amount (INR)", inv.paidAmount],
    ["Outstanding Balance (INR)", inv.outstandingAmount],
    ["Amount in Words", inv.amountInWords],
    ["", ""],
    ["--- TERMS & REMARKS ---", ""],
    ["Remarks / Notes", inv.notes],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary["!cols"] = [{ wch: 32 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Invoice Summary");

  // --------------------------------------------------------------------------
  // Sheet 2: Line Items
  // --------------------------------------------------------------------------
  const lineItemHeaders = [
    "Line #",
    "Description",
    "Quantity",
    "Unit Rate (INR)",
    "Tax Rate (%)",
    "Tax Amount (INR)",
    "Line Total (INR)",
  ];

  const lineItemRows = inv.items.map((item, idx) => {
    const qty = Number(item.quantity || 1);
    const rate = Number(item.unitRate || item.rate || item.amount);
    const amt = Number(item.amount || qty * rate);
    const itemTaxRate = Number(item.taxRate || inv.taxRate || 18);
    const itemTaxAmt = (amt * itemTaxRate) / 100;
    return [
      idx + 1,
      item.description || "Transport Freight Service",
      qty,
      rate,
      itemTaxRate,
      itemTaxAmt,
      amt,
    ];
  });

  // Append totals row
  lineItemRows.push([
    "TOTAL",
    "Invoice Line Items Aggregate",
    inv.items.reduce((s, i) => s + (Number(i.quantity) || 1), 0),
    "—",
    "—",
    inv.taxAmount,
    inv.subtotal,
  ]);

  const wsLineItems = XLSX.utils.aoa_to_sheet([
    lineItemHeaders,
    ...lineItemRows,
  ]);
  wsLineItems["!cols"] = [
    { wch: 8 },
    { wch: 45 },
    { wch: 10 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsLineItems, "Line Items");

  // --------------------------------------------------------------------------
  // Sheet 3: Payments
  // --------------------------------------------------------------------------
  const paymentHeaders = [
    "Receipt #",
    "Payment Date",
    "Payment Mode",
    "Reference / UTR Number",
    "Amount (INR)",
    "Status",
    "Notes",
  ];

  const paymentRows =
    inv.paymentHistory && inv.paymentHistory.length > 0
      ? [
          ...inv.paymentHistory.map((p, idx) => [
            idx + 1,
            p.paymentDate || p.createdAt || "—",
            p.paymentMode?.replace("_", " ").toUpperCase() || "BANK TRANSFER",
            p.referenceNumber || "—",
            Number(p.amount || 0),
            "SUCCESS",
            p.notes || "—",
          ]),
          ["TOTAL", "—", "—", "—", inv.paidAmount, "—", "—"],
        ]
      : [["—", "—", "—", "No payment records recorded", 0, "PENDING", "—"]];

  const wsPayments = XLSX.utils.aoa_to_sheet([paymentHeaders, ...paymentRows]);
  wsPayments["!cols"] = [
    { wch: 10 },
    { wch: 18 },
    { wch: 20 },
    { wch: 26 },
    { wch: 16 },
    { wch: 12 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsPayments, "Payments");

  // --------------------------------------------------------------------------
  // Sheet 4: Included Trips (For Consolidated Invoices)
  // --------------------------------------------------------------------------
  if (inv.isConsolidated || (inv.trips && inv.trips.length > 0)) {
    const tripHeaders = [
      "Trip Code",
      "Date",
      "Pickup Location",
      "Drop Location",
      "Route",
      "Vehicle Number",
      "Driver Name",
      "Mileage (KM)",
      "Trip Amount (INR)",
      "Status",
    ];

    const tripRows = (inv.trips || []).map((t) => [
      t.tripCode || "—",
      t.date || "—",
      t.pickup || t.pickupLocation || "—",
      t.drop || t.dropLocation || "—",
      t.route || "—",
      t.vehicleNumber || "—",
      t.driverName || "—",
      Number(t.totalKm || 0),
      Number(t.totalAmount || 0),
      t.status || "Completed",
    ]);

    if (tripRows.length > 0) {
      tripRows.push([
        "TOTAL",
        "—",
        "—",
        "—",
        `${tripRows.length} Movements`,
        "—",
        "—",
        inv.totalKm,
        inv.subtotal,
        "—",
      ]);
    }

    const wsTrips = XLSX.utils.aoa_to_sheet([
      tripHeaders,
      ...(tripRows.length > 0
        ? tripRows
        : [
            ["—", "—", "—", "—", "No trip data available", "—", "—", 0, 0, "—"],
          ]),
    ]);
    wsTrips["!cols"] = [
      { wch: 16 },
      { wch: 14 },
      { wch: 22 },
      { wch: 22 },
      { wch: 30 },
      { wch: 16 },
      { wch: 18 },
      { wch: 14 },
      { wch: 18 },
      { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, wsTrips, "Included Trips");
  }

  const filename = sanitizeFilename(inv.invoiceNumber, "xlsx");
  if (options.returnBlob) {
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    return new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }

  XLSX.writeFile(wb, filename);
  return { filename, success: true };
}

/**
 * ----------------------------------------------------------------------------
 * 3. CSV EXPORT (Flat structured relational tabular export)
 * ----------------------------------------------------------------------------
 */
export function exportInvoiceToCsv(invoice, options = {}) {
  const inv = normalizeInvoiceForExport(invoice);
  if (!inv) throw new Error("Invalid invoice data provided for export.");

  const headers = [
    "Invoice Number",
    "Document Type",
    "Document Status",
    "Payment Status",
    "Issue Date",
    "Due Date",
    "Payment Terms",
    "PO Reference",
    "Billing Period",
    "Customer Code",
    "Customer Name",
    "Customer GSTIN",
    "Customer PAN",
    "Billing Address",
    "Trip Code",
    "Route",
    "Vehicle Number",
    "Driver Name",
    "Total Mileage (KM)",
    "Line Item #",
    "Line Description",
    "Quantity",
    "Unit Rate",
    "Line Amount",
    "Subtotal",
    "Discount",
    "CGST Amount",
    "SGST Amount",
    "IGST Amount",
    "Total Tax",
    "Round Off",
    "Grand Total",
    "Paid Amount",
    "Outstanding Due",
    "Amount In Words",
    "Notes",
  ];

  function escapeCsvValue(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  const rows = [];

  // Generate 1 row per line item, linking invoice and line item fields
  inv.items.forEach((item, idx) => {
    const row = [
      escapeCsvValue(inv.invoiceNumber),
      escapeCsvValue(inv.documentTypeLabel),
      escapeCsvValue(inv.documentStatusLabel),
      escapeCsvValue(inv.paymentStatusLabel),
      escapeCsvValue(inv.issueDate),
      escapeCsvValue(inv.dueDate),
      escapeCsvValue(inv.paymentTerms),
      escapeCsvValue(inv.poNumber),
      escapeCsvValue(inv.billingPeriod),
      escapeCsvValue(inv.customerCode),
      escapeCsvValue(inv.customerName),
      escapeCsvValue(inv.customerGstin),
      escapeCsvValue(inv.customerPan),
      escapeCsvValue(inv.billingAddress),
      escapeCsvValue(inv.tripCode),
      escapeCsvValue(inv.route),
      escapeCsvValue(inv.vehicleNumber),
      escapeCsvValue(inv.driverName),
      escapeCsvValue(inv.totalKm),
      idx + 1,
      escapeCsvValue(item.description || "Freight Service"),
      item.quantity || 1,
      item.unitRate || item.rate || item.amount || 0,
      item.amount || 0,
      inv.subtotal,
      inv.discountAmount,
      inv.cgstAmount,
      inv.sgstAmount,
      inv.igstAmount,
      inv.taxAmount,
      inv.roundOff,
      inv.grandTotal,
      inv.paidAmount,
      inv.outstandingAmount,
      escapeCsvValue(inv.amountInWords),
      escapeCsvValue(inv.notes),
    ];
    rows.push(row.join(","));
  });

  // If consolidated, also append trip-level relational rows if desired
  if (inv.isConsolidated && inv.trips && inv.trips.length > 0) {
    inv.trips.forEach((trip, tIdx) => {
      const row = [
        escapeCsvValue(inv.invoiceNumber),
        escapeCsvValue("Consolidated Trip Component"),
        escapeCsvValue(inv.documentStatusLabel),
        escapeCsvValue(inv.paymentStatusLabel),
        escapeCsvValue(trip.date || inv.issueDate),
        escapeCsvValue(inv.dueDate),
        escapeCsvValue(inv.paymentTerms),
        escapeCsvValue(inv.poNumber),
        escapeCsvValue(inv.billingPeriod),
        escapeCsvValue(inv.customerCode),
        escapeCsvValue(inv.customerName),
        escapeCsvValue(inv.customerGstin),
        escapeCsvValue(inv.customerPan),
        escapeCsvValue(inv.billingAddress),
        escapeCsvValue(trip.tripCode || `TRIP-${tIdx + 1}`),
        escapeCsvValue(trip.route || "—"),
        escapeCsvValue(trip.vehicleNumber || "—"),
        escapeCsvValue(trip.driverName || "—"),
        escapeCsvValue(trip.totalKm || 0),
        `TRIP-${tIdx + 1}`,
        escapeCsvValue(`Trip Movement: ${trip.route || trip.tripCode}`),
        1,
        trip.totalAmount || 0,
        trip.totalAmount || 0,
        inv.subtotal,
        inv.discountAmount,
        inv.cgstAmount,
        inv.sgstAmount,
        inv.igstAmount,
        inv.taxAmount,
        inv.roundOff,
        inv.grandTotal,
        inv.paidAmount,
        inv.outstandingAmount,
        escapeCsvValue(inv.amountInWords),
        escapeCsvValue(inv.notes),
      ];
      rows.push(row.join(","));
    });
  }

  // Prepend UTF-8 BOM (\uFEFF) for seamless Microsoft Excel compatibility
  const csvContent =
    "\uFEFF" + [headers.map(escapeCsvValue).join(","), ...rows].join("\r\n");

  const filename = sanitizeFilename(inv.invoiceNumber, "csv");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  if (options.returnBlob) {
    return blob;
  }

  downloadBlob(blob, filename);
  return { filename, success: true };
}

/**
 * ----------------------------------------------------------------------------
 * 4. BULK EXPORTS (Exporting multiple filtered invoices)
 * ----------------------------------------------------------------------------
 */
export function exportInvoicesToCsv(invoices = [], options = {}) {
  if (!Array.isArray(invoices) || invoices.length === 0) {
    throw new Error("No invoices selected for bulk export.");
  }

  const headers = [
    "Invoice Number",
    "Document Type",
    "Document Status",
    "Payment Status",
    "Issue Date",
    "Due Date",
    "Payment Terms",
    "Customer Code",
    "Customer Name",
    "Customer GSTIN",
    "Customer PAN",
    "Trip Code",
    "Route",
    "Vehicle Number",
    "Driver Name",
    "Subtotal",
    "Discount",
    "CGST",
    "SGST",
    "IGST",
    "Total Tax",
    "Grand Total",
    "Paid Amount",
    "Outstanding Due",
  ];

  function escapeCsvValue(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  const rows = invoices.map((invoice) => {
    const inv = normalizeInvoiceForExport(invoice);
    return [
      escapeCsvValue(inv.invoiceNumber),
      escapeCsvValue(inv.documentTypeLabel),
      escapeCsvValue(inv.documentStatusLabel),
      escapeCsvValue(inv.paymentStatusLabel),
      escapeCsvValue(inv.issueDate),
      escapeCsvValue(inv.dueDate),
      escapeCsvValue(inv.paymentTerms),
      escapeCsvValue(inv.customerCode),
      escapeCsvValue(inv.customerName),
      escapeCsvValue(inv.customerGstin),
      escapeCsvValue(inv.customerPan),
      escapeCsvValue(inv.tripCode),
      escapeCsvValue(inv.route),
      escapeCsvValue(inv.vehicleNumber),
      escapeCsvValue(inv.driverName),
      inv.subtotal,
      inv.discountAmount,
      inv.cgstAmount,
      inv.sgstAmount,
      inv.igstAmount,
      inv.taxAmount,
      inv.grandTotal,
      inv.paidAmount,
      inv.outstandingAmount,
    ].join(",");
  });

  const csvContent =
    "\uFEFF" + [headers.map(escapeCsvValue).join(","), ...rows].join("\r\n");
  const filename = sanitizeFilename(
    options.filename ||
      `fleetcore_invoices_${new Date().toISOString().split("T")[0]}`,
    "csv",
  );
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  if (options.returnBlob) {
    return blob;
  }

  downloadBlob(blob, filename);
  return { filename, success: true };
}

export function exportInvoicesToExcel(invoices = [], options = {}) {
  if (!Array.isArray(invoices) || invoices.length === 0) {
    throw new Error("No invoices selected for bulk export.");
  }

  const wb = XLSX.utils.book_new();

  const headers = [
    "Invoice Number",
    "Document Type",
    "Document Status",
    "Payment Status",
    "Issue Date",
    "Due Date",
    "Payment Terms",
    "Customer Code",
    "Customer Name",
    "Customer GSTIN",
    "Customer PAN",
    "Trip Code",
    "Route",
    "Vehicle Number",
    "Driver Name",
    "Subtotal (INR)",
    "Discount (INR)",
    "CGST (INR)",
    "SGST (INR)",
    "IGST (INR)",
    "Total Tax (INR)",
    "Grand Total (INR)",
    "Paid Amount (INR)",
    "Outstanding (INR)",
  ];

  const rows = invoices.map((invoice) => {
    const inv = normalizeInvoiceForExport(invoice);
    return [
      inv.invoiceNumber,
      inv.documentTypeLabel,
      inv.documentStatusLabel,
      inv.paymentStatusLabel,
      inv.issueDate,
      inv.dueDate,
      inv.paymentTerms,
      inv.customerCode,
      inv.customerName,
      inv.customerGstin || "Unregistered",
      inv.customerPan,
      inv.tripCode,
      inv.route,
      inv.vehicleNumber,
      inv.driverName,
      inv.subtotal,
      inv.discountAmount,
      inv.cgstAmount,
      inv.sgstAmount,
      inv.igstAmount,
      inv.taxAmount,
      inv.grandTotal,
      inv.paidAmount,
      inv.outstandingAmount,
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = [
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 28 },
    { wch: 18 },
    { wch: 14 },
    { wch: 16 },
    { wch: 28 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Invoices");

  const filename = sanitizeFilename(
    options.filename ||
      `fleetcore_invoices_${new Date().toISOString().split("T")[0]}`,
    "xlsx",
  );

  if (options.returnBlob) {
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    return new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }

  XLSX.writeFile(wb, filename);
  return { filename, success: true };
}
