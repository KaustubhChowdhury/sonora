use regex::Regex;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LyricsLine {
    pub time_ms: u64,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LyricsResult {
    pub source: String, // "embedded" | "sidecar" | "lrclib" | "none"
    pub is_synced: bool,
    pub plain_text: Option<String>,
    pub synced_lines: Option<Vec<LyricsLine>>,
}

#[derive(Deserialize)]
struct LrclibResponse {
    #[serde(rename = "plainLyrics")]
    plain_lyrics: Option<String>,
    #[serde(rename = "syncedLyrics")]
    synced_lyrics: Option<String>,
}

pub struct LyricsService;

impl LyricsService {
    pub async fn resolve_lyrics(
        track_path: Option<&str>,
        title: &str,
        artist: &str,
        album: Option<&str>,
        duration_s: Option<u64>,
    ) -> LyricsResult {
        // 1. Try local sidecar .lrc file
        if let Some(path_str) = track_path {
            let p = Path::new(path_str);
            let lrc_path = p.with_extension("lrc");
            if lrc_path.exists() {
                if let Ok(content) = fs::read_to_string(&lrc_path) {
                    if let Some(parsed) = Self::parse_lrc(&content) {
                        return LyricsResult {
                            source: "sidecar".to_string(),
                            is_synced: true,
                            plain_text: None,
                            synced_lines: Some(parsed),
                        };
                    } else {
                        return LyricsResult {
                            source: "sidecar".to_string(),
                            is_synced: false,
                            plain_text: Some(content),
                            synced_lines: None,
                        };
                    }
                }
            }
        }

        // 2. Query LRCLIB online API (free, open, no API key required)
        if let Ok(res) = Self::fetch_lrclib(title, artist, album, duration_s).await {
            return res;
        }

        // 3. None found
        LyricsResult {
            source: "none".to_string(),
            is_synced: false,
            plain_text: None,
            synced_lines: None,
        }
    }

    async fn fetch_lrclib(
        title: &str,
        artist: &str,
        album: Option<&str>,
        duration_s: Option<u64>,
    ) -> Result<LyricsResult, String> {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(6))
            .user_agent("SonoraMusicPlayer/1.0 (https://github.com/sonora-music/sonora)")
            .build()
            .map_err(|e| e.to_string())?;

        let mut query = vec![
            ("track_name", title),
            ("artist_name", artist),
        ];
        if let Some(alb) = album {
            query.push(("album_name", alb));
        }

        let dur_str = duration_s.map(|d| d.to_string());
        if let Some(ref d) = dur_str {
            query.push(("duration", d.as_str()));
        }

        let resp = client
            .get("https://lrclib.net/api/get")
            .query(&query)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !resp.status().is_success() {
            return Err("LRCLIB returned non-success".to_string());
        }

        let data = resp
            .json::<LrclibResponse>()
            .await
            .map_err(|e| e.to_string())?;

        if let Some(synced) = data.synced_lyrics {
            if let Some(parsed) = Self::parse_lrc(&synced) {
                return Ok(LyricsResult {
                    source: "lrclib".to_string(),
                    is_synced: true,
                    plain_text: data.plain_lyrics,
                    synced_lines: Some(parsed),
                });
            }
        }

        if let Some(plain) = data.plain_lyrics {
            return Ok(LyricsResult {
                source: "lrclib".to_string(),
                is_synced: false,
                plain_text: Some(plain),
                synced_lines: None,
            });
        }

        Err("No lyrics content found".to_string())
    }

    pub fn parse_lrc(lrc_content: &str) -> Option<Vec<LyricsLine>> {
        // Matches [mm:ss.xx] or [mm:ss.xxx]
        let re = Regex::new(r"\[(\d{1,2}):(\d{2})(?:\.(\d{2,3}))?\](.*)").ok()?;
        let mut lines = Vec::new();

        for line in lrc_content.lines() {
            let line_trimmed = line.trim();
            if let Some(caps) = re.captures(line_trimmed) {
                let minutes: u64 = caps.get(1)?.as_str().parse().ok()?;
                let seconds: u64 = caps.get(2)?.as_str().parse().ok()?;
                let millis: u64 = if let Some(m_str) = caps.get(3) {
                    let s = m_str.as_str();
                    if s.len() == 2 {
                        s.parse::<u64>().ok()? * 10
                    } else {
                        s.parse::<u64>().ok()?
                    }
                } else {
                    0
                };

                let time_ms = minutes * 60 * 1000 + seconds * 1000 + millis;
                let text = caps.get(4).map(|m| m.as_str().trim().to_string()).unwrap_or_default();

                lines.push(LyricsLine { time_ms, text });
            }
        }

        if lines.is_empty() {
            None
        } else {
            lines.sort_by_key(|l| l.time_ms);
            Some(lines)
        }
    }
}
