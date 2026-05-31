import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { notaParaXp } from '../services/turmaService';
import { calcularNivel } from '../services/xpService';
import { registrarRespostaStreak } from '../services/streakService';
import { verificarConquistas } from '../services/conquistaService';
import { progredirMissoesDiarias } from '../services/missoesService';
import { notificar, notificarMembrosTurma, notificarProfessorDaTurma } from '../services/notificacaoService';

async function exigirProfessor(turmaId: string, userId: string, role: string): Promise<string | null> {
  const turma = await prisma.turma.findUnique({ where: { id: turmaId }, select: { professorId: true } });
  if (!turma) return 'Turma não encontrada.';
  if (turma.professorId !== userId && role !== 'ADMIN') return 'Apenas o professor da turma pode executar esta ação.';
  return null;
}

// POST /api/turmas/:id/casos — cria caso na turma (status RASCUNHO)
export const criarCaso: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const turmaId = String(req.params.id);
  const erro = await exigirProfessor(turmaId, user!.id, user!.role);
  if (erro) {
    res.status(403).json({ error: erro });
    return;
  }
  const { casoId, titulo, descricao, prazo } = req.body as {
    casoId: string;
    titulo?: string;
    descricao?: string;
    prazo?: string;
  };
  if (!casoId) {
    res.status(400).json({ error: 'casoId obrigatório.' });
    return;
  }
  const caso = await prisma.caso.findUnique({ where: { id: casoId }, select: { titulo: true } });
  if (!caso) {
    res.status(404).json({ error: 'Caso não encontrado.' });
    return;
  }
  // eslint-disable-next-line no-console
  console.log(`[casoTurma.criar] professorId=${user!.id} turmaId=${turmaId} casoId=${casoId}`);
  const casoTurma = await prisma.casoTurma.create({
    data: {
      turmaId,
      casoId,
      professorId: user!.id,
      titulo: titulo || caso.titulo,
      descricao,
      prazo: prazo ? new Date(prazo) : null,
    },
  });
  res.status(201).json(casoTurma);
};

// PUT /api/turmas/:id/casos/:casoTurmaId/publicar
export const publicarCaso: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const turmaId = String(req.params.id);
  const casoTurmaId = String(req.params.casoTurmaId);
  const erro = await exigirProfessor(turmaId, user!.id, user!.role);
  if (erro) {
    res.status(403).json({ error: erro });
    return;
  }
  const ct = await prisma.casoTurma.update({
    where: { id: casoTurmaId },
    data: { status: 'PUBLICADO', publicadoEm: new Date() },
    include: { turma: { select: { nome: true } } },
  });
  await notificarMembrosTurma(
    turmaId,
    `Novo caso na turma ${ct.turma.nome}`,
    `${ct.titulo} foi publicado pelo seu professor.`,
  );
  res.json(ct);
};

// PUT /api/turmas/:id/casos/:casoTurmaId/reabrir
export const reabrirCaso: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const turmaId = String(req.params.id);
  const casoTurmaId = String(req.params.casoTurmaId);
  const erro = await exigirProfessor(turmaId, user!.id, user!.role);
  if (erro) {
    res.status(403).json({ error: erro });
    return;
  }
  const ct = await prisma.casoTurma.update({
    where: { id: casoTurmaId },
    data: { status: 'PUBLICADO' },
  });
  res.json(ct);
};

// PUT /api/turmas/:id/casos/:casoTurmaId/encerrar
export const encerrarCaso: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const turmaId = String(req.params.id);
  const casoTurmaId = String(req.params.casoTurmaId);
  const erro = await exigirProfessor(turmaId, user!.id, user!.role);
  if (erro) {
    res.status(403).json({ error: erro });
    return;
  }
  const ct = await prisma.casoTurma.update({
    where: { id: casoTurmaId },
    data: { status: 'ENCERRADO' },
  });
  res.json(ct);
};

