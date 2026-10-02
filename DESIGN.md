---
name: UnB Aggregator
description: Feed acadêmico unificado da UnB com visual de mural de adesivos — borda preta declarada, sombra dura sem blur, cores de material escolar
colors:
  pen-blue: "#468AFB"
  pen-blue-deep: "#3574DC"
  highlighter-yellow: "#FFE600"
  chalk-green: "#46E297"
  correction-red: "#FF6B6B"
  notebook-purple: "#C084FC"
  pencil-orange: "#FB923C"
  sky-blue: "#60A5FA"
  institutional-green: "#006633"
  grid-paper: "#E8EFF8"
  paper-cream: "#FAF7EE"
  pastel-blue: "#EBF3FF"
  pastel-green: "#E6F8EE"
  pastel-yellow: "#FFF9D2"
  pastel-purple: "#F3E8FF"
  pastel-red: "#FFEBEB"
  success-ink: "#16A34A"
  error-ink: "#DC2626"
  ink-black: "#000000"
  ink-soft: "#525252"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3rem)"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  heading:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.05em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "9999px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.pen-blue}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.pen-blue-deep}"
  button-accent:
    backgroundColor: "{colors.chalk-green}"
    textColor: "#000000"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 20px"
  button-yellow:
    backgroundColor: "{colors.highlighter-yellow}"
    textColor: "#000000"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 20px"
  button-destructive:
    backgroundColor: "{colors.correction-red}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 20px"
  button-outline:
    backgroundColor: "#ffffff"
    textColor: "#000000"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    height: "40px"
    padding: "0 20px"
  card-default:
    backgroundColor: "#ffffff"
    textColor: "#000000"
    rounded: "{rounded.lg}"
    padding: "24px"
  card-pastel-blue:
    backgroundColor: "{colors.pastel-blue}"
    textColor: "#000000"
    rounded: "{rounded.lg}"
    padding: "24px"
  input-default:
    backgroundColor: "#ffffff"
    textColor: "#000000"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  badge-sticker:
    backgroundColor: "#ffffff"
    textColor: "#000000"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px 12px"
---

# Design System: UnB Aggregator

## Overview

**Creative North Star: "Mural de Adesivos"**

Todo o sistema se comporta como uma muralha de papel quadriculado onde adesivos grossos foram pressionados à mão: cards, badges, botões e campos são adesivos com borda preta declarada (2px sólida) e sombra dura deslocada, sem um pixel de blur. Nada flutua no ar — tudo está *colado* na superfície. Quando o usuário clica, o adesivo afunda fisicamente: a sombra desaparece e o elemento se desloca na direção dela. A interface responde ao toque como objeto, não como holograma.

A personalidade é de app de estudante, não de empresa: cores de material escolar (caneta azul, marca-texto amarelo, giz verde, caneta corretora vermelha) sobre papel quadriculado sutil, com hierarquia construída por peso tipográfico (black/extrabold/bold) em vez de tons de cinza apagados. Por baixo da brincadeira existe um produto de trabalho sério: densidade organizada, grid discreto, ritmo consistente de 150ms em todas as transições.

O mundo é opaco e de alto contraste. Sombras suaves difusas, vidro fosco, gradiente e translucidez são a anti-referência declarada — nunca entram.

**Key Characteristics:**

