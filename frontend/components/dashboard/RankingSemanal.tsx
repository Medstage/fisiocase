'use client';

import { Medal } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RankingItem {
  posicao: number;
  id: string;
  nome: string;
  xpSemana?: number;
  xpTotal?: number;
}

// Top 3 ganham medalha colorida; resto mostra o número.
function CoresMedalha(posicao: number): string | null {
  if (posicao === 1) return 'text-yellow-500';
  if (posicao === 2) return 'text-neutral-400';
  if (posicao === 3) return 'text-amber-700';
  return null;
}

export function RankingSemanal({
  itens,
  meuId,
  titulo = 'Ranking semanal',
}: {
  itens: RankingItem[];
  meuId?: string;
  titulo?: string;
}) {
  const lista = Array.isArray(itens) ? itens : [];
  return (
    <div className="border border-border rounded overflow-hidden bg-card">
      <div className="flex items-center justify-between px-4 h-12 border-b border-border">
        <span className="text-xs uppercase tracking-wider text-neutral-600">{titulo}</span>
      </div>
      <div className="divide-y divide-neutral-200">
        {lista.length === 0 && <p className="px-4 py-6 text-sm text-neutral-500">Sem dados ainda.</p>}
        {lista.map((it) => {
          const sou = it.id === meuId;
          const corMedalha = CoresMedalha(it.posicao);
          return (
            <div
              key={it.id}
              className={cn(
                'flex items-center justify-between px-4 py-2.5 text-sm transition-colors',
                sou && 'bg-primary text-primary-foreground',
              )}
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className={cn('w-5 flex items-center justify-center font-bold', sou ? 'text-primary-foreground' : 'text-neutral-500')}>
                  {corMedalha ? (
                    <Medal className={cn('h-4 w-4', sou ? 'text-primary-foreground' : corMedalha)} fill="currentColor" />
                  ) : (
                    it.posicao
                  )}
                </span>
                <span className="truncate">{sou ? 'Você' : it.nome}</span>
              </span>
              <span className="font-bold tabular-nums">{(it.xpSemana ?? it.xpTotal ?? 0).toLocaleString('pt-BR')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
