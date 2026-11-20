use base64::prelude::*;
use cipher::{BlockCipherDecrypt, KeyInit};
use des::Des;
use serde::{Deserialize, Serialize};
use serde_json::Value;

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

/// A playlist, album or song tile from JioSaavn's home feed.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JioSaavnCollection {
    pub id: String,
    pub title: String,
    pub subtitle: String,
    pub image: String,
    /// "playlist" | "album" | "song"
    pub kind: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JioSaavnHome {
    pub new_releases: Vec<JioSaavnCollection>,
    pub charts: Vec<JioSaavnCollection>,
    pub top_playlists: Vec<JioSaavnCollection>,
    pub trending: Vec<JioSaavnCollection>,
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
    for (from, to) in [("_96.mp4", "_320.mp4"), ("_160.mp4", "_320.mp4"), ("_96.mp3", "_320.mp3"), ("_160.mp3", "_320.mp3")] {
        if url.contains(from) {
            url = url.replace(from, to);
            break;
        }
    }

    Some(url)
}

const BASE: &str = "https://www.jiosaavn.com/api.php?_format=json&_marker=0&api_version=4";

fn client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(8))
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())
}

async fn get_json(url: &str) -> Result<Value, String> {
    let text = client()?
        .get(url)
        .send()
        .await
        .map_err(|e| format!("JioSaavn network request failed: {}", e))?
        .text()
        .await
        .map_err(|e| e.to_string())?;
    serde_json::from_str(&text).map_err(|e| format!("Failed to parse JioSaavn response: {}", e))
}

fn s(v: &Value, key: &str) -> String {
    v.get(key).and_then(|x| x.as_str()).map(html_unescape).unwrap_or_default()
}

fn hi_res(image: &str) -> String {
    image.replace("150x150", "500x500").replace("50x50", "500x500")
}

/// Turns one song object (search, radio, playlist and album responses all share this shape)
/// into a playable track. Returns None when there's no decryptable stream.
fn parse_song(song: &Value) -> Option<JioSaavnTrackItem> {
    if song.get("type").and_then(|t| t.as_str()).map_or(false, |t| t != "song") {
        return None;
    }
    let mi = song.get("more_info")?;
    let enc = mi.get("encrypted_media_url")?.as_str().filter(|u| !u.is_empty())?;
    let stream_url = decrypt_jiosaavn_url(enc)?;

    // JioSaavn's "primary artists" mixes singers with composers and lyricists. The separate
    // artists list tags composers ("music"), lyricists and actors, so the singers are the
    // primary artists without one of those roles. Fall back to the full primary list, then the subtitle.
    let names = |ptr: &str| -> Vec<(String, String)> {
        mi.pointer(ptr)
            .and_then(|a| a.as_array())
            .map(|a| {
                a.iter()
                    .filter_map(|x| {
                        Some((html_unescape(x.get("name")?.as_str()?), x.get("role").and_then(|r| r.as_str()).unwrap_or("").to_string()))
                    })
                    .collect()
            })
            .unwrap_or_default()
    };
    let primary: Vec<String> = names("/artistMap/primary_artists").into_iter().map(|(n, _)| n).collect();
    let credits = names("/artistMap/artists");
    // Explicit singer credits win when present.
    let mut singers: Vec<String> = Vec::new();
    for (n, role) in &credits {
        if role == "singer" && !singers.contains(n) {
            singers.push(n.clone());
        }
    }
    if singers.is_empty() {
        let behind_the_scenes: std::collections::HashSet<&String> = credits
            .iter()
            .filter(|(_, role)| matches!(role.as_str(), "music" | "lyricist" | "starring"))
            .map(|(n, _)| n)
            .collect();
        singers = primary.iter().filter(|n| !behind_the_scenes.contains(n)).cloned().collect();
    }
    let mut artists = if singers.is_empty() { primary } else { singers };
    if artists.is_empty() {
        let sub = s(song, "subtitle");
        let names = sub.split(" - ").next().unwrap_or("");
        artists = names.split(',').map(|x| x.trim().to_string()).filter(|x| !x.is_empty()).collect();
    }
    if artists.is_empty() {
        let composer = s(mi, "music");
        artists.push(if composer.is_empty() { "Unknown artist".into() } else { composer });
    }

    let title = s(song, "title");
    let album = {
        let a = s(mi, "album");
        if a.is_empty() { title.clone() } else { a }
    };
    Some(JioSaavnTrackItem {
        id: song.get("id")?.as_str()?.to_string(),
        title: if title.is_empty() { "Unknown track".into() } else { title },
        artists,
        album,
        image: hi_res(&s(song, "image")),
        duration_seconds: mi.get("duration").and_then(|d| d.as_str()).and_then(|d| d.parse().ok()).unwrap_or(180),
        stream_url,
        year: song.get("year").and_then(|y| y.as_str()).map(String::from),
        bitrate: 320,
    })
}

fn parse_collection(v: &Value) -> Option<JioSaavnCollection> {
    let kind = v.get("type")?.as_str()?.to_string();
    if !matches!(kind.as_str(), "playlist" | "album" | "song") {
        return None;
    }
    Some(JioSaavnCollection {
        id: v.get("id")?.as_str()?.to_string(),
        title: s(v, "title"),
        subtitle: s(v, "subtitle"),
        image: hi_res(&s(v, "image")),
        kind,
    })
}

pub struct JioSaavnProvider;

