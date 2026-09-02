use super::customer_repository::{
    create_customer,
    get_customer,
    list_customers,
};
use crate::database::migrations::run_migrations;
use crate::error::AppError;
use crate::models::customer::CreateCustomer;
use rusqlite::Connection;

fn test_connection() -> Connection {
    let mut connection =
        Connection::open_in_memory().expect("Failed to open test database");

    run_migrations(&mut connection)
        .expect("Failed to run database migrations");

    connection
}

fn valid_customer() -> CreateCustomer {
    CreateCustomer {
        registration_date: "2026-09-01".to_string(),

        prefix: None,

        name: "Test Customer".to_string(),

        customer_type: "company".to_string(),

        contact_person: Some("Test Contact".to_string()),

        mobile1: "9876543210".to_string(),

        mobile2: None,

        email: "test@example.com".to_string(),

        alternate_email: None,

        address: "123 Test Street".to_string(),

        city: "Pune".to_string(),

        state: "Maharashtra".to_string(),

        state_code: "27".to_string(),

        pin_code: "411001".to_string(),

        gst_number: None,

        pan: None,

        vendor_code: None,

        billing_name: "Test Customer".to_string(),

        billing_same_as_address: true,

        billing_address: "123 Test Street".to_string(),

        billing_city: "Pune".to_string(),

        billing_state: "Maharashtra".to_string(),

        billing_state_code: "27".to_string(),

        billing_pin_code: "411001".to_string(),

        opening_balance_paise: 0,

        opening_balance_type: "debit".to_string(),

        credit_limit_paise: None,

        payment_terms: "30_days".to_string(),

        billing_cycle: "monthly".to_string(),

        date_of_birth: None,

        marriage_date: None,

        notes: None,
    }
}

#[test]
fn creates_customer_with_generated_code() {
    let mut connection = test_connection();

    let mut input = valid_customer();

    input.normalize();

    input
        .validate()
        .expect("Customer validation should succeed");

    let customer = create_customer(&mut connection, &input)
        .expect("Customer creation should succeed");

    assert_eq!(customer.id, 1);
    assert_eq!(customer.customer_code, "CUS-00001");
    assert_eq!(customer.name, "Test Customer");
    assert_eq!(customer.customer_type, "company");
    assert_eq!(customer.mobile1, "9876543210");
    assert!(customer.is_active);
}

#[test]
fn gets_customer_by_id() {
    let mut connection = test_connection();

    let mut input = valid_customer();
    input.normalize();
    input
        .validate()
        .expect("Customer validation should succeed");

    let created = create_customer(&mut connection, &input)
        .expect("Customer should be created");

    let customer = get_customer(&connection, created.id)
        .expect("Query should succeed")
        .expect("Customer should exist");

    assert_eq!(customer.id, created.id);
    assert_eq!(customer.customer_code, "CUS-00001");
    assert_eq!(customer.name, input.name);
    assert_eq!(customer.mobile1, input.mobile1);
    assert_eq!(customer.email, input.email);
}

#[test]
fn returns_none_for_unknown_customer_id() {
    let connection = test_connection();

    let customer = get_customer(&connection, 999999)
        .expect("Query should succeed");

    assert!(customer.is_none());
}

#[test]
fn lists_customers() {
    let mut connection = test_connection();

    let mut first_input = valid_customer();
    first_input.normalize();
    first_input
        .validate()
        .expect("First customer validation should succeed");

    let first = create_customer(&mut connection, &first_input)
        .expect("First customer should be created");

    let mut second_input = valid_customer();
    second_input.name = "Second Customer".to_string();
    second_input.mobile1 = "9876543211".to_string();
    second_input.email = "second@example.com".to_string();

    second_input.normalize();
    second_input
        .validate()
        .expect("Second customer validation should succeed");

    let second = create_customer(&mut connection, &second_input)
        .expect("Second customer should be created");

    let customers = list_customers(&connection)
        .expect("Query should succeed");

    assert_eq!(customers.len(), 2);

    // list_customers() orders by id DESC.
    assert_eq!(customers[0].id, second.id);
    assert_eq!(customers[1].id, first.id);
}

