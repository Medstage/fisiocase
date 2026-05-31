import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/** Exige que `req.user.role === 'ADMIN'`. Use sempre após `authenticate`. */
export function adminOnly(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Acesso restrito a administradores' });
    return;
  }
  next();
}
