import { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { calcularNivel } from '../services/xpService';

// GET /api/missoes/diarias — missões com o progresso do usuário logado
export const diarias: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const userId = user!.id;

  const [missoes, progressos] = await Promise.all([
    prisma.missao.findMany({ orderBy: { titulo: 'asc' } }),
    prisma.userMissao.findMany({ where: { userId } }),
  ]);

  const mapa = new Map(progressos.map((p) => [p.missaoId, p]));

  const resultado = missoes.map((m) => {
    const up = mapa.get(m.id);
    return {
      id: m.id,
      titulo: m.titulo,
      descricao: m.descricao,
      xpRecompensa: m.xpRecompensa,
      tipo: m.tipo,
      meta: m.meta,
      progresso: up?.progresso ?? 0,
      completedAt: up?.completedAt ?? null,
    };
  });

  res.json({ missoes: resultado });
};

// POST /api/missoes/:id/progresso — atualiza o progresso (upsert) e recompensa ao concluir
export const atualizarProgresso: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const userId = user!.id;
  const missaoId = String(req.params.id);
  const { progresso } = req.body as { progresso: number };

  const missao = await prisma.missao.findUnique({ where: { id: missaoId } });
  if (!missao) {
    res.status(404).json({ error: 'Missão não encontrada' });
    return;
  }

  const resultado = await prisma.$transaction(async (tx) => {
    const existente = await tx.userMissao.findUnique({
      where: { userId_missaoId: { userId, missaoId } },
    });

    const jaCompletada = !!existente?.completedAt;
    const atingiuMeta = progresso >= missao.meta;
    const completarAgora = atingiuMeta && !jaCompletada;

    const userMissao = await tx.userMissao.upsert({
      where: { userId_missaoId: { userId, missaoId } },
      create: {
        userId,
        missaoId,
        progresso,
        completedAt: completarAgora ? new Date() : null,
      },
      update: {
        progresso,
        ...(completarAgora ? { completedAt: new Date() } : {}),
      },
    });

    let recompensaXp = 0;
    if (completarAgora && missao.xpRecompensa > 0) {
      recompensaXp = missao.xpRecompensa;
      const u = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      const novoXpTotal = u.xpTotal + recompensaXp;
      await tx.user.update({
        where: { id: userId },
        data: {
          xpTotal: novoXpTotal,
          xpAtual: u.xpAtual + recompensaXp,
          nivel: calcularNivel(novoXpTotal),
        },
      });
    }

    return { userMissao, completou: completarAgora, recompensaXp };
  });

  res.json({
    progresso: resultado.userMissao.progresso,
    completedAt: resultado.userMissao.completedAt,
    completou: resultado.completou,
    xpRecompensa: resultado.recompensaXp,
  });
};
