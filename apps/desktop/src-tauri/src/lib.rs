pub mod commands;
pub mod models;
pub mod moodle;
pub mod scraper;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Inicialização do cofre criptográfico com derivação Argon2 do Tauri Stronghold
            let app_data_dir = app
                .path()
                .app_local_data_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("."));

            let _ = std::fs::create_dir_all(&app_data_dir);
            let salt_path = app_data_dir.join("vault.salt");

            app.handle().plugin(
                tauri_plugin_stronghold::Builder::with_argon2(&salt_path).build(),
            )?;

            app.handle().plugin(
                tauri_plugin_sql::Builder::default().build(),
            )?;

            log::info!("Plugins Tauri Stronghold e SQL (SQLite) inicializados com sucesso.");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::sync_platforms,
            commands::check_vault_status,
        ])
        .run(tauri::generate_context!())
        .expect("erro durante a execução do aplicativo UnB Aggregator");
}
