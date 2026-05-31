import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';
import { iaLimiter } from '../middleware/rateLimit';
import * as respostasController from '../controllers/respostasController';

const router = Router();

const enviarSchema = z.object({
  casoId: z.string().min(1, 'Informe o caso'),
  conteudo: z.string().min(10, 'A resposta deve ter ao menos 10 caracteres'),
  tempoGasto: z.coerce.number().int().min(0).optional(),
});

// Submissão de resposta (autenticada, com limite de IA).
router.post('/', authenticate, iaLimiter, validate(enviarSchema), respostasController.enviar);

// Histórico do usuário logado.
router.get('/historico', authenticate, respostasController.historico);

// Todas as respostas (ADMIN) — DEVE vir antes de /:id.
router.get('/admin/todas', authenticate, adminOnly, respostasController.listarTodasAdmin);

// Detalhe de uma resposta do usuário.
router.get('/:id', authenticate, respostasController.obter);

export default router;
