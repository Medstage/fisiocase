import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as missoesController from '../controllers/missoesController';

const router = Router();

router.use(authenticate);

const progressoSchema = z.object({
  progresso: z.coerce.number().int().min(0, 'Progresso inválido'),
});

router.get('/diarias', missoesController.diarias);
router.post('/:id/progresso', validate(progressoSchema), missoesController.atualizarProgresso);

export default router;
