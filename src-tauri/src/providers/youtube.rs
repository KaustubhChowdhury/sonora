use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YouTubeTrackItem {
    pub id: String,
    pub title: String,
    pub channel: String,
    pub duration_seconds: u64,
    pub thumbnail: String,
    pub youtube_video_id: String,
}

pub struct YouTubeProvider;

impl YouTubeProvider {
    pub async fn search_tracks(query: &str, limit: usize) -> Result<Vec<YouTubeTrackItem>, String> {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(8))
            .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            .build()
            .map_err(|e| e.to_string())?;

        let body = serde_json::json!({
            "context": {
                "client": {
                    "clientName": "WEB",
                    "clientVersion": "2.20230522.01.00"
                }
            },
            "query": query
        });

        let resp = client
            .post("https://www.youtube.com/youtubei/v1/search")
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("YouTube search request failed: {}", e))?;

        let val: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;

        let mut results = Vec::new();

        let section = val
            .pointer("/contents/twoColumnSearchResultsRenderer/primaryContents/sectionListRenderer/contents/0/itemSectionRenderer/contents")
            .and_then(|v| v.as_array());

        if let Some(contents) = section {
            for item in contents {
                if results.len() >= limit {
                    break;
                }

                if let Some(vr) = item.get("videoRenderer") {
                    let video_id = match vr.get("videoId").and_then(|v| v.as_str()) {
                        Some(id) => id.to_string(),
                        None => continue,
                    };

                    let title = vr
                        .pointer("/title/runs/0/text")
                        .and_then(|v| v.as_str())
                        .unwrap_or("Untitled Video")
                        .to_string();

                    let channel = vr
                        .pointer("/ownerText/runs/0/text")
                        .and_then(|v| v.as_str())
                        .unwrap_or("YouTube Artist")
                        .to_string();

                    let duration_str = vr
                        .pointer("/lengthText/simpleText")
                        .and_then(|v| v.as_str())
                        .unwrap_or("3:00");

                    let duration_seconds = parse_duration_seconds(duration_str);

                    let thumbnail = vr
                        .pointer("/thumbnail/thumbnails")
                        .and_then(|v| v.as_array())
                        .and_then(|thumbs| thumbs.last())
                        .and_then(|thumb| thumb.get("url"))
                        .and_then(|u| u.as_str())
                        .unwrap_or("")
                        .to_string();

                    results.push(YouTubeTrackItem {
                        id: format!("yt_{}", video_id),
                        title,
                        channel,
                        duration_seconds,
                        thumbnail,
                        youtube_video_id: video_id,
                    });
                }
            }
        }

        Ok(results)
    }
}

fn parse_duration_seconds(dur_str: &str) -> u64 {
    let parts: Vec<&str> = dur_str.split(':').collect();
    match parts.len() {
        1 => parts[0].parse::<u64>().unwrap_or(180),
        2 => {
            let mins = parts[0].parse::<u64>().unwrap_or(0);
            let secs = parts[1].parse::<u64>().unwrap_or(0);
            mins * 60 + secs
        }
        3 => {
            let hrs = parts[0].parse::<u64>().unwrap_or(0);
            let mins = parts[1].parse::<u64>().unwrap_or(0);
            let secs = parts[2].parse::<u64>().unwrap_or(0);
            hrs * 3600 + mins * 60 + secs
        }
        _ => 180,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_youtube_search() {
        let results = YouTubeProvider::search_tracks("phonk", 3).await.expect("Search should succeed");
        assert!(!results.is_empty());
        assert!(!results[0].title.is_empty());
        assert!(!results[0].youtube_video_id.is_empty());
    }
}
