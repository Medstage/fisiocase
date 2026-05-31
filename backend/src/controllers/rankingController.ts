import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as rankingService from '../services/rankingService';

// GET /api/ranking/global?page=&limit=
export const global: RequestHandler = async (req, res) => {
  const page = req.query.page ? Number(req.query.page) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;

  const resultado = await rankingService.rankingGlobal({ page, limit });
  res.json(resultado);
};

// GET /api/ranking/semanal
export const semanal: RequestHandler = async (_req, res) => {
  const ranking = await rankingService.rankingSemanal();
  res.json({ ranking });
};

// GET /api/ranking/posicao — posição do usuário logado
export const posicao: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const resultado = await rankingService.posicaoUsuario(user!.id);
  res.json(resultado);
};
