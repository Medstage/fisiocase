# FisioCase — Design System (fonte: Stitch)

> Extraído do projeto Stitch **"FisioCase: IA em Fisioterapia"** (`projects/18015761223185780484`).
> Este documento é a **fonte de verdade** do visual. As telas implementadas devem bater com o Stitch.

## Tokens principais

### Cores (paleta restrita "Strict Flat")
| Token | Hex | Uso |
|---|---|---|
| **Verde primário** | `#0F4D0F` | Ações de alta prioridade, foco, sucesso, barras de progresso |
| Verde claro (apoio) | `#96D788` / `#b1f3a2` | Realces sutis |
| **Preto** | `#000000` | Bordas, texto primário, estados invertidos |
| **Branco** | `#FFFFFF` | Fundo primário |
| Surface | `#f9f9f9` | Fundo de seções |
| Surface container | `#eeeeee` / `#e2e2e2` | Áreas neutras |
| Erro | `#ba1a1a` | Estados de erro |

> ⚠️ **Importante:** o verde do Stitch é `#0F4D0F` (verde-floresta escuro), **não** `#00C853`.
> A spec original citava `#00C853`, mas o design do Stitch prevalece.

### Tipografia — **Inter** (exclusivo)
| Nível | Tamanho | Peso | Line-height |
|---|---|---|---|
| headline-xl | 32px | 700 | 1.2 (letter-spacing -0.02em) |
| headline-lg | 24px | 700 | 1.3 |
| headline-md | 20px | 700 | 1.4 |
| body-lg | 16px | 400 | 1.6 |
| body-md | 14px | 400 | 1.5 |
| label-bold | 12px | 700 | 1 |

### Raio (roundness)
- **Global: 4px (`0.25rem`)** — nunca exceder. Sem pills (exceto avatares/indicadores pontuais).

### Spacing (múltiplos de 4px)
`base 4 · xs 8 · sm 16 · md 24 (gutter) · lg 32 (margin) · xl 64`

---

## Brand & Style
Ambiente clínico/diagnóstico onde clareza e precisão são prioridade. Linguagem visual **Strict Flat**,
inspirada em brutalismo de alto contraste, refinada para uso médico profissional. Sem ruído estilístico
(sombras, gradientes, blur) — foco total nos dados clínicos. Sensação de confiabilidade, eficiência e
autoridade clínica.

## Regras de cor
- Paleta restrita a 3 valores centrais (verde/preto/branco). Sem opacidade/transparência. Sem gradientes.
- Contraste sempre ≥ WCAG AAA.

## Tipografia
- Inter exclusivo. Títulos sempre Bold (700), corpo sempre Regular (400).
- Hierarquia por tamanho/peso, não por cor. Texto preto no branco (ou branco no preto em estados invertidos).

## Layout & Spacing
- Desktop (1440px+): grid 12 colunas, gutters 24px, margens externas 32px.
- Tablet (768–1439px): grid 8 colunas, gutters 16px.
- Mobile (<767px): grid 4 colunas, gutters 16px, margens 16px.
- Ritmo: tudo múltiplo de 4px. Gaps grandes (32px+) separam seções clínicas; pequenos (8–16px) agrupam campos.

## Elevação & Profundidade
- Profundidade **estrutural**, não atmosférica. Sem sombras/blur/translucidez.
- **Toda** caixa (cards, botões, inputs, modais) tem **borda 1px sólida preta**.
- Empilhamento por camadas físicas; modal apenas "por cima" com sua borda preta.
- Foco/estado ativo por **inversão** (fundo preto, texto branco).

## Componentes
- **Botões:** borda 1px preta, fundo branco, texto preto bold. Hover → fundo preto/texto branco (150ms ease). Active → scale 0.97 (100ms).
- **Cards:** borda 1px preta, fundo branco. Hover → borda verde `#0F4D0F` + `translateY(-2px)` (200ms).
- **Inputs:** borda 1px preta, raio 4px, fundo branco. Focus → borda verde (150ms), **sem glow/sombra**.
- **Sidebar:** 240px (expandida) ↔ 64px (recolhida), transição 250ms. Ícones e texto nítidos nos dois estados.
- **Progress bars:** container borda 1px preta, preenchimento verde `#0F4D0F`, anima da esquerda→direita (800ms ease-out).
- **Métricas numéricas:** "roll-up" de contador ao carregar (600ms ease-out).
- **Tabs:** borda inferior 1px preta no grupo; indicador verde deslizante (2px) na aba ativa (200ms ease).
- **Skeletons:** shimmer horizontal alternando blocos preto/branco (sem cinzas).
- **Notificações:** caixas retangulares, borda 1px preta, slide-in da direita.

## Telas desenhadas no Stitch
Ver `docs/STITCH_SCREENS.md` para IDs e mapeamento.
