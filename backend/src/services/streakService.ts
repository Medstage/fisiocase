import { prisma } from '../lib/prisma';

export type NivelFogo = 'apagado' | 'pequeno' | 'medio' | 'grande' | 'lendario';

export interface NivelInfo {
  nivel: NivelFogo;
  label: string;
  cor: string;
  proximoNivelDias: number | null;
  diasParaProximo: number | null;
}

/** Determina o nível do fogo a partir do streak atual. */
export function calcularNivelFogo(streak: number): NivelInfo {
  if (streak <= 0)
    return { nivel: 'apagado', label: 'Apagado', cor: '#737373', proximoNivelDias: 1, diasParaProximo: 1 };
  if (streak <= 6)
    return { nivel: 'pequeno', label: 'Pequena chama', cor: '#16a34a', proximoNivelDias: 7, diasParaProximo: 7 - streak };
  if (streak <= 29)
    return { nivel: 'medio', label: 'Chama média', cor: '#0F4D0F', proximoNivelDias: 30, diasParaProximo: 30 - streak };
  if (streak <= 89)
    return { nivel: 'grande', label: 'Em chamas', cor: '#f97316', proximoNivelDias: 90, diasParaProximo: 90 - streak };
  return { nivel: 'lendario', label: 'Lendário', cor: '#dc2626', proximoNivelDias: null, diasParaProximo: null };
}

function inicioDoDia(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function diasEntre(a: Date, b: Date): number {
  return Math.round((inicioDoDia(a).getTime() - inicioDoDia(b).getTime()) / 86_400_000);
}

export interface ResultadoStreak {
  sequenciaAtual: number;
  maiorSequencia: number;
  protetoresStreak: number;
  protetorUsado: boolean;
  quebrou: boolean;
  ganhouProtetor: boolean;
  resolveuHoje: boolean;
  nivel: NivelInfo;
}

/**
 * Verifica o estado do streak SEM registrar nova resposta.
 * Pode ser chamado no login/dashboard: detecta quebra ou uso de protetor.
 * Idempotente no mesmo dia.
 */
export async function verificarStreak(userId: string): Promise<ResultadoStreak> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const hoje = new Date();
  const inicio = inicioDoDia(hoje);

  const respostaHoje = await prisma.resposta.findFirst({
    where: { userId, createdAt: { gte: inicio } },
    select: { id: true },
  });
  const resolveuHoje = !!respostaHoje;

  const ultima = await prisma.resposta.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  let { sequenciaAtual, maiorSequencia, protetoresStreak } = user;
  let quebrou = false;
  let protetorUsado = false;

  if (!ultima) {
    sequenciaAtual = 0;
  } else if (!resolveuHoje) {
    const dias = diasEntre(hoje, ultima.createdAt);
    if (dias <= 1) {
      // ok (resolveu ontem, ainda na janela)
    } else if (dias === 2 && protetoresStreak > 0) {
      protetoresStreak -= 1;
      protetorUsado = true;
    } else {
      if (sequenciaAtual > 0) quebrou = true;
      sequenciaAtual = 0;
    }
  }

  if (sequenciaAtual > maiorSequencia) maiorSequencia = sequenciaAtual;

  const upd = await prisma.user.update({
    where: { id: userId },
    data: { sequenciaAtual, maiorSequencia, protetoresStreak, ultimoAcessoStreak: hoje },
  });

  return {
    sequenciaAtual: upd.sequenciaAtual,
    maiorSequencia: upd.maiorSequencia,
    protetoresStreak: upd.protetoresStreak,
    protetorUsado,
    quebrou,
    ganhouProtetor: false,
    resolveuHoje,
    nivel: calcularNivelFogo(upd.sequenciaAtual),
  };
}

/**
 * Registra o impacto de uma nova resposta no streak do usuário.
 * - Outra resposta hoje? mantém.
 * - Última foi ontem? incrementa (+1).
 * - Última foi anteontem e tem protetor? consome protetor e incrementa.
 * - Caso contrário: streak vira 1 (e flag `quebrou` se vinha de > 0).
 * - A cada múltiplo de 7 alcançado: ganha 1 protetor (máx 2).
 */
export async function registrarRespostaStreak(userId: string): Promise<ResultadoStreak> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const hoje = new Date();
  const inicio = inicioDoDia(hoje);

  const respostasHoje = await prisma.resposta.count({
    where: { userId, createdAt: { gte: inicio } },
  });
  const ultimaAntes = await prisma.resposta.findFirst({
    where: { userId, createdAt: { lt: inicio } },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  let { sequenciaAtual, maiorSequencia, protetoresStreak } = user;
  let protetorUsado = false;
  let quebrou = false;
  let ganhouProtetor = false;

  if (respostasHoje <= 1) {
    // É a primeira resposta de hoje (count == 1 pois a recém-criada já entrou).
    if (!ultimaAntes) {
      sequenciaAtual = 1;
    } else {
      const dias = diasEntre(hoje, ultimaAntes.createdAt);
      if (dias === 1) {
        sequenciaAtual += 1;
      } else if (dias === 2 && protetoresStreak > 0) {
        protetoresStreak -= 1;
        protetorUsado = true;
        sequenciaAtual += 1;
      } else if (dias >= 2) {
        if (sequenciaAtual > 0) quebrou = true;
        sequenciaAtual = 1;
      }
    }

    if (sequenciaAtual > 0 && sequenciaAtual % 7 === 0 && protetoresStreak < 2) {
      protetoresStreak += 1;
      ganhouProtetor = true;
    }
  }

  if (sequenciaAtual > maiorSequencia) maiorSequencia = sequenciaAtual;

  const upd = await prisma.user.update({
    where: { id: userId },
    data: { sequenciaAtual, maiorSequencia, protetoresStreak, ultimoAcessoStreak: hoje },
  });

  return {
    sequenciaAtual: upd.sequenciaAtual,
    maiorSequencia: upd.maiorSequencia,
    protetoresStreak: upd.protetoresStreak,
    protetorUsado,
    quebrou,
    ganhouProtetor,
    resolveuHoje: true,
    nivel: calcularNivelFogo(upd.sequenciaAtual),
  };
}
