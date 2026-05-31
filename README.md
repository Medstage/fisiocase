# FisioCase

Plataforma web para estudantes de fisioterapia praticarem **casos clínicos com IA**.
O aluno escolhe filtros (área, dificuldade, tipo de paciente, foco clínico), a IA gera um caso
clínico realista, o aluno escreve sua conduta e a IA avalia com feedback detalhado. Gamificado
(XP, níveis, sequência, ranking, missões, conquistas) + camada de turmas para professores
acompanharem alunos.

## Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind, Shadcn/UI, Framer Motion, React Hook Form + Zod, Recharts, Zustand, React Query, NextAuth, next-themes.
- **Backend:** Node.js + Express, TypeScript, Prisma, PostgreSQL, JWT, bcryptjs, Zod, helmet, cors, rate-limit.
- **IA:** `@anthropic-ai/sdk` (modelo `claude-sonnet-4-20250514`), streaming via ReadableStream, prompt caching.
- **Infra local:** Docker Compose (PostgreSQL).

## Design
Visual definido no Stitch (`docs/DESIGN_SYSTEM.md` + `docs/STITCH_SCREENS.md`). Estética **Strict Flat**:
verde `#0F4D0F`, preto, branco; bordas 1px pretas; sem sombras/gradientes; Inter; raio 4px; spacing múltiplo de 4px.

## Estrutura
```
.
├── frontend/   # Next.js 14
├── backend/    # Express API + Prisma
├── docs/       # Design system e mapa de telas do Stitch
└── docker-compose.yml
```

## Como rodar localmente

```bash
# 1. Subir o banco
docker compose up -d postgres

# 2. Backend
cd backend
cp .env.example .env      # preencher ANTHROPIC_API_KEY, JWT_SECRET, NEXTAUTH_SECRET, DATABASE_URL
npm install
npm run prisma:migrate    # cria as tabelas
npm run seed              # popula dados de exemplo (inclui admin)
npm run dev               # http://localhost:3001

# 3. Frontend
cd ../frontend
cp .env.example .env.local
npm install
npm run dev               # http://localhost:3000
```

### Credenciais de seed
- **Admin:** `admin@fisiocase.dev` / `admin123` (promova/desligue professores em `/admin/professores`)
- **Aluno (USER) e professor (PROFESSOR):** veja `backend/src/prisma/seed.ts`

> ⚠️ Não há cadastro público de professor: todo usuário criado pelo `/cadastro` é `USER`.
> Promoção a `PROFESSOR` é feita apenas pelo admin.

## Deploy em produção

A arquitetura recomendada é **frontend na Vercel** e **backend + Postgres na Railway** (ou
Render/Fly). Express + Prisma não rodam bem em serverless puro, então mantemos o backend
como um serviço Node tradicional.

### 1) Banco — Railway / Neon / Supabase
Crie um Postgres gerenciado e copie a `DATABASE_URL` (formato `postgresql://...`).

### 2) Backend — Railway

1. Crie um novo serviço apontando para a pasta `backend/`.
2. Variáveis de ambiente:
   - `DATABASE_URL` (do passo 1)
   - `JWT_SECRET` (gere com `openssl rand -base64 32`)
   - `NEXTAUTH_SECRET` (mesmo valor que será usado no frontend)
   - `NEXTAUTH_URL` (URL do frontend, ex: `https://fisiocase.vercel.app`)
   - `ANTHROPIC_API_KEY`
   - `ANTHROPIC_MODEL=claude-sonnet-4-20250514`
   - `PORT=3001` (Railway sobrescreve via `$PORT`)
   - `ALLOWED_ORIGINS=https://fisiocase.vercel.app` (separe por vírgula se houver mais de uma)
3. Build command: `npm install && npm run build`
4. Start command: `npm run start`
5. Após o primeiro deploy, rode uma vez:
   ```bash
   npm run deploy:migrate   # aplica migrations em produção
   npm run seed             # opcional: cria admin inicial
   ```

### 3) Frontend — Vercel

1. Importe o repositório na Vercel apontando para a pasta `frontend/`.
2. Variáveis de ambiente:
   - `NEXT_PUBLIC_API_URL=https://seu-backend.up.railway.app`
   - `NEXTAUTH_SECRET` (mesmo valor do backend)
   - `NEXTAUTH_URL=https://fisiocase.vercel.app`
3. Deploy.
4. Depois que a Vercel devolver a URL final, atualize no backend:
   - `ALLOWED_ORIGINS=https://fisiocase.vercel.app`
   - `NEXTAUTH_URL=https://fisiocase.vercel.app`

### Cuidados importantes
- **Nunca** comite arquivos `.env` reais — o `.gitignore` já cobre.
- Rotacione qualquer chave (ANTHROPIC, JWT_SECRET) que tenha sido compartilhada em chat ou commits.
- `ALLOWED_ORIGINS` é o que controla CORS; sem ele liberado, o frontend recebe `network error`.
- `NEXTAUTH_URL` precisa ser a URL pública final (não `localhost`).

## Roles e permissões
- **USER** — aluno padrão. Gera casos, responde, ganha XP/conquistas, entra em turmas via código.
- **PROFESSOR** — cria turmas, publica casos próprios, corrige respostas. Só enxerga os próprios casos.
- **ADMIN** — vê todos os casos (e o autor de cada um), gerencia usuários e promove/revoga professores.

## Scripts úteis (backend)
| Script | O que faz |
| --- | --- |
| `npm run dev` | Sobe API em modo watch |
| `npm run build` | `prisma generate` + `tsc` |
| `npm run start` | Roda o build de produção |
| `npm run deploy:migrate` | `prisma migrate deploy` (em produção) |
| `npm run seed` | Popula admin, casos, conquistas |
