import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import type { Role } from '../lib/jwt';

/** Exige que o usuário autenticado tenha uma das roles permitidas. Aplicar APÓS `authenticate`. */
export const checkRole =
  (...roles: Role[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Não autenticado' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Acesso negado para esta operação.' });
      return;
    }
    next();
  };
