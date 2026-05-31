import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './lib/env';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import casosRoutes from './routes/casos';
import respostasRoutes from './routes/respostas';
import rankingRoutes from './routes/ranking';
import perfilRoutes from './routes/perfil';
import conquistasRoutes from './routes/conquistas';
import missoesRoutes from './routes/missoes';
import configRoutes from './routes/config';
import adminRoutes from './routes/admin';
import streakRoutes from './routes/streak';
import turmasRoutes from './routes/turmas';
import casosTurmaRoutes from './routes/casosTurma';
import historicoRoutes from './routes/historico';
import notificacoesRoutes from './routes/notificacoes';

const app = express();

app.use(helmet());

// CORS: aceita origens configuradas em ALLOWED_ORIGINS (separadas por vírgula).
// Se vazio, libera tudo (dev). Em produção, defina explicitamente.
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      // requests sem origem (curl, mobile, server-to-server) e dev sem config: libera
      if (!origin || allowedOrigins.length === 0) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      // permite previews da Vercel se for o caso (*.vercel.app)
      if (allowedOrigins.some((a) => a.endsWith('.vercel.app') && origin.endsWith('.vercel.app'))) {
        return cb(null, true);
      }
      return cb(new Error(`CORS: origem não permitida — ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));

// Rate limit geral em /api
app.use('/api', apiLimiter);

// Healthcheck
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'fisiocase-backend' });
});

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/casos', casosRoutes);
app.use('/api/respostas', respostasRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/conquistas', conquistasRoutes);
app.use('/api/missoes', missoesRoutes);
app.use('/api/configuracoes', configRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/streak', streakRoutes);
app.use('/api/turmas/:id/casos', casosTurmaRoutes);
app.use('/api/turmas', turmasRoutes);
app.use('/api/historico', historicoRoutes);
app.use('/api/notificacoes', notificacoesRoutes);

// Handler de erros (sempre por último)
app.use(errorHandler);

const port = Number(env.PORT);
// 0.0.0.0 para escutar em todas as interfaces (necessário em containers Railway/Render).
app.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`FisioCase backend rodando na porta ${port}`);
});

export default app;
