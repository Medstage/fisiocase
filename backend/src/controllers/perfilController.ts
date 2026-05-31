import { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { calcularNivel } from '../services/xpService';
import type { User, Area } from '@prisma/client';

/** Remove a senha antes de devolver o usuário ao cliente. */
function sanitize(user: User) {
  const { senha: _senha, ...rest } = user;
  return rest;
}

/** Retorna só ano/mês/dia (timestamp) para agrupar por "calendário". */
function soData(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

// GET /api/perfil — dados do usuário logado (sem senha)
export const obter: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const dados = await prisma.user.findUnique({ where: { id: user!.id } });
  if (!dados) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }
  res.json({ user: sanitize(dados) });
};

// PUT /api/perfil — atualiza apenas os campos enviados
export const atualizar: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const { nome, bio, instituicao, semestre } = req.body as {
    nome?: string;
    bio?: string;
    instituicao?: string;
    semestre?: number;
  };

  const data: Record<string, unknown> = {};
  if (nome !== undefined) data.nome = nome;
  if (bio !== undefined) data.bio = bio;
  if (instituicao !== undefined) data.instituicao = instituicao;
  if (semestre !== undefined) data.semestre = semestre;

  const atualizado = await prisma.user.update({ where: { id: user!.id }, data });
  res.json({ user: sanitize(atualizado) });
};

// PUT /api/perfil/avatar — atualiza a URL do avatar
export const atualizarAvatar: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const { avatarUrl } = req.body as { avatarUrl: string };

  const atualizado = await prisma.user.update({
    where: { id: user!.id },
    data: { avatarUrl },
  });
  res.json({ user: sanitize(atualizado) });
};

// GET /api/perfil/estatisticas — métricas do usuário logado
export const estatisticas: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const userId = user!.id;

  // Busca o usuário (sequência) e as respostas com a área do caso.
  const [dadosUser, respostas] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { maiorSequencia: true },
    }),
    prisma.resposta.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        nota: true,
        xpGanho: true,
        createdAt: true,
        caso: { select: { area: true } },
      },
    }),
  ]);

  const totalCasos = respostas.length;

  // Casos resolvidos por área.
  const contagemArea = new Map<Area, number>();
  // Soma e contagem de notas por área (para média -> melhor área).
  const somaNotaArea = new Map<Area, { soma: number; qtd: number }>();
  let somaNotasGeral = 0;
  let qtdNotasGeral = 0;

  for (const r of respostas) {
    const area = r.caso.area;
    contagemArea.set(area, (contagemArea.get(area) ?? 0) + 1);
    if (r.nota !== null) {
      const atual = somaNotaArea.get(area) ?? { soma: 0, qtd: 0 };
      atual.soma += r.nota;
      atual.qtd += 1;
      somaNotaArea.set(area, atual);
      somaNotasGeral += r.nota;
      qtdNotasGeral += 1;
    }
  }

  const casosResolvidosPorArea = Array.from(contagemArea.entries()).map(([area, total]) => ({
    area,
    total,
  }));

  // Melhor área = maior média de nota.
  let melhorArea: Area | null = null;
  let melhorMedia = -1;
  for (const [area, { soma, qtd }] of somaNotaArea.entries()) {
    const media = qtd > 0 ? soma / qtd : 0;
    if (media > melhorMedia) {
      melhorMedia = media;
      melhorArea = area;
    }
  }

  const mediaGeral = qtdNotasGeral > 0 ? Math.round((somaNotasGeral / qtdNotasGeral) * 10) / 10 : 0;

  // Evolução semanal de XP — últimas ~6 semanas (incluindo a atual).
  const SEMANAS = 6;
  const MS_SEMANA = 7 * 24 * 60 * 60 * 1000;
  const hoje = soData(new Date());
  const evolucaoSemanalXp: Array<{ semana: string; xp: number }> = [];

  for (let i = SEMANAS - 1; i >= 0; i--) {
    const inicio = hoje - i * MS_SEMANA;
    const fim = inicio + MS_SEMANA;
    const xp = respostas.reduce((acc, r) => {
      const t = r.createdAt.getTime();
      return t >= inicio && t < fim ? acc + r.xpGanho : acc;
    }, 0);
    // Rótulo: "S-5" (mais antiga) ... "S-0" (atual).
    evolucaoSemanalXp.push({ semana: `S-${i}`, xp });
  }

  res.json({
    casosResolvidosPorArea,
    evolucaoSemanalXp,
    maiorSequencia: dadosUser.maiorSequencia,
    melhorArea,
    totalCasos,
    mediaGeral,
  });
};

// GET /api/perfil/certificados — derivados de marcos (níveis e quantidade de casos)
export const certificados: RequestHandler = async (req, res) => {
  const { user } = req as AuthRequest;
  const userId = user!.id;

  const [dadosUser, totalCasos] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { xpTotal: true, createdAt: true },
    }),
    prisma.resposta.count({ where: { userId } }),
  ]);

  const certificadosLista: Array<{ titulo: string; descricao: string; data: Date }> = [];

  // Marcos por nível alcançado (com base no XP total).
  const niveis: Array<{ nivel: string; xp: number }> = [
    { nivel: 'Estudante', xp: 501 },
    { nivel: 'Residente', xp: 1501 },
    { nivel: 'Especialista', xp: 3001 },
    { nivel: 'Mestre', xp: 6001 },
  ];
  for (const n of niveis) {
    if (dadosUser.xpTotal >= n.xp) {
      certificadosLista.push({
        titulo: `Nível ${n.nivel}`,
        descricao: `Você alcançou o nível ${n.nivel} acumulando ${n.xp} XP ou mais.`,
        data: dadosUser.createdAt,
      });
    }
  }

  // Marcos a cada 10 casos resolvidos.
  for (let marco = 10; marco <= totalCasos; marco += 10) {
    certificadosLista.push({
      titulo: `${marco} casos resolvidos`,
      descricao: `Parabéns por resolver ${marco} casos clínicos na plataforma.`,
      data: dadosUser.createdAt,
    });
  }

  // Garante que o nível atual textual seja coerente com o xpTotal (informativo).
  const nivelAtual = calcularNivel(dadosUser.xpTotal);

  res.json({ nivelAtual, certificados: certificadosLista });
};
