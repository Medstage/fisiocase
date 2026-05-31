import { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// GET /api/conquistas — todas as conquistas com flag de desbloqueio do usuário logado
export const listar: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const userId = user!.id;

  const [conquistas, desbloqueadas] = await Promise.all([
    prisma.conquista.findMany(),
    prisma.userConquista.findMany({
      where: { userId },
      select: { conquistaId: true, unlockedAt: true, notificadoEm: true },
    }),
  ]);

  const mapa = new Map(
    desbloqueadas.map((d) => [
      d.conquistaId,
      { unlockedAt: d.unlockedAt, notificadoEm: d.notificadoEm },
    ]),
  );

  const enriquecidas = conquistas.map((c) => {
    const meta = mapa.get(c.id);
    return {
      id: c.id,
      titulo: c.titulo,
      descricao: c.descricao,
      icone: c.icone,
      xpRecompensa: c.xpRecompensa,
      requisito: c.requisito,
      desbloqueada: !!meta,
      unlockedAt: meta?.unlockedAt ?? null,
      notificadoEm: meta?.notificadoEm ?? null,
    };
  });

  // Ordenação: desbloqueadas (mais recente → mais antiga) e depois as bloqueadas.
  const resultado = enriquecidas.sort((a, b) => {
    if (a.desbloqueada && !b.desbloqueada) return -1;
    if (!a.desbloqueada && b.desbloqueada) return 1;
    if (a.desbloqueada && b.desbloqueada) {
      const at = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
      const bt = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
      return bt - at;
    }
    // Bloqueadas: ordena pela meta do requisito (menor → maior); fallback no título.
    const reqA = (a.requisito as { meta?: number } | null)?.meta ?? Number.MAX_SAFE_INTEGER;
    const reqB = (b.requisito as { meta?: number } | null)?.meta ?? Number.MAX_SAFE_INTEGER;
    if (reqA !== reqB) return reqA - reqB;
    return a.titulo.localeCompare(b.titulo);
  });

  res.json({ conquistas: resultado });
};

// PATCH /api/conquistas/:id/notificar — marca uma conquista como notificada para o usuário
export const marcarNotificada: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const userId = user!.id;
  const conquistaId = String(req.params.id);

  const userConq = await prisma.userConquista.findUnique({
    where: { userId_conquistaId: { userId, conquistaId } },
  });
  if (!userConq) {
    res.status(404).json({ error: 'Conquista não desbloqueada para este usuário.' });
    return;
  }
  // Idempotente: se já estava notificada, mantém o timestamp original.
  if (userConq.notificadoEm) {
    res.json({ ok: true, notificadoEm: userConq.notificadoEm });
    return;
  }
  const atualizada = await prisma.userConquista.update({
    where: { userId_conquistaId: { userId, conquistaId } },
    data: { notificadoEm: new Date() },
  });
  res.json({ ok: true, notificadoEm: atualizada.notificadoEm });
};

// GET /api/conquistas/usuario — apenas as conquistas desbloqueadas do usuário logado
export const doUsuario: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const userId = user!.id;

  const desbloqueadas = await prisma.userConquista.findMany({
    where: { userId },
    orderBy: { unlockedAt: 'desc' },
    include: { conquista: true },
  });

  const resultado = desbloqueadas.map((d) => ({
    id: d.conquista.id,
    titulo: d.conquista.titulo,
    descricao: d.conquista.descricao,
    icone: d.conquista.icone,
    xpRecompensa: d.conquista.xpRecompensa,
    requisito: d.conquista.requisito,
    unlockedAt: d.unlockedAt,
    notificadoEm: d.notificadoEm,
  }));

  res.json({ conquistas: resultado });
};
