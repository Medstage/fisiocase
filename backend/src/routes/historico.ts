import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as historicoController from '../controllers/historicoController';

const router = Router();
router.use(authenticate);
router.get('/', historicoController.listar);

export default router;
