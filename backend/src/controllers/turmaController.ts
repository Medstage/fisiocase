import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { gerarCodigoTurma } from '../services/turmaService';

// POST /api/turmas — professor cria turma
export const criar: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const { nome, descricao } = req.body as { nome: string; descricao?: string };
  if (!nome || nome.trim().length < 2) {
    res.status(400).json({ error: 'Nome da turma é obrigatório.' });
    return;
  }
  const codigo = await gerarCodigoTurma();
  const turma = await prisma.turma.create({
    data: { nome, descricao, codigo, professorId: user!.id },
  });
  res.status(201).json(turma);
};

// GET /api/turmas/minhas — professor vê turmas que criou; aluno vê turmas que participa
export const listarMinhas: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;

  if (user!.role === 'PROFESSOR' || user!.role === 'ADMIN') {
    const incluirArquivadas = req.query.arquivadas === 'true';
    const turmas = await prisma.turma.findMany({
      where: incluirArquivadas
        ? { professorId: user!.id, deletadaEm: { not: null } }
        : { professorId: user!.id, deletadaEm: null },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { membros: true, casos: true } },
      },
    });
    res.json({ origem: 'professor', turmas, arquivadas: incluirArquivadas });
    return;
  }

  // aluno
  const memberships = await prisma.turmaMembro.findMany({
    where: { userId: user!.id, turma: { ativa: true, deletadaEm: null } },
    orderBy: { entradaEm: 'desc' },
    include: {
      turma: {
        include: {
          professor: { select: { id: true, nome: true, avatarUrl: true } },
          _count: { select: { membros: true, casos: true } },
        },
      },
    },
  });
  const turmas = memberships.map((m) => m.turma);
  res.json({ origem: 'aluno', turmas });
};

// GET /api/turmas/:id — detalhes (membros + casos)
export const obter: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const id = String(req.params.id);
  const turma = await prisma.turma.findUnique({
    where: { id },
    include: {
      professor: { select: { id: true, nome: true, avatarUrl: true } },
      membros: { include: { user: { select: { id: true, nome: true, avatarUrl: true } } } },
      casos: { orderBy: { createdAt: 'desc' }, include: { caso: { select: { titulo: true, area: true, dificuldade: true } } } },
    },
  });
  if (!turma) {
    res.status(404).json({ error: 'Turma não encontrada.' });
    return;
  }
  // Permissão: professor da turma, admin, ou membro
  const ehProfessor = turma.professorId === user!.id;
  const ehMembro = turma.membros.some((m) => m.userId === user!.id);
  if (!ehProfessor && user!.role !== 'ADMIN' && !ehMembro) {
    res.status(403).json({ error: 'Você não tem acesso a esta turma.' });
    return;
  }
  res.json(turma);
};

// PUT /api/turmas/:id — editar nome/descrição (professor da turma)
export const atualizar: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const id = String(req.params.id);
  const turma = await prisma.turma.findUnique({ where: { id }, select: { professorId: true } });
  if (!turma) {
    res.status(404).json({ error: 'Turma não encontrada.' });
    return;
  }
  if (turma.professorId !== user!.id && user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Apenas o professor da turma pode editar.' });
    return;
  }
  const { nome, descricao } = req.body as { nome?: string; descricao?: string };
  const atualizada = await prisma.turma.update({
    where: { id },
    data: { ...(nome !== undefined && { nome }), ...(descricao !== undefined && { descricao }) },
  });
  res.json(atualizada);
};

// PUT /api/turmas/:id/encerrar — encerra (mantém visível, ativa=false)
export const encerrarTurma: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const id = String(req.params.id);
  const turma = await prisma.turma.findUnique({ where: { id }, select: { professorId: true } });
  if (!turma) {
    res.status(404).json({ error: 'Turma não encontrada.' });
    return;
  }
  if (turma.professorId !== user!.id && user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Apenas o professor da turma pode encerrar.' });
    return;
  }
  const atualizada = await prisma.turma.update({ where: { id }, data: { ativa: false } });
  res.json(atualizada);
};

// DELETE /api/turmas/:id — arquiva (soft delete via deletadaEm)
export const desativar: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const id = String(req.params.id);
  const turma = await prisma.turma.findUnique({ where: { id }, select: { professorId: true } });
  if (!turma) {
    res.status(404).json({ error: 'Turma não encontrada.' });
    return;
  }
  if (turma.professorId !== user!.id && user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Apenas o professor da turma pode excluir.' });
    return;
  }
  await prisma.turma.update({ where: { id }, data: { deletadaEm: new Date(), ativa: false } });
  res.status(200).json({ message: 'Turma arquivada.' });
};

