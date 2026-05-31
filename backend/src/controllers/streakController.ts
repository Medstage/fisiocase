import { RequestHandler } from 'express';
import { AuthRequest } from '../middleware/auth';
import { verificarStreak } from '../services/streakService';

// GET /api/streak — verifica streak (detecta quebra/uso de protetor) e retorna estado atual.
export const checar: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const resultado = await verificarStreak(user!.id);
  res.json(resultado);
};
