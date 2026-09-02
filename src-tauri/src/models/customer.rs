use regex::Regex;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Customer {
    pub id: i64,

    pub customer_code: String,
    pub registration_date: String,

    pub prefix: Option<String>,
    pub name: String,
    pub customer_type: String,
    pub contact_person: Option<String>,

    pub mobile1: String,
    pub mobile2: Option<String>,
    pub email: String,
    pub alternate_email: Option<String>,

    pub address: String,
    pub city: String,
    pub state: String,
    pub state_code: String,
    pub pin_code: String,

    pub gst_number: Option<String>,
    pub pan: Option<String>,
    pub vendor_code: Option<String>,

    pub billing_name: String,
    pub billing_same_as_address: bool,
    pub billing_address: String,
    pub billing_city: String,
    pub billing_state: String,
    pub billing_state_code: String,
    pub billing_pin_code: String,

    pub opening_balance_paise: i64,
    pub opening_balance_type: String,
    pub credit_limit_paise: Option<i64>,

    pub payment_terms: String,
    pub billing_cycle: String,

    pub date_of_birth: Option<String>,
    pub marriage_date: Option<String>,
    pub notes: Option<String>,

    pub is_active: bool,

    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateCustomer {
    pub registration_date: String,

    pub prefix: Option<String>,
    pub name: String,
    pub customer_type: String,
    pub contact_person: Option<String>,

    pub mobile1: String,
    pub mobile2: Option<String>,
    pub email: String,
    pub alternate_email: Option<String>,

    pub address: String,
    pub city: String,
    pub state: String,
    pub state_code: String,
    pub pin_code: String,

    pub gst_number: Option<String>,
    pub pan: Option<String>,
    pub vendor_code: Option<String>,

    pub billing_name: String,
    pub billing_same_as_address: bool,
    pub billing_address: String,
    pub billing_city: String,
    pub billing_state: String,
    pub billing_state_code: String,
    pub billing_pin_code: String,

    pub opening_balance_paise: i64,
    pub opening_balance_type: String,
    pub credit_limit_paise: Option<i64>,

    pub payment_terms: String,
    pub billing_cycle: String,

    pub date_of_birth: Option<String>,
    pub marriage_date: Option<String>,
    pub notes: Option<String>,

    pub is_active: bool,
}

impl CreateCustomer {
    pub fn normalize(&mut self) {
        self.registration_date = self.registration_date.trim().to_string();

        self.name = self.name.trim().to_string();
        self.customer_type = self.customer_type.trim().to_lowercase();

        self.prefix = normalize_optional(&self.prefix);
        self.contact_person = normalize_optional(&self.contact_person);

        self.mobile1 = self.mobile1.trim().to_string();
        self.mobile2 = normalize_optional(&self.mobile2);

        self.email = self.email.trim().to_lowercase();
        self.alternate_email = self
            .alternate_email
            .as_ref()
            .map(|value| value.trim().to_lowercase())
            .filter(|value| !value.is_empty());

        self.address = self.address.trim().to_string();
        self.city = self.city.trim().to_string();
        self.state = self.state.trim().to_string();
        self.state_code = self.state_code.trim().to_uppercase();
        self.pin_code = self.pin_code.trim().to_string();

        self.gst_number = self.gst_number.as_ref().and_then(|value| {
            let value = value.trim().to_uppercase();

            if value.is_empty() {
                None
            } else {
                Some(value)
            }
        });

        self.pan = self.pan.as_ref().and_then(|value| {
            let value = value.trim().to_uppercase();

            if value.is_empty() {
                None
            } else {
                Some(value)
            }
        });

        self.vendor_code = normalize_optional(&self.vendor_code);

        self.billing_name = self.billing_name.trim().to_string();
        self.billing_address = self.billing_address.trim().to_string();
        self.billing_city = self.billing_city.trim().to_string();
        self.billing_state = self.billing_state.trim().to_string();
        self.billing_state_code = self.billing_state_code.trim().to_uppercase();
        self.billing_pin_code = self.billing_pin_code.trim().to_string();

        self.opening_balance_type =
            self.opening_balance_type.trim().to_lowercase();

        self.payment_terms = self.payment_terms.trim().to_lowercase();
        self.billing_cycle = self.billing_cycle.trim().to_lowercase();

        self.date_of_birth = normalize_optional(&self.date_of_birth);
        self.marriage_date = normalize_optional(&self.marriage_date);
        self.notes = normalize_optional(&self.notes);
    }

    pub fn validate(&self) -> Result<(), String> {
        const EMAIL_REGEX: &str = r"^[^\s@]+@[^\s@]+\.[^\s@]+$";
        const MOBILE_REGEX: &str = r"^[6-9][0-9]{9}$";
        const PIN_CODE_REGEX: &str = r"^[0-9]{6}$";
        const PAN_REGEX: &str = r"^[A-Z]{5}[0-9]{4}[A-Z]$";
        const GSTIN_REGEX: &str =
            r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$";

        let is_company = self.customer_type == "company";
        let is_individual = self.customer_type == "individual";

        let email_regex =
            Regex::new(EMAIL_REGEX).expect("EMAIL_REGEX must be valid");

        let mobile_regex =
            Regex::new(MOBILE_REGEX).expect("MOBILE_REGEX must be valid");

        let pin_code_regex =
            Regex::new(PIN_CODE_REGEX).expect("PIN_CODE_REGEX must be valid");

        let pan_regex =
            Regex::new(PAN_REGEX).expect("PAN_REGEX must be valid");

        let gstin_regex =
            Regex::new(GSTIN_REGEX).expect("GSTIN_REGEX must be valid");

        // ---------------------------------------------------------
        // Customer Information
        // ---------------------------------------------------------

        if self.registration_date.trim().is_empty() {
            return Err("Registration date is required.".to_string());
        }

        if self.customer_type.trim().is_empty() {
            return Err("Customer type is required.".to_string());
        }

        if !["company", "individual"].contains(&self.customer_type.as_str()) {
            return Err("Select a valid customer type.".to_string());
        }

        if self.name.trim().is_empty() {
            return Err(
                if is_company {
                    "Company name is required."
                } else {
                    "Customer name is required."
                }
                .to_string(),
            );
        }

        if self.name.trim().chars().count() < 2 {
            return Err("Name must contain at least 2 characters.".to_string());
        }

        if is_individual {
            let prefix = self.prefix.as_deref().unwrap_or("").trim();

            if prefix.is_empty() {
                return Err("Prefix is required.".to_string());
            }
        }

        if let Some(prefix) = self.prefix.as_deref() {
            let prefix = prefix.trim();

            if !prefix.is_empty()
                && !["mr", "mrs", "ms", "dr"].contains(&prefix)
            {
                return Err("Select a valid prefix.".to_string());
            }
        }

        if is_company {
            let contact_person =
                self.contact_person.as_deref().unwrap_or("").trim();

            if contact_person.is_empty() {
                return Err("Contact person is required.".to_string());
            }

            if contact_person.chars().count() < 2 {
                return Err(
                    "Contact person must contain at least 2 characters."
                        .to_string(),
                );
            }
        }

        // ---------------------------------------------------------
        // Contact Information
        // ---------------------------------------------------------

        let mobile1 = self.mobile1.trim();

        if mobile1.is_empty() {
            return Err("Primary mobile number is required.".to_string());
        }

        if !mobile_regex.is_match(mobile1) {
            return Err(
                "Enter a valid 10-digit Indian mobile number.".to_string(),
            );
        }

        if let Some(mobile2) = self.mobile2.as_deref() {
            let mobile2 = mobile2.trim();

            if !mobile2.is_empty() {
                if !mobile_regex.is_match(mobile2) {
                    return Err(
                        "Enter a valid 10-digit Indian mobile number."
                            .to_string(),
                    );
                }

                if mobile2 == mobile1 {
                    return Err("Mobile numbers must be different.".to_string());
                }
            }
        }

        let email = self.email.trim();

        if email.is_empty() {
            return Err("Email is required.".to_string());
        }

        if !email_regex.is_match(email) {
            return Err("Enter a valid email address.".to_string());
        }

        if let Some(alternate_email) = self.alternate_email.as_deref() {
            let alternate_email = alternate_email.trim();

            if !alternate_email.is_empty() {
                if !email_regex.is_match(alternate_email) {
                    return Err("Enter a valid email address.".to_string());
                }

                if alternate_email.eq_ignore_ascii_case(email) {
                    return Err(
                        "Alternate email must be different from primary email."
                            .to_string(),
                    );
                }
            }
        }

        // ---------------------------------------------------------
        // Address Information
        // ---------------------------------------------------------

        let address = self.address.trim();

        if address.is_empty() {
            return Err("Address is required.".to_string());
        }

        if address.chars().count() < 5 {
            return Err("Please enter a valid address.".to_string());
        }

        if self.state.trim().is_empty() {
            return Err("State is required.".to_string());
        }

        if self.city.trim().is_empty() {
            return Err("City is required.".to_string());
        }

        if self.state_code.trim().is_empty() {
            return Err(
                "State code could not be determined. Select a valid state."
                    .to_string(),
            );
        }

        validate_pin_code(
            self.pin_code.trim(),
            "PIN code",
            &pin_code_regex,
        )?;

        // ---------------------------------------------------------
        // Tax Information
        // ---------------------------------------------------------

        if let Some(gst_number) = self.gst_number.as_deref() {
            let gst_number = gst_number.trim().to_uppercase();

            if !gst_number.is_empty() {
                if gst_number.chars().count() != 15 {
                    return Err(
                        "GSTIN must contain 15 characters.".to_string(),
                    );
                }

                if !gstin_regex.is_match(&gst_number) {
                    return Err("Enter a valid GSTIN.".to_string());
                }
            }
        }

        if let Some(pan) = self.pan.as_deref() {
            let pan = pan.trim().to_uppercase();

            if !pan.is_empty() && !pan_regex.is_match(&pan) {
                return Err("Enter a valid PAN.".to_string());
            }
        }

        // ---------------------------------------------------------
        // Billing Information
        // ---------------------------------------------------------

        if self.billing_name.trim().is_empty() {
            return Err("Billing name is required.".to_string());
        }

        if self.billing_address.trim().is_empty() {
            return Err("Billing address is required.".to_string());
        }

        if self.billing_state.trim().is_empty() {
            return Err("Billing state is required.".to_string());
        }

        if self.billing_city.trim().is_empty() {
            return Err("Billing city is required.".to_string());
        }

        if self.billing_state_code.trim().is_empty() {
            return Err("Billing state code is required.".to_string());
        }

        validate_pin_code(
            self.billing_pin_code.trim(),
            "Billing PIN code",
            &pin_code_regex,
        )?;

        // ---------------------------------------------------------
        // Financial Information
        // ---------------------------------------------------------

        if self.opening_balance_paise < 0 {
            return Err("Opening balance cannot be negative.".to_string());
        }

        if self.opening_balance_paise > 0
            && !["debit", "credit"]
                .contains(&self.opening_balance_type.as_str())
        {
            return Err("Select Debit or Credit.".to_string());
        }

        if let Some(credit_limit) = self.credit_limit_paise {
            if credit_limit < 0 {
                return Err("Credit limit cannot be negative.".to_string());
            }
        }

        if self.payment_terms.trim().is_empty() {
            return Err("Payment terms are required.".to_string());
        }

        if ![
            "immediate",
            "15_days",
            "30_days",
            "45_days",
            "60_days",
        ]
        .contains(&self.payment_terms.as_str())
        {
            return Err("Select valid payment terms.".to_string());
        }

        if self.billing_cycle.trim().is_empty() {
            return Err("Billing cycle is required.".to_string());
        }

        if !["per_trip", "daily", "weekly", "monthly"]
            .contains(&self.billing_cycle.as_str())
        {
            return Err("Select a valid billing cycle.".to_string());
        }

        // ---------------------------------------------------------
        // Additional Information
        // ---------------------------------------------------------

        // Date validation for DOB and marriage date will be added
        // once the application standardizes date handling.

        Ok(())
    }
}

fn normalize_optional(value: &Option<String>) -> Option<String> {
    value.as_ref().and_then(|value| {
        let value = value.trim();

        if value.is_empty() {
            None
        } else {
            Some(value.to_string())
        }
    })
}

fn validate_pin_code(
    pin_code: &str,
    field_name: &str,
    regex: &Regex,
) -> Result<(), String> {
    if pin_code.is_empty() {
        return Err(format!("{field_name} is required."));
    }

    if !regex.is_match(pin_code) {
        return Err(format!(
            "{field_name} must contain exactly 6 digits."
        ));
    }

    Ok(())
}