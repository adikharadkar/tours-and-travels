export function normalizeLicenseNumber(licenseNumber) {
  return String(licenseNumber ?? "")
    .trim()
    .toUpperCase();
}

export function validateDriver(formData) {
  const errors = {};

  // 1. Driver Name (Required)
  const name = String(formData.name ?? "").trim();
  if (!name) {
    errors.name = "Driver name is required.";
  } else if (name.length < 2) {
    errors.name = "Driver name must be at least 2 characters.";
  }

  // 2. Mobile No. (Required, 10 digits)
  const mobile = String(formData.mobile ?? "")
    .trim()
    .replace(/\D/g, "");
  if (!mobile) {
    errors.mobile = "Mobile number is required.";
  } else if (mobile.length !== 10) {
    errors.mobile = "Mobile number must be exactly 10 digits.";
  }

  // 3. Alternate Mobile (Optional, 10 digits, not identical to mobile 1)
  const alternateMobile = String(formData.alternateMobile ?? "")
    .trim()
    .replace(/\D/g, "");
  if (alternateMobile) {
    if (alternateMobile.length !== 10) {
      errors.alternateMobile = "Alternate mobile must be exactly 10 digits.";
    } else if (alternateMobile === mobile) {
      errors.alternateMobile =
        "Alternate mobile cannot be the same as primary mobile.";
    }
  }

  // 4. Email (Optional, valid format)
  const email = String(formData.email ?? "").trim();
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.email = "Please enter a valid email address.";
    }
  }

  // 5. PIN Code (Optional, 6 digits)
  const pinCode = String(formData.pinCode ?? "")
    .trim()
    .replace(/\D/g, "");
  if (pinCode && pinCode.length !== 6) {
    errors.pinCode = "PIN code must be exactly 6 digits.";
  }

  // 6. License Number (Required)
  const licenseNumber = normalizeLicenseNumber(formData.licenseNumber);
  if (!licenseNumber) {
    errors.licenseNumber = "Driving license number is required.";
  } else if (licenseNumber.length < 5) {
    errors.licenseNumber = "License number must be at least 5 characters.";
  }

  // 7. License Type (Required)
  if (!formData.licenseType) {
    errors.licenseType = "License type is required.";
  }

  // 8. License Expiry Date (Required, valid date)
  if (!formData.licenseExpiryDate) {
    errors.licenseExpiryDate = "License expiry date is required.";
  } else {
    const expiry = new Date(formData.licenseExpiryDate);
    if (isNaN(expiry.getTime())) {
      errors.licenseExpiryDate = "Invalid expiry date.";
    }
  }

  // 9. License Issue Date (Optional, must be <= Expiry Date)
  if (formData.licenseIssueDate) {
    const issueDate = new Date(formData.licenseIssueDate);
    if (isNaN(issueDate.getTime())) {
      errors.licenseIssueDate = "Invalid issue date.";
    } else if (formData.licenseExpiryDate) {
      const expiry = new Date(formData.licenseExpiryDate);
      if (!isNaN(expiry.getTime()) && issueDate > expiry) {
        errors.licenseExpiryDate =
          "License expiry date must be on or after the issue date.";
      }
    }
  }

  // 10. Driver Type (Required: own, contract, attached)
  if (!formData.driverType) {
    errors.driverType = "Driver employment type is required.";
  }

  // 11. Daily Rate (Optional, must be non-negative)
  if (
    formData.dailyRate !== undefined &&
    formData.dailyRate !== null &&
    String(formData.dailyRate).trim() !== ""
  ) {
    const rate = Number(formData.dailyRate);
    if (isNaN(rate) || rate < 0) {
      errors.dailyRate = "Daily rate must be a valid non-negative amount.";
    }
  }

  // 12. Date of Birth (Optional, must be in past, driver at least 18 yrs old ideally)
  if (formData.dateOfBirth) {
    const dob = new Date(formData.dateOfBirth);
    const today = new Date();
    if (isNaN(dob.getTime())) {
      errors.dateOfBirth = "Invalid date of birth.";
    } else if (dob > today) {
      errors.dateOfBirth = "Date of birth cannot be in the future.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
