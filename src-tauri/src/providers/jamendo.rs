use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JamendoTrackItem {
    pub id: String,
    pub name: String,
    pub duration: u64,
    pub artist_id: String,
    pub artist_name: String,
    pub album_name: Option<String>,
    pub album_id: Option<String>,
    pub license_ccurl: Option<String>,
    pub image: Option<String>,
    pub audio: String,
    pub audiodownload: Option<String>,
    pub audiodownload_allowed: bool,
}

#[derive(Deserialize)]
struct JamendoApiResponse {
    results: Vec<JamendoRawTrack>,
}

#[derive(Deserialize)]
struct JamendoRawTrack {
    id: String,
    name: String,
    duration: u64,
    artist_id: String,
    artist_name: String,
    album_name: Option<String>,
    album_id: Option<String>,
    license_ccurl: Option<String>,
    image: Option<String>,
    audio: String,
    audiodownload: Option<String>,
    audiodownload_allowed: bool,
}

pub struct JamendoProvider;

// Default demo client ID from Jamendo open documentation
const DEFAULT_CLIENT_ID: &str = "56d30c95";

impl JamendoProvider {
    pub async fn search_tracks(
        query: &str,
        client_id_override: Option<&str>,
        limit: usize,
    ) -> Result<Vec<JamendoTrackItem>, String> {
        let client_id = client_id_override.unwrap_or(DEFAULT_CLIENT_ID);
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(8))
            .user_agent("SonoraMusicPlayer/1.0 (https://github.com/sonora-music/sonora)")
            .build()
            .map_err(|e| e.to_string())?;

        let url = "https://api.jamendo.com/v3.0/tracks/";
        let limit_str = limit.to_string();

        let mut req = client.get(url)
            .query(&[
                ("client_id", client_id),
                ("format", "json"),
                ("limit", limit_str.as_str()),
                ("audioformat", "mp32"), // 320kbps MP3 stream
                ("include", "musicinfo"),
            ]);

        if !query.trim().is_empty() {
            req = req.query(&[("namesearch", query.trim())]);
        } else {
            req = req.query(&[("order", "popularity_total")]);
        }

        let resp = req.send().await.map_err(|e| format!("Jamendo API request failed: {}", e))?;

        if !resp.status().is_success() {
            return Err(format!("Jamendo API returned HTTP {}", resp.status()));
        }

        let body = resp.json::<JamendoApiResponse>().await
            .map_err(|e| format!("Failed to parse Jamendo response: {}", e))?;

        let tracks = body.results.into_iter().map(|r| JamendoTrackItem {
            id: format!("jamendo-{}", r.id),
            name: r.name,
            duration: r.duration * 1000,
            artist_id: r.artist_id,
            artist_name: r.artist_name,
            album_name: r.album_name,
            album_id: r.album_id,
            license_ccurl: r.license_ccurl,
            image: r.image,
            audio: r.audio,
            audiodownload: r.audiodownload,
            audiodownload_allowed: r.audiodownload_allowed,
        }).collect();

        Ok(tracks)
    }
}
