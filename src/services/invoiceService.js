import { getNextInvoiceCode } from "./invoiceCodeService";

const INVOICES_STORAGE_KEY = "invoices";

export const DEFAULT_INVOICES = [
  {
    id: "inv_1",
    invoiceNumber: "INV-2026-084",
    documentType: "tax_invoice", // tax_invoice, consolidated, proforma, credit_note, debit_note
    documentStatus: "issued", // draft, issued, revised, cancelled
    paymentStatus: "overdue", // unpaid, partially_paid, paid, overdue, credit
    customerId: "cust_apex_1",
    customerName: "Apex Corporation",
    customerCode: "CUST-8902A",
    customerGstin: "27AAACA8902A1Z5",
    tripId: "trp_1",
    tripCode: "TRP-0001",
    route: "Mumbai → Pune",
    pickupLocation: "Chhatrapati Sambhajinagar",
    dropLocation: "Pune",
    isConsolidated: false,
    consolidatedTripsCount: 1,
    consolidatedPeriod: "",
    issueDate: "2026-08-10",
    dueDate: "2026-08-18", // 7 days overdue relative to Aug 25
    subtotal: 35000,
    taxRate: 12,
    taxAmount: 3000,
    discountAmount: 0,
    totalAmount: 38000,
    paidAmount: 20000,
    outstandingAmount: 18000,
    paymentTerms: "Net 15",
    paymentReference: "NEFT-88902-PARTIAL",
    notes:
      "Corporate intercity transit. Balance payment pending finance approval.",
    paymentHistory: [
      {
        id: "pmt_101",
        amount: 20000,
        paymentDate: "2026-08-12",
        paymentMode: "bank_transfer",
        referenceNumber: "NEFT-88902",
        recordedBy: "Operations Desk",
        notes: "Part payment received",
      },
    ],
    items: [
      {
        description: "BharatBenz Luxury AC Coach - Mumbai to Pune (TRP-0001)",
        quantity: 1,
        unitRate: 35000,
        amount: 35000,
      },
    ],
    createdAt: "2026-08-10T09:30:00.000Z",
    updatedAt: "2026-08-12T14:20:00.000Z",
  },
  {
    id: "inv_2",
    invoiceNumber: "INV-2026-083",
    documentType: "consolidated",
    documentStatus: "issued",
    paymentStatus: "paid",
    customerId: "cust_gt_2",
    customerName: "Global Transit",
    customerCode: "CUST-4491X",
    customerGstin: "29AABCG4491X1Z2",
    tripId: null,
    tripCode: "CONSOLIDATED",
    route: "Delhi Hub & Regional (4 Trips)",
    isConsolidated: true,
    consolidatedTripsCount: 4,
    consolidatedPeriod: "August 2026",
    issueDate: "2026-08-10",
    dueDate: "2026-08-24",
    subtotal: 100446.43,
    taxRate: 12,
    taxAmount: 12053.57,
    discountAmount: 0,
    totalAmount: 112500,
    paidAmount: 112500,
    outstandingAmount: 0,
    paymentTerms: "Net 15",
    paymentReference: "RTGS-90218841",
    notes:
      "Monthly consolidated corporate logistics fleet service for Delhi Hub.",
    paymentHistory: [
      {
        id: "pmt_102",
        amount: 112500,
        paymentDate: "2026-08-22",
        paymentMode: "bank_transfer",
        referenceNumber: "RTGS-90218841",
        recordedBy: "Finance Lead",
        notes: "Full clearance of August consolidation",
      },
    ],
    items: [
      {
        description: "Regional Distribution Shuttles - 4 Trips (Aug 1 - Aug 9)",
        quantity: 4,
        unitRate: 25111.6,
        amount: 100446.43,
      },
    ],
    createdAt: "2026-08-10T11:00:00.000Z",
    updatedAt: "2026-08-22T16:45:00.000Z",
  },
  {
    id: "inv_3",
    invoiceNumber: "DRAFT-092",
    documentType: "proforma",
    documentStatus: "draft",
    paymentStatus: "unpaid",
    customerId: "cust_nexus_4",
    customerName: "Nexus Logistics",
    customerCode: "CUST-1188C",
    customerGstin: "27AABCN1188C1Z8",
    tripId: null,
    tripCode: "TRP-489",
    route: "Chennai → Bengaluru",
    isConsolidated: false,
    consolidatedTripsCount: 1,
    consolidatedPeriod: "",
    issueDate: "2026-08-24",
    dueDate: "2026-09-08",
    subtotal: 40000,
    taxRate: 12.5,
    taxAmount: 5000,
    discountAmount: 0,
    totalAmount: 45000,
    paidAmount: 0,
    outstandingAmount: 45000,
    paymentTerms: "Advance / Proforma",
    paymentReference: "",
    notes: "Proforma quotation awaiting corporate billing authorization.",
    paymentHistory: [],
    items: [
      {
        description:
          "Heavy Freight Interstate Haul - Chennai to Bengaluru Corridor",
        quantity: 1,
        unitRate: 40000,
        amount: 40000,
      },
    ],
    createdAt: "2026-08-24T08:00:00.000Z",
    updatedAt: "2026-08-24T08:00:00.000Z",
  },
  {
    id: "inv_4",
    invoiceNumber: "INV-2026-082",
    documentType: "tax_invoice",
    documentStatus: "issued",
    paymentStatus: "partially_paid",
    customerId: "cust_zenith_6",
    customerName: "Zenith Software Solutions",
    customerCode: "CUST-0004",
    customerGstin: "27AABCZ9988C1Z8",
    tripId: "trp_2",
    tripCode: "TRP-0002",
    route: "Bengaluru Airport → Coorg",
    isConsolidated: false,
    consolidatedTripsCount: 1,
    consolidatedPeriod: "",
    issueDate: "2026-08-15",
    dueDate: "2026-08-30",
    subtotal: 32870,
    taxRate: 5,
    taxAmount: 1643.5,
    discountAmount: 0,
    totalAmount: 34513.5,
    paidAmount: 20000,
    outstandingAmount: 14513.5,
    paymentTerms: "Net 15",
    paymentReference: "UPI-4819283719",
    notes: "Executive team luxury offsite retreat transport.",
    paymentHistory: [
      {
        id: "pmt_103",
        amount: 20000,
        paymentDate: "2026-08-15",
        paymentMode: "upi",
        referenceNumber: "UPI-4819283719",
        recordedBy: "Front Desk",
        notes: "Advance payment at booking time",
      },
    ],
    items: [
      {
        description: "Force Urbania 17S Luxury Tour (TRP-0002)",
        quantity: 1,
        unitRate: 32870,
        amount: 32870,
      },
    ],
    createdAt: "2026-08-15T10:00:00.000Z",
    updatedAt: "2026-08-15T12:00:00.000Z",
  },
  {
    id: "inv_5",
    invoiceNumber: "INV-2026-081",
    documentType: "tax_invoice",
    documentStatus: "issued",
    paymentStatus: "unpaid",
    customerId: "cust_dot_3",
    customerName: "Dept. of Transportation",
    customerCode: "GOV-0019B",
    customerGstin: "07AAACD0019B1Z0",
    tripId: null,
    tripCode: "TRP-0044",
    route: "New Delhi → Chandigarh Protocol",
    isConsolidated: false,
    consolidatedTripsCount: 1,
    consolidatedPeriod: "",
    issueDate: "2026-08-18",
    dueDate: "2026-09-17",
    subtotal: 62000,
    taxRate: 12,
    taxAmount: 7440,
    discountAmount: 0,
    totalAmount: 69440,
    paidAmount: 0,
    outstandingAmount: 69440,
    paymentTerms: "Net 60 (Government)",
    paymentReference: "",
    notes: "Official delegate escort convoy.",
    paymentHistory: [],
    items: [
      {
        description: "VIP Fleet Deployment - 2 Premium SUVs + Support",
        quantity: 1,
        unitRate: 62000,
        amount: 62000,
      },
    ],
    createdAt: "2026-08-18T14:30:00.000Z",
    updatedAt: "2026-08-18T14:30:00.000Z",
  },
  {
    id: "inv_6",
    invoiceNumber: "INV-2026-080",
    documentType: "consolidated",
    documentStatus: "issued",
    paymentStatus: "paid",
    customerId: "cust_horizon_5",
    customerName: "Horizon Escapes Tours",
    customerCode: "CUST-0002",
    customerGstin: "29AABCH5678B1Z2",
    tripId: null,
    tripCode: "CONSOLIDATED",
    route: "South India Circuit (6 Trips)",
    isConsolidated: true,
    consolidatedTripsCount: 6,
    consolidatedPeriod: "July 2026",
    issueDate: "2026-08-01",
    dueDate: "2026-08-15",
    subtotal: 210000,
    taxRate: 5,
    taxAmount: 10500,
    discountAmount: 5000,
    totalAmount: 215500,
    paidAmount: 215500,
    outstandingAmount: 0,
    paymentTerms: "Net 15",
    paymentReference: "NEFT-7719208-CLEAR",
    notes: "Full billing for Kerala & Ooty group expeditions.",
    paymentHistory: [
      {
        id: "pmt_104",
        amount: 215500,
        paymentDate: "2026-08-14",
        paymentMode: "bank_transfer",
        referenceNumber: "NEFT-7719208-CLEAR",
        recordedBy: "Accounting",
        notes: "Settlement received on schedule",
      },
    ],
    items: [
      {
        description: "Tour Group Transport Packages - 6 Trips",
        quantity: 6,
        unitRate: 35000,
        amount: 210000,
      },
    ],
    createdAt: "2026-08-01T08:00:00.000Z",
    updatedAt: "2026-08-14T11:20:00.000Z",
  },
  {
    id: "inv_7",
    invoiceNumber: "CRN-2026-0012",
    documentType: "credit_note",
    documentStatus: "issued",
    paymentStatus: "credit",
    customerId: "cust_apex_1",
    customerName: "Apex Corporation",
    customerCode: "CUST-8902A",
    customerGstin: "27AAACA8902A1Z5",
    tripId: null,
    tripCode: "TRP-0039",
    route: "Toll & Fuel Rebate Adjustment",
    isConsolidated: false,
    consolidatedTripsCount: 1,
    consolidatedPeriod: "",
    issueDate: "2026-08-19",
    dueDate: "2026-08-19",
    subtotal: -4500,
    taxRate: 12,
    taxAmount: -540,
    discountAmount: 0,
    totalAmount: -5040,
    paidAmount: -5040,
    outstandingAmount: 0,
    paymentTerms: "Adjusted against Ledger",
    paymentReference: "ADJ-INV-078",
    notes: "Credit note issued for unutilized fuel allowance on Trip TRP-0039.",
    paymentHistory: [],
    items: [
      {
        description: "Rebate on Excess Advance Fuel Charge (TRP-0039)",
        quantity: 1,
        unitRate: -4500,
        amount: -4500,
      },
    ],
    createdAt: "2026-08-19T10:00:00.000Z",
    updatedAt: "2026-08-19T10:00:00.000Z",
  },
  {
    id: "inv_8",
    invoiceNumber: "INV-2026-079",
    documentType: "tax_invoice",
    documentStatus: "issued",
    paymentStatus: "overdue",
    customerId: "cust_gt_2",
    customerName: "Global Transit",
    customerCode: "CUST-4491X",
    customerGstin: "29AABCG4491X1Z2",
    tripId: null,
    tripCode: "TRP-0028",
    route: "Mumbai → Ahmedabad Express",
    isConsolidated: false,
    consolidatedTripsCount: 1,
    consolidatedPeriod: "",
    issueDate: "2026-07-25",
    dueDate: "2026-08-10", // 15 days overdue
    subtotal: 95000,
    taxRate: 12,
    taxAmount: 11000,
    discountAmount: 0,
    totalAmount: 106000,
    paidAmount: 0,
    outstandingAmount: 106000,
    paymentTerms: "Net 15",
    paymentReference: "",
    notes: "Urgent overdue notice dispatched to client account manager.",
    paymentHistory: [],
    items: [
      {
        description: "Container Chassis Multi-Axle Haul (TRP-0028)",
        quantity: 1,
        unitRate: 95000,
        amount: 95000,
      },
    ],
    createdAt: "2026-07-25T14:00:00.000Z",
    updatedAt: "2026-07-25T14:00:00.000Z",
  },
  {
    id: "inv_9",
    invoiceNumber: "DRAFT-091",
    documentType: "tax_invoice",
    documentStatus: "draft",
    paymentStatus: "unpaid",
    customerId: "cust_vikram_7",
    customerName: "Dr. Vikram Sethi",
    customerCode: "CUST-0003",
    customerGstin: "",
    tripId: null,
    tripCode: "TRP-0051",
    route: "Delhi → Agra Day Tour",
    isConsolidated: false,
    consolidatedTripsCount: 1,
    consolidatedPeriod: "",
    issueDate: "2026-08-25",
    dueDate: "2026-08-25",
    subtotal: 14000,
    taxRate: 5,
    taxAmount: 700,
    discountAmount: 0,
    totalAmount: 14700,
    paidAmount: 0,
    outstandingAmount: 14700,
    paymentTerms: "Immediate",
    paymentReference: "",
    notes: "Sedan day booking. Awaiting final odometer reading check.",
    paymentHistory: [],
    items: [
      {
        description: "Toyota Camry Executive Chauffeur Service",
        quantity: 1,
        unitRate: 14000,
        amount: 14000,
      },
    ],
    createdAt: "2026-08-25T07:00:00.000Z",
    updatedAt: "2026-08-25T07:00:00.000Z",
  },
  {
    id: "inv_10",
    invoiceNumber: "DRAFT-090",
    documentType: "tax_invoice",
    documentStatus: "draft",
    paymentStatus: "unpaid",
    customerId: "cust_apex_1",
    customerName: "Apex Corporation",
    customerCode: "CUST-8902A",
    customerGstin: "27AAACA8902A1Z5",
    tripId: null,
    tripCode: "TRP-0052",
    route: "Pune → Nashik Industrial",
    isConsolidated: false,
    consolidatedTripsCount: 1,
    consolidatedPeriod: "",
    issueDate: "2026-08-25",
    dueDate: "2026-09-09",
    subtotal: 28000,
    taxRate: 12,
    taxAmount: 3360,
    discountAmount: 0,
    totalAmount: 31360,
    paidAmount: 0,
    outstandingAmount: 31360,
    paymentTerms: "Net 15",
    paymentReference: "",
    notes: "Draft invoice prepared for completed shift transit.",
    paymentHistory: [],
    items: [
      {
        description: "Employee Shuttle Weekly Contract",
        quantity: 1,
        unitRate: 28000,
        amount: 28000,
      },
    ],
    createdAt: "2026-08-25T08:30:00.000Z",
    updatedAt: "2026-08-25T08:30:00.000Z",
  },
  {
    id: "inv_11",
    invoiceNumber: "DRAFT-089",
    documentType: "proforma",
    documentStatus: "draft",
    paymentStatus: "unpaid",
    customerId: "cust_zenith_6",
    customerName: "Zenith Software Solutions",
    customerCode: "CUST-0004",
    customerGstin: "27AABCZ9988C1Z8",
    tripId: null,
    tripCode: "TRP-0053",
    route: "Pune Tech Park Quarterly Contract",
    isConsolidated: true,
    consolidatedTripsCount: 8,
    consolidatedPeriod: "Q3 2026",
    issueDate: "2026-08-24",
    dueDate: "2026-09-15",
    subtotal: 480000,
    taxRate: 12,
    taxAmount: 57600,
    discountAmount: 10000,
    totalAmount: 527600,
    paidAmount: 0,
    outstandingAmount: 527600,
    paymentTerms: "Net 30",
    paymentReference: "",
    notes: "Proforma quote submitted for quarterly fleet renewal.",
    paymentHistory: [],
    items: [
      {
        description: "8 Dedicated Commuter Sprinters (Monthly package)",
        quantity: 8,
        unitRate: 60000,
        amount: 480000,
      },
    ],
    createdAt: "2026-08-24T16:00:00.000Z",
    updatedAt: "2026-08-24T16:00:00.000Z",
  },
  {
    id: "inv_12",
    invoiceNumber: "DBN-2026-0004",
    documentType: "debit_note",
    documentStatus: "issued",
    paymentStatus: "unpaid",
    customerId: "cust_gt_2",
    customerName: "Global Transit",
    customerCode: "CUST-4491X",
    customerGstin: "29AABCG4491X1Z2",
    tripId: null,
    tripCode: "TRP-0028",
    route: "Detention & Demurrage Charges",
    isConsolidated: false,
    consolidatedTripsCount: 1,
    consolidatedPeriod: "",
    issueDate: "2026-08-20",
    dueDate: "2026-08-30",
    subtotal: 7500,
    taxRate: 12,
    taxAmount: 900,
    discountAmount: 0,
    totalAmount: 8400,
    paidAmount: 0,
    outstandingAmount: 8400,
    paymentTerms: "Immediate",
    paymentReference: "",
    notes: "Supplementary debit note for 24-hour border clearance detention.",
    paymentHistory: [],
    items: [
      {
        description: "Vehicle Detention / Waiting Fee (24 hrs) - TRP-0028",
        quantity: 1,
        unitRate: 7500,
        amount: 7500,
      },
    ],
    createdAt: "2026-08-20T15:00:00.000Z",
    updatedAt: "2026-08-20T15:00:00.000Z",
  },
  {
    id: "inv_13",
    invoiceNumber: "INV-2026-078",
    documentType: "tax_invoice",
    documentStatus: "issued",
    paymentStatus: "paid",
    customerId: "cust_apex_1",
    customerName: "Apex Corporation",
    customerCode: "CUST-8902A",
    customerGstin: "27AAACA8902A1Z5",
    tripId: null,
    tripCode: "TRP-0012",
    route: "Mumbai Airport ↔ BKC Corporate",
    isConsolidated: false,
    consolidatedTripsCount: 1,
    consolidatedPeriod: "",
    issueDate: "2026-08-05",
    dueDate: "2026-08-20",
    subtotal: 580000,
    taxRate: 12,
    taxAmount: 69600,
    discountAmount: 0,
    totalAmount: 649600,
    paidAmount: 649600,
    outstandingAmount: 0,
    paymentTerms: "Net 15",
    paymentReference: "HDFC-RTGS-992144",
    notes: "Annual general meeting guest transport dispatch.",
    paymentHistory: [
      {
        id: "pmt_105",
        amount: 649600,
        paymentDate: "2026-08-18",
        paymentMode: "bank_transfer",
        referenceNumber: "HDFC-RTGS-992144",
        recordedBy: "Finance",
        notes: "Full clearance received",
      },
    ],
    items: [
      {
        description:
          "AGM Fleet Coordination - 10 Luxury Sedans + 2 Mini Coaches",
        quantity: 1,
        unitRate: 580000,
        amount: 580000,
      },
    ],
    createdAt: "2026-08-05T09:00:00.000Z",
    updatedAt: "2026-08-18T16:00:00.000Z",
  },
  {
    id: "inv_14",
    invoiceNumber: "INV-2026-077",
    documentType: "tax_invoice",
    documentStatus: "issued",
    paymentStatus: "paid",
    customerId: "cust_nexus_4",
    customerName: "Nexus Logistics",
    customerCode: "CUST-1188C",
    customerGstin: "27AABCN1188C1Z8",
    tripId: null,
    tripCode: "TRP-0010",
    route: "Hyderabad ↔ Bengaluru Express",
    isConsolidated: false,
    consolidatedTripsCount: 1,
    consolidatedPeriod: "",
    issueDate: "2026-08-02",
    dueDate: "2026-08-16",
    subtotal: 270000,
    taxRate: 12,
    taxAmount: 32400,
    discountAmount: 0,
    totalAmount: 302400,
    paidAmount: 302400,
    outstandingAmount: 0,
    paymentTerms: "Net 15",
    paymentReference: "ICICI-IMPS-884102",
    notes: "Express freight transit.",
    paymentHistory: [
      {
        id: "pmt_106",
        amount: 302400,
        paymentDate: "2026-08-12",
        paymentMode: "bank_transfer",
        referenceNumber: "ICICI-IMPS-884102",
        recordedBy: "Finance",
        notes: "Paid in full",
      },
    ],
    items: [
      {
        description: "Double Decker Auto Carrier - Hyderabad to Bengaluru",
        quantity: 1,
        unitRate: 270000,
        amount: 270000,
      },
    ],
    createdAt: "2026-08-02T10:00:00.000Z",
    updatedAt: "2026-08-12T14:30:00.000Z",
  },
];

