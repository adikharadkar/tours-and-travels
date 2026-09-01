use rusqlite::{params, Connection};

use crate::models::customer::{CreateCustomer, Customer};
use crate::error::AppError;

pub fn create_customer(
    connection: &mut Connection,
    input: &CreateCustomer,
) -> Result<Customer, AppError> {
    let transaction = connection
        .transaction()
        .map_err(|error| AppError::Database(error.to_string()))?;

    // ---------------------------------------------------------
    // Duplicate check: GSTIN
    // ---------------------------------------------------------

    if let Some(gst_number) = input.gst_number.as_deref() {
        let exists: bool = transaction
            .query_row(
                "SELECT EXISTS(
                    SELECT 1
                    FROM customers
                    WHERE gst_number = ?1
                )",
                [gst_number],
                |row| row.get(0),
            )
            .map_err(|error| AppError::Database(error.to_string()))?;

        if exists {
            return Err(AppError::DuplicateGstNumber);
        }
    }

    // ---------------------------------------------------------
    // Duplicate check: PAN
    // ---------------------------------------------------------

    if let Some(pan) = input.pan.as_deref() {
        let exists: bool = transaction
            .query_row(
                "SELECT EXISTS(
                    SELECT 1
                    FROM customers
                    WHERE pan = ?1
                )",
                [pan],
                |row| row.get(0),
            )
            .map_err(|error| AppError::Database(error.to_string()))?;

        if exists {
            return Err(AppError::DuplicatePan);
        }
    }

    // ---------------------------------------------------------
    // Duplicate check: Name + Primary Mobile
    // ---------------------------------------------------------

    let exists: bool = transaction
        .query_row(
            "SELECT EXISTS(
                SELECT 1
                FROM customers
                WHERE LOWER(name) = LOWER(?1)
                  AND mobile1 = ?2
            )",
            params![input.name, input.mobile1],
            |row| row.get(0),
        )
        .map_err(|error| AppError::Database(error.to_string()))?;

    if exists {
        return Err(AppError::DuplicateCustomer);
    }

    // ---------------------------------------------------------
    // Generate customer code
    // ---------------------------------------------------------

    let customer_code = generate_customer_code(&transaction)?;

    // ---------------------------------------------------------
    // Insert customer
    // ---------------------------------------------------------

    transaction
        .execute(
            r#"
            INSERT INTO customers (
                customer_code,
                registration_date,
                prefix,
                name,
                customer_type,
                contact_person,
                mobile1,
                mobile2,
                email,
                alternate_email,
                address,
                city,
                state,
                state_code,
                pin_code,
                gst_number,
                pan,
                vendor_code,
                billing_name,
                billing_same_as_address,
                billing_address,
                billing_city,
                billing_state,
                billing_state_code,
                billing_pin_code,
                opening_balance_paise,
                opening_balance_type,
                credit_limit_paise,
                payment_terms,
                billing_cycle,
                date_of_birth,
                marriage_date,
                notes
            )
            VALUES (
                ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10,
                ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20,
                ?21, ?22, ?23, ?24, ?25, ?26, ?27, ?28, ?29, ?30,
                ?31, ?32, ?33
            )
            "#,
            params![
                customer_code,
                input.registration_date,
                input.prefix,
                input.name,
                input.customer_type,
                input.contact_person,
                input.mobile1,
                input.mobile2,
                input.email,
                input.alternate_email,
                input.address,
                input.city,
                input.state,
                input.state_code,
                input.pin_code,
                input.gst_number,
                input.pan,
                input.vendor_code,
                input.billing_name,
                input.billing_same_as_address,
                input.billing_address,
                input.billing_city,
                input.billing_state,
                input.billing_state_code,
                input.billing_pin_code,
                input.opening_balance_paise,
                input.opening_balance_type,
                input.credit_limit_paise,
                input.payment_terms,
                input.billing_cycle,
                input.date_of_birth,
                input.marriage_date,
                input.notes,
            ],
        )
        .map_err(|error| AppError::Database(error.to_string()))?;

    let customer_id = transaction.last_insert_rowid();

    // ---------------------------------------------------------
    // Read the newly created customer
    // ---------------------------------------------------------

    let customer = transaction
        .query_row(
            r#"
            SELECT
                id,
                customer_code,
                registration_date,
                prefix,
                name,
                customer_type,
                contact_person,
                mobile1,
                mobile2,
                email,
                alternate_email,
                address,
                city,
                state,
                state_code,
                pin_code,
                gst_number,
                pan,
                vendor_code,
                billing_name,
                billing_same_as_address,
                billing_address,
                billing_city,
                billing_state,
                billing_state_code,
                billing_pin_code,
                opening_balance_paise,
                opening_balance_type,
                credit_limit_paise,
                payment_terms,
                billing_cycle,
                date_of_birth,
                marriage_date,
                notes,
                is_active,
                created_at,
                updated_at
            FROM customers
            WHERE id = ?1
            "#,
            [customer_id],
            map_customer,
        )
        .map_err(|error| AppError::Database(error.to_string()))?;

    // ---------------------------------------------------------
    // Increment customer code sequence
    // ---------------------------------------------------------

    transaction
        .execute(
            "UPDATE customer_code_sequence
             SET next_number = next_number + 1
             WHERE id = 1",
            [],
        )
        .map_err(|error| AppError::Database(error.to_string()))?;

    // ---------------------------------------------------------
    // Commit transaction
    // ---------------------------------------------------------

    transaction
        .commit()
        .map_err(|error| AppError::Database(error.to_string()))?;

    Ok(customer)
}

