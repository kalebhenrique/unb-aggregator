# ADR 0001: Rust para scraping e solver de horários

- Status: aceito (2026-10)

## Contexto

Sincronizar SIGAA e Aprender 3 exige HTTP com sessão, parsing de HTML e
raspagem pesada; o solver de grade percorre combinações de turmas. Tudo isso
roda dentro de um app Tauri.

## Decisão

Scraping, sessão e solver vivem em Rust (`src-tauri`), expostos como commands
IPC tipados. O núcleo de regras (entidades, use cases) permanece em TypeScript
(`src/core`), e o Rust é tratado como driver: sem regras de aplicação.

## Consequências

- Tipos de IPC são fonte única em Rust; bindings TS gerados via tauri-specta
  (`cargo test export_bindings`).
- Custa manter `models.rs` paralelo às entidades TS na fronteira — mitigado
  pelos bindings gerados.
- Solver e conflito têm espelho em TypeScript apenas como fallback de
  degradação quando o comando nativo falha; dono canônico é o Rust.
