use rusqlite::Connection;

const MIGRATIONS: &[(i64, &str, &str)] = &[
    (
        1,
        "initial_schema",
        include_str!("../../migrations/001_initial_schema.sql"),
    ),
    (
        2,
        "create_customers",
        include_str!("../../migrations/002_create_customers.sql"),
    ),
    (
        3,
        "create_customer_code_sequence",
        include_str!("../../migrations/003_create_customer_code_sequence.sql"),
    ),

];

pub fn run_migrations(connection: &mut Connection) -> Result<(), rusqlite::Error> {
    connection.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        "#,
    )?;

    let current_version: i64 = connection.query_row(
        "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
        [],
        |row| row.get(0),
    )?;

    for &(version, name, sql) in MIGRATIONS {
        if version <= current_version {
            continue;
        }

        let transaction = connection.transaction()?;

        transaction.execute_batch(sql)?;

        transaction.execute(
            "INSERT INTO schema_migrations (version, name) VALUES (?1, ?2)",
            (version, name),
        )?;

        transaction.commit()?;
    }

    Ok(())
}