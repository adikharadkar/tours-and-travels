const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;
const PIN_CODE_REGEX = /^\d{6}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const isEmpty = (value) =>
  value === undefined || value === null || String(value).trim() === "";

const addError = (errors, field, message) => {
  if (!errors[field]) {
    errors[field] = message;
  }
};

export function validateCustomer(formData) {
  const errors = {};

  const isCompany = formData.customerType === "company";
  const isIndividual = formData.customerType === "individual";

  /* ---------------------------------------------
     Customer Information
  --------------------------------------------- */

  if (isEmpty(formData.registrationDate)) {
    addError(errors, "registrationDate", "Registration date is required.");
  }

  if (isEmpty(formData.customerType)) {
    addError(errors, "customerType", "Customer type is required.");
  } else if (!["company", "individual"].includes(formData.customerType)) {
    addError(errors, "customerType", "Select a valid customer type.");
  }

  if (isEmpty(formData.name)) {
    addError(
      errors,
      "name",
      isCompany ? "Company name is required." : "Customer name is required.",
    );
  } else if (formData.name.trim().length < 2) {
    addError(errors, "name", "Name must contain at least 2 characters.");
  }

  if (isIndividual) {
    if (isEmpty(formData.prefix)) {
      addError(errors, "prefix", "Prefix is required.");
    }
  }

  if (isCompany) {
    if (isEmpty(formData.contactPerson)) {
      addError(errors, "contactPerson", "Contact person is required.");
    } else if (formData.contactPerson.trim().length < 2) {
      addError(
        errors,
        "contactPerson",
        "Contact person must contain at least 2 characters.",
      );
    }
  }

  /* ---------------------------------------------
     Contact Information
  --------------------------------------------- */

  if (isEmpty(formData.mobile1)) {
    addError(errors, "mobile1", "Primary mobile number is required.");
  } else if (!MOBILE_REGEX.test(formData.mobile1.trim())) {
    addError(errors, "mobile1", "Enter a valid 10-digit Indian mobile number.");
  }

  if (!isEmpty(formData.mobile2)) {
    if (!MOBILE_REGEX.test(formData.mobile2.trim())) {
      addError(
        errors,
        "mobile2",
        "Enter a valid 10-digit Indian mobile number.",
      );
    }

    if (formData.mobile2.trim() === formData.mobile1.trim()) {
      addError(errors, "mobile2", "Mobile numbers must be different.");
    }
  }

  if (isEmpty(formData.email)) {
    addError(errors, "email", "Email is required.");
  } else if (!EMAIL_REGEX.test(formData.email.trim())) {
    addError(errors, "email", "Enter a valid email address.");
  }

  if (!isEmpty(formData.alternateEmail)) {
    if (!EMAIL_REGEX.test(formData.alternateEmail.trim())) {
      addError(errors, "alternateEmail", "Enter a valid email address.");
    }

    if (
      formData.alternateEmail.trim().toLowerCase() ===
      formData.email.trim().toLowerCase()
    ) {
      addError(
        errors,
        "alternateEmail",
        "Alternate email must be different from primary email.",
      );
    }
  }

  /* ---------------------------------------------
     Address Information
  --------------------------------------------- */

  if (isEmpty(formData.address)) {
    addError(errors, "address", "Address is required.");
  } else if (formData.address.trim().length < 5) {
    addError(errors, "address", "Please enter a valid address.");
  }

  if (isEmpty(formData.state)) {
    addError(errors, "state", "State is required.");
  }

  if (isEmpty(formData.city)) {
    addError(errors, "city", "City is required.");
  }

  if (isEmpty(formData.stateCode)) {
    addError(
      errors,
      "stateCode",
      "State code could not be determined. Select a valid state.",
    );
  }

  if (isEmpty(formData.pinCode)) {
    addError(errors, "pinCode", "PIN code is required.");
  } else if (!PIN_CODE_REGEX.test(formData.pinCode.trim())) {
    addError(errors, "pinCode", "PIN code must contain exactly 6 digits.");
  }

  /* ---------------------------------------------
     Tax & Billing Information
  --------------------------------------------- */

  if (!isEmpty(formData.gstNumber)) {
    const gstNumber = formData.gstNumber.trim().toUpperCase();

    if (gstNumber.length !== 15) {
      addError(errors, "gstNumber", "GSTIN must contain 15 characters.");
    } else if (!GSTIN_REGEX.test(gstNumber)) {
      addError(errors, "gstNumber", "Enter a valid GSTIN.");
    }
  }

  if (!isEmpty(formData.pan)) {
    const pan = formData.pan.trim().toUpperCase();

    if (!PAN_REGEX.test(pan)) {
      addError(errors, "pan", "Enter a valid PAN.");
    }
  }

  if (isEmpty(formData.billingName)) {
    addError(errors, "billingName", "Billing name is required.");
  }

  if (isEmpty(formData.billingAddress)) {
    addError(errors, "billingAddress", "Billing address is required.");
  }

  if (isEmpty(formData.billingState)) {
    addError(errors, "billingState", "Billing state is required.");
  }

  if (isEmpty(formData.billingCity)) {
    addError(errors, "billingCity", "Billing city is required.");
  }

  if (isEmpty(formData.billingStateCode)) {
    addError(errors, "billingStateCode", "Billing state code is required.");
  }

  if (isEmpty(formData.billingPinCode)) {
    addError(errors, "billingPinCode", "Billing PIN code is required.");
  } else if (!PIN_CODE_REGEX.test(formData.billingPinCode.trim())) {
    addError(
      errors,
      "billingPinCode",
      "Billing PIN code must contain exactly 6 digits.",
    );
  }

  /* ---------------------------------------------
     Financial / Account Information
  --------------------------------------------- */

  if (
    formData.openingBalance === "" ||
    formData.openingBalance === null ||
    formData.openingBalance === undefined
  ) {
    addError(errors, "openingBalance", "Opening balance is required.");
  } else {
    const openingBalance = Number(formData.openingBalance);

    if (!Number.isFinite(openingBalance)) {
      addError(errors, "openingBalance", "Enter a valid opening balance.");
    } else if (openingBalance < 0) {
      addError(errors, "openingBalance", "Opening balance cannot be negative.");
    }
  }

  if (formData.openingBalance > 0) {
    if (!["debit", "credit"].includes(formData.openingBalanceType)) {
      addError(errors, "openingBalanceType", "Select Debit or Credit.");
    }
  }

  if (!isEmpty(formData.creditLimit)) {
    const creditLimit = Number(formData.creditLimit);

    if (!Number.isFinite(creditLimit)) {
      addError(errors, "creditLimit", "Enter a valid credit limit.");
    } else if (creditLimit < 0) {
      addError(errors, "creditLimit", "Credit limit cannot be negative.");
    }
  }

  if (isEmpty(formData.paymentTerms)) {
    addError(errors, "paymentTerms", "Payment terms are required.");
  }

  if (isEmpty(formData.billingCycle)) {
    addError(errors, "billingCycle", "Billing cycle is required.");
  }

  /* ---------------------------------------------
     Additional Information
  --------------------------------------------- */

  if (isIndividual && !isEmpty(formData.dateOfBirth)) {
    const dateOfBirth = new Date(formData.dateOfBirth);
    const today = new Date();

    if (Number.isNaN(dateOfBirth.getTime())) {
      addError(errors, "dateOfBirth", "Enter a valid date of birth.");
    } else if (dateOfBirth > today) {
      addError(errors, "dateOfBirth", "Date of birth cannot be in the future.");
    }
  }

  if (isIndividual && !isEmpty(formData.marriageDate)) {
    const marriageDate = new Date(formData.marriageDate);
    const today = new Date();

    if (Number.isNaN(marriageDate.getTime())) {
      addError(errors, "marriageDate", "Enter a valid marriage date.");
    } else if (marriageDate > today) {
      addError(
        errors,
        "marriageDate",
        "Marriage date cannot be in the future.",
      );
    }

    if (formData.dateOfBirth && marriageDate < new Date(formData.dateOfBirth)) {
      addError(
        errors,
        "marriageDate",
        "Marriage date cannot be earlier than date of birth.",
      );
    }
  }

  return errors;
}
