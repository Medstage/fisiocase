import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as conquistasController from '../controllers/conquistasController';

const router = Router();

router.use(authenticate);

router.get('/', conquistasController.listar);
router.get('/usuario', conquistasController.doUsuario);

export default router;