// -------------------------------------------------------------
// Customer code generation
// -------------------------------------------------------------

fn generate_customer_code(
    connection: &Connection,
) -> Result<String, AppError> {
    let next_number: i64 = connection
        .query_row(
            "SELECT next_number
             FROM customer_code_sequence
             WHERE id = 1",
            [],
            |row| row.get(0),
        )
        .map_err(|error| AppError::Database(error.to_string()))?;

    Ok(format!("CUS-{next_number:05}"))
}

// -------------------------------------------------------------
// Customer row mapper
// -------------------------------------------------------------

fn map_customer(row: &rusqlite::Row<'_>) -> rusqlite::Result<Customer> {
    Ok(Customer {
        id: row.get("id")?,
        customer_code: row.get("customer_code")?,
        registration_date: row.get("registration_date")?,
        prefix: row.get("prefix")?,
        name: row.get("name")?,
        customer_type: row.get("customer_type")?,
        contact_person: row.get("contact_person")?,
        mobile1: row.get("mobile1")?,
        mobile2: row.get("mobile2")?,
        email: row.get("email")?,
        alternate_email: row.get("alternate_email")?,
        address: row.get("address")?,
        city: row.get("city")?,
        state: row.get("state")?,
        state_code: row.get("state_code")?,
        pin_code: row.get("pin_code")?,
        gst_number: row.get("gst_number")?,
        pan: row.get("pan")?,
        vendor_code: row.get("vendor_code")?,
        billing_name: row.get("billing_name")?,
        billing_same_as_address: row.get("billing_same_as_address")?,
        billing_address: row.get("billing_address")?,
        billing_city: row.get("billing_city")?,
        billing_state: row.get("billing_state")?,
        billing_state_code: row.get("billing_state_code")?,
        billing_pin_code: row.get("billing_pin_code")?,
        opening_balance_paise: row.get("opening_balance_paise")?,
        opening_balance_type: row.get("opening_balance_type")?,
        credit_limit_paise: row.get("credit_limit_paise")?,
        payment_terms: row.get("payment_terms")?,
        billing_cycle: row.get("billing_cycle")?,
        date_of_birth: row.get("date_of_birth")?,
        marriage_date: row.get("marriage_date")?,
        notes: row.get("notes")?,
        is_active: row.get("is_active")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}