// GET /api/turmas/:id/membros — lista alunos + estatísticas
export const listarMembros: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const id = String(req.params.id);
  const turma = await prisma.turma.findUnique({ where: { id }, select: { professorId: true } });
  if (!turma) {
    res.status(404).json({ error: 'Turma não encontrada.' });
    return;
  }
  if (turma.professorId !== user!.id && user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Acesso restrito ao professor.' });
    return;
  }
  const membros = await prisma.turmaMembro.findMany({
    where: { turmaId: id },
    include: { user: { select: { id: true, nome: true, avatarUrl: true } } },
  });
  // Para cada membro: casos resolvidos na turma, média de nota
  const result = await Promise.all(
    membros.map(async (m) => {
      const respostas = await prisma.respostaTurma.findMany({
        where: { alunoId: m.userId, casoTurma: { turmaId: id }, status: 'CORRIGIDO' },
        select: { notaProfessor: true, corrigidoEm: true },
      });
      const total = respostas.length;
      const media = total > 0 ? respostas.reduce((s, r) => s + (r.notaProfessor ?? 0), 0) / total : 0;
      const ultimaAtividade = respostas.reduce<Date | null>(
        (acc, r) => (r.corrigidoEm && (!acc || r.corrigidoEm > acc) ? r.corrigidoEm : acc),
        null,
      );
      return {
        id: m.user.id,
        nome: m.user.nome,
        avatarUrl: m.user.avatarUrl,
        entradaEm: m.entradaEm,
        casosResolvidos: total,
        mediaNotas: Math.round(media * 10) / 10,
        ultimaAtividade,
      };
    }),
  );
  res.json({ membros: result });
};

// POST /api/turmas/entrar — aluno entra com código
export const entrar: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const codigo = String(req.body?.codigo ?? '').trim().toUpperCase();
  if (codigo.length !== 6) {
    res.status(400).json({ error: 'Código deve ter 6 caracteres.' });
    return;
  }
  const turma = await prisma.turma.findUnique({ where: { codigo } });
  if (!turma || !turma.ativa) {
    res.status(404).json({ error: 'Turma não encontrada ou inativa.' });
    return;
  }
  if (turma.professorId === user!.id) {
    res.status(400).json({ error: 'Você é o professor desta turma.' });
    return;
  }
  const jaMembro = await prisma.turmaMembro.findUnique({
    where: { turmaId_userId: { turmaId: turma.id, userId: user!.id } },
  });
  if (jaMembro) {
    res.status(200).json({ message: 'Você já é membro desta turma.', turma });
    return;
  }
  await prisma.turmaMembro.create({ data: { turmaId: turma.id, userId: user!.id } });
  res.status(201).json({ message: 'Bem-vindo à turma!', turma });
};

// DELETE /api/turmas/:id/sair — aluno sai da turma
export const sair: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const id = String(req.params.id);
  await prisma.turmaMembro.deleteMany({ where: { turmaId: id, userId: user!.id } });
  res.status(204).send();
};

// DELETE /api/turmas/:turmaId/membros/:userId — professor remove aluno (preserva respostas)
export const removerMembro: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const turmaId = String(req.params.turmaId);
  const userId = String(req.params.userId);

  const turma = await prisma.turma.findUnique({ where: { id: turmaId }, select: { professorId: true } });
  if (!turma) {
    res.status(404).json({ error: 'Turma não encontrada.' });
    return;
  }
  if (turma.professorId !== user!.id && user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Apenas o professor da turma pode remover alunos.' });
    return;
  }
  if (userId === turma.professorId) {
    res.status(400).json({ error: 'O professor não pode remover a si mesmo.' });
    return;
  }
  const membro = await prisma.turmaMembro.findUnique({
    where: { turmaId_userId: { turmaId, userId } },
  });
  if (!membro) {
    res.status(404).json({ error: 'Aluno não é membro desta turma.' });
    return;
  }
  await prisma.turmaMembro.delete({ where: { turmaId_userId: { turmaId, userId } } });
  res.status(200).json({ message: 'Aluno removido. Histórico de respostas preservado.' });
};
