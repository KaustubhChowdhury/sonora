use lofty::file::{AudioFile, TaggedFileExt};
use lofty::probe::Probe;
use lofty::tag::Accessor;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

use crate::db::Database;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanResult {
    pub total_scanned: usize,
    pub candidates_found: usize,
    pub errors: Vec<String>,
    pub elapsed_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DbTrack {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub duration_ms: u64,
    pub path: String,
    pub source_kind: String,
    pub provider_id: String,
    pub provider_track_id: Option<String>,
    pub codec: Option<String>,
    pub sample_rate: Option<u32>,
    pub bit_depth: Option<u32>,
    pub channels: Option<u32>,
    pub bitrate: Option<u32>,
    pub file_size: Option<u64>,
    pub year: Option<u32>,
    pub genre: Option<String>,
    pub track_number: Option<u32>,
    pub disc_number: Option<u32>,
    pub artwork_url: Option<String>,
    pub license_url: Option<String>,
    pub attribution: Option<String>,
    pub download_allowed: bool,
    pub is_favourite: bool,
    pub date_added: String,
}

pub struct LibraryScanner;

impl LibraryScanner {
    pub fn scan_directory<P: AsRef<Path>>(
        folder_path: P,
        db: &Database,
    ) -> Result<ScanResult, String> {
        let start_time = std::time::Instant::now();
        let path = folder_path.as_ref();
        if !path.exists() {
            return Err(format!("Folder does not exist: {}", path.display()));
        }

        let art_cache_dir = dirs::cache_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("Sonora")
            .join("artworks");
        fs::create_dir_all(&art_cache_dir).ok();

        let mut total_scanned = 0;
        let mut candidates_found = 0;
        let mut errors = Vec::new();

        let supported_extensions = ["flac", "wav", "mp3", "m4a", "aac", "ogg", "opus", "alac", "aiff"];

        let mut discovered_tracks = Vec::new();

        for entry in WalkDir::new(path).into_iter().filter_map(|e| e.ok()) {
            if entry.file_type().is_file() {
                let file_path = entry.path();
                if let Some(ext) = file_path.extension().and_then(|s| s.to_str()) {
                    let ext_lower = ext.to_lowercase();
                    if supported_extensions.contains(&ext_lower.as_str()) {
                        candidates_found += 1;
                        match Self::probe_file(file_path, &art_cache_dir) {
                            Ok(track) => {
                                discovered_tracks.push(track);
                                total_scanned += 1;
                            }
                            Err(e) => {
                                errors.push(format!("{}: {}", file_path.display(), e));
                            }
                        }
                    }
                }
            }
        }

        // Batch insert or replace into SQLite database
        {
            let mut conn = db.conn.lock().unwrap();
            let tx = conn
                .transaction()
                .map_err(|e| format!("Database transaction error: {}", e))?;

            for t in &discovered_tracks {
                let _ = tx.execute(
                    r#"
                    INSERT INTO tracks (
                        id, title, artist, album, duration_ms, path, source_kind, provider_id,
                        codec, sample_rate, bit_depth, channels, bitrate, file_size,
                        year, genre, track_number, disc_number, artwork_url, download_allowed, is_favourite, date_added
                    ) VALUES (
                        ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8,
                        ?9, ?10, ?11, ?12, ?13, ?14,
                        ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22
                    )
                    ON CONFLICT(id) DO UPDATE SET
                        title = excluded.title,
                        artist = excluded.artist,
                        album = excluded.album,
                        duration_ms = excluded.duration_ms,
                        artwork_url = coalesce(excluded.artwork_url, tracks.artwork_url);
                    "#,
                    params![
                        t.id,
                        t.title,
                        t.artist,
                        t.album,
                        t.duration_ms as i64,
                        t.path,
                        t.source_kind,
                        t.provider_id,
                        t.codec,
                        t.sample_rate,
                        t.bit_depth,
                        t.channels,
                        t.bitrate,
                        t.file_size.map(|s| s as i64),
                        t.year,
                        t.genre,
                        t.track_number,
                        t.disc_number,
                        t.artwork_url,
                        if t.download_allowed { 1 } else { 0 },
                        if t.is_favourite { 1 } else { 0 },
                        t.date_added
                    ],
                );
            }

            // Save folder entry
            let now = chrono::Utc::now().to_rfc3339();
            let folder_id = format!("folder-{}", uuid::Uuid::new_v4());
            let _ = tx.execute(
                "INSERT INTO folders (id, path, added_at, last_scan_at) VALUES (?1, ?2, ?3, ?4)
                 ON CONFLICT(path) DO UPDATE SET last_scan_at = ?4;",
                params![folder_id, path.to_string_lossy().to_string(), now, now],
            );

            tx.commit()
                .map_err(|e| format!("Failed to commit tracks: {}", e))?;
        }

        let elapsed_ms = start_time.elapsed().as_millis() as u64;

        Ok(ScanResult {
            total_scanned,
            candidates_found,
            errors,
            elapsed_ms,
        })
    }

    fn probe_file(file_path: &Path, art_cache_dir: &Path) -> Result<DbTrack, String> {
        let meta = fs::metadata(file_path).map_err(|e| e.to_string())?;
        let file_size = meta.len();
        let path_str = file_path.to_string_lossy().to_string();

        let tagged_file = Probe::open(file_path)
            .map_err(|e| e.to_string())?
            .read()
            .map_err(|e| e.to_string())?;

        let properties = tagged_file.properties();
        let duration_ms = properties.duration().as_millis() as u64;
        let sample_rate = properties.sample_rate();
        let bit_depth = properties.bit_depth().map(|bd| bd as u32);
        let channels = properties.channels().map(|c| c as u32);
        let bitrate = properties.audio_bitrate();

        let ext = file_path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("audio")
            .to_uppercase();

        let file_stem = file_path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("Unknown Track");

        let mut title = file_stem.to_string();
        let mut artist = "Unknown Artist".to_string();
        let mut album = "Unknown Album".to_string();
        let mut year = None;
        let mut genre = None;
        let mut track_number = None;
        let mut disc_number = None;
        let mut artwork_url = None;

        if let Some(tag) = tagged_file.primary_tag().or_else(|| tagged_file.first_tag()) {
            if let Some(t) = tag.title() {
                let trimmed = t.trim();
                if !trimmed.is_empty() {
                    title = trimmed.to_string();
                }
            }
            if let Some(a) = tag.artist() {
                let trimmed = a.trim();
                if !trimmed.is_empty() {
                    artist = trimmed.to_string();
                }
            }
            if let Some(al) = tag.album() {
                let trimmed = al.trim();
                if !trimmed.is_empty() {
                    album = trimmed.to_string();
                }
            }
            year = tag.year();
            genre = tag.genre().map(|g| g.trim().to_string());
            track_number = tag.track();
            disc_number = tag.disk();

            // Extract embedded cover art
            if let Some(picture) = tag.pictures().first() {
                let pic_data = picture.data();
                if !pic_data.is_empty() {
                    let mime = picture.mime_type().map(|m| m.as_str()).unwrap_or("image/jpeg");
                    let ext = if mime.contains("png") { "png" } else { "jpg" };
                    let art_filename = format!("art_{:x}.{}", md5_simple(pic_data), ext);
                    let art_path = art_cache_dir.join(&art_filename);

                    if !art_path.exists() {
                        let _ = fs::write(&art_path, pic_data);
                    }
                    artwork_url = Some(art_path.to_string_lossy().to_string());
                }
            }
        }

        // Generate deterministic track ID from path
        let id = format!("local-{:x}", md5_simple(path_str.as_bytes()));
        let now = chrono::Utc::now().to_rfc3339();

        Ok(DbTrack {
            id,
            title,
            artist,
            album,
            duration_ms,
            path: path_str,
            source_kind: "local".to_string(),
            provider_id: "local".to_string(),
            provider_track_id: None,
            codec: Some(ext),
            sample_rate,
            bit_depth,
            channels,
            bitrate,
            file_size: Some(file_size),
            year,
            genre,
            track_number,
            disc_number,
            artwork_url,
            license_url: None,
            attribution: None,
            download_allowed: true,
            is_favourite: false,
            date_added: now,
        })
    }
}

// Simple fast hash for caching
fn md5_simple(data: &[u8]) -> u64 {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::Hasher;
    let mut hasher = DefaultHasher::new();
    hasher.write(data);
    hasher.finish()
}
