# Relatório técnico — FisioCase

> Plataforma web de prática de casos clínicos de fisioterapia com IA, desenvolvida como projeto integrador.
> Repositório: <https://github.com/Medstage/fisiocase> · Aplicação ao vivo: <https://fisiocase.vercel.app>

## 1. Resumo executivo

O FisioCase é um produto end-to-end composto por uma SPA Next.js, uma API REST Express + Prisma, um banco PostgreSQL gerenciado e integração com a API da Anthropic (modelo Claude Sonnet 4) para duas tarefas centrais: **gerar casos clínicos realistas sob demanda** e **avaliar a conduta escrita pelo aluno com nota e feedback estruturado**. Em volta do core de IA há uma camada de gamificação (XP, níveis, sequência, conquistas, missões diárias, ranking global/semanal) e um módulo de turmas para professores publicarem casos e corrigirem respostas.

O desenvolvimento foi **100% AI-assisted, não low-code**: todo o código (frontend, backend, banco, deploy, scripts) foi escrito em conjunto com o Claude Code (CLI da Anthropic), em sessões iterativas a partir de uma especificação detalhada. Não foi usado nenhum visual builder (Bubble, Webflow, FlutterFlow etc.) — o resultado é TypeScript convencional, versionado em Git e implantado em provedores de cloud padrão.

## 2. Onde a IA aparece (duas frentes distintas)

### 2.1 IA dentro do produto (runtime)

São duas chamadas de IA expostas ao usuário final:

| Função | Endpoint | Quando dispara |
| --- | --- | --- |
| **Geração de caso clínico** | `POST /api/casos/gerar` | Aluno escolhe filtros (área, dificuldade, tipo de paciente, foco clínico) na tela "Novo caso" |
| **Avaliação de resposta** | Parte do `POST /api/respostas` | Aluno termina de escrever a conduta e clica em "Enviar resposta" |

Modelo utilizado: `claude-sonnet-4-20250514` (configurável via env). SDK: `@anthropic-ai/sdk` v0.99. Prompts vão sempre como **system prompt + user prompt**, com a persona estabilizada no `system` para se beneficiar do **prompt caching da Anthropic** (`cache_control: { type: 'ephemeral' }`) — reduz custo das chamadas seguintes com a mesma persona.

### 2.2 IA dentro do desenvolvimento (build time)

Todo o código foi produzido com Claude Code (CLI). Em prática:

- O agente lê e escreve arquivos diretamente no projeto (tools Read, Write, Edit).
- Executa comandos shell (`npm install`, `prisma migrate`, `tsc`, `vercel deploy`, `railway up`).
- Faz chamadas a MCP servers conectados (Stitch para design, Context7 para documentação de bibliotecas).
- Cria git commits, abre PRs, faz deploy.

Não é "geração de boilerplate" pontual: é um par-programmer que opera o repositório inteiro.

## 3. Prompts utilizados no produto

São apenas dois prompts, propositadamente curtos para ficarem auditáveis e fáceis de iterar. Os parâmetros vindos do usuário entram por interpolação direta.

### 3.1 Geração de caso clínico

**System prompt (persona, em cache):**

> "Você é um professor especialista em fisioterapia clínica com 20 anos de experiência. Gere um caso clínico realista e detalhado para um estudante de fisioterapia. O caso deve ser educativo, baseado em situações reais, com dados clínicos precisos e terminologia técnica correta."

**User prompt (parametrizado):**

> "Gere um caso clínico de `{ÁREA}` com dificuldade `{DIFICULDADE}` para um paciente `{TIPO_PACIENTE}` focado em `{FOCO_CLÍNICO}`. Retorne APENAS um JSON com os campos: titulo, identificacao (objeto com nome fictício, idade, sexo, profissao, estadoCivil), queixaPrincipal, historiaDoencaAtual, historicoPatologico (array de strings), exameFisico (objeto com pa, fc, fr, spo2, achados), examesComplementares (array de objetos com tipo e resultado), respostaEsperada (conduta completa ideal). Não inclua nenhum texto fora do JSON."

