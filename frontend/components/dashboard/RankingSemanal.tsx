'use client';

import { cn } from '@/lib/utils';

export interface RankingItem {
  posicao: number;
  id: string;
  nome: string;
  xpSemana?: number;
  xpTotal?: number;
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
    <div className="border border-border rounded overflow-hidden">
      <div className="flex items-center justify-between px-4 h-12 border-b border-border">
        <span className="text-xs uppercase tracking-wider text-neutral-600">{titulo}</span>
      </div>
      <div className="divide-y divide-neutral-200">
        {lista.length === 0 && <p className="px-4 py-6 text-sm text-neutral-500">Sem dados ainda.</p>}
        {lista.map((it) => {
          const sou = it.id === meuId;
          return (
            <div
              key={it.id}
              className={cn('flex items-center justify-between px-4 py-2.5 text-sm', sou && 'bg-foreground text-background')}
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className={cn('w-5 text-center font-bold', sou ? 'text-background' : 'text-neutral-500')}>
                  {it.posicao}
                </span>
                <span className="truncate">{sou ? 'Você' : it.nome}</span>
              </span>
              <span className="font-bold">{(it.xpSemana ?? it.xpTotal ?? 0).toLocaleString('pt-BR')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
