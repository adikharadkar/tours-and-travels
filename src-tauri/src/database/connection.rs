use rusqlite::Connection;
use std::path::Path;

pub fn open_database(path: &Path) -> Result<Connection, rusqlite::Error> {
    let connection = Connection::open(path)?;

    connection.execute_batch(
        r#"
        PRAGMA foreign_keys = ON;
        PRAGMA journal_mode = WAL;
        PRAGMA busy_timeout = 5000;
        "#,
    )?;

    Ok(connection)
}