Domínios dos enums:

- **Área:** Ortopedia, Neurologia, Cardiorrespiratória, Esportiva, Gerontologia, Pediatria, Uroginecologia, Reumatologia.
- **Dificuldade:** Fácil, Médio, Difícil.
- **Tipo de paciente:** Adulto, Idoso, Pediátrico, Gestante, Atleta.
- **Foco clínico:** Avaliação, Diagnóstico, Conduta, Reabilitação, Prevenção.

`max_tokens: 2000`. O retorno é parseado por um helper que tolera blocos ` ```json ` ou prosa em volta do JSON.

### 3.2 Avaliação de resposta do aluno

**System prompt (persona, em cache):**

> "Você é um professor especialista em fisioterapia clínica com 20 anos de experiência, avaliando a conduta de um estudante de forma rigorosa, justa e didática, baseada em evidências clínicas."

**User prompt (parametrizado com o caso + resposta):**

> "CASO: `{titulo}`\
> Queixa principal: `{queixaPrincipal}`\
> \
> CONDUTA IDEAL (gabarito):\
> `{respostaEsperada}`\
> `{critérios opcionais, se houver}`\
> \
> RESPOSTA DO ALUNO:\
> `{conteudo}`\
> \
> Avalie a resposta do aluno comparando com a conduta ideal. Retorne APENAS um JSON com: nota (inteiro de 0 a 100), acertos (array de strings), melhorias (array de strings), explicacaoClinica (string longa e didática), recursosEstudo (array de strings com tópicos/leituras sugeridas). Não inclua nenhum texto fora do JSON."

`max_tokens: 1500`. A nota é clampada para `0..100` no backend antes de seguir para o cálculo de XP.

### 3.3 Pós-processamento da nota (não-IA, mas relevante)

A nota retornada pela IA alimenta o motor de XP:

| Nota | XP ganho | Bônus |
| --- | --- | --- |
| ≥ 90 | 400 | "Excelente" |
| ≥ 80 | 320 | "Muito bom" |
| ≥ 70 | 240 | "Bom" |
| ≥ 60 | 160 | "Regular" |
| < 60 | 80 | "Pratique mais" |

E ainda dispara, em sequência:

- `processarResposta` — recalcula nível e XP atual.
- `registrarRespostaStreak` — atualiza sequência diária.
- `verificarConquistas` — desbloqueia conquistas se requisito atingido.
- `progredirMissoesDiarias` — atualiza progresso das missões do dia.

## 4. Stack tecnológica

### 4.1 Frontend (pasta `frontend/`)

| Categoria | Escolha |
| --- | --- |
| Framework | Next.js 14 (App Router) |
| Linguagem | TypeScript (modo estrito) |
| Estilos | Tailwind CSS 3, design system "Strict Flat" — verde `#0F4D0F`, preto, branco, bordas 1px, sem sombras, fonte Inter, raio 4px, spacing múltiplo de 4px |
| Componentes base | Inspiração Shadcn/UI (`button`, `badge`, `floating-input`); customizados sob medida |
| Animação | Framer Motion 12 (transições de página, modal de conquista, hover de cards, drawer mobile) |
| Estado | Zustand 5 (`uiStore`, `casoWizardStore`), React Query 5 (cache de dados de API) |
| Autenticação | NextAuth v4 (JWT strategy, Credentials Provider) |
| Gráficos | Recharts 3 |
| Ícones | Lucide React |
| HTTP | Axios com interceptors (injeção de token, redirect em 401) |

### 4.2 Backend (pasta `backend/`)

