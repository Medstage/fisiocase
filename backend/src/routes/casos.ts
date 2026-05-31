import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';
import { checkRole } from '../middleware/checkRole';
import { iaLimiter } from '../middleware/rateLimit';
import * as casosController from '../controllers/casosController';

const router = Router();

// Enums alinhados ao schema.prisma.
const areaEnum = z.enum([
  'ORTOPEDIA',
  'NEUROLOGIA',
  'CARDIORRESPIRATORIA',
  'ESPORTIVA',
  'GERONTOLOGIA',
  'PEDIATRIA',
  'UROGINECOLOGIA',
  'REUMATOLOGIA',
]);
const dificuldadeEnum = z.enum(['FACIL', 'MEDIO', 'DIFICIL']);
const tipoPacienteEnum = z.enum(['ADULTO', 'IDOSO', 'PEDIATRICO', 'GESTANTE', 'ATLETA']);
const focoClinicoEnum = z.enum(['AVALIACAO', 'DIAGNOSTICO', 'CONDUTA', 'REABILITACAO', 'PREVENCAO']);
const statusEnum = z.enum(['RASCUNHO', 'PUBLICADO']);

const gerarSchema = z.object({
  area: areaEnum,
  dificuldade: dificuldadeEnum,
  tipoPaciente: tipoPacienteEnum,
  focoClinico: focoClinicoEnum,
});

const identificacaoSchema = z.object({
  nome: z.string(),
  idade: z.union([z.number(), z.string()]),
  sexo: z.string(),
  profissao: z.string(),
  estadoCivil: z.string(),
});

const exameFisicoSchema = z
  .object({
    pa: z.string().optional(),
    fc: z.string().optional(),
    fr: z.string().optional(),
    spo2: z.string().optional(),
    achados: z.string().optional(),
  })
  .passthrough();

const exameComplementarSchema = z.object({
  tipo: z.string(),
  resultado: z.string(),
});

const criarSchema = z.object({
  titulo: z.string().min(3),
  area: areaEnum,
  dificuldade: dificuldadeEnum,
  tipoPaciente: tipoPacienteEnum,
  focoClinico: focoClinicoEnum,
  identificacao: identificacaoSchema,
  queixaPrincipal: z.string().min(1),
  historiaDoencaAtual: z.string().min(1),
  historicoPatologico: z.array(z.string()),
  exameFisico: exameFisicoSchema,
  examesComplementares: z.array(exameComplementarSchema),
  respostaEsperada: z.string().min(1),
  criteriosAvaliacao: z.any().optional(),
  xpRecompensa: z.coerce.number().int().optional(),
  status: statusEnum.optional(),
});

const atualizarSchema = criarSchema.partial();

// Listagem pública (autenticada).
router.get('/', authenticate, casosController.listar);

// Analytics (ADMIN) — DEVE vir antes de /:id.
router.get('/admin/lista', authenticate, adminOnly, casosController.listarAdmin);

// Lista de casos PUBLICADOS para o aluno escolher — DEVE vir antes de /:id.
router.get('/publicados', authenticate, casosController.listarPublicados);

// Geração via IA (autenticada, com limite de IA).
router.post('/gerar', authenticate, iaLimiter, validate(gerarSchema), casosController.gerar);

// Criação manual (PROFESSOR ou ADMIN). O caso fica vinculado a quem criou (autorId).
router.post('/', authenticate, checkRole('PROFESSOR', 'ADMIN'), validate(criarSchema), casosController.criar);

// Detalhe.
router.get('/:id', authenticate, casosController.obter);

// Atualização e remoção (PROFESSOR no próprio caso; ADMIN em qualquer).
// O controller verifica a posse do caso antes de aplicar a mudança.
router.put('/:id', authenticate, checkRole('PROFESSOR', 'ADMIN'), validate(atualizarSchema), casosController.atualizar);
router.delete('/:id', authenticate, checkRole('PROFESSOR', 'ADMIN'), casosController.remover);

export default router;
