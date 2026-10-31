use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubsonicConfig {
    pub server_url: String,
    pub username: String,
    pub token: String,
    pub salt: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubsonicTrackItem {
    pub id: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub duration_ms: u64,
    pub stream_url: String,
    pub cover_art_url: Option<String>,
    pub bit_rate: Option<u32>,
    pub content_type: Option<String>,
    pub year: Option<u32>,
}

#[derive(Deserialize)]
struct SubsonicRootResponse {
    #[serde(rename = "subsonic-response")]
    subsonic_response: SubsonicInnerResponse,
}

#[derive(Deserialize)]
struct SubsonicInnerResponse {
    status: String,
    version: Option<String>,
    #[serde(rename = "searchResult3")]
    search_result_3: Option<SubsonicSearchResult3>,
}

#[derive(Deserialize)]
struct SubsonicSearchResult3 {
    song: Option<Vec<SubsonicRawSong>>,
}

#[derive(Deserialize)]
struct SubsonicRawSong {
    id: String,
    title: String,
    artist: Option<String>,
    album: Option<String>,
    duration: Option<u64>,
    #[serde(rename = "bitRate")]
    bit_rate: Option<u32>,
    #[serde(rename = "contentType")]
    content_type: Option<String>,
    year: Option<u32>,
    #[serde(rename = "coverArt")]
    cover_art: Option<String>,
}

pub struct SubsonicProvider;

impl SubsonicProvider {
    pub async fn test_connection(cfg: &SubsonicConfig) -> Result<String, String> {
        let base_url = cfg.server_url.trim_end_matches('/');
        let url = format!(
            "{}/rest/ping.view?u={}&t={}&s={}&v=1.16.1&c=Sonora&f=json",
            base_url, cfg.username, cfg.token, cfg.salt
        );

        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(6))
            .build()
            .map_err(|e| e.to_string())?;

        let resp = client.get(&url).send().await.map_err(|e| format!("Connection failed: {}", e))?;
        if !resp.status().is_success() {
            return Err(format!("Server returned HTTP {}", resp.status()));
        }

        let body = resp.json::<SubsonicRootResponse>().await
            .map_err(|e| format!("Invalid Subsonic response: {}", e))?;

        if body.subsonic_response.status == "ok" {
            let ver = body.subsonic_response.version.unwrap_or_else(|| "1.16.1".to_string());
            Ok(format!("Connected to Subsonic server (API version {})", ver))
        } else {
            Err("Authentication failed or server error".to_string())
        }
    }

    pub async fn search(cfg: &SubsonicConfig, query: &str) -> Result<Vec<SubsonicTrackItem>, String> {
        let base_url = cfg.server_url.trim_end_matches('/');
        let url = format!(
            "{}/rest/search3.view?u={}&t={}&s={}&v=1.16.1&c=Sonora&f=json&query={}",
            base_url, cfg.username, cfg.token, cfg.salt, query
        );

        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(8))
            .build()
            .map_err(|e| e.to_string())?;

        let resp = client.get(&url).send().await.map_err(|e| format!("Search request failed: {}", e))?;
        let body = resp.json::<SubsonicRootResponse>().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let mut results = Vec::new();
        if let Some(sr) = body.subsonic_response.search_result_3 {
            if let Some(songs) = sr.song {
                for s in songs {
                    let stream_url = format!(
                        "{}/rest/stream.view?id={}&u={}&t={}&s={}&v=1.16.1&c=Sonora",
                        base_url, s.id, cfg.username, cfg.token, cfg.salt
                    );
                    let cover_art_url = s.cover_art.map(|ca| {
                        format!(
                            "{}/rest/getCoverArt.view?id={}&u={}&t={}&s={}&v=1.16.1&c=Sonora",
                            base_url, ca, cfg.username, cfg.token, cfg.salt
                        )
                    });

                    results.push(SubsonicTrackItem {
                        id: format!("subsonic-{}", s.id),
                        title: s.title,
                        artist: s.artist.unwrap_or_else(|| "Unknown Artist".to_string()),
                        album: s.album.unwrap_or_else(|| "Unknown Album".to_string()),
                        duration_ms: s.duration.unwrap_or(0) * 1000,
                        stream_url,
                        cover_art_url,
                        bit_rate: s.bit_rate,
                        content_type: s.content_type,
                        year: s.year,
                    });
                }
            }
        }

        Ok(results)
    }
}
