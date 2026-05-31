import { RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { avaliarResposta } from '../services/anthropicService';
import { calcularXP, processarResposta } from '../services/xpService';
import { verificarConquistas } from '../services/conquistaService';
import { progredirMissoesDiarias } from '../services/missoesService';
import { registrarRespostaStreak } from '../services/streakService';

interface HttpError extends Error {
  status?: number;
}

// POST /api/respostas — submete uma resposta, avalia via IA e processa XP/conquistas.
export const enviar: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const userId = user!.id;
  const { casoId, conteudo, tempoGasto } = req.body as {
    casoId: string;
    conteudo: string;
    tempoGasto?: number;
  };

  const caso = await prisma.caso.findUnique({ where: { id: casoId } });
  if (!caso) {
    res.status(404).json({ error: 'Caso não encontrado' });
    return;
  }

  let avaliacao;
  try {
    avaliacao = await avaliarResposta(
      {
        titulo: caso.titulo,
        queixaPrincipal: caso.queixaPrincipal,
        respostaEsperada: caso.respostaEsperada,
        criteriosAvaliacao: caso.criteriosAvaliacao,
      },
      conteudo,
    );
  } catch (err) {
    const e = err as HttpError;
    if (e.status === 503) {
      res.status(503).json({ error: e.message });
      return;
    }
    res.status(500).json({ error: 'Falha ao avaliar a resposta.' });
    return;
  }

  const xpGanho = calcularXP(avaliacao.nota);

  // Cria a resposta e atualiza os agregados do caso atomicamente.
  const resposta = await prisma.$transaction(async (tx) => {
    const novaResposta = await tx.resposta.create({
      data: {
        userId,
        casoId,
        conteudo,
        nota: avaliacao.nota,
        feedback: avaliacao as unknown as Prisma.InputJsonValue,
        xpGanho,
        tempoGasto: tempoGasto ?? 0,
      },
    });

    // Nova média = ((mediaAtual * totalAntigo) + nota) / (totalAntigo + 1).
    const novaMedia =
      (caso.mediaAcerto * caso.totalResolucoes + avaliacao.nota) / (caso.totalResolucoes + 1);

    await tx.caso.update({
      where: { id: casoId },
      data: {
        totalResolucoes: { increment: 1 },
        mediaAcerto: novaMedia,
      },
    });

    return novaResposta;
  });

  // Processa XP/nível e streak; em seguida, conquistas e missões.
  const resultadoXp = await processarResposta(userId, avaliacao.nota);
  const resultadoStreak = await registrarRespostaStreak(userId);
  const conquistas = await verificarConquistas(userId);
  const missoesCompletadas = await progredirMissoesDiarias(userId, avaliacao.nota, 'NATIVO');

  res.status(201).json({
    resposta,
    avaliacao,
    xpGanho,
    subiuNivel: resultadoXp.subiuNivel,
    nivelNovo: resultadoXp.nivelNovo,
    conquistas,
    missoesCompletadas,
    streak: resultadoStreak,
  });
};

// GET /api/respostas/historico — histórico do usuário logado, paginado.
export const historico: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const userId = user!.id;
  const { area } = req.query as Record<string, string | undefined>;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Number(req.query.limit) || 12);

  const where: Prisma.RespostaWhereInput = { userId };
  if (area) where.caso = { area: area as Prisma.CasoWhereInput['area'] };

  const [respostas, total] = await Promise.all([
    prisma.resposta.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        caso: { select: { id: true, titulo: true, area: true, dificuldade: true } },
      },
    }),
    prisma.resposta.count({ where }),
  ]);

  res.json({ respostas, total, page, limit });
};

// GET /api/respostas/admin/todas — todas as respostas (ADMIN). DEVE vir antes de /:id.
export const listarTodasAdmin: RequestHandler = async (req, res) => {
  const { area } = req.query as Record<string, string | undefined>;
  const userId = req.query.userId as string | undefined;
  const casoId = req.query.casoId as string | undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Number(req.query.limit) || 20);

  const where: Prisma.RespostaWhereInput = {};
  if (userId) where.userId = userId;
  if (casoId) where.casoId = casoId;
  if (area) where.caso = { area: area as Prisma.CasoWhereInput['area'] };

  const [respostas, total] = await Promise.all([
    prisma.resposta.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, nome: true, email: true } },
        caso: { select: { id: true, titulo: true, area: true, dificuldade: true } },
      },
    }),
    prisma.resposta.count({ where }),
  ]);

  res.json({ respostas, total, page, limit });
};

// GET /api/respostas/:id — uma resposta do usuário logado (com o caso).
export const obter: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const resposta = await prisma.resposta.findUnique({
    where: { id: String(req.params.id) },
    include: { caso: true },
  });

  if (!resposta || resposta.userId !== user!.id) {
    res.status(404).json({ error: 'Resposta não encontrada' });
    return;
  }

  res.json(resposta);
};
