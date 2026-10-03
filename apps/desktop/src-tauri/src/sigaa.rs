use crate::models::{Course, FeedItem, FeedItemType, PlatformType};
use chrono::Datelike;
use regex::Regex;
use reqwest::header::{HeaderMap, HeaderValue, CONTENT_TYPE, REFERER, USER_AGENT};
use std::collections::HashMap;

const USER_AGENT_STR: &str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const CAS_LOGIN_URL: &str = "https://autenticacao.unb.br/sso-server/login?service=https%3A%2F%2Fsig.unb.br%2Fsigaa%2Flogin%2Fcas";
const DISCENTE_URL: &str = "https://sigaa.unb.br/sigaa/portais/discente/discente.jsf";

pub struct SigaaClient {
    client: reqwest::Client,
}

impl SigaaClient {
    pub fn new() -> Self {
        let mut default_headers = HeaderMap::new();
        default_headers.insert(USER_AGENT, HeaderValue::from_static(USER_AGENT_STR));

        let client = reqwest::Client::builder()
            .cookie_store(true)
            .default_headers(default_headers)
            .timeout(std::time::Duration::from_secs(30))
            .redirect(reqwest::redirect::Policy::limited(10))
            .build()
            .expect("Falha ao criar cliente HTTP reqwest para SIGAA");

        Self { client }
    }

    /// Sincroniza o SIGAA realizando o login CAS SSO, avançando por telas de aviso (telaAvisoLogon.jsf)
    /// e extraindo as disciplinas matriculadas, atividades e avisos do portal discente.
    pub async fn sync_sigaa(
        &self,
        matricula: &str,
        senha: &str,
    ) -> Result<(Vec<FeedItem>, Vec<Course>), String> {
        let clean_matricula = matricula.trim();
        let clean_senha = senha.trim();

        if clean_matricula.is_empty() || clean_senha.is_empty() {
            return Err("Matrícula ou senha do SIGAA não fornecidas.".into());
        }

        // 1. Obter página inicial do CAS SSO
        log::info!("[SigaaClient] Obtendo formulário de login CAS SSO...");
        let res_cas = self
            .client
            .get(CAS_LOGIN_URL)
            .send()
            .await
            .map_err(|e| format!("Falha de conexão com CAS SSO UnB: {}", e))?;

        let cas_html = res_cas
            .text()
            .await
            .map_err(|e| format!("Falha ao ler resposta do CAS SSO: {}", e))?;

        // 2. Extrair campos de segurança do formulário CAS
        let (action_url, lt, execution, event_id) = Self::extract_cas_form_params(&cas_html)?;

        // 3. Submeter credenciais ao CAS SSO
        // 3. Submeter credenciais ao CAS SSO
        let clean_action_log = action_url.split('?').next().unwrap_or(&action_url);
        log::info!("[SigaaClient] Submetendo credenciais para {}", clean_action_log);
        let mut form_data = HashMap::new();
        form_data.insert("username", clean_matricula);
        form_data.insert("password", clean_senha);
        form_data.insert("lt", &lt);
        form_data.insert("execution", &execution);
        form_data.insert("_eventId", &event_id);
        form_data.insert("submit", "Submit");

        let res_login = self
            .client
            .post(&action_url)
            .header(REFERER, CAS_LOGIN_URL)
            .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
            .form(&form_data)
            .send()
            .await
            .map_err(|e| format!("Erro ao submeter autenticação ao SIGAA: {}", e))?;

        let mut landing_url = res_login.url().to_string();
        let mut page_html = res_login
            .text()
            .await
            .map_err(|e| format!("Erro ao ler resposta pós-login do SIGAA: {}", e))?;

        if page_html.contains("Credenciais inválidas")
            || page_html.contains("name=\"lt\"")
            || landing_url.contains("autenticacao.unb.br/sso-server/login")
        {
            return Err("Credenciais inválidas ou falha de login no SIGAA. Verifique matrícula e senha (lembre-se de respeitar maiúsculas/minúsculas).".into());
        }

        let mut feed_items = Vec::new();

        // 4. Verificar se caímos na tela de aviso institucional (telaAvisoLogon.jsf)
        if landing_url.contains("telaAvisoLogon.jsf") || page_html.contains("telaAvisoLogon.jsf") || page_html.contains("Continuar >>") {
            log::info!("[SigaaClient] Detectada tela intermediária de avisos institucionais (telaAvisoLogon.jsf).");
            
            // Extrai o comunicado institucional da tela de aviso para o feed
            if let Some(aviso_item) = Self::extract_aviso_logon(&page_html) {
                feed_items.push(aviso_item);
            }

            // Submete o formulário com ViewState para avançar para o portal
            if let Ok((action, params)) = Self::extract_aviso_form_submit(&page_html, &landing_url) {
                log::info!("[SigaaClient] Submetendo confirmação do aviso para {}", action);
                let res_aviso = self
                    .client
                    .post(&action)
                    .header(REFERER, &landing_url)
                    .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
                    .form(&params)
                    .send()
                    .await
                    .map_err(|e| format!("Erro ao avançar tela de aviso do SIGAA: {}", e))?;

                landing_url = res_aviso.url().to_string();
                page_html = res_aviso
                    .text()
                    .await
                    .map_err(|e| format!("Erro ao ler resposta após tela de aviso: {}", e))?;
            }
        }

        // 5. Garantir que estamos no portal discente
        if !landing_url.contains("discente.jsf") {
            log::info!("[SigaaClient] Navegando explicitamente para o portal discente: {}", DISCENTE_URL);
            let res_portal = self
                .client
                .get(DISCENTE_URL)
                .send()
                .await
                .map_err(|e| format!("Erro ao carregar portal discente do SIGAA: {}", e))?;

            page_html = res_portal
                .text()
                .await
                .map_err(|e| format!("Erro ao ler conteúdo do portal discente: {}", e))?;
        }

        if !page_html.contains("form_acessarTurmaVirtual") && !page_html.contains("Turmas do Semestre") {
            return Err("Login SIGAA não concluído — portal discente não foi carregado.".into());
        }

        // 6. Fazer o parse completo do portal discente
        let (extracted_items, courses) = Self::parse_discente_html(&page_html)?;
        feed_items.extend(extracted_items);

        log::info!(
            "[SigaaClient] Sincronização concluída com sucesso: {} turmas e {} itens de feed.",
            courses.len(),
            feed_items.len()
        );

        Ok((feed_items, courses))
    }

