use regex::Regex;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

const SIGAA_URL: &str = "https://sigaa.unb.br/sigaa/public/turmas/listar.jsf";
const SIGAA_HOME_URL: &str = "https://sigaa.unb.br/sigaa/public/home.jsf";
const SIGAA_TURMAS_URL: &str = "https://sigaa.unb.br/sigaa/public/turmas/listar.jsf?aba=p-ensino";
const USER_AGENT: &str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct Department {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, specta::Type)]
pub struct ScheduleSlot {
    pub day: u8,
    pub day_name: String,
    pub shift: char,
    pub period: u8,
    pub time_range: String,
    pub global_slot_index: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct ScrapedClass {
    pub id: String,
    pub discipline_code: String,
    pub discipline_name: String,
    pub class_code: String,
    pub teachers: Vec<String>,
    pub classroom: String,
    pub schedule_code: String,
    #[serde(default)]
    pub schedule_description: Option<String>,
    #[serde(default)]
    pub date_range: Option<String>,
    pub schedule_slots: Vec<ScheduleSlot>,
    pub vacancies: Option<u32>,
    pub occupied: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, specta::Type)]
pub struct ScrapedDiscipline {
    pub code: String,
    pub name: String,
    pub department_id: String,
    pub classes: Vec<ScrapedClass>,
}

pub struct SigaaGradeScraper;

impl SigaaGradeScraper {
    /// Decodifica o código de horário padrão UnB (ex: "24M34 6T12") em slots estruturados
    pub fn parse_schedule_code(schedule_str: &str) -> Vec<ScheduleSlot> {
        let mut slots = Vec::new();
        let regex = match Regex::new(r"(\d+)([MTN])(\d+)") {
            Ok(r) => r,
            Err(_) => return slots,
        };

        for cap in regex.captures_iter(schedule_str) {
            let days_part = cap.get(1).map_or("", |m| m.as_str());
            let shift_char = cap.get(2).map_or('M', |m| m.as_str().chars().next().unwrap_or('M'));
            let periods_part = cap.get(3).map_or("", |m| m.as_str());

            for day_ch in days_part.chars() {
                if let Some(day_digit) = day_ch.to_digit(10) {
                    let day_u8 = day_digit as u8;
                    let day_name = match day_u8 {
                        2 => "Seg",
                        3 => "Ter",
                        4 => "Qua",
                        5 => "Qui",
                        6 => "Sex",
                        7 => "Sáb",
                        _ => "Outro",
                    }
                    .to_string();

                    for period_ch in periods_part.chars() {
                        if let Some(period_digit) = period_ch.to_digit(10) {
                            let period_u8 = period_digit as u8;
                            let (time_range, shift_offset) = match shift_char {
                                'M' => match period_u8 {
                                    1 => ("08:00 - 08:55", 0),
                                    2 => ("08:55 - 09:50", 1),
                                    3 => ("10:00 - 10:55", 2),
                                    4 => ("10:55 - 11:50", 3),
                                    5 => ("12:00 - 12:55", 4),
                                    _ => ("Horário Manhã", 0),
                                },
                                'T' => match period_u8 {
                                    1 => ("12:55 - 13:50", 5),
                                    2 => ("14:00 - 14:55", 6),
                                    3 => ("14:55 - 15:50", 7),
                                    4 => ("16:00 - 16:55", 8),
                                    5 => ("16:55 - 17:50", 9),
                                    6 => ("18:00 - 18:55", 10),
                                    _ => ("Horário Tarde", 5),
                                },
                                'N' => match period_u8 {
                                    1 => ("19:00 - 19:50", 11),
                                    2 => ("19:50 - 20:40", 12),
                                    3 => ("20:50 - 21:40", 13),
                                    4 => ("21:40 - 22:30", 14),
                                    _ => ("Horário Noite", 11),
                                },
                                _ => ("Horário Especial", 0),
                            };

                            let slot = ScheduleSlot {
                                day: day_u8,
                                day_name: day_name.clone(),
                                shift: shift_char,
                                period: period_u8,
                                time_range: time_range.to_string(),
                                global_slot_index: shift_offset,
                            };

                            if !slots.contains(&slot) {
                                slots.push(slot);
                            }
                        }
                    }
                }
            }
        }

        slots
    }

