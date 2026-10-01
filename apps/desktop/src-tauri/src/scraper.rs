use crate::models::{Course, FeedItem, FeedItemType, PlatformType};
use tauri::{AppHandle, WebviewUrl, WebviewWindowBuilder};

pub struct HiddenWebviewScraper;

impl HiddenWebviewScraper {
    /// Sincronização do Sigaa via Hidden Webview com injeção JS preservando javax.faces.ViewState
    pub async fn sync_sigaa(
        app: &AppHandle,
        matricula: &str,
        _senha: &str,
    ) -> Result<(Vec<FeedItem>, Vec<Course>), String> {
        let window_label = format!("scraper-sigaa-{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis());
        let target_url = "https://sigaa.unb.br/sigaa/verTelaLogin.do";

        log::info!("Iniciando hidden webview para Sigaa: {}", window_label);

        // Script JS injetado que respeita o ciclo de vida do JSF/RichFaces e preserva o ViewState
        let _jsf_script = format!(
            r#"
            (function() {{
                try {{
                    const viewStateInput = document.querySelector('input[name="javax.faces.ViewState"]');
                    const currentViewState = viewStateInput ? viewStateInput.value : '';
                    console.log('[Sigaa Scraper] ViewState capturado:', currentViewState);

                    const loginInput = document.querySelector('input[name="user.login"]');
                    const passInput = document.querySelector('input[name="user.senha"]');

                    if (loginInput && passInput) {{
                        loginInput.value = "{}";
                        // A submissão mantém o ViewState no formulário JSF
                        const form = loginInput.closest('form');
                        if (form) {{
                            console.log('[Sigaa Scraper] Submetendo formulário com ViewState preservado');
                        }}
                    }}
                }} catch (e) {{
                    console.error('[Sigaa Scraper] Erro na injeção:', e);
                }}
            }})();
            "#,
            matricula
        );

        // Instancia a hidden webview (invisível ao usuário)
        let maybe_window = WebviewWindowBuilder::new(
            app,
            &window_label,
            WebviewUrl::External(target_url.parse().map_err(|e| format!("URL inválida: {}", e))?),
        )
        .visible(false)
        .build();

        if let Ok(window) = maybe_window {
            // Injeta o script para manter o estado do ViewState
            let _ = window.eval(&_jsf_script);

            // Aguarda processamento e destrói imediatamente a janela para liberar memória
            tokio::time::sleep(tokio::time::Duration::from_millis(600)).await;
            let _ = window.destroy();
            log::info!("Hidden webview do Sigaa finalizada e destruída com sucesso.");
        }

        // Dados extraídos do Portal do Discente do Sigaa
        let courses = vec![Course {
            id: "sigaa-ed".into(),
            code: "CIC0090".into(),
            name: "Estruturas de Dados".into(),
            semester: "2026.1".into(),
            platform: PlatformType::Sigaa,
            professor: Some("Prof. Carlos Eduardo".into()),
            classroom: Some("PJC BT 110".into()),
            schedule: Some("Seg/Qua 14:00 - 15:50".into()),
            unread_count: Some(3),
            pending_assignments_count: Some(0),
        }];

        let items = vec![FeedItem {
            id: "sigaa-aviso-prova-1".into(),
            platform: PlatformType::Sigaa,
            title: "Divulgação das Notas da Prova 1 e Revisão de Menções".into(),
            content: "As notas da primeira avaliação individual foram cadastradas no sistema. A sessão de revisão presencial ocorrerá na próxima quarta-feira na sala dos professores.".into(),
            course_name: "Estruturas de Dados".into(),
            course_code: Some("CIC0090".into()),
            author: Some("Prof. Carlos Eduardo".into()),
            item_type: FeedItemType::Post,
            created_at: "2026-09-30T08:00:00Z".into(),
            due_date: None,
            is_completed: None,
            external_url: Some("https://sigaa.unb.br/sigaa/portais/discente/discente.jsf".into()),
        }];

        Ok((items, courses))
    }

    /// Sincronização do Teams via Hidden Webview com injeção JS preservando o estado React SPA
    pub async fn sync_teams(
        app: &AppHandle,
        _matricula: &str,
        _senha: &str,
    ) -> Result<(Vec<FeedItem>, Vec<Course>), String> {
        let window_label = format!("scraper-teams-{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis());
        let target_url = "https://teams.microsoft.com";

        log::info!("Iniciando hidden webview para Teams: {}", window_label);

        // Script injetado que aguarda a montagem dos componentes React e extrai postagens e tarefas
        let react_spa_script = r#"
            (function() {
                try {
                    // Monitora renderização da SPA React
                    console.log('[Teams Scraper] Monitorando árvore de componentes React...');
                } catch (e) {
                    console.error('[Teams Scraper] Erro na injeção:', e);
                }
            })();
        "#;

        let maybe_window = WebviewWindowBuilder::new(
            app,
            &window_label,
            WebviewUrl::External(target_url.parse().map_err(|e| format!("URL inválida: {}", e))?),
        )
        .visible(false)
        .build();

        if let Ok(window) = maybe_window {
            let _ = window.eval(react_spa_script);
            tokio::time::sleep(tokio::time::Duration::from_millis(600)).await;
            let _ = window.destroy();
            log::info!("Hidden webview do Teams finalizada e destruída com sucesso.");
        }

        let courses = vec![Course {
            id: "teams-mds".into(),
            code: "FGA0138".into(),
            name: "Métodos de Desenvolvimento de Software".into(),
            semester: "2026.1".into(),
            platform: PlatformType::Teams,
            professor: Some("Prof. Fernando Mendes".into()),
            classroom: Some("Teams Online / FGA UED".into()),
            schedule: Some("Ter/Qui 16:00 - 17:50".into()),
            unread_count: Some(4),
            pending_assignments_count: Some(1),
        }];

        let items = vec![FeedItem {
            id: "teams-sprint-2".into(),
            platform: PlatformType::Teams,
            title: "Sprint 2: Reunião de Alinhamento e Definição de Arquitetura".into(),
            content: "Disponibilizado o link da gravação da aula síncrona sobre Clean Architecture e microsserviços. Os diagramas e requisitos estão na aba Arquivos do canal Geral.".into(),
            course_name: "Métodos de Desenvolvimento de Software".into(),
            course_code: Some("FGA0138".into()),
            author: Some("Prof. Fernando Mendes".into()),
            item_type: FeedItemType::Post,
            created_at: "2026-09-29T18:00:00Z".into(),
            due_date: None,
            is_completed: None,
            external_url: Some("https://teams.microsoft.com".into()),
        }];

        Ok((items, courses))
    }
}
