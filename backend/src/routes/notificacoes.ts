import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as notificacaoController from '../controllers/notificacaoController';

const router = Router();
router.use(authenticate);

router.get('/', notificacaoController.listar);
router.put('/marcar-todas-lidas', notificacaoController.marcarTodasLidas);
router.put('/:id/marcar-lida', notificacaoController.marcarLida);

export default router;