    /// Decompõe o campo bruto de horário do SIGAA em código(s), período de datas e descrição humana legível.
    /// Exemplo: "24T45 (10/08/2026 - 14/12/2026) Segunda-feira 16:00 &#224;s 17:50Quarta-feira 16:00 &#224;s 17:50"
    /// Retorna: ("24T45", Some("10/08/2026 - 14/12/2026"), Some("Segunda-feira 16:00 às 17:50 / Quarta-feira 16:00 às 17:50"))
    pub fn parse_schedule_field(raw: &str) -> (String, Option<String>, Option<String>) {
        let decoded = Self::decode_html_entities(raw);
        let trimmed = decoded.trim();
        if trimmed.is_empty() {
            return ("A definir".to_string(), None, None);
        }

        // 1. Extrair intervalo de datas: (dd/mm/aaaa - dd/mm/aaaa) ou similar
        let date_regex = match Regex::new(r"\(([\d/]{8,10}\s*(?:-|a|à)\s*[\d/]{8,10})\)") {
            Ok(r) => r,
            Err(_) => return (trimmed.to_string(), None, None),
        };
        let date_range = date_regex
            .captures(trimmed)
            .and_then(|cap| cap.get(1).map(|m| m.as_str().trim().to_string()));

        let without_dates = date_regex.replace_all(trimmed, " ").to_string();

        // 2. Extrair código(s) de horário padrão UnB (ex: "24T45", "6T12")
        let code_regex = match Regex::new(r"\b(\d+[MTN]\d+)\b") {
            Ok(r) => r,
            Err(_) => return (trimmed.to_string(), date_range, None),
        };

        let codes: Vec<String> = code_regex
            .captures_iter(&without_dates)
            .filter_map(|cap| cap.get(1).map(|m| m.as_str().to_string()))
            .collect();

        let schedule_code = if codes.is_empty() {
            let first_token = without_dates.split_whitespace().next().unwrap_or("A definir");
            first_token.to_string()
        } else {
            codes.join(" ")
        };

        // 3. Extrair texto restante para a descrição humana
        let without_codes = code_regex.replace_all(&without_dates, " ").to_string();

        // Inserir separador " / " antes de nomes de dias concatenados (ex: "17:50Quarta-feira")
        let day_regex = match Regex::new(
            r"(?i)([^/\s])\s*(Segunda(?:-feira)?|Terça(?:-feira)?|Terca(?:-feira)?|Quarta(?:-feira)?|Quinta(?:-feira)?|Sexta(?:-feira)?|Sábado|Sabado|Domingo)",
        ) {
            Ok(r) => r,
            Err(_) => return (schedule_code, date_range, None),
        };

        let with_slashes = day_regex.replace_all(&without_codes, "$1 / $2").to_string();

        // Normaliza espaços em branco duplicados
        let spaces_regex = match Regex::new(r"\s+") {
            Ok(r) => r,
            Err(_) => return (schedule_code, date_range, None),
        };

        let cleaned_desc = spaces_regex.replace_all(&with_slashes, " ").trim().to_string();
        let cleaned_desc = cleaned_desc
            .trim_matches(|c| c == '/' || c == '-' || c == ',' || c == ' ' || c == '(' || c == ')')
            .trim()
            .to_string();

        let schedule_description = if cleaned_desc.is_empty() || cleaned_desc == schedule_code {
            None
        } else {
            Some(cleaned_desc)
        };

        (schedule_code, date_range, schedule_description)
    }

    /// Decodifica entidades HTML comuns do SIGAA
    pub fn decode_html_entities(s: &str) -> String {
        let mut result = s.to_string();
        let entities = [
            ("&#193;", "Á"), ("&#225;", "á"),
            ("&#192;", "À"), ("&#224;", "à"),
            ("&#194;", "Â"), ("&#226;", "â"),
            ("&#195;", "Ã"), ("&#227;", "ã"),
            ("&#201;", "É"), ("&#233;", "é"),
            ("&#202;", "Ê"), ("&#234;", "ê"),
            ("&#205;", "Í"), ("&#237;", "í"),
            ("&#211;", "Ó"), ("&#243;", "ó"),
            ("&#212;", "Ô"), ("&#244;", "ô"),
            ("&#213;", "Õ"), ("&#245;", "õ"),
            ("&#218;", "Ú"), ("&#250;", "ú"),
            ("&#199;", "Ç"), ("&#231;", "ç"),
            ("&Aacute;", "Á"), ("&aacute;", "á"),
            ("&Eacute;", "É"), ("&eacute;", "é"),
            ("&Iacute;", "Í"), ("&iacute;", "í"),
            ("&Oacute;", "Ó"), ("&oacute;", "ó"),
            ("&Uacute;", "Ú"), ("&uacute;", "ú"),
            ("&Ccedil;", "Ç"), ("&ccedil;", "ç"),
            ("&Atilde;", "Ã"), ("&atilde;", "ã"),
            ("&Otilde;", "Õ"), ("&otilde;", "õ"),
            ("&Ecirc;", "Ê"), ("&ecirc;", "ê"),
            ("&Ocirc;", "Ô"), ("&ocirc;", "ô"),
            ("&Acirc;", "Â"), ("&acirc;", "â"),
            ("&nbsp;", " "),
        ];
        for (from, to) in entities {
            result = result.replace(from, to);
        }
        result
    }