| Categoria | Escolha |
| --- | --- |
| Runtime | Node.js + Express 5 + TypeScript |
| ORM | Prisma 6.19 (schema em `src/prisma/schema.prisma`) |
| Banco | PostgreSQL 15 |
| Auth | JWT + bcryptjs |
| Validação | Zod 4 |
| Segurança | Helmet, CORS configurável por env, express-rate-limit (limite específico em endpoints de IA) |
| IA | `@anthropic-ai/sdk` v0.99 com prompt caching |

### 4.3 Infraestrutura

| Camada | Provedor |
| --- | --- |
| Frontend | Vercel (deploy via CLI, alias `fisiocase.vercel.app`) |
| Backend | Railway (build via Nixpacks, exposto em `*.up.railway.app`) |
| Banco | Railway Postgres (rede interna `postgres.railway.internal` para a API; URL pública só para migrations) |
| Dev local | Docker Compose só do Postgres |
| Versionamento | GitHub (`Medstage/fisiocase`, público) |

## 5. Como foi o desenvolvimento

### 5.1 Modelo de trabalho

**Não foi low-code.** O ambiente foi o Claude Code (Claude Opus 4.7 com fast mode), operando como par-programmer com acesso ao terminal, ao filesystem do projeto e a servidores MCP conectados. O usuário descrevia objetivos em linguagem natural; o agente lia o estado do repositório, propunha plano, escrevia código, rodava verificações (`tsc --noEmit`), corrigia erros, fazia commits, deploys e validava por smoke test.

### 5.2 Macroetapas

1. **Especificação** — escopo definido em chat, validado em um plano de execução em markdown (Fase 0 → Fase 10) salvo localmente.
2. **Design (Stitch MCP)** — gerada uma biblioteca de 17 telas (desktop + mobile) no Stitch, com paleta restrita e estética flat. As telas mobile do Stitch foram a referência para os componentes responsivos.
3. **Schema do banco** — modelado em Prisma com 12 entidades (`User`, `Caso`, `Resposta`, `Turma`, `TurmaMembro`, `CasoTurma`, `RespostaTurma`, `Conquista`, `UserConquista`, `Missao`, `UserMissao`, `Notificacao`) e enums tipados (`Role`, `Area`, `Dificuldade`, `OrigemResposta` etc.).
4. **Backend** — 14 controllers, 14 rotas Express, 8 services de domínio (`anthropicService`, `xpService`, `conquistaService`, `missoesService`, `rankingService`, `streakService`, `turmaService`, `notificacaoService`). Validação Zod em todo o boundary HTTP.
5. **Frontend** — cerca de 30 páginas (App Router), agrupadas em `(auth)` e `(dashboard)`, com subgrupos `/professor/*` e `/admin/*`. Componentes reutilizados: `CasoCard`, `CasoViewer`, `Timer`, `PontuacaoDisplay`, `ConquistaUnlocked`, `RankingSemanal`, `Sidebar`, `Topbar`, `MobileBottomNav`, `WizardCriarCaso` (5 passos), entre outros.
6. **Gamificação ponta-a-ponta** — XP/nível/streak/conquistas/missões disparados em transação após cada submissão de resposta; sino de notificações revalida em tempo real.
7. **Sistema de turmas (PROFESSOR)** — soft delete, encerramento, correção de respostas com nota 0–10, XP convertido, notificações ao aluno.
8. **Painel admin** — promoção e revogação de professores, auditoria de casos (origem visível), bloqueio de usuários.
9. **Responsividade mobile** — drawer com overlay na sidebar, bottom tab bar fixa com 5 itens, ajuste de grids quebrados, `safe-area-inset` para iPhones com notch.
10. **Bug bash e deploy** — 4 bugs críticos de gamificação corrigidos em conjunto (modal de conquista repetindo, missões fora de sincronia, ranking semanal incompleto, missões não disparando em correção do professor), migration do schema aplicada em produção, deploy validado por smoke test.

### 5.3 Métricas grossas

- Cerca de **180 arquivos** versionados (~25.000 linhas de código entre frontend e backend, sem contar lockfiles e migrations).
- **5 migrations Prisma** aplicadas em produção.
- **3 deploys de produção** (back + front), todos via CLI.
- **2 prompts** de IA expostos ao produto (geração e avaliação).

