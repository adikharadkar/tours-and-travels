use serde::Serialize;

#[derive(Debug, Serialize)]
pub enum AppError {
    Validation(String),
    DuplicateGstNumber,
    DuplicatePan,
    DuplicateCustomer,
    Database(String),
}

impl From<rusqlite::Error> for AppError {
    fn from(error: rusqlite::Error) -> Self {
        Self::Database(error.to_string())
    }
}