import { prisma } from '../lib/prisma';
import type { Missao } from '@prisma/client';

export type OrigemMissao = 'NATIVO' | 'TURMA';

/**
 * Início do dia atual no fuso America/Sao_Paulo (00:00 SP),
 * retornado como Date UTC equivalente.
 * Sem isso, em Railway (UTC), uma resposta às 22h SP cairia "no dia seguinte".
 */
function inicioDoDiaSP(): Date {
  const agora = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(agora);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  // 00:00 SP = 03:00 UTC do mesmo dia (SP é UTC-3, sem horário de verão).
  return new Date(
    Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day), 3, 0, 0, 0),
  );
}

/**
 * Conta o total de casos resolvidos pelo aluno HOJE (SP), de qualquer origem:
 *   - Respostas nativas (Resposta) com createdAt >= início do dia SP
 *   - Tarefas de turma (RespostaTurma) com createdAt >= início do dia SP
 * É a métrica usada pelo tipo `resolver_casos` das missões diárias.
 */
async function totalCasosHojeSomadas(userId: string, inicioDia: Date): Promise<number> {
  const [nativas, deTurma] = await Promise.all([
    prisma.resposta.count({ where: { userId, createdAt: { gte: inicioDia } } }),
    prisma.respostaTurma.count({ where: { alunoId: userId, createdAt: { gte: inicioDia } } }),
  ]);
  return nativas + deTurma;
}

/**
 * Avalia as missões diárias do usuário após uma resposta e marca as completadas.
 *
 * Tipos suportados:
 *  - `resolver_casos`: progresso = total de respostas do usuário HOJE (qualquer origem)
 *  - `media_acima`: completa quando a nota recém-obtida >= meta (0..100)
 *
 * Credita o xpRecompensa quando completa pela primeira vez.
 * É **agnóstico à origem da resposta** (nativa ou de turma) — o parâmetro `origem`
 * existe apenas para fins de log.
 *
 * Retorna as missões recém-completadas.
 */
export async function progredirMissoesDiarias(
  userId: string,
  nota: number | null,
  origem: OrigemMissao = 'NATIVO',
): Promise<Missao[]> {
  // eslint-disable-next-line no-console
  console.log(
    `[MissaoService] Incrementando progresso para userId=${userId} origem=${origem} nota=${nota}`,
  );

  const inicioDia = inicioDoDiaSP();
  const [missoes, casosHoje] = await Promise.all([
    prisma.missao.findMany(),
    totalCasosHojeSomadas(userId, inicioDia),
  ]);

  const recemCompletadas: Missao[] = [];

  for (const m of missoes) {
    const um = await prisma.userMissao.findUnique({
      where: { userId_missaoId: { userId, missaoId: m.id } },
    });

    // Já completada antes: mantém o progresso atualizado (visual) mas não credita XP de novo.
    if (um?.completedAt) {
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
      // eslint-disable-next-line no-console
      console.log(
        `[MissaoService] Missão "${m.titulo}" completada por userId=${userId} origem=${origem} +${m.xpRecompensa}XP`,
      );
      recemCompletadas.push(m);
    }
  }

  return recemCompletadas;
}