// GET /api/turmas/:id/casos
export const listarCasos: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const turmaId = String(req.params.id);
  const turma = await prisma.turma.findUnique({
    where: { id: turmaId },
    include: { membros: { select: { userId: true } } },
  });
  if (!turma) {
    res.status(404).json({ error: 'Turma não encontrada.' });
    return;
  }
  const ehProfessor = turma.professorId === user!.id;
  const ehMembro = turma.membros.some((m) => m.userId === user!.id);
  if (!ehProfessor && user!.role !== 'ADMIN' && !ehMembro) {
    res.status(403).json({ error: 'Acesso negado.' });
    return;
  }
  // Aluno só vê PUBLICADO/ENCERRADO; professor vê tudo
  const where = ehProfessor || user!.role === 'ADMIN' ? { turmaId } : { turmaId, status: { in: ['PUBLICADO' as const, 'ENCERRADO' as const] } };
  const casos = await prisma.casoTurma.findMany({
    where,
    include: {
      caso: { select: { id: true, titulo: true, area: true, dificuldade: true, tipoPaciente: true } },
      _count: { select: { respostas: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  // Para aluno: status da própria resposta em cada caso
  if (!ehProfessor && user!.role !== 'ADMIN') {
    const meusIds = casos.map((c) => c.id);
    const minhas = await prisma.respostaTurma.findMany({
      where: { casoTurmaId: { in: meusIds }, alunoId: user!.id },
      select: { casoTurmaId: true, status: true, notaProfessor: true, id: true },
    });
    const mapa = new Map(minhas.map((m) => [m.casoTurmaId, m]));
    const enriched = casos.map((c) => ({ ...c, minhaResposta: mapa.get(c.id) ?? null }));
    res.json({ casos: enriched });
    return;
  }
  res.json({ casos });
};

// GET /api/turmas/:id/casos/:casoTurmaId — detalhe
export const obterCaso: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const turmaId = String(req.params.id);
  const casoTurmaId = String(req.params.casoTurmaId);
  const ct = await prisma.casoTurma.findUnique({
    where: { id: casoTurmaId },
    include: {
      caso: true,
      turma: { include: { professor: { select: { id: true, nome: true, avatarUrl: true } }, membros: { select: { userId: true } } } },
    },
  });
  if (!ct || ct.turmaId !== turmaId) {
    res.status(404).json({ error: 'Caso da turma não encontrado.' });
    return;
  }
  const ehProfessor = ct.turma.professorId === user!.id;
  const ehMembro = ct.turma.membros.some((m) => m.userId === user!.id);
  if (!ehProfessor && user!.role !== 'ADMIN' && !ehMembro) {
    res.status(403).json({ error: 'Acesso negado.' });
    return;
  }
  // Buscar a resposta do aluno (se houver)
  const minhaResposta = await prisma.respostaTurma.findFirst({
    where: { casoTurmaId, alunoId: user!.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ casoTurma: ct, minhaResposta });
};

// POST /api/turmas/:id/casos/:casoTurmaId/responder
export const responder: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const turmaId = String(req.params.id);
  const casoTurmaId = String(req.params.casoTurmaId);
  const { conteudo } = req.body as { conteudo: string };
  if (!conteudo || conteudo.trim().length < 10) {
    res.status(400).json({ error: 'Resposta muito curta (mín. 10 caracteres).' });
    return;
  }
  const ct = await prisma.casoTurma.findUnique({
    where: { id: casoTurmaId },
    include: { turma: { include: { membros: { where: { userId: user!.id }, select: { userId: true } } } } },
  });
  if (!ct || ct.turmaId !== turmaId) {
    res.status(404).json({ error: 'Caso não encontrado.' });
    return;
  }
  if (ct.status !== 'PUBLICADO') {
    res.status(400).json({ error: 'Caso não está disponível para respostas.' });
    return;
  }
  if (ct.turma.membros.length === 0) {
    res.status(403).json({ error: 'Você não é membro desta turma.' });
    return;
  }
  // Cria resposta PENDENTE
  const resposta = await prisma.respostaTurma.create({
    data: { casoTurmaId, alunoId: user!.id, conteudo, status: 'PENDENTE' },
    include: { aluno: { select: { nome: true } } },
  });
  // Notifica professor
  await notificarProfessorDaTurma(
    turmaId,
    `Nova resposta de ${resposta.aluno.nome}`,
    `No caso "${ct.titulo}". Aguardando correção.`,
  );
  res.status(201).json(resposta);
};

// GET /api/turmas/:id/casos/:casoTurmaId/respostas — professor lista todas
export const listarRespostas: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const turmaId = String(req.params.id);
  const casoTurmaId = String(req.params.casoTurmaId);
  const erro = await exigirProfessor(turmaId, user!.id, user!.role);
  if (erro) {
    res.status(403).json({ error: erro });
    return;
  }
  const respostas = await prisma.respostaTurma.findMany({
    where: { casoTurmaId },
    include: { aluno: { select: { id: true, nome: true, avatarUrl: true } } },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ respostas });
};

// GET /api/turmas/:id/casos/:casoTurmaId/respostas/:respostaId
export const obterResposta: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const turmaId = String(req.params.id);
  const casoTurmaId = String(req.params.casoTurmaId);
  const respostaId = String(req.params.respostaId);
  const resposta = await prisma.respostaTurma.findUnique({
    where: { id: respostaId },
    include: {
      aluno: { select: { id: true, nome: true, avatarUrl: true } },
      casoTurma: { include: { caso: true, turma: { select: { professorId: true, nome: true } } } },
    },
  });
  if (!resposta || resposta.casoTurmaId !== casoTurmaId || resposta.casoTurma.turmaId !== turmaId) {
    res.status(404).json({ error: 'Resposta não encontrada.' });
    return;
  }
  // Permissão: professor da turma, admin, ou o próprio aluno
  const ehProfessor = resposta.casoTurma.turma.professorId === user!.id;
  const ehProprioAluno = resposta.alunoId === user!.id;
  if (!ehProfessor && user!.role !== 'ADMIN' && !ehProprioAluno) {
    res.status(403).json({ error: 'Acesso negado.' });
    return;
  }
  res.json(resposta);
};

// PUT /api/turmas/:id/casos/:casoTurmaId/respostas/:respostaId/corrigir
export const corrigir: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const turmaId = String(req.params.id);
  const casoTurmaId = String(req.params.casoTurmaId);
  const respostaId = String(req.params.respostaId);
  const { nota, feedback } = req.body as { nota: number; feedback: string };

  if (typeof nota !== 'number' || nota < 0 || nota > 10) {
    res.status(400).json({ error: 'Nota deve ser número entre 0 e 10.' });
    return;
  }
  if (!feedback || feedback.trim().length < 10) {
    res.status(400).json({ error: 'Feedback muito curto (mín. 10 caracteres).' });
    return;
  }

  const resposta = await prisma.respostaTurma.findUnique({
    where: { id: respostaId },
    include: { casoTurma: { include: { turma: { select: { professorId: true, nome: true } } } } },
  });
  if (!resposta || resposta.casoTurmaId !== casoTurmaId || resposta.casoTurma.turmaId !== turmaId) {
    res.status(404).json({ error: 'Resposta não encontrada.' });
    return;
  }
  if (resposta.casoTurma.turma.professorId !== user!.id && user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Apenas o professor da turma pode corrigir.' });
    return;
  }
  if (resposta.status === 'CORRIGIDO') {
    res.status(400).json({ error: 'Resposta já foi corrigida.' });
    return;
  }

  const xp = notaParaXp(nota);

  // Atualiza resposta + credita XP + atualiza nível do aluno
  await prisma.$transaction([
    prisma.respostaTurma.update({
      where: { id: respostaId },
      data: { notaProfessor: nota, feedbackProfessor: feedback, xpGanho: xp, status: 'CORRIGIDO', corrigidoEm: new Date() },
    }),
    prisma.user.update({
      where: { id: resposta.alunoId },
      data: { xpTotal: { increment: xp }, xpAtual: { increment: xp } },
    }),
  ]);

  // Atualiza nível textual do aluno (em outra tx fora pra ler o novo xpTotal)
  const alunoAtualizado = await prisma.user.findUniqueOrThrow({ where: { id: resposta.alunoId } });
  const novoNivel = calcularNivel(alunoAtualizado.xpTotal);
  if (novoNivel !== alunoAtualizado.nivel) {
    await prisma.user.update({ where: { id: resposta.alunoId }, data: { nivel: novoNivel } });
  }

  // Streak + conquistas + missões diárias (Bug 4)
  // A correção de turma deve contar como "caso resolvido" exatamente igual
  // a uma resposta nativa — tudo passa pelos mesmos serviços.
  await registrarRespostaStreak(resposta.alunoId);
  await verificarConquistas(resposta.alunoId);
  // Nota professor é 0..10; converte para 0..100 para alinhar com a escala da IA
  // (que é o que missao.media_acima espera).
  const notaCemBase = nota * 10;
  await progredirMissoesDiarias(resposta.alunoId, notaCemBase, 'TURMA');

  // Notifica aluno
  await notificar(
    resposta.alunoId,
    `Sua resposta foi corrigida — Nota ${nota.toFixed(1)}`,
    `Turma "${resposta.casoTurma.turma.nome}": ${resposta.casoTurma.titulo}`,
  );

  res.json({ status: 'CORRIGIDO', notaProfessor: nota, feedbackProfessor: feedback, xpGanho: xp });
};