impl JioSaavnProvider {
    pub async fn search_tracks(query: &str, limit: usize) -> Result<Vec<JioSaavnTrackItem>, String> {
        let url = format!(
            "{BASE}&ctx=web6dot0&__call=search.getResults&n={}&p=1&q={}",
            limit,
            urlencoding_encode(query)
        );
        let data = get_json(&url).await?;
        Ok(data
            .get("results")
            .and_then(|r| r.as_array())
            .map(|a| a.iter().filter_map(parse_song).collect())
            .unwrap_or_default())
    }

    /// Songs similar to `song_id`, from JioSaavn's song radio (what its own autoplay uses).
    pub async fn song_radio(song_id: &str, limit: usize) -> Result<Vec<JioSaavnTrackItem>, String> {
        let entity = urlencoding_encode(&format!("[\"{}\"]", song_id));
        let station = get_json(&format!(
            "{BASE}&ctx=android&__call=webradio.createEntityStation&entity_id={entity}&entity_type=queue"
        ))
        .await?;
        let station_id = station
            .get("stationid")
            .and_then(|s| s.as_str())
            .ok_or("JioSaavn didn't create a radio station for this song")?;
        let data = get_json(&format!(
            "{BASE}&ctx=android&__call=webradio.getSong&stationid={}&k={}&next=1",
            urlencoding_encode(station_id),
            limit
        ))
        .await?;
        let mut songs: Vec<JioSaavnTrackItem> = data
            .as_object()
            .map(|o| o.values().filter_map(|v| v.get("song")).filter_map(parse_song).collect())
            .unwrap_or_default();
        songs.retain(|t| t.id != song_id);
        Ok(songs)
    }

    /// Songs in a playlist or album, or a single song, from the home feed.
    pub async fn collection_songs(kind: &str, id: &str, limit: usize) -> Result<Vec<JioSaavnTrackItem>, String> {
        let id = urlencoding_encode(id);
        let url = match kind {
            "playlist" => format!("{BASE}&ctx=web6dot0&__call=playlist.getDetails&listid={id}&n={limit}&p=1"),
            "album" => format!("{BASE}&ctx=web6dot0&__call=content.getAlbumDetails&albumid={id}"),
            "song" => format!("{BASE}&ctx=web6dot0&__call=song.getDetails&pids={id}"),
            other => return Err(format!("Unknown JioSaavn collection type: {}", other)),
        };
        let data = get_json(&url).await?;
        let songs: Vec<JioSaavnTrackItem> = if kind == "song" {
            // song.getDetails returns { songs: [...] } or a map keyed by id
            data.get("songs")
                .and_then(|a| a.as_array())
                .map(|a| a.iter().filter_map(parse_song).collect())
                .or_else(|| data.as_object().map(|o| o.values().filter_map(parse_song).collect()))
                .unwrap_or_default()
        } else {
            data.get("list")
                .and_then(|l| l.as_array())
                .map(|a| a.iter().filter_map(parse_song).collect())
                .unwrap_or_default()
        };
        Ok(songs.into_iter().take(limit).collect())
    }

    /// JioSaavn's own home feed: new releases, charts, editorial playlists and trending.
    pub async fn home() -> Result<JioSaavnHome, String> {
        let data = get_json(&format!("{BASE}&ctx=web6dot0&__call=webapi.getLaunchData")).await?;
        let list = |key: &str| -> Vec<JioSaavnCollection> {
            data.get(key)
                .and_then(|v| v.as_array())
                .map(|a| a.iter().filter_map(parse_collection).collect())
                .unwrap_or_default()
        };
        Ok(JioSaavnHome {
            new_releases: list("new_albums"),
            charts: list("charts"),
            top_playlists: list("top_playlists"),
            trending: list("new_trending"),
        })
    }
}

fn urlencoding_encode(s: &str) -> String {
    let mut encoded = String::new();
    for b in s.bytes() {
        match b {
            b'a'..=b'z' | b'A'..=b'Z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => encoded.push(b as char),
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
        let enc = "ID2ieOjCrwfgWvL5sXl4B1ImC5QfbsDyexyhGiurcXEpCNi8gBIelM0+/bASiAx59yNTLyuH4My32JGBcP+xKhw7tS9a8Gtq";
        let url = decrypt_jiosaavn_url(enc).expect("Decryption should succeed");
        assert!(url.starts_with("https://aac.saavncdn.com/"));
        assert!(url.contains("_320.mp4"));
    }

    #[tokio::test]
    async fn test_jiosaavn_live_search() {
        let items = JioSaavnProvider::search_tracks("trending hindi", 5).await.expect("search");
        assert!(!items.is_empty());
    }

    #[tokio::test]
    async fn test_jiosaavn_radio_and_home() {
        let seed = JioSaavnProvider::search_tracks("tum hi ho", 1).await.expect("search");
        let radio = JioSaavnProvider::song_radio(&seed[0].id, 10).await.expect("radio");
        assert!(!radio.is_empty());
        assert!(radio.iter().all(|t| !t.artists.is_empty()));

        // Film songs credit the composer first; the singer should come out on top.
        let arijit = JioSaavnProvider::search_tracks("gehra hua dhurandhar", 1).await.expect("search");
        assert!(arijit[0].artists.iter().any(|a| a == "Arijit Singh"), "{:?}", arijit[0].artists);
        assert!(!arijit[0].artists.iter().any(|a| a == "Irshad Kamil"), "lyricist leaked: {:?}", arijit[0].artists);

        let home = JioSaavnProvider::home().await.expect("home");
        assert!(!home.charts.is_empty());
        let chart = &home.charts[0];
        let songs = JioSaavnProvider::collection_songs(&chart.kind, &chart.id, 10).await.expect("chart songs");
        assert!(!songs.is_empty());
    }
}
