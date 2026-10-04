# ADR 0003: Projeto único, sem monorepo

- Status: aceito (2026-10)

## Contexto

O projeto nasceu como monorepo pnpm (`apps/desktop`, `packages/core`,
`packages/ui`). Com um único app Tauri, os packages cobravam indireção sem
comprar reuso: o UI era só primitivos estilo shadcn, e o core não tinha
segundo consumidor.

## Decisão

Raiz do repositório é o app. `packages/core` virou `src/core`,
`packages/ui` virou `src/components/ui`; `pnpm-workspace.yaml` foi removido.
A fronteira de camadas passou a ser guardada por regras ESLint
(`no-restricted-imports` em `eslint.config.js`) em vez de grafo de
dependências de workspace.

## Consequências

- Chegar ao código é mais direto: `src/` de uma vez.
- A fronteira depende do lint rodar (CI ou hook) — o config veio com o lint
  script e regras testadas contra violações.
- Extrair `src/core` de volta a um package, se um segundo consumidor surgir,
  é `git mv` + um `package.json`.