const getStoredInvoices = () => {
  try {
    const stored = localStorage.getItem(INVOICES_STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(
        INVOICES_STORAGE_KEY,
        JSON.stringify(DEFAULT_INVOICES),
      );
      return DEFAULT_INVOICES;
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      throw new Error("Stored invoice data is invalid.");
    }
    return parsed;
  } catch (error) {
    console.error("Failed to read invoices from localStorage:", error);
    return DEFAULT_INVOICES;
  }
};

const saveStoredInvoices = (invoices) => {
  try {
    localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
  } catch (error) {
    console.error("Failed to save invoices to localStorage:", error);
    throw new Error("Unable to save invoice data.", { cause: error });
  }
};

export function getInvoices() {
  return getStoredInvoices();
}

export function getInvoiceById(invoiceId) {
  if (!invoiceId) return null;
  const invoices = getStoredInvoices();
  return invoices.find((inv) => inv.id === invoiceId) ?? null;
}

export function saveInvoice(invoiceData) {
  if (!invoiceData || typeof invoiceData !== "object") {
    throw new Error("Invalid invoice data.");
  }

  const invoices = getStoredInvoices();
  const isDraft = invoiceData.documentStatus === "draft";
  const docType = invoiceData.documentType || "tax_invoice";

  const invoiceNumber =
    invoiceData.invoiceNumber || getNextInvoiceCode(docType, isDraft);
  const now = new Date().toISOString();

  const totalAmount = Number(invoiceData.totalAmount || 0);
  const paidAmount = Number(invoiceData.paidAmount || 0);
  const outstandingAmount = Math.max(0, totalAmount - paidAmount);

  let paymentStatus = invoiceData.paymentStatus;
  if (!paymentStatus) {
    if (docType === "credit_note") {
      paymentStatus = "credit";
    } else if (paidAmount >= totalAmount && totalAmount > 0) {
      paymentStatus = "paid";
    } else if (paidAmount > 0) {
      paymentStatus = "partially_paid";
    } else {
      paymentStatus = "unpaid";
    }
  }

  const newInvoice = {
    ...invoiceData,
    id:
      invoiceData.id ||
      `inv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    invoiceNumber,
    documentType: docType,
    documentStatus:
      invoiceData.documentStatus || (isDraft ? "draft" : "issued"),
    paymentStatus,
    totalAmount,
    paidAmount,
    outstandingAmount,
    items: Array.isArray(invoiceData.items) ? invoiceData.items : [],
    paymentHistory: Array.isArray(invoiceData.paymentHistory)
      ? invoiceData.paymentHistory
      : [],
    createdAt: invoiceData.createdAt || now,
    updatedAt: now,
  };

  const updated = [newInvoice, ...invoices];
  saveStoredInvoices(updated);
  return newInvoice;
}

export function updateInvoice(invoiceId, invoiceData) {
  if (!invoiceId) throw new Error("Invoice ID is required.");
  const invoices = getStoredInvoices();
  const index = invoices.findIndex((inv) => inv.id === invoiceId);
  if (index === -1) throw new Error("Invoice not found.");

  const current = invoices[index];
  const totalAmount = Number(
    invoiceData.totalAmount !== undefined
      ? invoiceData.totalAmount
      : current.totalAmount,
  );
  const paidAmount = Number(
    invoiceData.paidAmount !== undefined
      ? invoiceData.paidAmount
      : current.paidAmount,
  );
  const outstandingAmount = Math.max(0, totalAmount - paidAmount);

  let paymentStatus = invoiceData.paymentStatus || current.paymentStatus;
  if (invoiceData.documentType === "credit_note") {
    paymentStatus = "credit";
  } else if (paidAmount >= totalAmount && totalAmount > 0) {
    paymentStatus = "paid";
  } else if (paidAmount > 0 && paidAmount < totalAmount) {
    paymentStatus = "partially_paid";
  } else if (paidAmount === 0 && paymentStatus === "paid") {
    paymentStatus = "unpaid";
  }

  const updatedInvoice = {
    ...current,
    ...invoiceData,
    id: current.id,
    invoiceNumber: invoiceData.invoiceNumber || current.invoiceNumber,
    totalAmount,
    paidAmount,
    outstandingAmount,
    paymentStatus,
    updatedAt: new Date().toISOString(),
  };

  invoices[index] = updatedInvoice;
  saveStoredInvoices(invoices);
  return updatedInvoice;
}

export function deleteInvoice(invoiceId) {
  if (!invoiceId) throw new Error("Invoice ID is required.");
  const invoices = getStoredInvoices();
  const filtered = invoices.filter((inv) => inv.id !== invoiceId);
  saveStoredInvoices(filtered);
  return true;
}

export function markInvoiceIssued(invoiceId) {
  const invoice = getInvoiceById(invoiceId);
  if (!invoice) throw new Error("Invoice not found.");

  // If invoice number had DRAFT- prefix, generate official INV number
  let newInvoiceNumber = invoice.invoiceNumber;
  if (newInvoiceNumber.startsWith("DRAFT-")) {
    newInvoiceNumber = getNextInvoiceCode(invoice.documentType, false);
  }

  return updateInvoice(invoiceId, {
    invoiceNumber: newInvoiceNumber,
    documentStatus: "issued",
    issueDate: invoice.issueDate || new Date().toISOString().split("T")[0],
  });
}

export function cancelInvoice(invoiceId, reason = "") {
  return updateInvoice(invoiceId, {
    documentStatus: "cancelled",
    cancelReason: reason,
  });
}

export function recordPayment(invoiceId, paymentData) {
  if (!invoiceId) throw new Error("Invoice ID is required.");
  const invoice = getInvoiceById(invoiceId);
  if (!invoice) throw new Error("Invoice not found.");

  const pmtAmount = Number(paymentData.amount || 0);
  if (pmtAmount <= 0)
    throw new Error("Payment amount must be greater than zero.");

  const newPaidAmount = Number(invoice.paidAmount || 0) + pmtAmount;
  const newOutstanding = Math.max(
    0,
    Number(invoice.totalAmount || 0) - newPaidAmount,
  );

  const paymentEntry = {
    id: `pmt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    amount: pmtAmount,
    paymentDate:
      paymentData.paymentDate || new Date().toISOString().split("T")[0],
    paymentMode: paymentData.paymentMode || "bank_transfer",
    referenceNumber: paymentData.referenceNumber || "",
    recordedBy: paymentData.recordedBy || "Operator",
    notes: paymentData.notes || "",
    createdAt: new Date().toISOString(),
  };

  const newPaymentHistory = [paymentEntry, ...(invoice.paymentHistory || [])];
  const newPaymentStatus = newOutstanding === 0 ? "paid" : "partially_paid";

  return updateInvoice(invoiceId, {
    paidAmount: newPaidAmount,
    outstandingAmount: newOutstanding,
    paymentStatus: newPaymentStatus,
    paymentHistory: newPaymentHistory,
    paymentReference: paymentData.referenceNumber || invoice.paymentReference,
  });
}

