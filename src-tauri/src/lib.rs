pub mod audio;
pub mod commands;
pub mod db;
pub mod library;
pub mod metadata;
pub mod providers;

use std::sync::Arc;
use commands::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db = db::Database::new().expect("Failed to initialize Sonora SQLite database");
    let audio_engine = audio::engine::AudioEngine::new().expect("Failed to initialize Sonora Audio Engine");

    let app_state = Arc::new(AppState {
        db,
        audio_engine,
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_log::Builder::default().build())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            // Audio commands
            commands::play_track,
            commands::pause_playback,
            commands::resume_playback,
            commands::seek_playback,
            commands::stop_playback,
            commands::set_volume,
            commands::set_output_mode,
            commands::set_audio_device,
            commands::set_dsp_settings,
            commands::get_playback_status,
            commands::get_audio_devices,

            // Library commands
            commands::scan_library_folder,
            commands::get_library_tracks,
            commands::get_library_folders,
            commands::remove_library_folder,
            commands::toggle_favourite,
            commands::record_play_history,

            // Metadata & Providers
            commands::fetch_lyrics,
            commands::search_jamendo,
            commands::test_subsonic_connection,
            commands::search_subsonic,
            commands::open_external,
        ])
        .run(tauri::generate_context!())
        .expect("error while running sonora application");
}
