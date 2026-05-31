import jwt from 'jsonwebtoken';
import { env } from './env';

export type Role = 'USER' | 'PROFESSOR' | 'ADMIN';

export interface JwtPayload {
  id: string;
  nome: string;
  role: Role;
  nivel: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as unknown as JwtPayload;
}
