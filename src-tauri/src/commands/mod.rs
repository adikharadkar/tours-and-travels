use tauri::State;

use crate::database::Database;
use crate::error::AppError;
use crate::models::customer::{CreateCustomer, Customer};
use crate::repositories::customer_repository;

#[tauri::command]
pub fn create_customer(
    database: State<'_, Database>,
    mut input: CreateCustomer,
) -> Result<Customer, AppError> {
    input.normalize();

    input
        .validate()
        .map_err(AppError::Validation)?;

    let mut connection = database
        .connection()
        .lock()
        .map_err(|_| {
            AppError::Database(
                "Database lock was poisoned".to_string(),
            )
        })?;

    customer_repository::create_customer(
        &mut connection,
        &input,
    )
}