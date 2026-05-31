'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { ConquistasGrid } from '@/components/ranking/ConquistasGrid';
import type { Conquista } from '@/types';

interface ConquistasResponse {
  conquistas: Conquista[];
}

export default function ConquistasPage() {
  const { data: session } = useSession();
  const habilitado = !!session;

  const { data, isLoading } = useQuery({
    queryKey: ['conquistas'],
    queryFn: async () => (await api.get('/api/conquistas')).data as ConquistasResponse,
    enabled: habilitado,
  });

  const conquistas = data?.conquistas ?? [];
  const total = conquistas.length;
  const desbloqueadas = conquistas.filter((c) => c.desbloqueada).length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Conquistas</h1>
          <p className="text-sm text-neutral-600 mt-1">Desbloqueie marcos resolvendo casos clínicos.</p>
        </div>
        {!isLoading && total > 0 && (
          <span className="text-sm font-bold">
            <span className="text-green">{desbloqueadas}</span> de {total} desbloqueadas
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : (
        <ConquistasGrid conquistas={conquistas} />
      )}
    </motion.div>
  );
}
