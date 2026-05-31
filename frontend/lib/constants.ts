import type { Area, Dificuldade, TipoPaciente, FocoClinico } from '@/types';

export const AREA_LABEL: Record<Area, string> = {
  ORTOPEDIA: 'Ortopedia',
  NEUROLOGIA: 'Neurologia',
  CARDIORRESPIRATORIA: 'Cardiorrespiratória',
  ESPORTIVA: 'Esportiva',
  GERONTOLOGIA: 'Gerontologia',
  PEDIATRIA: 'Pediatria',
  UROGINECOLOGIA: 'Uroginecologia',
  REUMATOLOGIA: 'Reumatologia',
};

export const DIFICULDADE_LABEL: Record<Dificuldade, string> = {
  FACIL: 'Fácil',
  MEDIO: 'Médio',
  DIFICIL: 'Difícil',
};

export const TIPO_PACIENTE_LABEL: Record<TipoPaciente, string> = {
  ADULTO: 'Adulto',
  IDOSO: 'Idoso',
  PEDIATRICO: 'Pediátrico',
  GESTANTE: 'Gestante',
  ATLETA: 'Atleta',
};

export const FOCO_LABEL: Record<FocoClinico, string> = {
  AVALIACAO: 'Avaliação',
  DIAGNOSTICO: 'Diagnóstico',
  CONDUTA: 'Conduta',
  REABILITACAO: 'Reabilitação',
  PREVENCAO: 'Prevenção',
};

export const NIVEIS = [
  { nome: 'Iniciante', min: 0, max: 500 },
  { nome: 'Estudante', min: 501, max: 1500 },
  { nome: 'Residente', min: 1501, max: 3000 },
  { nome: 'Especialista', min: 3001, max: 6000 },
  { nome: 'Mestre', min: 6001, max: Infinity },
] as const;

export function progressoNivel(xpTotal: number) {
  const atual = NIVEIS.find((n) => xpTotal >= n.min && xpTotal <= n.max) ?? NIVEIS[NIVEIS.length - 1];
  if (atual.max === Infinity) {
    return { nivel: atual.nome, pct: 100, faltam: 0, proximo: null as string | null };
  }
  const span = atual.max - atual.min + 1;
  const pct = Math.min(100, Math.max(0, Math.round(((xpTotal - atual.min) / span) * 100)));
  const idx = NIVEIS.indexOf(atual);
  return { nivel: atual.nome, pct, faltam: atual.max - xpTotal + 1, proximo: NIVEIS[idx + 1]?.nome ?? null };
}
