import { RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import type { Prisma } from '@prisma/client';

// GET /api/admin/professores — lista todos os PROFESSOR + estatísticas
export const listarProfessores: RequestHandler = async (_req, res) => {
  const professores = await prisma.user.findMany({
    where: { role: 'PROFESSOR' },
    select: {
      id: true,
      nome: true,
      email: true,
      instituicao: true,
      createdAt: true,
      turmasComoProfessor: {
        where: { ativa: true },
        select: { id: true, _count: { select: { membros: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  const result = professores.map((p) => ({
    id: p.id,
    nome: p.nome,
    email: p.email,
    instituicao: p.instituicao,
    createdAt: p.createdAt,
    totalTurmas: p.turmasComoProfessor.length,
    totalAlunos: p.turmasComoProfessor.reduce((s, t) => s + t._count.membros, 0),
  }));
  res.json({ professores: result });
};

// POST /api/admin/professores — promove user existente ou cria novo professor
export const criarProfessor: RequestHandler = async (req, res) => {
  const { userId, nome, email, senha, instituicao } = req.body as {
    userId?: string;
    nome?: string;
    email?: string;
    senha?: string;
    instituicao?: string;
  };

  // Modo promoção
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }
    if (user.role === 'PROFESSOR') {
      res.status(400).json({ error: 'Usuário já é professor.' });
      return;
    }
    const promovido = await prisma.user.update({
      where: { id: userId },
      data: { role: 'PROFESSOR' },
      select: { id: true, nome: true, email: true },
    });
    res.status(200).json({ message: `${promovido.nome} promovido a professor.`, professor: promovido });
    return;
  }

  // Modo criação
  if (!nome || !email || !senha) {
    res.status(400).json({ error: 'Forneça userId (promover) ou nome+email+senha (criar).' });
    return;
  }
  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    res.status(409).json({ error: 'E-mail já cadastrado. Use a opção "promover usuário existente".' });
    return;
  }
  const hash = await bcrypt.hash(senha, 10);
  const novo = await prisma.user.create({
    data: {
      nome,
      email,
      senha: hash,
      instituicao: instituicao ?? null,
      role: 'PROFESSOR',
      nivel: 'Professor',
      xpTotal: 0,
      xpAtual: 0,
    },
    select: { id: true, nome: true, email: true },
  });
  res.status(201).json({ message: 'Professor criado.', professor: novo });
};

// PUT /api/admin/professores/:id/revogar — rebaixa pra USER
export const revogarProfessor: RequestHandler = async (req, res) => {
  const id = String(req.params.id);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado.' });
    return;
  }
  if (user.role !== 'PROFESSOR') {
    res.status(400).json({ error: 'Usuário não é professor.' });
    return;
  }
  await prisma.user.update({ where: { id }, data: { role: 'USER', nivel: 'Iniciante' } });
  res.json({ message: 'Acesso de professor revogado.' });
};

// GET /api/admin/usuarios/buscar?email= — autocomplete
export const buscarUsuariosPorEmail: RequestHandler = async (req, res) => {
  const email = typeof req.query.email === 'string' ? req.query.email.trim() : '';
  if (email.length < 2) {
    res.json({ usuarios: [] });
    return;
  }
  const usuarios = await prisma.user.findMany({
    where: { email: { contains: email, mode: 'insensitive' } },
    take: 10,
    select: { id: true, nome: true, email: true, role: true },
  });
  res.json({ usuarios });
};

// GET /api/admin/usuarios?page=&limit=&busca=
export const listarUsuarios: RequestHandler = async (req, res) => {
  const page = Math.max(1, req.query.page ? Number(req.query.page) : 1);
  const limit = Math.min(100, Math.max(1, req.query.limit ? Number(req.query.limit) : 20));
  const busca = typeof req.query.busca === 'string' ? req.query.busca.trim() : '';
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = busca
    ? {
        OR: [
          { nome: { contains: busca, mode: 'insensitive' } },
          { email: { contains: busca, mode: 'insensitive' } },
        ],
      }
    : {};

  const [usuarios, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        nome: true,
        email: true,
        instituicao: true,
        semestre: true,
        bio: true,
        avatarUrl: true,
        role: true,
        nivel: true,
        xpTotal: true,
        xpAtual: true,
        sequenciaAtual: true,
        maiorSequencia: true,
        bloqueado: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ usuarios, total, page, limit });
};

// PUT /api/admin/usuarios/:id/bloquear — alterna o bloqueio do usuário
export const alternarBloqueio: RequestHandler = async (req, res) => {
  const id = String(req.params.id);

  const usuario = await prisma.user.findUnique({ where: { id }, select: { bloqueado: true } });
  if (!usuario) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }

  const atualizado = await prisma.user.update({
    where: { id },
    data: { bloqueado: !usuario.bloqueado },
    select: { id: true, bloqueado: true },
  });

  res.json({
    id: atualizado.id,
    bloqueado: atualizado.bloqueado,
    message: atualizado.bloqueado ? 'Usuário bloqueado' : 'Usuário desbloqueado',
  });
};

// GET /api/admin/analytics — métricas gerais da plataforma
export const analytics: RequestHandler = async (_req, res) => {
  const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsuarios,
    totalCasos,
    totalRespostas,
    agregadoNota,
    casosPorAreaRaw,
    respostasUltimos7Dias,
    topUsuarios,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.caso.count(),
    prisma.resposta.count(),
    prisma.resposta.aggregate({ _avg: { nota: true } }),
    prisma.caso.groupBy({ by: ['area'], _count: { _all: true } }),
    prisma.resposta.count({ where: { createdAt: { gte: seteDiasAtras } } }),
    prisma.user.findMany({
      orderBy: { xpTotal: 'desc' },
      take: 10,
      select: { nome: true, xpTotal: true },
    }),
  ]);

  const casosPorArea = casosPorAreaRaw.map((c) => ({ area: c.area, total: c._count._all }));
  const mediaNotaGeral = agregadoNota._avg.nota
    ? Math.round(agregadoNota._avg.nota * 10) / 10
    : 0;

  res.json({
    totalUsuarios,
    totalCasos,
    totalRespostas,
    mediaNotaGeral,
    casosPorArea,
    respostasUltimos7Dias,
    topUsuarios,
  });
};
