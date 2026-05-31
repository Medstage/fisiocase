import { RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import {
  gerarCaso,
  type GerarCasoParams,
} from '../services/anthropicService';

interface HttpError extends Error {
  status?: number;
}

/** XP base por dificuldade para casos gerados/criados. */
const XP_BASE: Record<string, number> = { FACIL: 160, MEDIO: 240, DIFICIL: 320 };

/**
 * Filtro de visibilidade de casos por role:
 * - ADMIN vê tudo.
 * - PROFESSOR / USER veem casos públicos (autor=ADMIN ou sem autor) + os próprios.
 */
function whereVisivelParaUser(userId: string, role: string): Prisma.CasoWhereInput {
  if (role === 'ADMIN') return {};
  return {
    OR: [
      { autorId: null },
      { autor: { role: 'ADMIN' } },
      { autorId: userId },
    ],
  };
}

// GET /api/casos — listagem paginada com filtros opcionais.
export const listar: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const { area, dificuldade } = req.query as Record<string, string | undefined>;
  const status = (req.query.status as string | undefined) ?? 'PUBLICADO';
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Number(req.query.limit) || 12);

  const where: Prisma.CasoWhereInput = { ...whereVisivelParaUser(user!.id, user!.role) };
  if (status) where.status = status as Prisma.CasoWhereInput['status'];
  if (area) where.area = area as Prisma.CasoWhereInput['area'];
  if (dificuldade) where.dificuldade = dificuldade as Prisma.CasoWhereInput['dificuldade'];

  const [casos, total] = await Promise.all([
    prisma.caso.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.caso.count({ where }),
  ]);

  res.json({ casos, total, page, limit });
};

// GET /api/casos/publicados — lista de casos PUBLICADOS para o aluno escolher.
// Inclui flag `jaResolvido` e `minhaMelhorNota` calculados para o usuário logado.
export const listarPublicados: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const { area, dificuldade, tipoPaciente, focoClinico, busca } = req.query as Record<string, string | undefined>;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const ordenar = String(req.query.ordenar ?? 'recentes');
  const ocultarResolvidos = req.query.ocultarResolvidos === 'true';

  const where: Prisma.CasoWhereInput = {
    status: 'PUBLICADO',
    ...whereVisivelParaUser(user!.id, user!.role),
  };
  if (area) where.area = area as Prisma.CasoWhereInput['area'];
  if (dificuldade) where.dificuldade = dificuldade as Prisma.CasoWhereInput['dificuldade'];
  if (tipoPaciente) where.tipoPaciente = tipoPaciente as Prisma.CasoWhereInput['tipoPaciente'];
  if (focoClinico) where.focoClinico = focoClinico as Prisma.CasoWhereInput['focoClinico'];
  if (busca) where.titulo = { contains: busca, mode: 'insensitive' };

  const orderBy: Prisma.CasoOrderByWithRelationInput =
    ordenar === 'resolvidos'
      ? { totalResolucoes: 'desc' }
      : ordenar === 'melhor_avaliados'
        ? { mediaAcerto: 'desc' }
        : ordenar === 'mais_dificeis'
          ? { dificuldade: 'desc' }
          : { createdAt: 'desc' };

  const [casos, total] = await Promise.all([
    prisma.caso.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
    prisma.caso.count({ where }),
  ]);

  // Para cada caso, calcular jaResolvido + melhorNota + tentativas do usuário.
  const ids = casos.map((c) => c.id);
  const minhasRespostas = await prisma.resposta.findMany({
    where: { userId: user!.id, casoId: { in: ids } },
    select: { casoId: true, nota: true },
  });
  const mapa = new Map<string, { tentativas: number; melhorNota: number }>();
  for (const r of minhasRespostas) {
    const e = mapa.get(r.casoId) ?? { tentativas: 0, melhorNota: 0 };
    e.tentativas += 1;
    if ((r.nota ?? 0) > e.melhorNota) e.melhorNota = r.nota ?? 0;
    mapa.set(r.casoId, e);
  }

  let casosEnriched = casos.map((c) => {
    const m = mapa.get(c.id);
    return {
      ...c,
      jaResolvido: !!m,
      tentativas: m?.tentativas ?? 0,
      minhaMelhorNota: m?.melhorNota ?? null,
    };
  });

  if (ocultarResolvidos) casosEnriched = casosEnriched.filter((c) => !c.jaResolvido);

  res.json({ casos: casosEnriched, total, page, limit });
};

// GET /api/casos/admin/lista — todos os casos com analytics (ADMIN).
// IMPORTANTE: definir esta rota ANTES de /:id.
export const listarAdmin: RequestHandler = async (_req, res) => {
  const casos = await prisma.caso.findMany({
    orderBy: { createdAt: 'desc' },
    include: { autor: { select: { id: true, nome: true, email: true, role: true } } },
  });

  const lista = casos.map((c) => ({
    ...c,
    totalResolucoes: c.totalResolucoes,
    mediaAcerto: c.mediaAcerto,
    origem: !c.autor || c.autor.role === 'ADMIN' ? 'plataforma' : c.autor.role === 'PROFESSOR' ? 'professor' : 'ia',
  }));

  res.json({ casos: lista, total: lista.length });
};

// GET /api/casos/:id — detalhe de um caso (com guarda de visibilidade).
export const obter: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const caso = await prisma.caso.findUnique({
    where: { id: String(req.params.id) },
    include: { autor: { select: { id: true, role: true, nome: true } } },
  });
  if (!caso) {
    res.status(404).json({ error: 'Caso não encontrado' });
    return;
  }
  // Acesso: ADMIN sempre; autor sempre; senão só se caso for público (autor nulo ou ADMIN).
  const isPublico = !caso.autor || caso.autor.role === 'ADMIN';
  const isAutor = caso.autorId === user!.id;
  if (user!.role !== 'ADMIN' && !isPublico && !isAutor) {
    res.status(403).json({ error: 'Você não tem acesso a este caso.' });
    return;
  }
  res.json(caso);
};

