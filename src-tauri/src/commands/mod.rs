use tauri::State;
use rusqlite::params;
use std::sync::Arc;

use crate::audio::dsp::DspConfig;
use crate::audio::engine::{AudioEngine, DeviceInfo, PlaybackStatus};
use crate::db::Database;
use crate::library::scanner::{DbTrack, LibraryScanner, ScanResult};
use crate::metadata::lyrics::{LyricsResult, LyricsService};
use crate::providers::jamendo::{JamendoProvider, JamendoTrackItem};
use crate::providers::jiosaavn::{JioSaavnProvider, JioSaavnTrackItem};
use crate::providers::subsonic::{SubsonicConfig, SubsonicProvider, SubsonicTrackItem};
use crate::providers::youtube::{YouTubeProvider, YouTubeTrackItem};

pub struct AppState {
    pub db: Database,
    pub audio_engine: AudioEngine,
}

// Audio Commands
#[tauri::command]
pub fn play_track(state: State<Arc<AppState>>, path: String) -> Result<(), String> {
    state.audio_engine.play(path);
    Ok(())
}

#[tauri::command]
pub fn pause_playback(state: State<Arc<AppState>>) -> Result<(), String> {
    state.audio_engine.pause();
    Ok(())
}

#[tauri::command]
pub fn resume_playback(state: State<Arc<AppState>>) -> Result<(), String> {
    state.audio_engine.resume();
    Ok(())
}

#[tauri::command]
pub fn seek_playback(state: State<Arc<AppState>>, time_ms: u64) -> Result<(), String> {
    state.audio_engine.seek(time_ms);
    Ok(())
}

#[tauri::command]
pub fn stop_playback(state: State<Arc<AppState>>) -> Result<(), String> {
    state.audio_engine.stop();
    Ok(())
}

#[tauri::command]
pub fn set_volume(state: State<Arc<AppState>>, volume: f32) -> Result<(), String> {
    state.audio_engine.set_volume(volume);
    Ok(())
}

#[tauri::command]
pub fn set_output_mode(state: State<Arc<AppState>>, mode: String) -> Result<(), String> {
    state.audio_engine.set_output_mode(mode);
    Ok(())
}

#[tauri::command]
pub fn set_audio_device(state: State<Arc<AppState>>, device_id: String) -> Result<(), String> {
    state.audio_engine.set_device(device_id);
    Ok(())
}

#[tauri::command]
pub fn set_dsp_settings(state: State<Arc<AppState>>, config: DspConfig) -> Result<(), String> {
    state.audio_engine.set_dsp(config);
    Ok(())
}

#[tauri::command]
pub fn get_playback_status(state: State<Arc<AppState>>) -> Result<PlaybackStatus, String> {
    Ok(state.audio_engine.get_status())
}

#[tauri::command]
pub fn get_audio_devices() -> Result<Vec<DeviceInfo>, String> {
    Ok(AudioEngine::list_devices())
}