/**
 * Calculate KPI summaries from real invoice dataset
 */
export function getInvoiceKPIs(invoices = null) {
  const list = invoices || getStoredInvoices();
  const activeInvoices = list.filter(
    (inv) => inv.documentStatus !== "cancelled",
  );

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let totalOutstanding = 0;
  let overdueAmount = 0;
  let overdueCount = 0;
  let draftCount = 0;
  let paidThisMonth = 0;
  let transactionsThisMonth = 0;
  let totalBilledThisMonth = 0;

  activeInvoices.forEach((inv) => {
    // Drafts
    if (inv.documentStatus === "draft") {
      draftCount++;
      return; // Drafts do not count towards active receivables
    }

    // Issued / Revised
    const outstanding = Number(inv.outstandingAmount || 0);
    if (outstanding > 0) {
      totalOutstanding += outstanding;
    }

    // Check overdue
    if (
      inv.dueDate &&
      inv.paymentStatus !== "paid" &&
      inv.paymentStatus !== "credit"
    ) {
      try {
        const dueDate = new Date(inv.dueDate);
        dueDate.setHours(23, 59, 59, 999);
        if (dueDate < now && outstanding > 0) {
          overdueAmount += outstanding;
          overdueCount++;
        }
      } catch {
        // ignore date parsing error
      }
    }

    // Calculate Billed this month
    if (inv.issueDate) {
      try {
        const issDate = new Date(inv.issueDate);
        if (
          issDate.getMonth() === currentMonth &&
          issDate.getFullYear() === currentYear
        ) {
          totalBilledThisMonth += Number(inv.totalAmount || 0);
        }
      } catch {
        // ignore
      }
    }

    // Calculate Payments received this month
    if (Array.isArray(inv.paymentHistory)) {
      inv.paymentHistory.forEach((pmt) => {
        try {
          const pmtDate = new Date(pmt.paymentDate || pmt.createdAt);
          if (
            pmtDate.getMonth() === currentMonth &&
            pmtDate.getFullYear() === currentYear
          ) {
            paidThisMonth += Number(pmt.amount || 0);
            transactionsThisMonth++;
          }
        } catch {
          // ignore
        }
      });
    }
  });

  return {
    totalOutstanding,
    overdueAmount,
    overdueCount,
    draftCount,
    paidThisMonth,
    transactionsThisMonth,
    totalBilledThisMonth,
    totalCount: list.length,
  };
}
