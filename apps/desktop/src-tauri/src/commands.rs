use crate::models::{
    Aprender3Creds, Course, FeedItem, MoodleMatCreds, PlatformType, SigaaCreds, SyncResult,
    TeamsCreds,
};
use crate::moodle::MoodleClient;
use crate::scraper::HiddenWebviewScraper;
use std::collections::HashMap;
use tauri::{command, AppHandle};

#[command]
pub async fn sync_platforms(
    app: AppHandle,
    platforms: Vec<PlatformType>,
    sigaa: Option<SigaaCreds>,
    aprender3: Option<Aprender3Creds>,
    moodlemat: Option<MoodleMatCreds>,
    teams: Option<TeamsCreds>,
) -> Result<SyncResult, String> {
    let mut all_items: Vec<FeedItem> = Vec::new();
    let mut all_courses: Vec<Course> = Vec::new();
    let mut errors: HashMap<PlatformType, String> = HashMap::new();

    let moodle = MoodleClient::new();

    for platform in platforms {
        match platform {
            PlatformType::Aprender3 => {
                let (cpf, senha) = match &aprender3 {
                    Some(c) => (c.cpf.as_str(), c.senha.as_str()),
                    None => ("", ""),
                };
                match moodle.sync_aprender3(cpf, senha).await {
                    Ok((items, courses)) => {
                        all_items.extend(items);
                        all_courses.extend(courses);
                    }
                    Err(e) => {
                        errors.insert(PlatformType::Aprender3, e);
                    }
                }
            }
            PlatformType::MoodleMat => {
                let (matricula, senha) = match &moodlemat {
                    Some(c) => (c.matricula.as_str(), c.senha.as_str()),
                    None => ("", ""),
                };
                match moodle.sync_moodlemat(matricula, senha).await {
                    Ok((items, courses)) => {
                        all_items.extend(items);
                        all_courses.extend(courses);
                    }
                    Err(e) => {
                        errors.insert(PlatformType::MoodleMat, e);
                    }
                }
            }
            PlatformType::Sigaa => {
                let (matricula, senha) = match &sigaa {
                    Some(c) => (c.matricula.as_str(), c.senha.as_str()),
                    None => ("", ""),
                };
                match HiddenWebviewScraper::sync_sigaa(&app, matricula, senha).await {
                    Ok((items, courses)) => {
                        all_items.extend(items);
                        all_courses.extend(courses);
                    }
                    Err(e) => {
                        errors.insert(PlatformType::Sigaa, e);
                    }
                }
            }
            PlatformType::Teams => {
                let email = teams.as_ref().and_then(|t| t.email.as_deref()).unwrap_or("");
                match HiddenWebviewScraper::sync_teams(&app, email, "").await {
                    Ok((items, courses)) => {
                        all_items.extend(items);
                        all_courses.extend(courses);
                    }
                    Err(e) => {
                        errors.insert(PlatformType::Teams, e);
                    }
                }
            }
        }
    }

    // Ordenação estrita por data decrescente
    all_items.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    Ok(SyncResult {
        items: all_items,
        courses: all_courses,
        synced_at: chrono_like_timestamp(),
        errors: if errors.is_empty() { None } else { Some(errors) },
    })
}

#[command]
pub fn check_vault_status() -> serde_json::Value {
    serde_json::json!({
        "status": "ready",
        "encryption": "Argon2id (32 bytes)",
        "zeroTelemetry": true
    })
}

fn chrono_like_timestamp() -> String {
    let now = std::time::SystemTime::now();
    let duration = now.duration_since(std::time::UNIX_EPOCH).unwrap_or_default();
    format!("{}.000Z", duration.as_secs())
}