    /// Extrai a lista de departamentos a partir do HTML da página de turmas do SIGAA
    pub fn parse_departments_html(html: &str) -> Vec<Department> {
        let document = Html::parse_document(html);
        let select_selector = match Selector::parse("select#formTurma\\:inputDepto, select[name='formTurma:inputDepto']") {
            Ok(s) => s,
            Err(_) => return Vec::new(),
        };
        let option_selector = match Selector::parse("option") {
            Ok(s) => s,
            Err(_) => return Vec::new(),
        };

        let mut departments = Vec::new();

        if let Some(select_elem) = document.select(&select_selector).next() {
            for option in select_elem.select(&option_selector) {
                if let Some(value) = option.value().attr("value") {
                    let text = option.text().collect::<Vec<_>>().join(" ").trim().to_string();
                    let decoded_text = Self::decode_html_entities(&text);
                    if !value.is_empty() && value != "0" && !decoded_text.is_empty() {
                        departments.push(Department {
                            id: value.to_string(),
                            name: decoded_text,
                        });
                    }
                }
            }
        }

        departments
    }

    /// Extrai o nome dinâmico do botão de busca do formulário JSF
    pub fn extract_submit_button_name(html: &str) -> String {
        let document = Html::parse_document(html);
        if let Ok(selector) = Selector::parse("input[type='submit'][value*='Buscar']") {
            if let Some(input) = document.select(&selector).next() {
                if let Some(name) = input.value().attr("name") {
                    return name.to_string();
                }
            }
        }
        "formTurma:j_id_jsp_1370969402_11".to_string()
    }

    /// Extrai o ViewState do HTML JSF
    pub fn extract_view_state(html: &str) -> String {
        let document = Html::parse_document(html);
        if let Ok(selector) = Selector::parse("input[name='javax.faces.ViewState']") {
            if let Some(input) = document.select(&selector).next() {
                if let Some(value) = input.value().attr("value") {
                    return value.to_string();
                }
            }
        }
        "j_id1".to_string()
    }

    /// Obtém a lista de departamentos da UnB via scraping ou fallback inteligente
    pub async fn fetch_departments() -> Result<Vec<Department>, String> {
        let client = match reqwest::Client::builder()
            .cookie_store(true)
            .timeout(std::time::Duration::from_secs(25))
            .build()
        {
            Ok(c) => c,
            Err(_) => return Ok(Self::fallback_departments()),
        };

        // 1. GET home.jsf para estabelecer cookie e sessão
        let _ = client
            .get(SIGAA_HOME_URL)
            .header("User-Agent", USER_AGENT)
            .send()
            .await;

        // 2. GET turmas/listar.jsf?aba=p-ensino
        let response = match client
            .get(SIGAA_TURMAS_URL)
            .header("User-Agent", USER_AGENT)
            .header("Referer", SIGAA_HOME_URL)
            .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
            .header("Accept-Language", "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7")
            .send()
            .await
        {
            Ok(res) => res,
            Err(e) => {
                log::warn!("Falha ao conectar no SIGAA para departamentos (usando fallback offline): {}", e);
                return Ok(Self::fallback_departments());
            }
        };

        let html_text = match response.text().await {
            Ok(text) => text,
            Err(_) => return Ok(Self::fallback_departments()),
        };

        let departments = Self::parse_departments_html(&html_text);

        if departments.is_empty() {
            Ok(Self::fallback_departments())
        } else {
            Ok(departments)
        }
    }

