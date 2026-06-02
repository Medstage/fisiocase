'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge, DificuldadeBadge } from '@/components/ui/badge';
import { AREA_LABEL } from '@/lib/constants';
import type { Resposta } from '@/types';

export function CasoResolvidoCard({ resposta }: { resposta: Resposta }) {
  const caso = resposta.caso;
  return (
    <Link href={`/feedback/${resposta.id}`} className="block">
      <motion.div
        whileHover={{ borderColor: '#0F4D0F', y: -2 }}
        transition={{ duration: 0.2 }}
        className="border border-border rounded p-4 bg-card flex items-center justify-between gap-4"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {caso && <Badge>{AREA_LABEL[caso.area]}</Badge>}
            {caso && <DificuldadeBadge dificuldade={caso.dificuldade} />}
          </div>
          <p className="font-bold truncate">{caso?.titulo ?? 'Caso clínico'}</p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-lg font-bold">{resposta.nota ?? '—'}</span>
          <span className="text-sm text-neutral-600">/100</span>
        </div>
      </motion.div>
    </Link>
  );
}
