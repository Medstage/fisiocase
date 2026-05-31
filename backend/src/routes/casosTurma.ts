import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { checkRole } from '../middleware/checkRole';
import * as c from '../controllers/casoTurmaController';

// Sub-router montado em /api/turmas/:id/casos
const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', c.listarCasos);
router.post('/', checkRole('PROFESSOR', 'ADMIN'), c.criarCaso);
router.get('/:casoTurmaId', c.obterCaso);
router.put('/:casoTurmaId/publicar', checkRole('PROFESSOR', 'ADMIN'), c.publicarCaso);
router.put('/:casoTurmaId/encerrar', checkRole('PROFESSOR', 'ADMIN'), c.encerrarCaso);
router.put('/:casoTurmaId/reabrir', checkRole('PROFESSOR', 'ADMIN'), c.reabrirCaso);

router.post('/:casoTurmaId/responder', c.responder);
router.get('/:casoTurmaId/respostas', checkRole('PROFESSOR', 'ADMIN'), c.listarRespostas);
router.get('/:casoTurmaId/respostas/:respostaId', c.obterResposta);
router.put('/:casoTurmaId/respostas/:respostaId/corrigir', checkRole('PROFESSOR', 'ADMIN'), c.corrigir);

export default router;
