'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface RankingLinha {
  posicao: number;
  id: string;
  nome: string;
  avatarUrl?: string | null;
  nivel?: string;
  xpTotal?: number;
  xpSemana?: number;
}

function inicial(nome: string) {
  return nome?.trim().charAt(0).toUpperCase() || '?';
}

export function TabelaRanking({
  itens,
  meuId,
  mostrarNivel = true,
}: {
  itens: RankingLinha[];
  meuId?: string;
  mostrarNivel?: boolean;
}) {
  const lista = Array.isArray(itens) ? itens : [];

  if (lista.length === 0) {
    return (
      <div className="border border-dashed border-neutral-400 rounded p-8 text-center text-sm text-neutral-500">
        Sem dados de ranking ainda.
      </div>
    );
  }

  return (
    <div className="border border-border rounded overflow-hidden">
      {/* Cabeçalho */}
      <div className="flex items-center px-4 h-10 border-b border-border bg-card text-xs uppercase tracking-wider text-neutral-600">
        <span className="w-10 shrink-0">#</span>
        <span className="flex-1 min-w-0">Estudante</span>
        {mostrarNivel && <span className="hidden sm:block w-28 shrink-0">Nível</span>}
        <span className="w-20 shrink-0 text-right">XP</span>
      </div>

      <div className="divide-y divide-neutral-200">
        {lista.map((it) => {
          const sou = !!meuId && it.id === meuId;
          const xp = it.xpTotal ?? it.xpSemana ?? 0;
          return (
            <div
              key={it.id}
              className={cn('flex items-center px-4 py-3 text-sm', sou && 'bg-foreground text-background')}
            >
              <span className={cn('w-10 shrink-0 font-bold', sou ? 'text-background' : 'text-neutral-500')}>
                {it.posicao}
              </span>
              <span className="flex-1 min-w-0 flex items-center gap-3">
                <span
                  className={cn(
                    'h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold border',
                    sou ? 'bg-background text-foreground border-background' : 'bg-foreground text-background border-border',
                  )}
                >
                  {inicial(it.nome)}
                </span>
                <span className="truncate font-bold">{sou ? `${it.nome} (Você)` : it.nome}</span>
              </span>
              {mostrarNivel && (
                <span className="hidden sm:block w-28 shrink-0">
                  {it.nivel && (
                    <Badge variant={sou ? 'solid' : 'outline'} className={sou ? 'bg-background text-foreground' : ''}>
                      {it.nivel}
                    </Badge>
                  )}
                </span>
              )}
              <span className="w-20 shrink-0 text-right font-bold">{xp.toLocaleString('pt-BR')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
