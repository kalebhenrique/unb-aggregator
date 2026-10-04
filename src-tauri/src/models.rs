use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum PlatformType {
    Sigaa,
    Aprender3,
    MoodleMat,
    Teams,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FeedItemType {
    Post,
    Assignment,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FeedItem {
    pub id: String,
    pub platform: PlatformType,
    pub title: String,
    pub content: String,
    pub course_name: String,
    pub course_code: Option<String>,
    pub author: Option<String>,
    pub item_type: FeedItemType,
    pub created_at: String,
    pub due_date: Option<String>,
    pub is_completed: Option<bool>,
    pub external_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Course {
    pub id: String,
    pub code: String,
    pub name: String,
    pub semester: String,
    pub platform: PlatformType,
    pub professor: Option<String>,
    pub classroom: Option<String>,
    pub schedule: Option<String>,
    pub unread_count: Option<u32>,
    pub pending_assignments_count: Option<u32>,
    pub url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncResult {
    pub items: Vec<FeedItem>,
    pub courses: Vec<Course>,
    pub synced_at: String,
    pub errors: Option<HashMap<PlatformType, String>>,
}

// Modelos específicos de credenciais
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SigaaCreds {
    pub matricula: String,
    pub senha: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Aprender3Creds {
    pub cpf: String,
    pub senha: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MoodleMatCreds {
    pub matricula: String,
    pub senha: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TeamsCreds {
    pub is_connected: Option<bool>,
    pub email: Option<String>,
}
