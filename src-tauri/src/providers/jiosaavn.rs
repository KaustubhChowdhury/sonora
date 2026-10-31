use base64::prelude::*;
use cipher::{BlockCipherDecrypt, KeyInit};
use des::Des;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JioSaavnTrackItem {
    pub id: String,
    pub title: String,
    pub artists: Vec<String>,
    pub album: String,
    pub image: String,
    pub duration_seconds: u64,
    pub stream_url: String,
    pub year: Option<String>,
    pub bitrate: u32,
}

#[derive(Deserialize)]
struct RawJioSaavnResponse {
    results: Option<Vec<RawSong>>,
}

#[derive(Deserialize)]
struct RawSong {
    id: String,
    title: Option<String>,
    subtitle: Option<String>,
    image: Option<String>,
    year: Option<String>,
    more_info: Option<RawMoreInfo>,
}

#[derive(Deserialize)]
struct RawMoreInfo {
    album: Option<String>,
    duration: Option<String>,
    encrypted_media_url: Option<String>,
}

pub fn decrypt_jiosaavn_url(encrypted_b64: &str) -> Option<String> {
    let raw = BASE64_STANDARD.decode(encrypted_b64.trim()).ok()?;
    if raw.len() % 8 != 0 {
        return None;
    }

    let key = b"38346591";
    let cipher = Des::new_from_slice(key).ok()?;
    let mut decrypted = raw;

    for chunk in decrypted.chunks_exact_mut(8) {
        if let Ok(block) = chunk.try_into() {
            cipher.decrypt_block(block);
        }
    }

    // Remove PKCS7 padding
    let pad_len = *decrypted.last()? as usize;
    if pad_len > 0 && pad_len <= 8 && pad_len <= decrypted.len() {
        decrypted.truncate(decrypted.len() - pad_len);
    }

    let mut url = String::from_utf8(decrypted).ok()?;

    // Upgrade quality to 320kbps
    if url.contains("_96.mp4") {
        url = url.replace("_96.mp4", "_320.mp4");
    } else if url.contains("_160.mp4") {
        url = url.replace("_160.mp4", "_320.mp4");
    } else if url.contains("_96.mp3") {
        url = url.replace("_96.mp3", "_320.mp3");
    } else if url.contains("_160.mp3") {
        url = url.replace("_160.mp3", "_320.mp3");
    }

    Some(url)
}

pub struct JioSaavnProvider;

impl JioSaavnProvider {
    pub async fn search_tracks(query: &str, limit: usize) -> Result<Vec<JioSaavnTrackItem>, String> {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(8))
            .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            .build()
            .map_err(|e| e.to_string())?;

        let url = format!(
            "https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&api_version=4&ctx=web6dot0&n={}&p=1&q={}",
            limit,
            urlencoding_encode(query)
        );

        let resp = client
            .get(&url)
            .send()
            .await
            .map_err(|e| format!("JioSaavn network request failed: {}", e))?;

        let text = resp.text().await.map_err(|e| e.to_string())?;
        
        let api_data: RawJioSaavnResponse = serde_json::from_str(&text)
            .map_err(|e| format!("Failed to parse JioSaavn response: {}", e))?;

        let raw_songs = api_data.results.unwrap_or_default();
        let mut items = Vec::new();

        for song in raw_songs {
            let more_info = match song.more_info {
                Some(mi) => mi,
                None => continue,
            };

            let enc_url = match more_info.encrypted_media_url {
                Some(ref u) if !u.is_empty() => u,
                _ => continue,
            };

            let stream_url = match decrypt_jiosaavn_url(enc_url) {
                Some(u) => u,
                None => continue,
            };

            // High-resolution image (replace 150x150 with 500x500)
            let mut image = song.image.unwrap_or_default();
            if image.contains("150x150") {
                image = image.replace("150x150", "500x500");
            }

            // Duration in seconds
            let duration_seconds = more_info
                .duration
                .and_then(|d| d.parse::<u64>().ok())
                .unwrap_or(180);

            // Artists
            let artists = if let Some(subtitle) = song.subtitle {
                subtitle
                    .split(',')
                    .map(|s| s.trim().to_string())
                    .filter(|s| !s.is_empty())
                    .collect()
            } else {
                vec!["Unknown Artist".to_string()]
            };

            let raw_title = song.title.unwrap_or_else(|| "Unknown Track".to_string());
            let title = html_unescape(&raw_title);
            let album = html_unescape(&more_info.album.unwrap_or_else(|| title.clone()));

            items.push(JioSaavnTrackItem {
                id: song.id,
                title,
                artists,
                album,
                image,
                duration_seconds,
                stream_url,
                year: song.year,
                bitrate: 320,
            });
        }

        Ok(items)
    }
}

fn urlencoding_encode(s: &str) -> String {
    let mut encoded = String::new();
    for b in s.bytes() {
        match b {
            b'a'..=b'z' | b'A'..=b'Z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                encoded.push(b as char)
            }
            _ => encoded.push_str(&format!("%{:02X}", b)),
        }
    }
    encoded
}

fn html_unescape(s: &str) -> String {
    s.replace("&amp;", "&")
        .replace("&quot;", "\"")
        .replace("&#039;", "'")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_decrypt_jiosaavn_url() {
        let enc = "ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDymsKujagzVy8FM0d3vJrlyKgiXD0EM2z81H3pvljEuiPn0+MU70nnDRw7tS9a8Gtq";
        let url = decrypt_jiosaavn_url(enc).expect("Decryption should succeed");
        assert!(url.starts_with("https://aac.saavncdn.com/"));
        assert!(url.contains("_320.mp4"));
    }
}