#[test]
fn generates_sequential_customer_codes() {
    let mut connection = test_connection();

    let mut first = valid_customer();
    first.normalize();
    first.validate().unwrap();

    let first_customer =
        create_customer(&mut connection, &first).unwrap();

    let mut second = valid_customer();
    second.name = "Second Customer".to_string();
    second.mobile1 = "9123456789".to_string();
    second.email = "second@example.com".to_string();

    second.normalize();
    second.validate().unwrap();

    let second_customer =
        create_customer(&mut connection, &second).unwrap();

    assert_eq!(first_customer.customer_code, "CUS-00001");
    assert_eq!(second_customer.customer_code, "CUS-00002");
}

#[test]
fn rejects_duplicate_gst_number() {
    let mut connection = test_connection();

    let mut first = valid_customer();
    first.gst_number =
        Some("27ABCDE1234F1Z5".to_string());

    first.normalize();
    first.validate().unwrap();

    create_customer(&mut connection, &first).unwrap();

    let mut second = valid_customer();
    second.name = "Another Customer".to_string();
    second.mobile1 = "9123456789".to_string();
    second.email = "another@example.com".to_string();
    second.gst_number =
        Some("27ABCDE1234F1Z5".to_string());

    second.normalize();
    second.validate().unwrap();

    let result =
        create_customer(&mut connection, &second);

    assert!(matches!(
        result,
        Err(AppError::DuplicateGstNumber)
    ));
}

#[test]
fn rejects_duplicate_pan() {
    let mut connection = test_connection();

    let mut first = valid_customer();
    first.pan = Some("ABCDE1234F".to_string());

    first.normalize();
    first.validate().unwrap();

    create_customer(&mut connection, &first).unwrap();

    let mut second = valid_customer();
    second.name = "Another Customer".to_string();
    second.mobile1 = "9123456789".to_string();
    second.email = "another@example.com".to_string();
    second.pan = Some("ABCDE1234F".to_string());

    second.normalize();
    second.validate().unwrap();

    let result =
        create_customer(&mut connection, &second);

    assert!(matches!(
        result,
        Err(AppError::DuplicatePan)
    ));
}

#[test]
fn rejects_duplicate_customer_name_and_mobile() {
    let mut connection = test_connection();

    let mut first = valid_customer();

    first.normalize();
    first.validate().unwrap();

    create_customer(&mut connection, &first).unwrap();

    let mut second = valid_customer();
    second.email = "another@example.com".to_string();

    second.normalize();
    second.validate().unwrap();

    let result =
        create_customer(&mut connection, &second);

    assert!(matches!(
        result,
        Err(AppError::DuplicateCustomer)
    ));
}

#[test]
fn failed_customer_creation_does_not_advance_code_sequence() {
    let mut connection = test_connection();

    // Create the first customer.
    let mut first = valid_customer();
    first.normalize();
    first.validate().unwrap();

    let first_customer =
        create_customer(&mut connection, &first).unwrap();

    assert_eq!(first_customer.customer_code, "CUS-00001");

    // Attempt to create a duplicate customer.
    let mut duplicate = valid_customer();
    duplicate.normalize();
    duplicate.validate().unwrap();

    let result =
        create_customer(&mut connection, &duplicate);

    assert!(matches!(
        result,
        Err(AppError::DuplicateCustomer)
    ));

    // Create another valid customer.
    let mut second = valid_customer();

    second.name = "Second Customer".to_string();
    second.mobile1 = "9123456789".to_string();
    second.email = "second@example.com".to_string();

    second.normalize();
    second.validate().unwrap();

    let second_customer =
        create_customer(&mut connection, &second).unwrap();

    // The failed attempt must not consume CUS-00002.
    assert_eq!(second_customer.customer_code, "CUS-00002");
}