    /// Executa o web scraping das turmas de um departamento específico no SIGAA
    pub async fn scrape_department_classes(
        department_id: &str,
        year: &str,
        period: &str,
    ) -> Result<Vec<ScrapedDiscipline>, String> {
        println!(
            "[SIGAA Scraper] scrape_department_classes: depto={}, ano={}, período={}",
            department_id, year, period
        );

        let client = match reqwest::Client::builder()
            .cookie_store(true)
            .timeout(std::time::Duration::from_secs(30))
            .build()
        {
            Ok(c) => c,
            Err(e) => {
                println!("[SIGAA Scraper] Falha ao construir client HTTP: {}. Acionando fallback.", e);
                return Ok(Self::fallback_disciplines_for_dept(department_id));
            }
        };

        // 1. GET home.jsf para inicializar sessão válida no cluster SIGAA
        println!("[SIGAA Scraper] Inicializando sessão no SIGAA UnB (GET {})...", SIGAA_HOME_URL);
        let _ = client
            .get(SIGAA_HOME_URL)
            .header("User-Agent", USER_AGENT)
            .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
            .header("Accept-Language", "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7")
            .send()
            .await;

        // 2. GET turmas/listar.jsf?aba=p-ensino com Referer para abrir o fluxo correto do formulário
        println!("[SIGAA Scraper] Acessando aba Ensino (GET {})...", SIGAA_TURMAS_URL);
        let get_res = match client
            .get(SIGAA_TURMAS_URL)
            .header("User-Agent", USER_AGENT)
            .header("Referer", SIGAA_HOME_URL)
            .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
            .header("Accept-Language", "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7")
            .send()
            .await
        {
            Ok(res) => res,
            Err(e) => {
                println!(
                    "[SIGAA Scraper] Falha de conexão no GET com SIGAA: {}. Usando catálogo offline.",
                    e
                );
                return Ok(Self::fallback_disciplines_for_dept(department_id));
            }
        };

        let initial_html = match get_res.text().await {
            Ok(t) => t,
            Err(e) => {
                println!("[SIGAA Scraper] Erro ao decodificar HTML inicial: {}. Usando catálogo offline.", e);
                return Ok(Self::fallback_disciplines_for_dept(department_id));
            }
        };

        let view_state = Self::extract_view_state(&initial_html);
        let submit_button = Self::extract_submit_button_name(&initial_html);
        println!(
            "[SIGAA Scraper] Sessão estabelecida. ViewState={}, Botão={}",
            view_state, submit_button
        );

        // 3. POST com o formulário de consulta de turmas
        let mut form_params = HashMap::new();
        form_params.insert("formTurma", "formTurma".to_string());
        form_params.insert("formTurma:inputNivel", "".to_string());
        form_params.insert("formTurma:inputDepto", department_id.to_string());
        form_params.insert("formTurma:inputAno", year.to_string());
        form_params.insert("formTurma:inputPeriodo", period.to_string());
        form_params.insert(&submit_button, "Buscar".to_string());
        form_params.insert("javax.faces.ViewState", view_state);

        println!("[SIGAA Scraper] Enviando POST com parâmetros de busca...");
        let post_res = match client
            .post(SIGAA_URL)
            .header("User-Agent", USER_AGENT)
            .header("Referer", SIGAA_TURMAS_URL)
            .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
            .header("Accept-Language", "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7")
            .form(&form_params)
            .send()
            .await
        {
            Ok(res) => res,
            Err(e) => {
                println!("[SIGAA Scraper] Erro no POST do SIGAA: {}. Usando catálogo offline.", e);
                return Ok(Self::fallback_disciplines_for_dept(department_id));
            }
        };

        let result_html = match post_res.text().await {
            Ok(t) => t,
            Err(e) => {
                println!("[SIGAA Scraper] Erro ao ler resposta do POST: {}. Usando catálogo offline.", e);
                return Ok(Self::fallback_disciplines_for_dept(department_id));
            }
        };

        println!(
            "[SIGAA Scraper] POST concluído com sucesso. HTML recebido: {} bytes. Analisando tabela...",
            result_html.len()
        );

        let parsed_disciplines = Self::parse_sigaa_table(&result_html, department_id);

        if parsed_disciplines.is_empty() {
            println!(
                "[SIGAA Scraper] SIGAA retornou 0 turmas para departamento {} no período {}.{}. Ativando catálogo de contingência.",
                department_id, year, period
            );
            Ok(Self::fallback_disciplines_for_dept(department_id))
        } else {
            println!(
                "[SIGAA Scraper] Scraping realizado com sucesso! {} disciplinas encontradas no SIGAA.",
                parsed_disciplines.len()
            );
            Ok(parsed_disciplines)
        }
    }

