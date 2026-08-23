const EXPIRING_SOON_THRESHOLD_DAYS = 30;

function parseDateOnly(dateString) {
  if (!dateString) return null;
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function getDaysDifference(targetDate) {
  if (!targetDate) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = targetDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function checkSingleDocumentStatus(dateString, documentName) {
  if (!dateString) {
    return {
      status: "not_provided",
      label: "Not Provided",
      daysLeft: null,
      message: `${documentName} expiry date is not set`,
    };
  }

  const parsedDate = parseDateOnly(dateString);
  if (!parsedDate || isNaN(parsedDate.getTime())) {
    return {
      status: "invalid",
      label: "Invalid Date",
      daysLeft: null,
      message: `Invalid date format for ${documentName}`,
    };
  }

  const daysLeft = getDaysDifference(parsedDate);

  if (daysLeft < 0) {
    const daysAgo = Math.abs(daysLeft);
    return {
      status: "expired",
      label: "Expired",
      daysLeft,
      message: `${documentName} expired ${daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`}`,
    };
  }

  if (daysLeft <= EXPIRING_SOON_THRESHOLD_DAYS) {
    return {
      status: "expiring_soon",
      label: "Expiring Soon",
      daysLeft,
      message: `${documentName} expires in ${daysLeft === 0 ? "today" : `${daysLeft} ${daysLeft === 1 ? "day" : "days"}`}`,
    };
  }

  return {
    status: "valid",
    label: "Valid",
    daysLeft,
    message: `${documentName} is valid for ${daysLeft} days`,
  };
}

export function getVehicleDocumentStatus(vehicle) {
  if (!vehicle) {
    return {
      value: "valid",
      label: "Valid",
      criticalItems: [],
      summary: "No document data",
    };
  }

  const documents = [
    { name: "Insurance", date: vehicle.insuranceExpiry, required: true },
    {
      name: "Fitness Certificate",
      date: vehicle.fitnessExpiry,
      required: true,
    },
    { name: "PUC", date: vehicle.pucExpiry, required: true },
  ];

  if (vehicle.permitNumber || vehicle.permitExpiry) {
    documents.push({
      name: "Permit",
      date: vehicle.permitExpiry,
      required: Boolean(vehicle.permitNumber),
    });
  }

  const evaluations = documents.map((doc) => ({
    name: doc.name,
    required: doc.required,
    ...checkSingleDocumentStatus(doc.date, doc.name),
  }));

  const expiredDocs = evaluations.filter((doc) => doc.status === "expired");
  const expiringSoonDocs = evaluations.filter(
    (doc) => doc.status === "expiring_soon",
  );

  if (expiredDocs.length > 0) {
    return {
      value: "expired",
      label: "Expired",
      evaluations,
      criticalItems: expiredDocs,
      summary: expiredDocs.map((d) => d.message).join(", "),
    };
  }

  if (expiringSoonDocs.length > 0) {
    return {
      value: "expiring_soon",
      label: "Expiring Soon",
      evaluations,
      criticalItems: expiringSoonDocs,
      summary: expiringSoonDocs.map((d) => d.message).join(", "),
    };
  }

  return {
    value: "valid",
    label: "Valid",
    evaluations,
    criticalItems: [],
    summary: "All compliance documents are valid",
  };
}
