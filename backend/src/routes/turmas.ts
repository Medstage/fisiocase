import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { checkRole } from '../middleware/checkRole';
import * as turmaController from '../controllers/turmaController';

const router = Router();

router.use(authenticate);

// Aluno
router.post('/entrar', turmaController.entrar);
router.delete('/:id/sair', turmaController.sair);

// Listagem (USER mostra turmas que participa; PROFESSOR mostra que criou)
router.get('/minhas', turmaController.listarMinhas);

// Professor
router.post('/', checkRole('PROFESSOR', 'ADMIN'), turmaController.criar);
router.put('/:id', checkRole('PROFESSOR', 'ADMIN'), turmaController.atualizar);
router.put('/:id/encerrar', checkRole('PROFESSOR', 'ADMIN'), turmaController.encerrarTurma);
router.delete('/:id', checkRole('PROFESSOR', 'ADMIN'), turmaController.desativar);
router.get('/:id/membros', checkRole('PROFESSOR', 'ADMIN'), turmaController.listarMembros);
router.delete('/:turmaId/membros/:userId', checkRole('PROFESSOR', 'ADMIN'), turmaController.removerMembro);

// Detalhes (qualquer membro)
router.get('/:id', turmaController.obter);

export default router;
