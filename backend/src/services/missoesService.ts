import { prisma } from '../lib/prisma';
import type { Missao } from '@prisma/client';

/**
 * Avalia as missões diárias do usuário após uma resposta e marca as completadas.
 * Tipos suportados:
 *  - `resolver_casos`: progresso = nº de respostas do usuário HOJE; completa quando >= meta.
 *  - `media_acima`: completa quando a nota atual >= meta (meta = 0..100).
 *
 * Credita o xpRecompensa da missão ao usuário quando completa pela primeira vez.
 * Retorna as missões recém-completadas (para o feedback exibir).
 */
export async function progredirMissoesDiarias(userId: string, nota: number | null): Promise<Missao[]> {
  const inicioDia = new Date();
  inicioDia.setHours(0, 0, 0, 0);

  const [missoes, casosHoje] = await Promise.all([
    prisma.missao.findMany(),
    prisma.resposta.count({ where: { userId, createdAt: { gte: inicioDia } } }),
  ]);

  const recemCompletadas: Missao[] = [];

  for (const m of missoes) {
    const um = await prisma.userMissao.findUnique({
      where: { userId_missaoId: { userId, missaoId: m.id } },
    });

    // Se já foi completada antes, mantém o progresso atual e segue (sem creditar XP de novo).
    if (um?.completedAt) {
      // Ainda assim mantém o progresso atualizado para `resolver_casos` (apenas visual).
      if (m.tipo === 'resolver_casos' && um.progresso !== casosHoje) {
        await prisma.userMissao.update({
          where: { userId_missaoId: { userId, missaoId: m.id } },
          data: { progresso: casosHoje },
        });
      }
      continue;
    }

    let progresso = um?.progresso ?? 0;
    let completar = false;

    if (m.tipo === 'resolver_casos') {
      progresso = casosHoje;
      completar = progresso >= m.meta;
    } else if (m.tipo === 'media_acima') {
      if (nota !== null && nota >= m.meta) {
        progresso = m.meta;
        completar = true;
      }
    }

    await prisma.userMissao.upsert({
      where: { userId_missaoId: { userId, missaoId: m.id } },
      create: {
        userId,
        missaoId: m.id,
        progresso,
        completedAt: completar ? new Date() : null,
      },
      update: {
        progresso,
        completedAt: completar ? new Date() : null,
      },
    });

    if (completar) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          xpTotal: { increment: m.xpRecompensa },
          xpAtual: { increment: m.xpRecompensa },
        },
      });
      recemCompletadas.push(m);
    }
  }

  return recemCompletadas;
}
