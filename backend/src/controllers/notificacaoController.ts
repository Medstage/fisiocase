import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

// GET /api/notificacoes — últimas 20 do usuário logado
export const listar: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const notificacoes = await prisma.notificacao.findMany({
    where: { userId: user!.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  const naoLidas = await prisma.notificacao.count({
    where: { userId: user!.id, lida: false },
  });
  res.json({ notificacoes, naoLidas });
};

// PUT /api/notificacoes/:id/marcar-lida
export const marcarLida: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const id = String(req.params.id);
  const n = await prisma.notificacao.findUnique({ where: { id }, select: { userId: true } });
  if (!n || n.userId !== user!.id) {
    res.status(404).json({ error: 'Notificação não encontrada.' });
    return;
  }
  await prisma.notificacao.update({ where: { id }, data: { lida: true } });
  res.json({ message: 'Marcada como lida.' });
};

// PUT /api/notificacoes/marcar-todas-lidas
export const marcarTodasLidas: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  await prisma.notificacao.updateMany({ where: { userId: user!.id, lida: false }, data: { lida: true } });
  res.json({ message: 'Todas marcadas como lidas.' });
};