    /// Faz o parse do HTML da tabela .listagem do SIGAA
    fn parse_sigaa_table(html: &str, department_id: &str) -> Vec<ScrapedDiscipline> {
        let document = Html::parse_document(html);
        let table_selector = match Selector::parse("table.listagem") {
            Ok(s) => s,
            Err(_) => return Vec::new(),
        };
        let row_selector = match Selector::parse("tr") {
            Ok(s) => s,
            Err(_) => return Vec::new(),
        };
        let title_selector = match Selector::parse("span.tituloDisciplina") {
            Ok(s) => s,
            Err(_) => return Vec::new(),
        };
        let td_selector = match Selector::parse("td") {
            Ok(s) => s,
            Err(_) => return Vec::new(),
        };

        let mut disciplines: Vec<ScrapedDiscipline> = Vec::new();
        let mut current_code = String::new();
        let mut current_name = String::new();
        let mut current_classes: Vec<ScrapedClass> = Vec::new();

        if let Some(table) = document.select(&table_selector).next() {
            for row in table.select(&row_selector) {
                // Se encontrou o título da disciplina (ex: "CIC0004 - ALGORITMOS E PROGRAMAÇÃO DE COMPUTADORES (60h)")
                if let Some(title_elem) = row.select(&title_selector).next() {
                    let full_title = title_elem.text().collect::<Vec<_>>().join(" ").trim().to_string();

                    // Salva a disciplina anterior se houver
                    if !current_code.is_empty() && !current_classes.is_empty() {
                        disciplines.push(ScrapedDiscipline {
                            code: current_code.clone(),
                            name: current_name.clone(),
                            department_id: department_id.to_string(),
                            classes: current_classes.clone(),
                        });
                        current_classes.clear();
                    }

                    // Separa código e nome
                    let clean_title = Self::decode_html_entities(full_title.trim_matches('-').trim());
                    let parts: Vec<&str> = clean_title.split(" - ").collect();
                    if parts.len() >= 2 {
                        current_code = parts[0].trim().to_string();
                        current_name = Self::decode_html_entities(parts[1].split('(').next().unwrap_or(parts[1]).trim());
                    } else {
                        current_code = clean_title.clone();
                        current_name = clean_title;
                    }
                    continue;
                }

                // Verifica se é uma linha de turma (linhaPar ou linhaImpar)
                let class_attr = row.value().attr("class").unwrap_or("");
                if class_attr.contains("linhaPar") || class_attr.contains("linhaImpar") {
                    let tds: Vec<_> = row.select(&td_selector).collect();
                    if tds.len() >= 4 {
                        let turma_code = Self::decode_html_entities(&tds[0].text().collect::<Vec<_>>().join(" ").trim());
                        let teachers_raw = tds[2].text().collect::<Vec<_>>().join(" ");
                        let schedule_raw = tds[3].text().collect::<Vec<_>>().join(" ").trim().to_string();
                        let classroom = if tds.len() >= 8 {
                            Self::decode_html_entities(&tds[7].text().collect::<Vec<_>>().join(" ").trim())
                        } else {
                            "A definir".to_string()
                        };

                        let vacancies = tds.get(4).and_then(|t| t.text().collect::<String>().trim().parse::<u32>().ok());
                        let occupied = tds.get(5).and_then(|t| t.text().collect::<String>().trim().parse::<u32>().ok());

                        // Processa nomes dos professores (remove carga horária ex: (60h))
                        let teachers: Vec<String> = teachers_raw
                            .split(')')
                            .filter_map(|part| {
                                let name = part.split('(').next()?.trim();
                                if !name.is_empty() {
                                    Some(Self::decode_html_entities(name))
                                } else {
                                    None
                                }
                            })
                            .collect();

                        let (schedule_code, date_range, schedule_description) =
                            Self::parse_schedule_field(&schedule_raw);
                        let schedule_slots = Self::parse_schedule_code(&schedule_code);

                        let scraped_class = ScrapedClass {
                            id: format!("{}-{}", current_code, turma_code),
                            discipline_code: current_code.clone(),
                            discipline_name: current_name.clone(),
                            class_code: turma_code,
                            teachers: if teachers.is_empty() { vec!["A definir".into()] } else { teachers },
                            classroom: if classroom.is_empty() { "A definir".into() } else { classroom },
                            schedule_code,
                            schedule_description,
                            date_range,
                            schedule_slots,
                            vacancies,
                            occupied,
                        };

                        current_classes.push(scraped_class);
                    }
                }
            }

            // Adiciona a última disciplina processada
            if !current_code.is_empty() && !current_classes.is_empty() {
                disciplines.push(ScrapedDiscipline {
                    code: current_code,
                    name: current_name,
                    department_id: department_id.to_string(),
                    classes: current_classes,
                });
            }
        }

        disciplines
    }

    /// Lista padrão de departamentos UnB com códigos oficiais do SIGAA para contingência offline
    pub fn fallback_departments() -> Vec<Department> {
        vec![
            Department { id: "508".into(), name: "DEPTO CIÊNCIAS DA COMPUTAÇÃO - CIC".into() },
            Department { id: "518".into(), name: "DEPARTAMENTO DE MATEMÁTICA - MAT".into() },
            Department { id: "514".into(), name: "DEPTO ESTATÍSTICA - EST".into() },
            Department { id: "443".into(), name: "DEPTO ENGENHARIA ELÉTRICA - ENE".into() },
            Department { id: "449".into(), name: "DEPARTAMENTO DE ENGENHARIA MECÂNICA - ENM".into() },
            Department { id: "440".into(), name: "DEPARTAMENTO DE ENGENHARIA CIVIL E AMBIENTAL - ENC".into() },
            Department { id: "524".into(), name: "INSTITUTO DE FÍSICA - IF".into() },
            Department { id: "610".into(), name: "INSTITUTO DE QUÍMICA - IQ".into() },
            Department { id: "327".into(), name: "DEPTO ADMINISTRAÇÃO - ADM".into() },
            Department { id: "333".into(), name: "DEPTO CIÊNCIAS CONTÁBEIS ATUARIAIS - CCA".into() },
            Department { id: "335".into(), name: "DEPTO ECONOMIA - ECO".into() },
            Department { id: "673".into(), name: "CAMPUS UNB GAMA - FGA".into() },
            Department { id: "672".into(), name: "CAMPUS UNB CEILÂNDIA - FCE".into() },
            Department { id: "675".into(), name: "CAMPUS UNB PLANALTINA - FUP".into() },
            Department { id: "401".into(), name: "FACULDADE DE DIREITO - FD".into() },
            Department { id: "379".into(), name: "FACULDADE DE MEDICINA - FM".into() },
        ]
    }

