import { prisma } from '../lib/prisma';

/** Item do ranking global. */
export interface RankingGlobalItem {
  posicao: number;
  id: string;
  nome: string;
  avatarUrl: string | null;
  nivel: string;
  xpTotal: number;
  casosResolvidos: number;
  sequenciaAtual: number;
}

/** Item do ranking semanal. */
export interface RankingSemanalItem {
  posicao: number;
  id: string;
  nome: string;
  avatarUrl: string | null;
  xpSemana: number;
}

/**
 * Ranking global: usuários ordenados por XP total (desc), paginado.
 * Usuários bloqueados são excluídos.
 */
export async function rankingGlobal(opts: {
  page?: number;
  limit?: number;
}): Promise<{ ranking: RankingGlobalItem[]; total: number; page: number; limit: number }> {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 20));
  const skip = (page - 1) * limit;

  const [usuarios, total] = await Promise.all([
    prisma.user.findMany({
      where: { bloqueado: false, role: 'USER' },
      orderBy: [{ xpTotal: 'desc' }, { createdAt: 'asc' }],
      skip,
      take: limit,
      select: {
        id: true,
        nome: true,
        avatarUrl: true,
        nivel: true,
        xpTotal: true,
        sequenciaAtual: true,
        _count: { select: { respostas: true } },
      },
    }),
    prisma.user.count({ where: { bloqueado: false, role: 'USER' } }),
  ]);

  const ranking: RankingGlobalItem[] = usuarios.map((u, i) => ({
    posicao: skip + i + 1,
    id: u.id,
    nome: u.nome,
    avatarUrl: u.avatarUrl,
    nivel: u.nivel,
    xpTotal: u.xpTotal,
    casosResolvidos: u._count.respostas,
    sequenciaAtual: u.sequenciaAtual,
  }));

  return { ranking, total, page, limit };
}

/**
 * Ranking semanal (top 50): soma do XP ganho nas respostas dos últimos 7 dias,
 * agrupado por usuário e ordenado (desc). Usuários bloqueados são excluídos.
 */
export async function rankingSemanal(): Promise<RankingSemanalItem[]> {
  const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const grupos = await prisma.resposta.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: seteDiasAtras } },
    _sum: { xpGanho: true },
    orderBy: { _sum: { xpGanho: 'desc' } },
    take: 50,
  });

  if (grupos.length === 0) return [];

  const usuarios = await prisma.user.findMany({
    where: { id: { in: grupos.map((g) => g.userId) }, bloqueado: false, role: 'USER' },
    select: { id: true, nome: true, avatarUrl: true },
  });
  const mapaUsuarios = new Map(usuarios.map((u) => [u.id, u]));

  const itens: RankingSemanalItem[] = [];
  for (const g of grupos) {
    const u = mapaUsuarios.get(g.userId);
    if (!u) continue; // usuário bloqueado ou inexistente
    itens.push({
      posicao: 0, // preenchido abaixo após filtrar
      id: u.id,
      nome: u.nome,
      avatarUrl: u.avatarUrl,
      xpSemana: g._sum.xpGanho ?? 0,
    });
  }

  return itens.map((item, i) => ({ ...item, posicao: i + 1 }));
}

/**
 * Posição do usuário no ranking global: conta quantos usuários (não bloqueados)
 * têm XP total maior e soma 1.
 */
export async function posicaoUsuario(
  userId: string,
): Promise<{ posicao: number; xpTotal: number; total: number }> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { xpTotal: true },
  });

  const [acima, total] = await Promise.all([
    prisma.user.count({
      where: { bloqueado: false, role: 'USER', xpTotal: { gt: user.xpTotal } },
    }),
    prisma.user.count({ where: { bloqueado: false, role: 'USER' } }),
  ]);

  return { posicao: acima + 1, xpTotal: user.xpTotal, total };
}
