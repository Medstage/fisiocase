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
 * Calcula o início da semana atual (segunda-feira 00:00) no fuso horário
 * America/Sao_Paulo (UTC-3, sem horário de verão atualmente). Retorna um Date
 * em UTC equivalente para uso direto em comparações Prisma.
 *
 * Por que SP e não UTC puro: se o usuário responde domingo 22h em SP, isso é
 * segunda-feira 01h UTC — em UTC ele cairia na semana seguinte e sumiria do
 * ranking semanal por 7 dias inteiros. Forçando SP, a semana espelha o que o
 * aluno enxerga no calendário.
 */
function inicioSemanaSP(): Date {
  const agora = new Date();
  // Componentes "as if Brazil": dia/mês/ano/hora em America/Sao_Paulo.
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    weekday: 'short',
  }).formatToParts(agora);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  // weekday: Sun/Mon/Tue/Wed/Thu/Fri/Sat → quantos dias subtrair pra chegar em segunda
  const wd = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }[map.weekday] ?? 0;
  // Constrói meia-noite de SP do dia atual: SP é UTC-3 → meia-noite SP = 03:00 UTC do mesmo dia.
  const meiaNoiteHoje = new Date(
    Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day), 3, 0, 0, 0),
  );
  meiaNoiteHoje.setUTCDate(meiaNoiteHoje.getUTCDate() - wd);
  return meiaNoiteHoje;
}

/**
 * Ranking semanal (top 50): soma do XP ganho na semana corrente (início =
 * segunda-feira 00:00 America/Sao_Paulo), agregando XP de duas fontes:
 *   1. Respostas nativas (avaliadas por IA): Resposta.xpGanho onde createdAt >= início
 *   2. Tarefas de turma corrigidas pelo professor: RespostaTurma.xpGanho onde corrigidoEm >= início
 *
 * Usuários bloqueados ou que não são alunos (PROFESSOR/ADMIN) são excluídos.
 */
export async function rankingSemanal(): Promise<RankingSemanalItem[]> {
  const inicio = inicioSemanaSP();

  const [gruposNativos, gruposTurma] = await Promise.all([
    prisma.resposta.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: inicio } },
      _sum: { xpGanho: true },
    }),
    prisma.respostaTurma.groupBy({
      by: ['alunoId'],
      where: { corrigidoEm: { gte: inicio }, status: 'CORRIGIDO' },
      _sum: { xpGanho: true },
    }),
  ]);

  // Soma as duas fontes por userId.
  const soma = new Map<string, number>();
  for (const g of gruposNativos) {
    soma.set(g.userId, (soma.get(g.userId) ?? 0) + (g._sum.xpGanho ?? 0));
  }
  for (const g of gruposTurma) {
    soma.set(g.alunoId, (soma.get(g.alunoId) ?? 0) + (g._sum.xpGanho ?? 0));
  }
  if (soma.size === 0) return [];

  const ids = Array.from(soma.keys());
  const usuarios = await prisma.user.findMany({
    where: { id: { in: ids }, bloqueado: false, role: 'USER' },
    select: { id: true, nome: true, avatarUrl: true },
  });

  const itens: RankingSemanalItem[] = usuarios
    .map((u) => ({
      posicao: 0,
      id: u.id,
      nome: u.nome,
      avatarUrl: u.avatarUrl,
      xpSemana: soma.get(u.id) ?? 0,
    }))
    .filter((it) => it.xpSemana > 0)
    .sort((a, b) => b.xpSemana - a.xpSemana)
    .slice(0, 50)
    .map((item, i) => ({ ...item, posicao: i + 1 }));

  return itens;
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
