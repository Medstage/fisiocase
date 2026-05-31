import { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// GET /api/conquistas — todas as conquistas com flag de desbloqueio do usuário logado
export const listar: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const userId = user!.id;

  const [conquistas, desbloqueadas] = await Promise.all([
    prisma.conquista.findMany({ orderBy: { titulo: 'asc' } }),
    prisma.userConquista.findMany({
      where: { userId },
      select: { conquistaId: true, unlockedAt: true },
    }),
  ]);

  const mapa = new Map(desbloqueadas.map((d) => [d.conquistaId, d.unlockedAt]));

  const resultado = conquistas.map((c) => ({
    id: c.id,
    titulo: c.titulo,
    descricao: c.descricao,
    icone: c.icone,
    xpRecompensa: c.xpRecompensa,
    requisito: c.requisito,
    desbloqueada: mapa.has(c.id),
    unlockedAt: mapa.get(c.id) ?? null,
  }));

  res.json({ conquistas: resultado });
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
  }));

  res.json({ conquistas: resultado });
};
