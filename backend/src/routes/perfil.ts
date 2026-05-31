import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as perfilController from '../controllers/perfilController';

const router = Router();

router.use(authenticate);

const atualizarSchema = z.object({
  nome: z.string().min(2, 'Nome muito curto').optional(),
  bio: z.string().max(500, 'Bio muito longa').optional(),
  instituicao: z.string().optional(),
  semestre: z.coerce.number().int().min(1).max(12).optional(),
});

const avatarSchema = z.object({
  avatarUrl: z.string().min(1, 'Informe a URL do avatar'),
});

router.get('/', perfilController.obter);
router.put('/', validate(atualizarSchema), perfilController.atualizar);
router.put('/avatar', validate(avatarSchema), perfilController.atualizarAvatar);
router.get('/estatisticas', perfilController.estatisticas);
router.get('/certificados', perfilController.certificados);

export default router;
