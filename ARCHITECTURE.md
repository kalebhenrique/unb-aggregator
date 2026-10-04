# Arquitetura

Clean Architecture (portas e adapters) com um núcleo TypeScript e um driver Rust.
A regra de dependência é uma só: **as setas apontam para dentro**.

```
            ┌──────────────────────────────────────────────┐
            │              src/ (apresentação)             │
            │  screens/  components/  hooks/  context/     │
            └──────────────────────┬───────────────────────┘
                                   │ usa casos de uso
            ┌──────────────────────▼───────────────────────┐
            │               src/core/                      │
            │                                              │
            │  application/  (use cases)                   │
            │      │ depende apenas de                     │
            │      ▼                                       │
            │  domain/       (entidades + portas)          │
            │      ▲                                       │
            │      │ implementa                            │
            │  infrastructure/ (adapters: Tauri, in-memory)│
            └──────────────────────┬───────────────────────┘
                                   │ chama commands
            ┌──────────────────────▼───────────────────────┐
            │        src-tauri/ (Rust: driver de I/O)      │
            │  sigaa/ moodle/ grade_scraper/ solver/       │
            └──────────────────────────────────────────────┘
```

Nada em `domain/` depende de plataforma. Nada em `application/` depende de
infraestrutura. O código de apresentação nunca importa adapters: fala com o
core através de use cases. `src-tauri` não conhece o core.

## Mapa do código

```
src/
  core/
    domain/          entidades (Course, FeedItem, Grade...) + portas (I*Repository)
    application/     um use case por operação do produto
    infrastructure/  adapters Tauri + in-memory + bindings IPC gerados
    container.ts     composition root
    index.ts         API pública do core (barrel)
  components/        UI: ui/ (primitivos estilo shadcn) + feed/ + grade/
  screens/           telas
  hooks/  context/   cola React
  lib/               utilitários (cn, openExternalUrl)
src-tauri/           scraping, solver de horários, commands IPC
```

## Portas e adapters

O `container.ts` é o único arquivo que conhece implementações concretas.
A escolha do adapter acontece por ambiente, não dentro dos adapters:

| Porta | Ambiente Tauri | Navegador (dev/preview) |
|---|---|---|
| `ICredentialsRepository` | `StrongholdCredentialsRepository` | o próprio adapter cai para store em memória |
| `ISyncRepository` | `TauriSyncRepository` | `InMemorySyncRepository` (dados demo) |
| `IFeedRepository` | `SqliteFeedRepository` | `InMemoryFeedRepository` |
| `IGradeRepository` | `TauriGradeRepository` | `InMemoryGradeRepository` (dados demo) |

Testes injam os próprios repositórios via `ContainerOverrides` — nenhum use
case toca rede ou banco.

## IPC Rust e bindings gerados

A superfície IPC tem fonte única: os commands anotados em `src-tauri/src/lib.rs`
(`collect_commands!`). Os bindings TypeScript são gerados a partir deles:

```sh
cargo test export_bindings   # gera src/core/infrastructure/bindings.ts
```

Os adapters TS importam `commands` de `bindings.ts` — nunca chamam `invoke`
com string solta. Tipos novos no lado Rust (derive `specta::Type`) aparecem
no TS na próxima geração.

**Convenção: Rust é driver.** Faz HTTP, sessão e parsing das plataformas
(Sigaa, Aprender 3, MoodleMat, Teams) e resolve a grade; não conhece regras
de aplicação. O mapeamento para tipos de domínio acontece na fronteira dos
adapters TS. Os fallbacks locais de solver/conflito em `TauriGradeRepository`
existem só como degradação elegante quando o comando nativo falha.

## Guardrails

Regras em `eslint.config.js` mantêm a fronteira sem revisão humana:

- Fora de `src/core`: proibido importar `core/infrastructure` e proibido
  abrir `core/domain`/`core/application` direto — use o barrel `@/core`.
- `src/core/domain`: não depende de nada fora de si.
- `src/core/application`: depende apenas do domínio.

Exceção declarada: `src/lib/utils.ts` importa os bindings gerados para o
comando `open_external_url`.

## Verificação

```sh
pnpm lint        # fronteira + qualidade
pnpm typecheck   # tsc --noEmit
pnpm test        # use cases com repos in-memory
cargo test       # Rust, incluindo geração dos bindings
```
