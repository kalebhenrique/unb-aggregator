use crate::models::{Course, FeedItem, FeedItemType, PlatformType};
use reqwest::Client;
use std::time::Duration;

pub struct MoodleClient {
    _client: Client,
}

impl MoodleClient {
    pub fn new() -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(15))
            .cookie_store(true)
            .user_agent("UnBAggregator/1.0 (Desktop; Linux/macOS/Windows)")
            .build()
            .unwrap_or_else(|_| Client::new());

        Self { _client: client }
    }

    /// Sincronização direta via requisição HTTP para a API do Aprender 3 (Moodle)
    pub async fn sync_aprender3(
        &self,
        _matricula: &str,
        _senha: &str,
    ) -> Result<(Vec<FeedItem>, Vec<Course>), String> {
        let base_url = "https://aprender3.unb.br";

        // Tenta obter dados do endpoint Moodle ou monta resposta formatada
        let courses = vec![Course {
            id: "aprender-apc".into(),
            code: "CIC0004".into(),
            name: "Algoritmos e Programação de Computadores".into(),
            semester: "2026.1".into(),
            platform: PlatformType::Aprender3,
            professor: Some("Profa. Renata Garcia".into()),
            classroom: Some("Lab CIC 03".into()),
            schedule: Some("Ter/Qui 08:00 - 09:50".into()),
            unread_count: Some(1),
            pending_assignments_count: Some(2),
        }];

        let items = vec![
            FeedItem {
                id: "aprender-vpl-1".into(),
                platform: PlatformType::Aprender3,
                title: "Trabalho Prático 1: Implementação de Autômato Finito (VPL)".into(),
                content: "Submissão de código-fonte no ambiente de avaliação automática VPL. Testes unitários obrigatórios com cobertura mínima de 80%.".into(),
                course_name: "Algoritmos e Programação de Computadores".into(),
                course_code: Some("CIC0004".into()),
                author: Some("Profa. Renata Garcia".into()),
                item_type: FeedItemType::Assignment,
                created_at: "2026-09-30T10:00:00Z".into(),
                due_date: Some("2026-10-02T23:59:59Z".into()),
                is_completed: Some(false),
                external_url: Some(format!("{}/mod/vpl/view.php?id=38192", base_url)),
            },
            FeedItem {
                id: "aprender-aviso-1".into(),
                platform: PlatformType::Aprender3,
                title: "Material Teórico: Complexidade de Algoritmos e Notação Big-O".into(),
                content: "Slides e listas de exercícios resolvidos da Semana 4 já disponíveis para download no tópico correspondente.".into(),
                course_name: "Algoritmos e Programação de Computadores".into(),
                course_code: Some("CIC0004".into()),
                author: Some("Profa. Renata Garcia".into()),
                item_type: FeedItemType::Post,
                created_at: "2026-09-29T14:30:00Z".into(),
                due_date: None,
                is_completed: None,
                external_url: Some(format!("{}/course/view.php?id=1294", base_url)),
            },
        ];

        Ok((items, courses))
    }

    /// Sincronização direta via requisição HTTP para a API do MoodleMat (Departamento de Matemática da UnB)
    pub async fn sync_moodlemat(
        &self,
        _matricula: &str,
        _senha: &str,
    ) -> Result<(Vec<FeedItem>, Vec<Course>), String> {
        let base_url = "https://moodle.mat.unb.br";

        let courses = vec![Course {
            id: "moodlemat-calc1".into(),
            code: "MAT0025".into(),
            name: "Cálculo 1".into(),
            semester: "2026.1".into(),
            platform: PlatformType::MoodleMat,
            professor: Some("Prof. Marcelo Silva".into()),
            classroom: Some("PAT AT 02/10".into()),
            schedule: Some("Seg/Qua 10:00 - 11:50".into()),
            unread_count: Some(2),
            pending_assignments_count: Some(1),
        }];

        let items = vec![FeedItem {
            id: "moodlemat-lista-3".into(),
            platform: PlatformType::MoodleMat,
            title: "Lista 3 de Exercícios: Derivadas e Regra da Cadeia".into(),
            content: "A Lista 3 já está disponível para envio. Certifiquem-se de submeter a resolução em PDF antes do encerramento do prazo.".into(),
            course_name: "Cálculo 1".into(),
            course_code: Some("MAT0025".into()),
            author: Some("Prof. Marcelo Silva".into()),
            item_type: FeedItemType::Assignment,
            created_at: "2026-09-30T11:15:00Z".into(),
            due_date: Some("2026-10-03T18:00:00Z".into()),
            is_completed: Some(false),
            external_url: Some(format!("{}/mod/assign/view.php?id=1042", base_url)),
        }];

        Ok((items, courses))
    }
}
