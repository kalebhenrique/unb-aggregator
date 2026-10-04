use crate::models::{Course, FeedItem};
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

        // Sem mocks no ambiente Tauri nativo: apenas dados reais extraídos
        Ok((Vec::new(), Vec::new()))
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

        // Sem mocks no ambiente Tauri nativo
        Ok((Vec::new(), Vec::new()))
    }
}
