import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimit';
import * as authController from '../controllers/authController';

const router = Router();

const registerSchema = z.object({
  nome: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'A senha deve ter ao menos 6 caracteres'),
  instituicao: z.string().optional(),
  semestre: z.coerce.number().int().min(1).max(12).optional(),
});

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Informe a senha'),
});

const recuperarSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

const novaSenhaSchema = z.object({
  token: z.string().min(1),
  senha: z.string().min(6, 'A senha deve ter ao menos 6 caracteres'),
});

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/recuperar-senha', authLimiter, validate(recuperarSchema), authController.recuperarSenha);
router.post('/nova-senha', authLimiter, validate(novaSenhaSchema), authController.novaSenha);

export default router;
