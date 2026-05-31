import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import * as configController from '../controllers/configController';

const router = Router();

router.use(authenticate);

const senhaSchema = z.object({
  senhaAtual: z.string().min(1, 'Informe a senha atual'),
  novaSenha: z.string().min(6, 'A nova senha deve ter ao menos 6 caracteres'),
});

const notificacoesSchema = z
  .object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    novidades: z.boolean().optional(),
  })
  .passthrough();

const privacidadeSchema = z
  .object({
    perfilPublico: z.boolean().optional(),
    mostrarNoRanking: z.boolean().optional(),
  })
  .passthrough();

const excluirContaSchema = z.object({
  senha: z.string().min(1, 'Informe a senha'),
});

router.put('/senha', validate(senhaSchema), configController.alterarSenha);
router.put('/notificacoes', validate(notificacoesSchema), configController.atualizarNotificacoes);
router.put('/privacidade', validate(privacidadeSchema), configController.atualizarPrivacidade);
router.delete('/conta', validate(excluirContaSchema), configController.excluirConta);

export default router;