// POST /api/casos/gerar — gera um caso via IA e persiste (autenticada).
export const gerar: RequestHandler = async (req, res) => {
  const params = req.body as GerarCasoParams;

  try {
    const gerado = await gerarCaso(params);

    const caso = await prisma.caso.create({
      data: {
        titulo: gerado.titulo,
        area: params.area,
        dificuldade: params.dificuldade,
        tipoPaciente: params.tipoPaciente,
        focoClinico: params.focoClinico,
        identificacao: gerado.identificacao as unknown as Prisma.InputJsonValue,
        queixaPrincipal: gerado.queixaPrincipal,
        historiaDoencaAtual: gerado.historiaDoencaAtual,
        historicoPatologico: gerado.historicoPatologico as unknown as Prisma.InputJsonValue,
        exameFisico: gerado.exameFisico as unknown as Prisma.InputJsonValue,
        examesComplementares: gerado.examesComplementares as unknown as Prisma.InputJsonValue,
        respostaEsperada: gerado.respostaEsperada,
        criteriosAvaliacao: [] as unknown as Prisma.InputJsonValue,
        xpRecompensa: XP_BASE[params.dificuldade] ?? 160,
        status: 'PUBLICADO',
        autorId: null,
      },
    });

    res.status(201).json(caso);
  } catch (err) {
    const e = err as HttpError;
    if (e.status === 503) {
      res.status(503).json({ error: e.message });
      return;
    }
    res.status(500).json({ error: 'Falha ao gerar o caso clínico.' });
  }
};

// POST /api/casos — criação manual (ADMIN).
export const criar: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const body = req.body;

  const caso = await prisma.caso.create({
    data: {
      titulo: body.titulo,
      area: body.area,
      dificuldade: body.dificuldade,
      tipoPaciente: body.tipoPaciente,
      focoClinico: body.focoClinico,
      identificacao: body.identificacao as Prisma.InputJsonValue,
      queixaPrincipal: body.queixaPrincipal,
      historiaDoencaAtual: body.historiaDoencaAtual,
      historicoPatologico: body.historicoPatologico as Prisma.InputJsonValue,
      exameFisico: body.exameFisico as Prisma.InputJsonValue,
      examesComplementares: body.examesComplementares as Prisma.InputJsonValue,
      respostaEsperada: body.respostaEsperada,
      criteriosAvaliacao: (body.criteriosAvaliacao ?? []) as Prisma.InputJsonValue,
      xpRecompensa: body.xpRecompensa ?? XP_BASE[body.dificuldade] ?? 160,
      status: body.status ?? 'PUBLICADO',
      autorId: user!.id,
    },
  });

  res.status(201).json(caso);
};

// PUT /api/casos/:id — atualização (ADMIN).
export const atualizar: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const body = req.body;
  const existente = await prisma.caso.findUnique({ where: { id: String(req.params.id) } });
  if (!existente) {
    res.status(404).json({ error: 'Caso não encontrado' });
    return;
  }
  // PROFESSOR só pode editar os próprios casos. ADMIN pode editar qualquer.
  if (user!.role !== 'ADMIN' && existente.autorId !== user!.id) {
    res.status(403).json({ error: 'Você só pode editar seus próprios casos.' });
    return;
  }

  const data: Prisma.CasoUpdateInput = {};
  if (body.titulo !== undefined) data.titulo = body.titulo;
  if (body.area !== undefined) data.area = body.area;
  if (body.dificuldade !== undefined) data.dificuldade = body.dificuldade;
  if (body.tipoPaciente !== undefined) data.tipoPaciente = body.tipoPaciente;
  if (body.focoClinico !== undefined) data.focoClinico = body.focoClinico;
  if (body.identificacao !== undefined) data.identificacao = body.identificacao as Prisma.InputJsonValue;
  if (body.queixaPrincipal !== undefined) data.queixaPrincipal = body.queixaPrincipal;
  if (body.historiaDoencaAtual !== undefined) data.historiaDoencaAtual = body.historiaDoencaAtual;
  if (body.historicoPatologico !== undefined)
    data.historicoPatologico = body.historicoPatologico as Prisma.InputJsonValue;
  if (body.exameFisico !== undefined) data.exameFisico = body.exameFisico as Prisma.InputJsonValue;
  if (body.examesComplementares !== undefined)
    data.examesComplementares = body.examesComplementares as Prisma.InputJsonValue;
  if (body.respostaEsperada !== undefined) data.respostaEsperada = body.respostaEsperada;
  if (body.criteriosAvaliacao !== undefined)
    data.criteriosAvaliacao = body.criteriosAvaliacao as Prisma.InputJsonValue;
  if (body.xpRecompensa !== undefined) data.xpRecompensa = body.xpRecompensa;
  if (body.status !== undefined) data.status = body.status;

  const caso = await prisma.caso.update({ where: { id: String(req.params.id) }, data });
  res.json(caso);
};

// DELETE /api/casos/:id — remoção (PROFESSOR no próprio, ADMIN em qualquer).
export const remover: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const existente = await prisma.caso.findUnique({ where: { id: String(req.params.id) } });
  if (!existente) {
    res.status(404).json({ error: 'Caso não encontrado' });
    return;
  }
  if (user!.role !== 'ADMIN' && existente.autorId !== user!.id) {
    res.status(403).json({ error: 'Você só pode excluir seus próprios casos.' });
    return;
  }
  await prisma.caso.delete({ where: { id: String(req.params.id) } });
  res.status(204).send();
};