// Library Commands
#[tauri::command]
pub async fn scan_library_folder(
    _state: State<'_, Arc<AppState>>,
    folder_path: String,
) -> Result<ScanResult, String> {
    tokio::task::spawn_blocking({
        let path = folder_path.clone();
        let db_conn = Database::new().map_err(|e| e.to_string())?;
        move || LibraryScanner::scan_directory(path, &db_conn)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
pub fn get_library_tracks(state: State<Arc<AppState>>) -> Result<Vec<DbTrack>, String> {
    let conn = state.db.conn.lock().unwrap();
    let mut stmt = conn
        .prepare(
            r#"
            SELECT id, title, artist, album, duration_ms, path, source_kind, provider_id,
                   provider_track_id, codec, sample_rate, bit_depth, channels, bitrate,
                   file_size, year, genre, track_number, disc_number, artwork_url,
                   license_url, attribution, download_allowed, is_favourite, date_added
            FROM tracks
            ORDER BY artist ASC, album ASC, track_number ASC, title ASC
            "#,
        )
        .map_err(|e| e.to_string())?;

    let track_iter = stmt
        .query_map([], |row| {
            Ok(DbTrack {
                id: row.get(0)?,
                title: row.get(1)?,
                artist: row.get(2)?,
                album: row.get(3)?,
                duration_ms: row.get::<_, i64>(4)? as u64,
                path: row.get(5)?,
                source_kind: row.get(6)?,
                provider_id: row.get(7)?,
                provider_track_id: row.get(8)?,
                codec: row.get(9)?,
                sample_rate: row.get(10)?,
                bit_depth: row.get(11)?,
                channels: row.get(12)?,
                bitrate: row.get(13)?,
                file_size: row.get::<_, Option<i64>>(14)?.map(|s| s as u64),
                year: row.get(15)?,
                genre: row.get(16)?,
                track_number: row.get(17)?,
                disc_number: row.get(18)?,
                artwork_url: row.get(19)?,
                license_url: row.get(20)?,
                attribution: row.get(21)?,
                download_allowed: row.get::<_, i64>(22)? != 0,
                is_favourite: row.get::<_, i64>(23)? != 0,
                date_added: row.get(24)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut tracks = Vec::new();
    for t in track_iter {
        if let Ok(track) = t {
            tracks.push(track);
        }
    }
    Ok(tracks)
}

#[tauri::command]
pub fn get_library_folders(state: State<Arc<AppState>>) -> Result<Vec<String>, String> {
    let conn = state.db.conn.lock().unwrap();
    let mut stmt = conn
        .prepare("SELECT path FROM folders ORDER BY added_at ASC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?;

    let mut folders = Vec::new();
    for r in rows {
        if let Ok(f) = r {
            folders.push(f);
        }
    }
    Ok(folders)
}

#[tauri::command]
pub fn remove_library_folder(state: State<Arc<AppState>>, folder_path: String) -> Result<(), String> {
    let conn = state.db.conn.lock().unwrap();
    conn.execute("DELETE FROM folders WHERE path = ?1", params![folder_path])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn toggle_favourite(
    state: State<Arc<AppState>>,
    track_id: String,
    is_favourite: bool,
) -> Result<(), String> {
    let conn = state.db.conn.lock().unwrap();
    conn.execute(
        "UPDATE tracks SET is_favourite = ?1 WHERE id = ?2",
        params![if is_favourite { 1 } else { 0 }, track_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn record_play_history(
    state: State<Arc<AppState>>,
    track_id: String,
    title: String,
    artist: String,
    album: Option<String>,
    artwork_url: Option<String>,
    listened_ms: u64,
    completion_ratio: f64,
) -> Result<(), String> {
    let conn = state.db.conn.lock().unwrap();
    let id = format!("hist-{}", uuid::Uuid::new_v4());
    let now = chrono::Utc::now().to_rfc3339();

    conn.execute(
        r#"
        INSERT INTO play_history (id, track_id, title, artist, album, artwork_url, played_at, listened_ms, completion_ratio)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
        "#,
        params![id, track_id, title, artist, album, artwork_url, now, listened_ms as i64, completion_ratio],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

// Metadata & Providers
#[tauri::command]
pub async fn fetch_lyrics(
    track_path: Option<String>,
    title: String,
    artist: String,
    album: Option<String>,
    duration_s: Option<u64>,
) -> Result<LyricsResult, String> {
    Ok(LyricsService::resolve_lyrics(
        track_path.as_deref(),
        &title,
        &artist,
        album.as_deref(),
        duration_s,
    ).await)
}

#[tauri::command]
pub async fn search_jamendo(
    query: String,
    limit: Option<usize>,
) -> Result<Vec<JamendoTrackItem>, String> {
    JamendoProvider::search_tracks(&query, None, limit.unwrap_or(20)).await
}

#[tauri::command]
pub async fn search_jiosaavn(
    query: String,
    limit: Option<usize>,
) -> Result<Vec<JioSaavnTrackItem>, String> {
    println!("[Sonora Backend] search_jiosaavn received query: '{}', limit: {:?}", query, limit);
    let results = JioSaavnProvider::search_tracks(&query, limit.unwrap_or(20)).await;
    match &results {
        Ok(items) => println!("[Sonora Backend] search_jiosaavn returning {} items", items.len()),
        Err(e) => println!("[Sonora Backend] search_jiosaavn error: {}", e),
    }
    results
}

#[tauri::command]
pub async fn search_youtube(
    query: String,
    limit: Option<usize>,
) -> Result<Vec<YouTubeTrackItem>, String> {
    println!("[Sonora Backend] search_youtube received query: '{}', limit: {:?}", query, limit);
    let results = YouTubeProvider::search_tracks(&query, limit.unwrap_or(20)).await;
    match &results {
        Ok(items) => println!("[Sonora Backend] search_youtube returning {} items", items.len()),
        Err(e) => println!("[Sonora Backend] search_youtube error: {}", e),
    }
    results
}

#[tauri::command]
pub async fn test_subsonic_connection(
    server_url: String,
    username: String,
    token: String,
    salt: String,
) -> Result<String, String> {
    let cfg = SubsonicConfig {
        server_url,
        username,
        token,
        salt,
    };
    SubsonicProvider::test_connection(&cfg).await
}

#[tauri::command]
pub async fn search_subsonic(
    server_url: String,
    username: String,
    token: String,
    salt: String,
    query: String,
) -> Result<Vec<SubsonicTrackItem>, String> {
    let cfg = SubsonicConfig {
        server_url,
        username,
        token,
        salt,
    };
    SubsonicProvider::search(&cfg, &query).await
}

#[tauri::command]
pub fn open_external(url: String) -> Result<(), String> {
    open::that(url).map_err(|e| e.to_string())
}