    /// Extrai parâmetros do formulário de autenticação CAS SSO
    pub fn extract_cas_form_params(html: &str) -> Result<(String, String, String, String), String> {
        let lt_re = Regex::new(r#"name="lt"\s+value="([^"]+)""#).map_err(|e| e.to_string())?;
        let exec_re = Regex::new(r#"name="execution"\s+value="([^"]+)""#).map_err(|e| e.to_string())?;
        let event_re = Regex::new(r#"name="_eventId"\s+value="([^"]+)""#).map_err(|e| e.to_string())?;
        let action_re = Regex::new(r#"<form[^>]*action="([^"]+)""#).map_err(|e| e.to_string())?;

        let lt = lt_re
            .captures(html)
            .and_then(|c| c.get(1))
            .map(|m| m.as_str().to_string())
            .ok_or_else(|| "Token 'lt' não encontrado no formulário CAS.".to_string())?;

        let execution = exec_re
            .captures(html)
            .and_then(|c| c.get(1))
            .map(|m| m.as_str().to_string())
            .ok_or_else(|| "Campo 'execution' não encontrado no formulário CAS.".to_string())?;

        let event_id = event_re
            .captures(html)
            .and_then(|c| c.get(1))
            .map(|m| m.as_str().to_string())
            .unwrap_or_else(|| "submit".to_string());

        let raw_action = action_re
            .captures(html)
            .and_then(|c| c.get(1))
            .map(|m| m.as_str().to_string())
            .unwrap_or_else(|| "/sso-server/login".to_string());

        let action_url = if raw_action.starts_with("https://autenticacao.unb.br/") {
            raw_action
        } else if raw_action.starts_with('/') {
            format!("https://autenticacao.unb.br{}", raw_action)
        } else {
            return Err("Ação do formulário CAS com host inválido ou não seguro.".to_string());
        };

        Ok((action_url, lt, execution, event_id))
    }

    /// Extrai o aviso institucional de `telaAvisoLogon.jsf` como um item para o feed
    pub fn extract_aviso_logon(html: &str) -> Option<FeedItem> {
        let title_re = Regex::new(r"<h2>(.*?)</h2>").ok()?;
        let body_re = Regex::new(r"<p><span[^>]*>(.*?)</span></p>").ok()?;

        let title_match = title_re.captures(html).and_then(|c| c.get(1))?;
        let raw_title = decode_html_entities(title_match.as_str().trim());

        let raw_body = if let Some(cap) = body_re.captures(html).and_then(|c| c.get(1)) {
            let stripped = Regex::new(r"<[^>]+>").unwrap().replace_all(cap.as_str(), " ");
            let clean = Regex::new(r"\s+").unwrap().replace_all(&stripped, " ");
            decode_html_entities(clean.trim())
        } else {
            "Comunicado institucional exibido no acesso ao SIGAA.".to_string()
        };

        let now_iso = chrono::Utc::now().to_rfc3339();

        Some(FeedItem {
            id: format!("sigaa-aviso-{}", fnv1a_hash(&raw_title)),
            platform: PlatformType::Sigaa,
            title: raw_title,
            content: raw_body,
            course_name: "Aviso Geral UnB".into(),
            course_code: Some("SIGAA".into()),
            author: Some("STI / Reitoria UnB".into()),
            item_type: FeedItemType::Post,
            created_at: now_iso,
            due_date: None,
            is_completed: Some(false),
            external_url: Some(DISCENTE_URL.into()),
        })
    }

    /// Extrai dados do formulário de confirmação de `telaAvisoLogon.jsf` para avançar
    pub fn extract_aviso_form_submit(
        html: &str,
        base_url: &str,
    ) -> Result<(String, HashMap<String, String>), String> {
        let form_re = Regex::new(r#"<form[^>]*id="([^"]+)"[^>]*action="([^"]+)""#).map_err(|e| e.to_string())?;
        let viewstate_re = Regex::new(r#"id="javax\.faces\.ViewState"[^>]*value="([^"]+)""#).map_err(|e| e.to_string())?;
        let btn_re = Regex::new(r#"type="submit"[^>]*name="([^"]+)"[^>]*value="([^"]+)""#).map_err(|e| e.to_string())?;

        let form_cap = form_re
            .captures(html)
            .ok_or_else(|| "Formulário não encontrado em telaAvisoLogon.jsf".to_string())?;

        let form_id = form_cap.get(1).map(|m| m.as_str()).unwrap_or("").to_string();
        let raw_action = form_cap.get(2).map(|m| m.as_str()).unwrap_or("").to_string();

        let viewstate = viewstate_re
            .captures(html)
            .and_then(|c| c.get(1))
            .map(|m| m.as_str().to_string())
            .unwrap_or_else(|| "j_id1".to_string());

        let (btn_name, btn_val) = if let Some(btn_cap) = btn_re.captures(html) {
            (
                btn_cap.get(1).map(|m| m.as_str().to_string()).unwrap_or_default(),
                btn_cap.get(2).map(|m| m.as_str().to_string()).unwrap_or_else(|| "Continuar >>".to_string()),
            )
        } else {
            (format!("{}:j_id_jsp_continuar", form_id), "Continuar >>".to_string())
        };

        let action_url = if raw_action.starts_with("http") {
            raw_action
        } else if raw_action.starts_with('/') {
            format!("https://sigaa.unb.br{}", raw_action)
        } else {
            base_url.to_string()
        };

        let mut params = HashMap::new();
        params.insert(form_id.clone(), form_id);
        params.insert(btn_name, btn_val);
        params.insert("javax.faces.ViewState".into(), viewstate);

        Ok((action_url, params))
    }

    /// Realiza o parse das turmas do semestre atual, atividades e atualizações do portal discente
    pub fn parse_discente_html(html: &str) -> Result<(Vec<FeedItem>, Vec<Course>), String> {
        let mut courses = Vec::new();
        let mut items = Vec::new();

        // 1. Extração do semestre atual (ex.: "2026.2") com fallback dinâmico
        let semester_re = Regex::new(r#"<td colspan="5"[^>]*style="[^"]*background:[^>]*>\s*(\d{4}\.[12])\s*</td>"#)
            .unwrap();
        let current_semester = semester_re
            .captures(html)
            .and_then(|c| c.get(1))
            .map(|m| m.as_str().to_string())
            .unwrap_or_else(|| {
                let now = chrono::Utc::now();
                let period = if now.month() <= 6 { 1 } else { 2 };
                format!("{}.{}", now.year(), period)
            });

        // 2. Extração das turmas matriculadas
        let course_row_re = Regex::new(
            r#"(?s)<form id="form_acessarTurmaVirtual[^"]*"[^>]*>.*?<a [^>]*onclick="[^"]*frontEndIdTurma[^"]*">([^<]+)</a>.*?<td class="info"[^>]*style="text-align:left">([^<]+)</td>\s*<td class="info"><center>([^<]+).*?<td colspan="5" id="linha_(\d+)""#,
        )
        .unwrap();

        for cap in course_row_re.captures_iter(html) {
            let raw_name = cap.get(1).map(|m| m.as_str()).unwrap_or("").trim();
            let raw_local = cap.get(2).map(|m| m.as_str()).unwrap_or("").trim();
            let raw_horario = cap.get(3).map(|m| m.as_str()).unwrap_or("").trim();
            let turma_id = cap.get(4).map(|m| m.as_str()).unwrap_or("").trim();

            let course_name = decode_html_entities(raw_name);
            let classroom = decode_html_entities(raw_local);
            let schedule = decode_html_entities(raw_horario);

            let course_code = course_name.clone();

            courses.push(Course {
                id: format!("sigaa-{}", turma_id),
                code: course_code,
                name: course_name,
                semester: current_semester.clone(),
                platform: PlatformType::Sigaa,
                professor: None,
                classroom: Some(classroom),
                schedule: Some(schedule),
                unread_count: Some(0),
                pending_assignments_count: Some(0),
                url: Some(DISCENTE_URL.into()),
            });
        }

        // 3. Extração das atividades do semestre ("Minhas atividades")
        let ativ_re = Regex::new(
            r#"(?s)(\d{2}/\d{2}/\d{4})\s*</font>\s*</td>\s*<td>\s*<small>\s*<font[^>]*>\s*([^<]+)<br>\s*<strong>([^<]+)</strong>\s*([^<]+)"#,
        )
        .unwrap();

        for cap in ativ_re.captures_iter(html) {
            let raw_date = cap.get(1).map(|m| m.as_str()).unwrap_or("").trim();
            let raw_course = cap.get(2).map(|m| m.as_str()).unwrap_or("").trim();
            let raw_type = cap.get(3).map(|m| m.as_str()).unwrap_or("").trim();
            let raw_name = cap.get(4).map(|m| m.as_str()).unwrap_or("").trim();

            let course_name = decode_html_entities(raw_course);
            let ativ_type = decode_html_entities(raw_type);
            let ativ_name = decode_html_entities(raw_name);

            let title = format!("{} {}", ativ_type, ativ_name).trim().to_string();
            let content = format!("{} - {}: {}", course_name, ativ_type, ativ_name);

            let due_date_iso = parse_br_date_to_iso(raw_date, true);
            let created_at_iso = parse_br_date_to_iso(raw_date, false);

            items.push(FeedItem {
                id: format!("sigaa-ativ-{}", fnv1a_hash(&format!("{}-{}-{}", course_name, title, raw_date))),
                platform: PlatformType::Sigaa,
                title,
                content,
                course_name: course_name.clone(),
                course_code: Some(course_name),
                author: None,
                item_type: FeedItemType::Assignment,
                created_at: created_at_iso,
                due_date: Some(due_date_iso),
                is_completed: Some(false),
                external_url: Some(DISCENTE_URL.into()),
            });
        }

        // 4. Extração das atualizações de turmas ("atualizacoes-turma" rotator)
        let rotator_re = Regex::new(
            r#"(?s)(\d{2}/\d{2}/\d{4})\s*-\s*<a [^>]*onclick="[^"]*idTurma[^"]*">([^<]+)</a>\s*</td>\s*</tr>\s*<tr>\s*<td>([^<]+)</td>"#,
        )
        .unwrap();

        for cap in rotator_re.captures_iter(html) {
            let raw_date = cap.get(1).map(|m| m.as_str()).unwrap_or("").trim();
            let raw_course = cap.get(2).map(|m| m.as_str()).unwrap_or("").trim();
            let raw_content = cap.get(3).map(|m| m.as_str()).unwrap_or("").trim();

            let course_full = decode_html_entities(raw_course);
            let content = decode_html_entities(raw_content);

            // Extrai o nome da disciplina removendo o sufixo "(2026.2)"
            let course_name = if let Some(idx) = course_full.find('(') {
                course_full[..idx].trim().to_string()
            } else {
                course_full.clone()
            };

            let title = if content.chars().count() > 60 {
                format!("{}...", content.chars().take(57).collect::<String>())
            } else {
                content.clone()
            };

            let created_at_iso = parse_br_date_to_iso(raw_date, false);

            let is_assignment = content.to_lowercase().contains("prova")
                || content.to_lowercase().contains("trabalho")
                || content.to_lowercase().contains("tarefa");

            items.push(FeedItem {
                id: format!("sigaa-update-{}", fnv1a_hash(&format!("{}-{}-{}", course_name, content, raw_date))),
                platform: PlatformType::Sigaa,
                title,
                content,
                course_name: course_name.clone(),
                course_code: Some(course_name),
                author: None,
                item_type: if is_assignment { FeedItemType::Assignment } else { FeedItemType::Post },
                created_at: created_at_iso,
                due_date: None,
                is_completed: Some(false),
                external_url: Some(DISCENTE_URL.into()),
            });
        }

        // 5. Extração de Notícias Gerais da Instituição (fcontent)
        let fcontent_re = Regex::new(r#"fcontent\[\d+\]\s*=\s*"(.*?)";"#).unwrap();
        let news_title_re = Regex::new(r#"class=\\"noticia[^"]*\\"[^>]*>.*?id=\\"([^"]+)\\"[^>]*>([^<]+)</a>"#).unwrap();
        let news_desc_re = Regex::new(r#"class=\\"descricao\\"[^>]*>.*?id=\\"[^"]+\\"[^>]*>([^<]+)</a>"#).unwrap();

        for cap in fcontent_re.captures_iter(html) {
            let raw_entry = cap.get(1).map(|m| m.as_str()).unwrap_or("");
            if let Some(t_cap) = news_title_re.captures(raw_entry) {
                let news_id = t_cap.get(1).map(|m| m.as_str()).unwrap_or("");
                let raw_title = t_cap.get(2).map(|m| m.as_str()).unwrap_or("");

                let raw_desc = news_desc_re
                    .captures(raw_entry)
                    .and_then(|c| c.get(1))
                    .map(|m| m.as_str())
                    .unwrap_or(raw_title);

                let title = decode_html_entities(raw_title.trim());
                let content = decode_html_entities(raw_desc.trim());

                items.push(FeedItem {
                    id: format!("sigaa-news-{}", news_id),
                    platform: PlatformType::Sigaa,
                    title,
                    content,
                    course_name: "Mural SIGAA".into(),
                    course_code: Some("SIGAA".into()),
                    author: Some("Coordenação / DAA".into()),
                    item_type: FeedItemType::Post,
                    created_at: chrono::Utc::now().to_rfc3339(),
                    due_date: None,
                    is_completed: Some(false),
                    external_url: Some(DISCENTE_URL.into()),
                });
            }
        }

        // Ordena itens do feed por data decrescente
        items.sort_by(|a, b| b.created_at.cmp(&a.created_at));

        Ok((items, courses))
    }
}

/// Converte data brasileira "dd/mm/aaaa" para string ISO 8601 (RFC 3339) com validação de calendário
fn parse_br_date_to_iso(date_str: &str, end_of_day: bool) -> String {
    if let Ok(date) = chrono::NaiveDate::parse_from_str(date_str.trim(), "%d/%m/%Y") {
        if end_of_day {
            format!("{}T23:59:59Z", date)
        } else {
            format!("{}T12:00:00Z", date)
        }
    } else {
        chrono::Utc::now().to_rfc3339()
    }
}

/// Função de hash FNV-1a simples e rápida para identificadores estáveis
fn fnv1a_hash(s: &str) -> u64 {
    let mut h: u64 = 0xcbf29ce484222325;
    for b in s.as_bytes() {
        h ^= *b as u64;
        h = h.wrapping_mul(0x100000001b3);
    }
    h
}

/// Decodifica entidades HTML comuns em páginas legadas do SIGAA
fn decode_html_entities(input: &str) -> String {
    input
        .replace("&ccedil;", "ç")
        .replace("&Ccedil;", "Ç")
        .replace("&atilde;", "ã")
        .replace("&Atilde;", "Ã")
        .replace("&otilde;", "õ")
        .replace("&Otilde;", "Õ")
        .replace("&aacute;", "á")
        .replace("&Aacute;", "Á")
        .replace("&eacute;", "é")
        .replace("&Eacute;", "É")
        .replace("&iacute;", "í")
        .replace("&Iacute;", "Í")
        .replace("&oacute;", "ó")
        .replace("&Oacute;", "Ó")
        .replace("&uacute;", "ú")
        .replace("&Uacute;", "Ú")
        .replace("&acirc;", "â")
        .replace("&Acirc;", "Â")
        .replace("&ecirc;", "ê")
        .replace("&Ecirc;", "Ê")
        .replace("&icirc;", "î")
        .replace("&Icirc;", "Î")
        .replace("&ocirc;", "ô")
        .replace("&Ocirc;", "Ô")
        .replace("&ucirc;", "û")
        .replace("&Ucirc;", "Û")
        .replace("&#231;", "ç")
        .replace("&#199;", "Ç")
        .replace("&#227;", "ã")
        .replace("&#195;", "Ã")
        .replace("&#245;", "õ")
        .replace("&#213;", "Õ")
        .replace("&#225;", "á")
        .replace("&#193;", "Á")
        .replace("&#233;", "é")
        .replace("&#201;", "É")
        .replace("&#237;", "í")
        .replace("&#205;", "Í")
        .replace("&#243;", "ó")
        .replace("&#211;", "Ó")
        .replace("&#250;", "ú")
        .replace("&#218;", "Ú")
        .replace("&#226;", "â")
        .replace("&#194;", "Â")
        .replace("&#234;", "ê")
        .replace("&#202;", "Ê")
        .replace("&#244;", "ô")
        .replace("&#212;", "Ô")
        .replace("&#170;", "ª")
        .replace("&#186;", "º")
        .replace("&ordm;", "º")
        .replace("&ordf;", "ª")
        .replace("&nbsp;", " ")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#150;", "–")
        .replace("&amp;", "&")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_cas_form_params() {
        let html = r##"
            <form id="login-form" action="/sso-server/login;jsessionid=123?service=sigaa" method="post">
                <input type="hidden" name="lt" value="LT-999-abc"/>
                <input type="hidden" name="execution" value="e1s1"/>
                <input type="hidden" name="_eventId" value="submit"/>
            </form>
        "##;

        let (action, lt, execution, event_id) = SigaaClient::extract_cas_form_params(html).unwrap();
        assert_eq!(action, "https://autenticacao.unb.br/sso-server/login;jsessionid=123?service=sigaa");
        assert_eq!(lt, "LT-999-abc");
        assert_eq!(execution, "e1s1");
        assert_eq!(event_id, "submit");
    }

    #[test]
    fn test_extract_aviso_form_submit() {
        let html = r##"
            <form id="j_id_aviso" name="j_id_aviso" action="/sigaa/telaAvisoLogon.jsf" method="post">
                <input type="hidden" name="j_id_aviso" value="j_id_aviso"/>
                <input type="hidden" name="javax.faces.ViewState" id="javax.faces.ViewState" value="j_id1"/>
                <input type="submit" name="j_id_aviso:btn" value="Continuar &gt;&gt;"/>
            </form>
        "##;

        let (action, params) = SigaaClient::extract_aviso_form_submit(html, "https://sigaa.unb.br/sigaa/telaAvisoLogon.jsf").unwrap();
        assert_eq!(action, "https://sigaa.unb.br/sigaa/telaAvisoLogon.jsf");
        assert_eq!(params.get("j_id_aviso").unwrap(), "j_id_aviso");
        assert_eq!(params.get("javax.faces.ViewState").unwrap(), "j_id1");
        assert_eq!(params.get("j_id_aviso:btn").unwrap(), "Continuar &gt;&gt;");
    }

    #[test]
    fn test_parse_discente_html() {
        let html = r##"
            <table>
                <tr>
                    <td colspan="5" style="background: #C8D5EC; font-weight: bold; padding: 2px 0 2px 5px;">
                        2026.2
                    </td>
                </tr>
                <tr class="odd">
                    <td class="descricao">
                        <form id="form_acessarTurmaVirtual" name="form_acessarTurmaVirtual" method="post" action="/sigaa/portais/discente/discente.jsf">
                            <a href="#" onclick="if(typeof jsfcljs == 'function'){jsfcljs(document.getElementById('form_acessarTurmaVirtual'),{'frontEndIdTurma':'ABC'},'');}return false">FISICA 2</a>
                        </form>
                    </td>
                    <td class="info" style="text-align:left">BSA S B1 34/10</td>
                    <td class="info"><center>35T45 (10/08/2026 - 14/12/2026)</center></td>
                </tr>
                <tr>
                    <td colspan="5" id="linha_1614531" style="display: none;"></td>
                </tr>
            </table>

            <div id="atualizacoes-turma">
                <table>
                    <tr>
                        <td>
                            10/09/2026 - 
                            <a href="#" onclick="jsfcljs(..., {'idTurma':'1614531'})">FISICA 2 (2026.2)</a>
                        </td>
                    </tr>
                    <tr>
                        <td>Novo Vídeo: Linhas de fluxo</td>
                    </tr>
                </table>
            </div>

            <table>
                <tbody>
                    <tr>
                        <td>22/09/2026</font></td>
                        <td><small><font color="gray">FISICA 2<br><strong>Avaliação:</strong> 1ª Avaliação</small></td>
                    </tr>
                </tbody>
            </table>
        "##;

        let (items, courses) = SigaaClient::parse_discente_html(html).unwrap();

        assert_eq!(courses.len(), 1);
        assert_eq!(courses[0].id, "sigaa-1614531");
        assert_eq!(courses[0].name, "FISICA 2");
        assert_eq!(courses[0].semester, "2026.2");
        assert_eq!(courses[0].classroom.as_deref(), Some("BSA S B1 34/10"));
        assert_eq!(courses[0].schedule.as_deref(), Some("35T45 (10/08/2026 - 14/12/2026)"));

        assert_eq!(items.len(), 2);
        let ativ = items.iter().find(|i| matches!(i.item_type, FeedItemType::Assignment)).unwrap();
        assert_eq!(ativ.course_name, "FISICA 2");
        assert_eq!(ativ.title, "Avaliação: 1ª Avaliação");
        assert_eq!(ativ.due_date.as_deref(), Some("2026-09-22T23:59:59Z"));
    }

    #[test]
    fn test_utf8_truncation_no_panic() {
        // Texto longo em português com caracteres multibyte (ã, ç, é)
        let long_content = "Orientação sobre a avaliação de Álgebra Linear e Equações Diferenciais com menção final";
        assert!(long_content.chars().count() > 60);

        let title = if long_content.chars().count() > 60 {
            format!("{}...", long_content.chars().take(57).collect::<String>())
        } else {
            long_content.to_string()
        };

        assert!(title.ends_with("..."));
        assert_eq!(title.chars().count(), 60);
    }

    #[test]
    fn test_decode_html_entities_order() {
        assert_eq!(decode_html_entities("&amp;lt;"), "&lt;");
        assert_eq!(decode_html_entities("&lt;b&gt;UnB&lt;/b&gt;"), "<b>UnB</b>");
        assert_eq!(decode_html_entities("Aten&ccedil;&atilde;o"), "Atenção");
    }

    #[test]
    fn test_parse_br_date_to_iso() {
        assert_eq!(parse_br_date_to_iso("22/09/2026", true), "2026-09-22T23:59:59Z");
        assert_eq!(parse_br_date_to_iso("22/09/2026", false), "2026-09-22T12:00:00Z");
        // Data inválida cai no fallback sem pânico
        let invalid = parse_br_date_to_iso("32/13/2026", true);
        assert!(!invalid.is_empty());
    }

    #[tokio::test]
    #[ignore]
    async fn test_live_sync_sigaa() {
        if let (Ok(mat), Ok(pwd)) = (std::env::var("SIGAA_MATRICULA"), std::env::var("SIGAA_SENHA")) {
            let client = SigaaClient::new();
            let res = client.sync_sigaa(&mat, &pwd).await;
            assert!(res.is_ok(), "Erro na sincronização real: {:?}", res.err());
            let (items, courses) = res.unwrap();
            println!("Turmas extraídas: {}", courses.len());
            for c in &courses {
                println!("- {} ({:?}) - {:?}", c.name, c.classroom, c.schedule);
            }
            println!("Itens de feed extraídos: {}", items.len());
        }
    }
}
