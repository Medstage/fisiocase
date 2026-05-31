// Helpers compartilhados pelas telas de professor.

import type { Caso } from '@/types';

export type StatusCasoTurma = 'RASCUNHO' | 'PUBLICADO' | 'ENCERRADO';
export type StatusResposta = 'PENDENTE' | 'CORRIGIDO';

export interface TurmaProfessor {
  id: string;
  nome: string;
  descricao: string | null;
  codigo: string;
  ativa: boolean;
  professorId: string;
  createdAt: string;
  _count: { membros: number; casos: number };
}

export interface CasoTurma {
  id: string;
  turmaId: string;
  casoId: string;
  professorId: string;
  titulo: string;
  descricao: string | null;
  prazo: string | null;
  status: StatusCasoTurma;
  publicadoEm: string | null;
  createdAt: string;
  caso?: Pick<Caso, 'id' | 'titulo' | 'area' | 'dificuldade' | 'tipoPaciente'> | Caso;
  _count?: { respostas: number };
}

export interface RespostaTurma {
  id: string;
  conteudo?: string;
  status: StatusResposta;
  notaProfessor: number | null;
  feedbackProfessor: string | null;
  xpGanho: number | null;
  corrigidoEm: string | null;
  createdAt: string;
  aluno: { id: string; nome: string; avatarUrl?: string | null };
  casoTurma?: CasoTurma & { caso: Caso };
}

export interface MembroTurma {
  id: string;
  nome: string;
  avatarUrl: string | null;
  entradaEm: string;
  casosResolvidos: number;
  mediaNotas: number;
  ultimaAtividade: string | null;
}

// Conversão nota -> XP (espelho do backend, para preview na UI).
export function notaParaXpPreview(nota: number): number {
  if (nota >= 9) return 500;
  if (nota >= 7) return 380;
  if (nota >= 5) return 260;
  if (nota >= 3) return 140;
  return 60;
}

// "há X tempo" em pt-BR, simples e sem dependência externa.
export function tempoRelativo(dataIso: string | Date): string {
  const data = typeof dataIso === 'string' ? new Date(dataIso) : dataIso;
  const segundos = Math.max(1, Math.floor((Date.now() - data.getTime()) / 1000));
  if (segundos < 60) return `há ${segundos}s`;
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas}h`;
  const dias = Math.floor(horas / 24);
  if (dias < 30) return `há ${dias}d`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return `há ${meses} mês${meses > 1 ? 'es' : ''}`;
  const anos = Math.floor(meses / 12);
  return `há ${anos} ano${anos > 1 ? 's' : ''}`;
}

export function statusCasoLabel(s: StatusCasoTurma): string {
  if (s === 'RASCUNHO') return 'Rascunho';
  if (s === 'PUBLICADO') return 'Publicado';
  return 'Encerrado';
}
