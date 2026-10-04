# ADR 0004: Mobile Tauri adiado

- Status: aceito (2026-10)

## Contexto

Tauri 2 compila o mesmo core Rust para iOS e Android (`tauri ios init` /
`tauri android init` geram targets dentro do próprio projeto — não há
`apps/mobile` duplicado). A UI web é a mesma; responsividade e store
workflow são o trabalho real. Não existe demanda confirmada de mobile hoje.

## Decisão

Decisão adiada até haver sinal real. Quando chegar: inicializar os targets
dentro deste projeto, revisar capabilities por plataforma e reavaliar o
adapter de credenciais (ADR 0002) para Keychain/Keystore se necessário.

## Consequências

- Nenhum código mobile existe hoje; nenhuma pasta promete o que não existe.
- As portas (`ICredentialsRepository`, etc.) garantem que o dia de.mobile
  custa adapters novos, não reescrita de use cases.
