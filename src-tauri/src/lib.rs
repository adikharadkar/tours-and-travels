mod commands;
mod database;
mod error;
mod models;
mod repositories;

use database::Database;
use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()?;

            std::fs::create_dir_all(&app_data_dir)?;

            let database_path = app_data_dir.join("fleetcore.db");

            let database = Database::new(database_path)
                .map_err(|error| {
                    eprintln!("Database initialization failed: {error}");

                    std::io::Error::other(
                        "Failed to initialize application database",
                    )
                })?;

            app.manage(database);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::customer::create_customer,
            commands::customer::get_customer,
            commands::customer::list_customers
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}