# ADR 0002: Stronghold para credenciais

- Status: aceito (2026-10)

## Contexto

O app pede credenciais institucionais (SIGAA, Aprender 3, MoodleMat, Teams).
Promessa central do produto: os dados do aluno ficam no dispositivo,
criptografados. O plugin `tauri-plugin-stronghold` (Argon2 + IOTA Stronghold)
atende no desktop.

## Decisão

Credenciais no cofre Stronghold local, atrás da porta
`ICredentialsRepository`. A troca do mecanismo (ex.: Keychain/Keystore no
futuro mobile) é escrever outro adapter e mudar uma linha no `container.ts` —
nenhum use case muda.

## Consequências

- Suporte do Stronghold a mobile ainda precisa de verificação; se não houver,
  o mobile recebe um adapter próprio (janela de decisão permanece aberta).
- O vault usa senha derivada e salt por instalação (`vault.salt`).
