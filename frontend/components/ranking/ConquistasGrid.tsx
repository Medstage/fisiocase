'use client';

import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { conquistaIcone } from '@/lib/conquistas';
import type { Conquista } from '@/types';

function formatarData(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ConquistaCard({ conquista, index }: { conquista: Conquista; index: number }) {
  const desbloqueada = !!conquista.desbloqueada;
  const data = formatarData(conquista.unlockedAt);
  const { Icon, cor } = conquistaIcone(conquista.icone);

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
      className={cn(
        'border rounded p-6 bg-white flex flex-col',
        desbloqueada ? 'border-green' : 'border-black opacity-50',
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span
          className={cn(
            'h-10 w-10 rounded flex items-center justify-center border',
            desbloqueada ? `border-black ${cor}` : 'border-black text-neutral-400',
          )}
        >
          {desbloqueada ? <Icon className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
        </span>
        <span
          className={cn(
            'text-xs font-bold',
            desbloqueada ? 'text-green' : 'text-neutral-500',
          )}
        >
          +{conquista.xpRecompensa} XP
        </span>
      </div>
      <h3 className="font-bold">{conquista.titulo}</h3>
      <p className="text-sm text-neutral-600 mt-1 flex-1">{conquista.descricao}</p>
      {desbloqueada && data && (
        <p className="text-xs text-green mt-3">Desbloqueada em {data}</p>
      )}
    </motion.div>
  );
}

export function ConquistasGrid({ conquistas }: { conquistas: Conquista[] }) {
  const lista = Array.isArray(conquistas) ? conquistas : [];

  if (lista.length === 0) {
    return (
      <div className="border border-dashed border-neutral-400 rounded p-8 text-center text-sm text-neutral-500">
        Nenhuma conquista disponível ainda.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {lista.map((c, i) => (
        <ConquistaCard key={c.id} conquista={c} index={i} />
      ))}
    </div>
  );
}
