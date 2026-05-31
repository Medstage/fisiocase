'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ConquistasGrid } from '@/components/ranking/ConquistasGrid';
import type { Conquista } from '@/types';

interface ConquistasResponse {
  conquistas: Conquista[];
}

type Aba = 'todas' | 'desbloqueadas' | 'progresso';

const ABAS: Array<{ id: Aba; label: string }> = [
  { id: 'todas', label: 'Todas' },
  { id: 'desbloqueadas', label: 'Conquistadas' },
  { id: 'progresso', label: 'Em progresso' },
];

export default function ConquistasPage() {
  const { data: session } = useSession();
  const habilitado = !!session;
  const [aba, setAba] = useState<Aba>('todas');

  const { data, isLoading } = useQuery({
    queryKey: ['conquistas'],
    queryFn: async () => (await api.get('/api/conquistas')).data as ConquistasResponse,
    enabled: habilitado,
  });

  // Backend já devolve as desbloqueadas primeiro (mais recente → mais antiga)
  // e depois as bloqueadas ordenadas por meta.
  const conquistas = data?.conquistas ?? [];
  const total = conquistas.length;
  const desbloqueadas = conquistas.filter((c) => c.desbloqueada);
  const bloqueadas = conquistas.filter((c) => !c.desbloqueada);

  const visiveis = useMemo(() => {
    if (aba === 'desbloqueadas') return desbloqueadas;
    if (aba === 'progresso') return bloqueadas;
    return conquistas;
  }, [aba, conquistas, desbloqueadas, bloqueadas]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Conquistas</h1>
          <p className="text-sm text-neutral-600 mt-1">Desbloqueie marcos resolvendo casos clínicos.</p>
        </div>
        {!isLoading && total > 0 && (
          <span className="text-sm font-bold">
            <span className="text-green">{desbloqueadas.length}</span> de {total} desbloqueadas
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {ABAS.map((a) => {
          const ativo = aba === a.id;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setAba(a.id)}
              className={cn(
                'h-9 px-4 rounded text-xs font-bold uppercase tracking-wider border border-black transition-colors',
                ativo ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100',
              )}
            >
              {a.label}
              {a.id === 'desbloqueadas' && desbloqueadas.length > 0 && (
                <span className={cn('ml-2 text-[10px]', ativo ? 'text-neutral-300' : 'text-neutral-500')}>
                  {desbloqueadas.length}
                </span>
              )}
              {a.id === 'progresso' && bloqueadas.length > 0 && (
                <span className={cn('ml-2 text-[10px]', ativo ? 'text-neutral-300' : 'text-neutral-500')}>
                  {bloqueadas.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={aba}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {visiveis.length === 0 ? (
              <div className="border border-dashed border-neutral-400 rounded p-10 text-center text-sm text-neutral-500">
                {aba === 'desbloqueadas'
                  ? 'Você ainda não desbloqueou nenhuma conquista.'
                  : aba === 'progresso'
                    ? 'Todas as conquistas foram desbloqueadas. 🎉'
                    : 'Nenhuma conquista disponível ainda.'}
              </div>
            ) : (
              <ConquistasGrid conquistas={visiveis} />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}