## 6. Ferramentas utilizadas

### 6.1 Ambiente principal

- **Claude Code (CLI)** com Claude Opus 4.7 — par-programmer durante todo o desenvolvimento.
- **Editor** — apenas o terminal e os tools do agente (Read/Write/Edit), sem IDE gráfica.
- **Git + GitHub** — versionamento e repositório público.

### 6.2 MCP servers (Model Context Protocol)

- **Stitch MCP** (`stitch.googleapis.com`) — geração de mockups das 17 telas (8 mobile, 9 desktop) usadas como referência visual.
- **Context7 MCP** — consulta a documentação oficial atualizada de Next.js, Prisma, NextAuth, Express e Tailwind durante o desenvolvimento.

### 6.3 APIs e SDKs externos

- **Anthropic API** (modelo `claude-sonnet-4-20250514`) — feature de geração e avaliação.
- **GitHub CLI (`gh`)** — criação do repositório e push automatizado.
- **Railway CLI** — provisionamento do Postgres, criação do serviço backend, set de variáveis, deploy, run de migrations.
- **Vercel CLI** — link do projeto, set de env vars, deploy de produção.

### 6.4 Bibliotecas de runtime (principais)

Frontend: `next@14`, `react@18`, `next-auth@4`, `@tanstack/react-query@5`, `tailwindcss@3`, `framer-motion@12`, `zustand@5`, `react-hook-form@7`, `zod@4`, `recharts@3`, `lucide-react`, `axios`, `clsx`.

Backend: `express@5`, `@prisma/client@6.19`, `@anthropic-ai/sdk@0.99`, `bcryptjs@3`, `jsonwebtoken@9`, `zod@4`, `helmet@8`, `cors@2`, `express-rate-limit@8`, `dotenv@17`.

### 6.5 Infraestrutura e operação

- **Docker Compose** — Postgres local para desenvolvimento.
- **Nixpacks (Railway)** — build automático do backend.
- **Vercel Build** — build estático/SSR do Next.js.
- **Health endpoint** (`/health`) + smoke tests em curl/python para validação pós-deploy.

## 7. Fluxo de ponta-a-ponta resumido

```text
Aluno -> Vercel (Next.js)
         |  HTTPS + JWT
         v
       Railway (Express + Prisma)
         |  pool interno
         v
       Railway Postgres

Para geração de caso e avaliação:
Express -> @anthropic-ai/sdk -> Anthropic API -> JSON
        -> parsing (extractJson) -> validação -> grava no Postgres
        -> dispara xpService / conquistaService / missoesService / streakService
        -> responde ao Next.js
        -> React Query atualiza UI + invalidações
```

## 8. Decisões de arquitetura notáveis

- **JWT no header**, sem cookies HTTP-only — escolha de simplicidade para o MVP; pode ser substituído por sessions+CSRF em produção real.
- **Single source of truth no Postgres** para o estado de gamificação — sem `localStorage` para flags que precisam sobreviver à troca de dispositivo (foi exatamente o que motivou a correção do bug do modal de conquista reaparecendo).
- **Timezone explícito** America/Sao_Paulo para janelas semanais e diárias, em vez de UTC puro — evita que respostas do final do domingo "sumam" do ranking semanal.
- **Agregação no service** em vez de query SQL única — ranking semanal soma `Resposta` + `RespostaTurma` em duas queries paralelas e reduz no Node, mantendo a lógica auditável.
- **Prompt caching** no system prompt — a persona do professor é constante; a Anthropic dá desconto significativo nesse trecho em chamadas próximas no tempo.
- **Estética flat e estrita** — sem `box-shadow`, sem gradientes, sem corner-radius > 4px; obriga o design a se sustentar por contraste e tipografia, e fica rápido em qualquer dispositivo.
