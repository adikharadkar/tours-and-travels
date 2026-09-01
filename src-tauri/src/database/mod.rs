pub mod connection;
pub mod migrations;

use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::Mutex;

pub struct Database {
    connection: Mutex<Connection>,
}

impl Database {
    pub fn new(path: PathBuf) -> Result<Self, rusqlite::Error> {
        let mut connection = connection::open_database(&path)?;

        migrations::run_migrations(&mut connection)?;

        Ok(Self {
            connection: Mutex::new(connection),
        })
    }

    pub fn connection(&self) -> &Mutex<Connection> {
        &self.connection
    }
}