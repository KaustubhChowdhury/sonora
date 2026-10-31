use rusqlite::{params, Connection, Result};
use std::path::PathBuf;
use std::sync::Mutex;

pub struct Database {
    pub conn: Mutex<Connection>,
}

impl Database {
    pub fn new() -> Result<Self> {
        let db_dir = dirs::data_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("Sonora");
        std::fs::create_dir_all(&db_dir).ok();
        let db_path = db_dir.join("sonora.db");

        let conn = Connection::open(&db_path)?;
        let db = Database {
            conn: Mutex::new(conn),
        };
        db.init_tables()?;
        Ok(db)
    }

    pub fn new_in_memory() -> Result<Self> {
        let conn = Connection::open_in_memory()?;
        let db = Database {
            conn: Mutex::new(conn),
        };
        db.init_tables()?;
        Ok(db)
    }

    fn init_tables(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        conn.execute_batch(
            r#"
            PRAGMA journal_mode = WAL;
            PRAGMA synchronous = NORMAL;
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS tracks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                artist TEXT NOT NULL,
                album TEXT NOT NULL,
                duration_ms INTEGER NOT NULL,
                path TEXT,
                source_kind TEXT NOT NULL, -- 'local' | 'stream' | 'personal-server'
                provider_id TEXT NOT NULL, -- 'local' | 'jamendo' | 'navidrome'
                provider_track_id TEXT,
                codec TEXT,
                sample_rate INTEGER,
                bit_depth INTEGER,
                channels INTEGER,
                bitrate INTEGER,
                file_size INTEGER,
                year INTEGER,
                genre TEXT,
                track_number INTEGER,
                disc_number INTEGER,
                artwork_url TEXT,
                license_url TEXT,
                attribution TEXT,
                download_allowed INTEGER DEFAULT 0,
                is_favourite INTEGER DEFAULT 0,
                date_added TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist);
            CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album);
            CREATE INDEX IF NOT EXISTS idx_tracks_path ON tracks(path);
            CREATE INDEX IF NOT EXISTS idx_tracks_source ON tracks(source_kind);

            CREATE TABLE IF NOT EXISTS folders (
                id TEXT PRIMARY KEY,
                path TEXT UNIQUE NOT NULL,
                added_at TEXT NOT NULL,
                last_scan_at TEXT
            );

            CREATE TABLE IF NOT EXISTS playlists (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                is_smart INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS playlist_tracks (
                playlist_id TEXT NOT NULL,
                track_id TEXT NOT NULL,
                position INTEGER NOT NULL,
                added_at TEXT NOT NULL,
                PRIMARY KEY (playlist_id, track_id),
                FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS play_history (
                id TEXT PRIMARY KEY,
                track_id TEXT NOT NULL,
                title TEXT NOT NULL,
                artist TEXT NOT NULL,
                album TEXT,
                artwork_url TEXT,
                played_at TEXT NOT NULL,
                listened_ms INTEGER NOT NULL,
                completion_ratio REAL NOT NULL
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
            "#,
        )?;

        // Insert default smart playlists if not existing
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM playlists WHERE id = 'smart-lossless'",
            [],
            |r| r.get(0),
        ).unwrap_or(0);

        if count == 0 {
            let now = chrono::Utc::now().to_rfc3339();
            conn.execute(
                "INSERT INTO playlists (id, name, description, is_smart, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![
                    "smart-lossless",
                    "Lossless Master Vault",
                    "Curated 24-bit FLAC/WAV/ALAC lossless audio collection",
                    1,
                    now,
                    now
                ],
            ).ok();

            conn.execute(
                "INSERT INTO playlists (id, name, description, is_smart, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![
                    "smart-recent",
                    "Recently Added",
                    "Tracks added to Sonora in the last 30 days",
                    1,
                    now,
                    now
                ],
            ).ok();
        }

        Ok(())
    }
}
