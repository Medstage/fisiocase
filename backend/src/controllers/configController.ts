import { RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// PUT /api/configuracoes/senha — altera a senha do usuário logado
export const alterarSenha: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const { senhaAtual, novaSenha } = req.body as { senhaAtual: string; novaSenha: string };

  const dados = await prisma.user.findUniqueOrThrow({ where: { id: user!.id } });

  const ok = await bcrypt.compare(senhaAtual, dados.senha);
  if (!ok) {
    res.status(401).json({ error: 'Senha atual incorreta' });
    return;
  }

  const hash = await bcrypt.hash(novaSenha, 10);
  await prisma.user.update({ where: { id: user!.id }, data: { senha: hash } });
  res.json({ message: 'Senha atualizada com sucesso.' });
};

// PUT /api/configuracoes/notificacoes — placeholder (sem colunas no schema)
export const atualizarNotificacoes: RequestHandler = async (_req, res) => {
  res.json({ message: 'Preferências de notificação atualizadas' });
};

// PUT /api/configuracoes/privacidade — placeholder (sem colunas no schema)
export const atualizarPrivacidade: RequestHandler = async (_req, res) => {
  res.json({ message: 'Preferências de privacidade atualizadas' });
};

// DELETE /api/configuracoes/conta — exclui a conta do usuário logado (cascade)
export const excluirConta: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const { senha } = req.body as { senha: string };

  const dados = await prisma.user.findUniqueOrThrow({ where: { id: user!.id } });

  const ok = await bcrypt.compare(senha, dados.senha);
  if (!ok) {
    res.status(401).json({ error: 'Senha incorreta' });
    return;
  }

  await prisma.user.delete({ where: { id: user!.id } });
  res.json({ message: 'Conta excluída com sucesso.' });
};