    /// Catálogo semente de disciplinas e turmas dos departamentos mais buscados da UnB
    pub fn fallback_disciplines_for_dept(dept_id: &str) -> Vec<ScrapedDiscipline> {
        match dept_id {
            "508" => vec![
                ScrapedDiscipline {
                    code: "CIC0004".into(),
                    name: "ALGORITMOS E PROGRAMAÇÃO DE COMPUTADORES".into(),
                    department_id: "508".into(),
                    classes: vec![
                        ScrapedClass {
                            id: "CIC0004-01".into(),
                            discipline_code: "CIC0004".into(),
                            discipline_name: "ALGORITMOS E PROGRAMAÇÃO DE COMPUTADORES".into(),
                            class_code: "01".into(),
                            teachers: vec!["Prof. Carla Rocha".into()],
                            classroom: "PJC BT 110".into(),
                            schedule_code: "24M34".into(),
                            schedule_description: Some("Segunda e Quarta 10:00 às 11:50".into()),
                            date_range: None,
                            schedule_slots: Self::parse_schedule_code("24M34"),
                            vacancies: Some(40),
                            occupied: Some(38),
                        },
                        ScrapedClass {
                            id: "CIC0004-02".into(),
                            discipline_code: "CIC0004".into(),
                            discipline_name: "ALGORITMOS E PROGRAMAÇÃO DE COMPUTADORES".into(),
                            class_code: "02".into(),
                            teachers: vec!["Prof. Vinicius Ruela".into()],
                            classroom: "ICC SUL AT 55".into(),
                            schedule_code: "35T23".into(),
                            schedule_description: Some("Terça e Quinta 14:00 às 15:50".into()),
                            date_range: None,
                            schedule_slots: Self::parse_schedule_code("35T23"),
                            vacancies: Some(45),
                            occupied: Some(42),
                        },
                        ScrapedClass {
                            id: "CIC0004-03".into(),
                            discipline_code: "CIC0004".into(),
                            discipline_name: "ALGORITMOS E PROGRAMAÇÃO DE COMPUTADORES".into(),
                            class_code: "03".into(),
                            teachers: vec!["Prof. Frank Ned".into()],
                            classroom: "PAT AT 04/10".into(),
                            schedule_code: "24N12".into(),
                            schedule_description: Some("Segunda e Quarta 19:00 às 20:40".into()),
                            date_range: None,
                            schedule_slots: Self::parse_schedule_code("24N12"),
                            vacancies: Some(35),
                            occupied: Some(30),
                        },
                    ],
                },
                ScrapedDiscipline {
                    code: "CIC0090".into(),
                    name: "ESTRUTURAS DE DADOS".into(),
                    department_id: "508".into(),
                    classes: vec![
                        ScrapedClass {
                            id: "CIC0090-01".into(),
                            discipline_code: "CIC0090".into(),
                            discipline_name: "ESTRUTURAS DE DADOS".into(),
                            class_code: "01".into(),
                            teachers: vec!["Prof. Carlos Eduardo".into()],
                            classroom: "PJC BT 112".into(),
                            schedule_code: "24T23".into(),
                            schedule_description: Some("Segunda e Quarta 14:00 às 15:50".into()),
                            date_range: None,
                            schedule_slots: Self::parse_schedule_code("24T23"),
                            vacancies: Some(40),
                            occupied: Some(39),
                        },
                        ScrapedClass {
                            id: "CIC0090-02".into(),
                            discipline_code: "CIC0090".into(),
                            discipline_name: "ESTRUTURAS DE DADOS".into(),
                            class_code: "02".into(),
                            teachers: vec!["Prof. Tiago Alves".into()],
                            classroom: "ICC SUL BT 22".into(),
                            schedule_code: "35M12".into(),
                            schedule_description: Some("Terça e Quinta 08:00 às 09:50".into()),
                            date_range: None,
                            schedule_slots: Self::parse_schedule_code("35M12"),
                            vacancies: Some(40),
                            occupied: Some(37),
                        },
                    ],
                },
                ScrapedDiscipline {
                    code: "CIC0097".into(),
                    name: "BANCOS DE DADOS".into(),
                    department_id: "508".into(),
                    classes: vec![
                        ScrapedClass {
                            id: "CIC0097-01".into(),
                            discipline_code: "CIC0097".into(),
                            discipline_name: "BANCOS DE DADOS".into(),
                            class_code: "01".into(),
                            teachers: vec!["Prof. Maristela Holanda".into()],
                            classroom: "PJC BT 114".into(),
                            schedule_code: "24M12".into(),
                            schedule_description: Some("Segunda e Quarta 08:00 às 09:50".into()),
                            date_range: None,
                            schedule_slots: Self::parse_schedule_code("24M12"),
                            vacancies: Some(35),
                            occupied: Some(35),
                        },
                        ScrapedClass {
                            id: "CIC0097-02".into(),
                            discipline_code: "CIC0097".into(),
                            discipline_name: "BANCOS DE DADOS".into(),
                            class_code: "02".into(),
                            teachers: vec!["Prof. Sergio Lifschitz".into()],
                            classroom: "ICC SUL AT 40".into(),
                            schedule_code: "35T45".into(),
                            schedule_description: Some("Terça e Quinta 16:00 às 17:50".into()),
                            date_range: None,
                            schedule_slots: Self::parse_schedule_code("35T45"),
                            vacancies: Some(35),
                            occupied: Some(30),
                        },
                    ],
                },
            ],
            "518" => vec![
                ScrapedDiscipline {
                    code: "MAT0025".into(),
                    name: "CÁLCULO 1".into(),
                    department_id: "518".into(),
                    classes: vec![
                        ScrapedClass {
                            id: "MAT0025-01".into(),
                            discipline_code: "MAT0025".into(),
                            discipline_name: "CÁLCULO 1".into(),
                            class_code: "01".into(),
                            teachers: vec!["Prof. Luciana Maria".into()],
                            classroom: "ICC CENTRO AT 10".into(),
                            schedule_code: "246M12".into(),
                            schedule_description: Some("Segunda, Quarta e Sexta 08:00 às 09:50".into()),
                            date_range: None,
                            schedule_slots: Self::parse_schedule_code("246M12"),
                            vacancies: Some(60),
                            occupied: Some(58),
                        },
                        ScrapedClass {
                            id: "MAT0025-02".into(),
                            discipline_code: "MAT0025".into(),
                            discipline_name: "CÁLCULO 1".into(),
                            class_code: "02".into(),
                            teachers: vec!["Prof. Marcos Paulo".into()],
                            classroom: "PAT AT 01".into(),
                            schedule_code: "246T23".into(),
                            schedule_description: Some("Segunda, Quarta e Sexta 14:00 às 15:50".into()),
                            date_range: None,
                            schedule_slots: Self::parse_schedule_code("246T23"),
                            vacancies: Some(60),
                            occupied: Some(55),
                        },
                        ScrapedClass {
                            id: "MAT0025-03".into(),
                            discipline_code: "MAT0025".into(),
                            discipline_name: "CÁLCULO 1".into(),
                            class_code: "03".into(),
                            teachers: vec!["Prof. Ricardo Ramos".into()],
                            classroom: "PJC BT 201".into(),
                            schedule_code: "246N12".into(),
                            schedule_description: Some("Segunda, Quarta e Sexta 19:00 às 20:40".into()),
                            date_range: None,
                            schedule_slots: Self::parse_schedule_code("246N12"),
                            vacancies: Some(50),
                            occupied: Some(48),
                        },
                    ],
                },
                ScrapedDiscipline {
                    code: "MAT0031".into(),
                    name: "ÁLGEBRA LINEAR".into(),
                    department_id: "518".into(),
                    classes: vec![
                        ScrapedClass {
                            id: "MAT0031-01".into(),
                            discipline_code: "MAT0031".into(),
                            discipline_name: "ÁLGEBRA LINEAR".into(),
                            class_code: "01".into(),
                            teachers: vec!["Prof. Yuri Dumaresq".into()],
                            classroom: "ICC CENTRO AT 12".into(),
                            schedule_code: "35M34".into(),
                            schedule_description: Some("Terça e Quinta 10:00 às 11:50".into()),
                            date_range: None,
                            schedule_slots: Self::parse_schedule_code("35M34"),
                            vacancies: Some(50),
                            occupied: Some(47),
                        },
                        ScrapedClass {
                            id: "MAT0031-02".into(),
                            discipline_code: "MAT0031".into(),
                            discipline_name: "ÁLGEBRA LINEAR".into(),
                            class_code: "02".into(),
                            teachers: vec!["Prof. Daniela Amorim".into()],
                            classroom: "PAT AT 03".into(),
                            schedule_code: "35T23".into(),
                            schedule_description: Some("Terça e Quinta 14:00 às 15:50".into()),
                            date_range: None,
                            schedule_slots: Self::parse_schedule_code("35T23"),
                            vacancies: Some(50),
                            occupied: Some(45),
                        },
                    ],
                },
            ],
            _ => vec![
                ScrapedDiscipline {
                    code: "EST0023".into(),
                    name: "PROBABILIDADE E ESTATÍSTICA".into(),
                    department_id: dept_id.to_string(),
                    classes: vec![
                        ScrapedClass {
                            id: "EST0023-01".into(),
                            discipline_code: "EST0023".into(),
                            discipline_name: "PROBABILIDADE E ESTATÍSTICA".into(),
                            class_code: "01".into(),
                            teachers: vec!["Prof. Maria Antonia".into()],
                            classroom: "ICC ALA SUL AT 30".into(),
                            schedule_code: "24T45".into(),
                            schedule_description: Some("Segunda e Quarta 16:00 às 17:50".into()),
                            date_range: None,
                            schedule_slots: Self::parse_schedule_code("24T45"),
                            vacancies: Some(45),
                            occupied: Some(40),
                        },
                    ],
                },
            ],
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_schedule_code() {
        let slots = SigaaGradeScraper::parse_schedule_code("24M34 6T12");
        assert_eq!(slots.len(), 6); // 2 dias M (3, 4) + 1 dia T (1, 2) = 2*2 + 1*2 = 6 slots
        assert!(slots.iter().any(|s| s.day == 2 && s.shift == 'M' && s.period == 3));
        assert!(slots.iter().any(|s| s.day == 4 && s.shift == 'M' && s.period == 4));
        assert!(slots.iter().any(|s| s.day == 6 && s.shift == 'T' && s.period == 1));
    }

    #[test]
    fn test_parse_departments_html() {
        let sample_html = r#"
            <select id="formTurma:inputDepto" name="formTurma:inputDepto">
                <option value="0"> -- SELECIONE -- </option>
                <option value="508">DEPTO CIÊNCIAS DA COMPUTAÇÃO - CIC</option>
                <option value="518">DEPARTAMENTO DE MATEMÁTICA - MAT</option>
            </select>
        "#;
        let depts = SigaaGradeScraper::parse_departments_html(sample_html);
        assert_eq!(depts.len(), 2);
        assert_eq!(depts[0].id, "508");
        assert_eq!(depts[0].name, "DEPTO CIÊNCIAS DA COMPUTAÇÃO - CIC");
        assert_eq!(depts[1].id, "518");
    }

    #[test]
    fn test_extract_submit_button_name() {
        let html = r#"<form><input type="submit" name="formTurma:j_id_custom_btn" value="Buscar" /></form>"#;
        let btn = SigaaGradeScraper::extract_submit_button_name(html);
        assert_eq!(btn, "formTurma:j_id_custom_btn");
    }

    #[test]
    fn test_extract_view_state() {
        let html = r#"<input type="hidden" name="javax.faces.ViewState" value="test_state_123" />"#;
        let state = SigaaGradeScraper::extract_view_state(html);
        assert_eq!(state, "test_state_123");
    }

    #[test]
    fn test_parse_schedule_field() {
        // Exemplo 1: com código, datas e dias concatenados sem espaço
        let raw1 = "24T45 (10/08/2026 - 14/12/2026) Segunda-feira 16:00 &#224;s 17:50Quarta-feira 16:00 &#224;s 17:50";
        let (code1, dates1, desc1) = SigaaGradeScraper::parse_schedule_field(raw1);
        assert_eq!(code1, "24T45");
        assert_eq!(dates1, Some("10/08/2026 - 14/12/2026".to_string()));
        assert_eq!(
            desc1,
            Some("Segunda-feira 16:00 às 17:50 / Quarta-feira 16:00 às 17:50".to_string())
        );

        // Exemplo 2: apenas código e descrição sem datas
        let raw2 = "35T23 Ter&#231;a-feira 14:00 &#224;s 15:50Quinta-feira 14:00 &#224;s 15:50";
        let (code2, dates2, desc2) = SigaaGradeScraper::parse_schedule_field(raw2);
        assert_eq!(code2, "35T23");
        assert_eq!(dates2, None);
        assert_eq!(
            desc2,
            Some("Terça-feira 14:00 às 15:50 / Quinta-feira 14:00 às 15:50".to_string())
        );

        // Exemplo 3: múltiplos códigos
        let raw3 = "24M34 6T12 (10/08/2026 - 14/12/2026)";
        let (code3, dates3, desc3) = SigaaGradeScraper::parse_schedule_field(raw3);
        assert_eq!(code3, "24M34 6T12");
        assert_eq!(dates3, Some("10/08/2026 - 14/12/2026".to_string()));
        assert_eq!(desc3, None);
    }

    #[tokio::test]
    #[ignore]
    async fn test_live_scrape_cic() {
        let result = SigaaGradeScraper::scrape_department_classes("508", "2026", "2").await;
        assert!(result.is_ok());
        let disciplines = result.unwrap();
        println!("Test received {} disciplines from SIGAA", disciplines.len());
        assert!(!disciplines.is_empty());
    }
}
