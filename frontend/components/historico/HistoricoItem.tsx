'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge, DificuldadeBadge } from '@/components/ui/badge';
import { AREA_LABEL } from '@/lib/constants';
import type { Resposta } from '@/types';

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatarTempo(segundos: number) {
  if (!segundos || segundos <= 0) return null;
  const min = Math.floor(segundos / 60);
  const seg = segundos % 60;
  if (min === 0) return `${seg}s`;
  return `${min}min`;
}

export function HistoricoItem({ resposta }: { resposta: Resposta }) {
  const caso = resposta.caso;
  const tempo = formatarTempo(resposta.tempoGasto);

  return (
    <Link href={`/feedback/${resposta.id}`} className="block">
      <motion.div
        whileHover={{ borderColor: '#0F4D0F', y: -2 }}
        transition={{ duration: 0.2 }}
        className="border border-black rounded p-4 bg-white flex items-center justify-between gap-4"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {caso && <Badge>{AREA_LABEL[caso.area]}</Badge>}
            {caso && <DificuldadeBadge dificuldade={caso.dificuldade} />}
          </div>
          <p className="font-bold truncate">{caso?.titulo ?? 'Caso clínico'}</p>
          <p className="text-xs text-neutral-600 mt-1">
            {formatarData(resposta.createdAt)}
            {tempo && <span className="ml-2">· {tempo}</span>}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-lg font-bold">{resposta.nota ?? '—'}</span>
          <span className="text-sm text-neutral-600">/100</span>
        </div>
      </motion.div>
    </Link>
  );
}