- Borda preta de 2px em toda superfície e elemento interativo
- Sombra dura deslocada, cor preta sólida, blur zero
- Física de pressionar: hover levanta, active afunda até a sombra sumir
- Cores candy de material escolar sobre papel quadriculado (#E8EFF8, grid de 32px)
- Hierarquia por peso de fonte, não por cinza
- Raio generoso (12–16px) suavizando a agressividade das bordas
- Tudo em 150ms ease-out

## Colors

Paleta de material escolar: uma cor de ação por intenção, versões pastel das mesmas cores para superfícies de apoio, tudo costurado por preto de tinta.

### Primary
- **Azul Caneta** (#468AFB): a cor de ação do produto. Botões primários, tabs ativas, item de navegação ativo (fundo cheio com texto branco), foco de inputs (ring), links de marca ("Aggregator" no logo), ícones de cabeçalho de página. Hover escurece para **Azul Caneta Pressionado** (#3574DC).

### Secondary
- **Amarelo Marca-Texto** (#FFE600): ação de destaque e badge de tarefa/entrega — o amarelo de grifo em cima da leitura. Sempre com texto preto.
- **Verde Giz** (#46E297): sucesso e plataforma SIGAA. Botão accent, badges de confirmado, badges de plataforma. Texto preto.
- **Vermelho Correção** (#FF6B6B): destrutivo e urgente. Botão destructive (texto branco), badge urgent (texto branco), prazos vencidos ou < 24h.

### Tertiary
- **Lápis Laranja** (#FB923C): identidade da plataforma Aprender 3, texto preto.
- **Lilás Caderno** (#C084FC): identidade da plataforma MoodleMat e variante purple de card, texto preto.
- **Azul Céu** (#60A5FA): identidade da plataforma Teams (reservado — plataforma em revisão no produto).
- **Verde Institucional** (#006633): verde oficial UnB, definido no tema; uso pontual institucional.

### Neutral
- **Papel Quadriculado** (#E8EFF8): fundo do canvas do app, sempre com o grid de 32px por cima.
- **Creme Papel** (#FAF7EE): superfície alternativa quente, uso pontual.
- **Branco** (#FFFFFF): superfície padrão de cards, inputs, sidebar e botão outline.
- **Tinta Preta** (#000000): todas as bordas (2px), todas as sombras, texto primário, ícones.
- **Tinta Suave** (#525252, escala neutral-400–800 do Tailwind): texto secundário e descrições — sempre font-medium no mínimo, nunca cinza de baixo contraste em peso leve.
- **Cinza Papel** (#F5F5F5, neutral-100): preenchimentos de hover, itens desabilitados, card de item concluído.

### Tintas de apoio
- **Verde OK** (#16A34A): texto de confirmação dentro de superfícies pastel (checkmarks, selo "Zero Telemetria").
- **Vermelho Erro** (#DC2626): texto e borda de erro de input.

### Pastéis (superfícies, nunca texto)
Versões lavadas das cores de ação, usadas como fundo de cards variante e alerts — sempre com texto preto e borda preta: **Azul Pastel** (#EBF3FF), **Verde Pastel** (#E6F8EE), **Amarelo Pastel** (#FFF9D2), **Lilás Pastel** (#F3E8FF), **Vermelho Pastel** (#FFEBEB).

### Named Rules
**A Regra do Risco Preto.** Nenhuma superfície ou elemento interativo existe sem borda preta de 2px. A borda é o contorno do adesivo; sem ela o elemento cai fora do mundo.

**A Regra do Pastel como Papel.** Cores de ação (caneta, giz, correção) marcam interação e identidade; as versões pastel servem de papel de fundo. Uma nunca faz o trabalho da outra: pastel nunca é botão, cor cheia nunca é fundo de seção inteira.

## Typography

**Display Font:** Plus Jakarta Sans (fallback system-ui, -apple-system, sans-serif)
**Body Font:** Plus Jakarta Sans (fallback system-ui, -apple-system, sans-serif)

**Character:** Geométrica e arredondada, com personalidade de app jovem — os pesos extremos (800/900) dão voz de marcador grosso, enquanto 500/600 mantêm corpo de produto legível.

### Hierarchy
- **Display** (900, clamp(2.25rem, 5vw, 3rem), 1.1, tracking -0.02em): título de boas-vindas no onboarding ("UnB Aggregator"). Único momento de hero.
- **Title** (800, 1.5rem, 1.25, tracking -0.01em): cabeçalho de página (PageHeader), com ícone azul de 24px ao lado.
- **Heading** (700, 1.125rem, 1.4, tracking -0.01em): título de card (CardTitle).
- **Body** (500, 0.875rem, 1.5): conteúdo de cards, descrições, itens de lista. Texto secundário em neutral-600/700 mesma faixa de tamanho.
- **Label** (700, 0.75rem, 1.4): labels de input, badges, botões, tabs. Versão uppercase com tracking 0.05em para rótulos de grupo (SelectLabel, cabeçalhos da grade).

### Named Rules
**A Regra do Marcador Grosso.** Hierarquia vem de peso (900 → 800 → 700 → 500), não de esmaecer cinza. Nunca enfraqueça texto baixando o peso para abaixo de 500 — baixe o tom (neutral-600) mantendo o peso.

**A Regra do Rótulo Gritado.** Rótulos estruturais (grupos, cabeçalhos de tabela, micro-cabeçalhos) são uppercase, font-black ou font-bold, 10–12px. Dá o tom de etiqueta de fichário.

## Layout

App desktop (janela Tauri), desktop-first. Estrutura permanente: sidebar branca à esquerda com borda direita preta de 2px, expandida em 264px (w-64) ou recolhida em 80px (w-20), contendo logo-bloco, navegação ledger e ações de sync na base. O conteúdo vive sobre o **Papel Quadriculado** (#E8EFF8 com grid de 32px em rgba(0,0,0,0.05)) e é centrado em container de no máximo 1152px (max-w-6xl) com ritmo vertical de 24px entre blocos (space-y-6) e respiro inferior de 48px.

Densidade: cards com padding interno de 24px, gaps de 8–16px entre controles, listas com cards empilhados. Grids internos usam gap de 6px (grade horária) a 10px (tabs). Breakpoints Tailwind padrão existem para janelas estreitas (sm 640px, md 768px, lg 1024px), mas o alvo é janela de desktop; nada de layout de mobile.

## Elevation & Depth

Profundidade é **física e estrutural**: sombras são deslocamentos sólidos de tinta preta, sem blur, sem cor ambiente. Um elemento "senta" sobre o papel e sua sombra diz quanto peso ele tem. A interação muda a física: hover levanta o adesivo (translate -1px,-1px + sombra cresce), active o pressiona contra o papel (translate +2px,+2px + sombra zero), disabled desmira (opacity 50%, sem movimento).

### Shadow Vocabulary
- **Sticker micro** (`2px 2px 0 0 #000`, token `neo-sm`): badges, chips, logo-bloco, botões pequenos, ícones de collapse.
- **Adesivo de botão** (`3px 3px 0 0 #000`): botões em repouso, select popup, alerts.
- **Adesivo de card** (`4px 4px 0 0 #000`, token `neo`): cards, botões em hover.
- **Ênfase máxima** (`6px 6px 0 0 #000`, token `neo-lg`): reservado, ainda sem uso no app.
- **Pressionado** (`shadow-none` + translate 2px): estado active de qualquer elemento interativo.
- **Divisores internos**: bordas de 2px pretas entre seções da sidebar; linhas internas de card em black/10–15%.

### Named Rules
**A Regra da Sombra Dura.** Sombra é deslocamento sólido preto, nunca blur, nunca rgba difusa, nunca cor. Se precisar de menos profundidade, diminua o deslocamento — não amacie.

**A Regra do Afundar.** Todo elemento interativo em repouso com sombra deve afundar no active (sombra some, elemento desloca 2px na direção da sombra). Elemento que levanta no hover e não afunda no click é bug físico.

## Shapes

Forma de adesivo: cantos arredondados generosos sob borda reta de 2px. Botões e inputs em raio médio (rounded-xl, 12px); cards e alerts em raio grande (rounded-2xl, 16px); elementos pequenos (botão sm, ícones de grade, botões de collapse) em raio pequeno (rounded-lg, 8px); badges e pills em círculo completo (9999px). A combinação borda-preta-2px + raio generoso é a assinatura: lê brutalista de longe, amigável de perto.

Ícones são Lucide com stroke 2.5 (mais grossos que o padrão) — combinando com a espessura das bordas. O logo é um bloco quadrado de 36px, **Azul Caneta**, texto "UnB" branco font-black, borda e sombra de sticker.

## Components

### Buttons
- **Shape:** raio 12px (md), 8px (sm), 16px (lg); borda preta 2px; altura 40px (md).
- **Primary:** fundo **Azul Caneta**, texto branco, fonte 700; hover **Azul Caneta Pressionado**. Variantes: accent (**Verde Giz**, texto preto), yellow (**Amarelo Marca-Texto**, texto preto), destructive (**Vermelho Correção**, texto branco), outline (branco, texto preto), ghost (transparente, sem borda visível, sem sombra, hover black/5).
- **Hover / Focus:** hover levanta (translate -1px,-1px, sombra 3px→4px); active afunda (translate +2px,+2px, sombra none). Transição 150ms ease-out. Disabled: opacity 50%, congela a física.
- **Loading:** spinner circular de borda 2px corrente no lugar do conteúdo.

### Chips (tabs e filtros)
- **Style:** pill retangular raio 12px, borda preta 2px, branco com texto preto; ativa vira **Azul Caneta** com texto branco; contador em sub-pill (10px, bold) com cores invertidas.
- **State:** mesma física de botão (hover levanta, active afunda), sombra 2px.

### Cards / Containers
- **Corner Style:** 16px.
- **Background:** branco padrão; variantes pastel (Azul/Verde/Amarelo/Lilás Pastel) para destaque de seção; concluído usa Cinza Papel com opacity 75%.
- **Shadow Strategy:** Adesivo de card (4px 4px #000).
- **Border:** preta, 2px.
- **Internal Padding:** 24px (p-6); footer de card com borda superior black/10.

### Inputs / Fields
- **Style:** fundo branco, borda preta 2px, raio 12px, padding 10px 16px, texto 0.875rem/500; label acima em 0.75rem/700.
- **Focus:** ring de 2px **Azul Caneta**, sem glow.
- **Error:** borda e ring **Vermelho Erro**, mensagem abaixo em 0.75rem/700 vermelha.
- **Disabled:** opacity 50%, fundo Cinza Papel.

### Navigation (Sidebar Ledger)
- **Style:** coluna full-bleed: cada item é uma faixa inteira separada por borda preta 2px (estilo fichário). Item ativo: fundo **Azul Caneta** cheio, texto branco, font-black. Inativo: branco, font-bold, hover Cinza Papel.
- **States:** sem sombra e sem física de pressionar — a navegação é a encadernação, não um adesivo. Colapsável (264px ↔ 80px); recolhida mostra só ícones centralizados; botões de expandir/recolher aparecem no hover do grupo.

### Badge (sticker de plataforma/tipo)
- **Style:** pill (9999px), borda preta 2px, sombra micro 1.5px, padding 2px 12px, texto 0.75rem/700; cor por identidade: Sigaa **Verde Giz**, Aprender 3 **Lápis Laranja**, MoodleMat **Lilás Caderno**, tarefa **Amarelo Marca-Texto**, urgente **Vermelho Correção** (texto branco), neutra branca.
- **Icon:** Lucide 14–16px, stroke 2.5, opcional à esquerda.

### Alert
- **Style:** fundo pastel por variante, borda preta 2px, raio 16px, sombra 3px; ícone em bloco branco próprio (borda 2px, raio 12px, sombra micro); título 0.875rem/700, descrição 0.75rem/600.

### Signature: Grade Horária (ScheduleTimetable)
O componente mais identitário: tabela de 7 colunas (Seg–Sáb) × 15 linhas de horário (turnos M/T/N), cabeçalhos de dia como mini-adesivos (Cinza Papel, borda preta 1px, sombra 1px), células de aula em uma de 6 cores de disciplina (par fundo-pastel + borda de tinta + texto escuro da mesma família: azul, verde, amarelo, roxo, laranja, céu). Cabeçalho institucional em uppercase font-black **Azul Caneta**. Exporta como PNG.

## Do's and Don'ts

### Do:
- **Do** dar borda preta de 2px a toda superfície e elemento interativo (A Regra do Risco Preto).
- **Do** usar sombra dura deslocada preta (`Xpx Xpx 0 0 #000`) e física completa: hover levanta, active afunda, disabled congela.
- **Do** construir hierarquia com peso de fonte (900/800/700/500) e usar pastéis como fundo, nunca como cor de ação.
- **Do** usar Plus Jakarta Sans e ícones Lucide com stroke 2.5; rótulos estruturais em uppercase bold 10–12px.
- **Do** usar as cores de plataforma como identidade fixa (Sigaa verde, Aprender 3 laranja) em badges e filtros.

### Don't:
- **Don't** usar sombra com blur, box-shadow difusa, rgba ambiente ou elevação estilo Material — sombra dura ou nenhuma.
- **Don't** usar glassmorphism, backdrop-blur, gradientes ou superfícies translúcidas — o mundo é opaco.
- **Don't** criar elemento interativo com sombra que não afunde no active (A Regra do Afundar).
- **Don't** enfraquecer texto reduzindo peso abaixo de font-medium; baixe o tom, mantenha o peso (A Regra do Marcador Grosso).
- **Don't** usar cor de ação cheia como fundo de seção, ou pastel como cor de botão (A Regra do Pastel como Papel).
