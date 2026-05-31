import { prisma } from '../lib/prisma';
import type { Conquista, Area } from '@prisma/client';

/** Formatos de requisito suportados (armazenados no campo Json `requisito`). */
type Requisito =
  | { tipo: 'casos_resolvidos'; meta: number }
  | { tipo: 'casos_area'; area: Area; meta: number; mediaMinima?: number }
  | { tipo: 'sequencia'; meta: number }
  | { tipo: 'nota_perfeita' }
  | { tipo: 'media_geral'; meta: number; minCasos: number };

/**
 * Verifica todas as conquistas ainda não desbloqueadas do usuário, desbloqueia
 * as que foram atingidas (criando UserConquista) e soma o xpRecompensa ao usuário.
 * Retorna o array das conquistas recém-desbloqueadas.
 */
export async function verificarConquistas(userId: string): Promise<Conquista[]> {
  const [todas, jaDesbloqueadas] = await Promise.all([
    prisma.conquista.findMany(),
    prisma.userConquista.findMany({ where: { userId }, select: { conquistaId: true } }),
  ]);

  const desbloqueadasIds = new Set(jaDesbloqueadas.map((u) => u.conquistaId));
  const pendentes = todas.filter((c) => !desbloqueadasIds.has(c.id));
  if (pendentes.length === 0) return [];

  // Estatísticas do usuário usadas para avaliar os requisitos.
  const [user, totalResolvidos, notaPerfeita, agregadoGeral] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    // Conta casos DISTINTOS resolvidos (uma resposta por caso conta uma vez).
    prisma.resposta.findMany({ where: { userId }, distinct: ['casoId'], select: { casoId: true } }),
    prisma.resposta.findFirst({ where: { userId, nota: 100 }, select: { id: true } }),
    prisma.resposta.aggregate({ where: { userId }, _avg: { nota: true }, _count: { _all: true } }),
  ]);

  const totalCasos = totalResolvidos.length;
  const temNotaPerfeita = notaPerfeita !== null;
  const mediaGeral = agregadoGeral._avg.nota ?? 0;
  const totalRespostas = agregadoGeral._count._all;

  // Cache de estatísticas por área (carregadas sob demanda).
  const cacheArea = new Map<Area, { total: number; media: number }>();
  async function estatisticasArea(area: Area): Promise<{ total: number; media: number }> {
    const cached = cacheArea.get(area);
    if (cached) return cached;
    const respostasArea = await prisma.resposta.findMany({
      where: { userId, caso: { area } },
      select: { nota: true },
    });
    const total = respostasArea.length;
    const soma = respostasArea.reduce((acc, r) => acc + (r.nota ?? 0), 0);
    const media = total > 0 ? soma / total : 0;
    const stats = { total, media };
    cacheArea.set(area, stats);
    return stats;
  }

  async function atingiu(req: Requisito): Promise<boolean> {
    switch (req.tipo) {
      case 'casos_resolvidos':
        return totalCasos >= req.meta;
      case 'sequencia':
        return user.maiorSequencia >= req.meta;
      case 'nota_perfeita':
        return temNotaPerfeita;
      case 'media_geral':
        return totalRespostas >= req.minCasos && mediaGeral >= req.meta;
      case 'casos_area': {
        const stats = await estatisticasArea(req.area);
        if (stats.total < req.meta) return false;
        if (req.mediaMinima !== undefined && stats.media < req.mediaMinima) return false;
        return true;
      }
      default:
        return false;
    }
  }

  const recemDesbloqueadas: Conquista[] = [];

  for (const conquista of pendentes) {
    const req = conquista.requisito as unknown as Requisito;
    if (!req || typeof req !== 'object' || !('tipo' in req)) continue;

    if (await atingiu(req)) {
      // Desbloqueia dentro de uma transação: cria o vínculo e credita o XP.
      await prisma.$transaction([
        prisma.userConquista.create({ data: { userId, conquistaId: conquista.id } }),
        prisma.user.update({
          where: { id: userId },
          data: {
            xpTotal: { increment: conquista.xpRecompensa },
            xpAtual: { increment: conquista.xpRecompensa },
          },
        }),
      ]);
      recemDesbloqueadas.push(conquista);
    }
  }

  return recemDesbloqueadas;
}
