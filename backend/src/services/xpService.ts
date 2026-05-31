import { prisma } from '../lib/prisma';

/** Calcula o XP ganho com base na nota (0–100) de uma resposta. */
export function calcularXP(nota: number): number {
  if (nota >= 90) return 400;
  if (nota >= 80) return 320;
  if (nota >= 70) return 240;
  if (nota >= 60) return 160;
  return 80;
}

/** Determina o nível textual do usuário a partir do XP total acumulado. */
export function calcularNivel(xpTotal: number): string {
  if (xpTotal <= 500) return 'Iniciante';
  if (xpTotal <= 1500) return 'Estudante';
  if (xpTotal <= 3000) return 'Residente';
  if (xpTotal <= 6000) return 'Especialista';
  return 'Mestre';
}

export interface ResultadoXP {
  xpGanho: number;
  nivelAnterior: string;
  nivelNovo: string;
  subiuNivel: boolean;
}

/**
 * Processa apenas XP e nível após uma resposta.
 * O streak/sequência é tratado em `streakService.registrarRespostaStreak`.
 */
export async function processarResposta(userId: string, nota: number): Promise<ResultadoXP> {
  const xpGanho = calcularXP(nota);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    const nivelAnterior = user.nivel;
    const novoXpTotal = user.xpTotal + xpGanho;
    const nivelNovo = calcularNivel(novoXpTotal);

    await tx.user.update({
      where: { id: userId },
      data: {
        xpTotal: novoXpTotal,
        xpAtual: user.xpAtual + xpGanho,
        nivel: nivelNovo,
      },
    });

    return { xpGanho, nivelAnterior, nivelNovo, subiuNivel: nivelNovo !== nivelAnterior };
  });
}
