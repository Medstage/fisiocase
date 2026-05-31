import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';
import * as adminController from '../controllers/adminController';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/usuarios', adminController.listarUsuarios);
router.get('/usuarios/buscar', adminController.buscarUsuariosPorEmail);
router.put('/usuarios/:id/bloquear', adminController.alternarBloqueio);
router.get('/analytics', adminController.analytics);

// Gestão de professores
router.get('/professores', adminController.listarProfessores);
router.post('/professores', adminController.criarProfessor);
router.put('/professores/:id/revogar', adminController.revogarProfessor);

export default router;
