import { RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { signToken } from '../lib/jwt';
import { env } from '../lib/env';
import type { User } from '@prisma/client';

/** Remove a senha antes de devolver o usuário ao cliente. */
function sanitize(user: User) {
  const { senha: _senha, ...rest } = user;
  return rest;
}

// POST /api/auth/register
export const register: RequestHandler = async (req, res) => {
  // Cadastro público SEMPRE cria USER. Promoção a PROFESSOR só via /api/admin/professores.
  const { nome, email, senha, instituicao, semestre } = req.body as {
    nome: string;
    email: string;
    senha: string;
    instituicao?: string;
    semestre?: number;
  };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'E-mail já cadastrado' });
    return;
  }

  const hash = await bcrypt.hash(senha, 10);
  const user = await prisma.user.create({
    data: {
      nome,
      email,
      senha: hash,
      instituicao,
      semestre,
      role: 'USER',
      nivel: 'Iniciante',
      xpTotal: 0,
      xpAtual: 0,
    },
  });

  const token = signToken({ id: user.id, nome: user.nome, role: user.role, nivel: user.nivel });
  res.status(201).json({ token, user: sanitize(user) });
};

// POST /api/auth/login
export const login: RequestHandler = async (req, res) => {
  const { email, senha } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }
  if (user.bloqueado) {
    res.status(403).json({ error: 'Conta bloqueada. Contate o administrador.' });
    return;
  }

  const ok = await bcrypt.compare(senha, user.senha);
  if (!ok) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }

  const token = signToken({ id: user.id, nome: user.nome, role: user.role, nivel: user.nivel });
  res.json({ token, user: sanitize(user) });
};

// POST /api/auth/recuperar-senha
export const recuperarSenha: RequestHandler = async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  // Não revelar se o e-mail existe.
  if (user) {
    const resetToken = jwt.sign({ id: user.id, type: 'reset' }, env.JWT_SECRET, { expiresIn: '1h' });
    // TODO: enviar por e-mail. Em dev, logamos o link.
    // eslint-disable-next-line no-console
    console.log(`[recuperar-senha] ${env.NEXTAUTH_URL}/nova-senha?token=${resetToken}`);
  }

  res.json({ message: 'Se o e-mail estiver cadastrado, enviamos as instruções de recuperação.' });
};

// POST /api/auth/nova-senha
export const novaSenha: RequestHandler = async (req, res) => {
  const { token, senha } = req.body;

  let payload: { id: string; type: string };
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as unknown as { id: string; type: string };
  } catch {
    res.status(400).json({ error: 'Token inválido ou expirado' });
    return;
  }

  if (payload.type !== 'reset') {
    res.status(400).json({ error: 'Token inválido' });
    return;
  }

  const hash = await bcrypt.hash(senha, 10);
  await prisma.user.update({ where: { id: payload.id }, data: { senha: hash } });
  res.json({ message: 'Senha atualizada com sucesso.' });
};
