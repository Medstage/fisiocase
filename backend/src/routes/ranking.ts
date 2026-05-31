import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as rankingController from '../controllers/rankingController';

const router = Router();

router.use(authenticate);

router.get('/global', rankingController.global);
router.get('/semanal', rankingController.semanal);
router.get('/posicao', rankingController.posicao);

export default router;
