import {
  VEHICLE_TYPES,
  FUEL_TYPES,
  OWNERSHIP_TYPES,
} from "../../constants/vehicles";

const MOBILE_REGEX = /^[6-9]\d{9}$/;
const GENERAL_PHONE_REGEX = /^[0-9+() -]{7,15}$/;
const VEHICLE_NUMBER_REGEX = /^[A-Z0-9\s-]{4,15}$/i;

const isEmpty = (value) =>
  value === undefined || value === null || String(value).trim() === "";

const addError = (errors, field, message) => {
  if (!errors[field]) {
    errors[field] = message;
  }
};

export function normalizeVehicleNumber(vehicleNumber) {
  if (!vehicleNumber) return "";
  return String(vehicleNumber).trim().replace(/\s+/g, "").toUpperCase();
}

export function validateVehicle(formData) {
  const errors = {};
  const currentYear = new Date().getFullYear();

  /* ---------------------------------------------
     Vehicle Information
  --------------------------------------------- */
  if (isEmpty(formData.vehicleNumber)) {
    addError(
      errors,
      "vehicleNumber",
      "Vehicle registration number is required.",
    );
  } else {
    const rawNumber = String(formData.vehicleNumber).trim();
    if (!VEHICLE_NUMBER_REGEX.test(rawNumber)) {
      addError(
        errors,
        "vehicleNumber",
        "Enter a valid vehicle registration number (e.g., MH20AB1234).",
      );
    } else if (rawNumber.replace(/[\s-]/g, "").length < 4) {
      addError(
        errors,
        "vehicleNumber",
        "Vehicle number must be at least 4 characters long.",
      );
    }
  }

  if (isEmpty(formData.vehicleType)) {
    addError(errors, "vehicleType", "Vehicle type is required.");
  } else {
    const validTypes = VEHICLE_TYPES.map((t) => t.value);
    if (!validTypes.includes(formData.vehicleType)) {
      addError(errors, "vehicleType", "Select a valid vehicle type.");
    }
  }

  if (isEmpty(formData.registrationDate)) {
    addError(errors, "registrationDate", "Registration date is required.");
  }

  if (isEmpty(formData.make)) {
    addError(errors, "make", "Vehicle make/manufacturer is required.");
  } else if (formData.make.trim().length < 2) {
    addError(errors, "make", "Make must contain at least 2 characters.");
  }

  if (isEmpty(formData.model)) {
    addError(errors, "model", "Vehicle model is required.");
  } else if (formData.model.trim().length < 1) {
    addError(errors, "model", "Model is required.");
  }

  if (isEmpty(formData.manufacturingYear)) {
    addError(errors, "manufacturingYear", "Manufacturing year is required.");
  } else {
    const year = Number(formData.manufacturingYear);
    if (!Number.isInteger(year) || year < 1970 || year > currentYear + 1) {
      addError(
        errors,
        "manufacturingYear",
        `Enter a valid year between 1970 and ${currentYear + 1}.`,
      );
    }
  }

  if (isEmpty(formData.seatingCapacity)) {
    addError(errors, "seatingCapacity", "Seating capacity is required.");
  } else {
    const capacity = Number(formData.seatingCapacity);
    if (!Number.isInteger(capacity) || capacity <= 0 || capacity > 150) {
      addError(
        errors,
        "seatingCapacity",
        "Seating capacity must be a positive number up to 150.",
      );
    }
  }

  if (isEmpty(formData.fuelType)) {
    addError(errors, "fuelType", "Fuel type is required.");
  } else {
    const validFuels = FUEL_TYPES.map((f) => f.value);
    if (!validFuels.includes(formData.fuelType)) {
      addError(errors, "fuelType", "Select a valid fuel type.");
    }
  }

  /* ---------------------------------------------
     Ownership Information
  --------------------------------------------- */
  if (isEmpty(formData.ownershipType)) {
    addError(errors, "ownershipType", "Ownership type is required.");
  } else {
    const validOwnerships = OWNERSHIP_TYPES.map((o) => o.value);
    if (!validOwnerships.includes(formData.ownershipType)) {
      addError(errors, "ownershipType", "Select a valid ownership type.");
    }
  }

  const isAttachedOrLeased =
    formData.ownershipType === "attached" ||
    formData.ownershipType === "leased";

  if (isAttachedOrLeased) {
    if (isEmpty(formData.ownerName)) {
      addError(
        errors,
        "ownerName",
        `Owner name is required for ${formData.ownershipType} vehicles.`,
      );
    } else if (formData.ownerName.trim().length < 2) {
      addError(
        errors,
        "ownerName",
        "Owner name must contain at least 2 characters.",
      );
    }

    if (isEmpty(formData.ownerContact)) {
      addError(
        errors,
        "ownerContact",
        `Owner contact number is required for ${formData.ownershipType} vehicles.`,
      );
    } else {
      const contact = String(formData.ownerContact).trim();
      if (!MOBILE_REGEX.test(contact) && !GENERAL_PHONE_REGEX.test(contact)) {
        addError(
          errors,
          "ownerContact",
          "Enter a valid 10-digit mobile number or contact number.",
        );
      }
    }
  }

  /* ---------------------------------------------
     Documents & Compliance Information
  --------------------------------------------- */
  if (isEmpty(formData.insuranceExpiry)) {
    addError(errors, "insuranceExpiry", "Insurance expiry date is required.");
  }

  if (isEmpty(formData.fitnessExpiry)) {
    addError(
      errors,
      "fitnessExpiry",
      "Fitness certificate expiry date is required.",
    );
  }

  if (isEmpty(formData.pucExpiry)) {
    addError(errors, "pucExpiry", "PUC expiry date is required.");
  }

  // Cross-date check with registration date
  if (!isEmpty(formData.registrationDate)) {
    const regDate = new Date(formData.registrationDate);

    if (!isEmpty(formData.insuranceExpiry)) {
      const insDate = new Date(formData.insuranceExpiry);
      if (insDate < regDate) {
        addError(
          errors,
          "insuranceExpiry",
          "Insurance expiry cannot be earlier than registration date.",
        );
      }
    }

    if (!isEmpty(formData.fitnessExpiry)) {
      const fitDate = new Date(formData.fitnessExpiry);
      if (fitDate < regDate) {
        addError(
          errors,
          "fitnessExpiry",
          "Fitness expiry cannot be earlier than registration date.",
        );
      }
    }

    if (!isEmpty(formData.pucExpiry)) {
      const pucDate = new Date(formData.pucExpiry);
      if (pucDate < regDate) {
        addError(
          errors,
          "pucExpiry",
          "PUC expiry cannot be earlier than registration date.",
        );
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
