'use client';

import { motion } from 'framer-motion';
import { Flame, Shield } from 'lucide-react';
import { calcularNivelFogo } from '@/lib/streak';
import { cn } from '@/lib/utils';

type Size = 'sm' | 'md' | 'lg';

const SIZES: Record<Size, { icon: string; num: string }> = {
  sm: { icon: 'h-5 w-5', num: 'text-base' },
  md: { icon: 'h-10 w-10', num: 'text-3xl' },
  lg: { icon: 'h-16 w-16', num: 'text-5xl' },
};

export function StreakDisplay({
  sequenciaAtual,
  maiorSequencia,
  protetoresStreak,
  size = 'md',
  mostrarDias = true,
}: {
  sequenciaAtual: number;
  maiorSequencia?: number;
  protetoresStreak?: number;
  size?: Size;
  mostrarDias?: boolean;
}) {
  const n = calcularNivelFogo(sequenciaAtual);
  const apagado = n.nivel === 'apagado';
  const intenso = n.nivel === 'grande' || n.nivel === 'lendario';
  const s = SIZES[size];

  const tooltip = `${sequenciaAtual} dias consecutivos${
    maiorSequencia !== undefined ? ` • Maior sequência: ${maiorSequencia}` : ''
  }${protetoresStreak ? ` • ${protetoresStreak} protetor${protetoresStreak > 1 ? 'es' : ''}` : ''}`;

  return (
    <div className="inline-flex items-center gap-3" title={tooltip}>
      <div className="relative">
        <motion.div
          animate={
            apagado
              ? { scale: 1 }
              : intenso
                ? { scale: [1, 1.12, 1], rotate: [0, -3, 3, 0] }
                : { scale: [1, 1.06, 1] }
          }
          transition={apagado ? { duration: 0 } : { repeat: Infinity, duration: intenso ? 1.4 : 2.2, ease: 'easeInOut' }}
        >
          <Flame
            className={cn(s.icon, n.cor, apagado && 'opacity-40')}
            fill={apagado ? 'none' : 'currentColor'}
            strokeWidth={1.5}
          />
        </motion.div>
        {protetoresStreak !== undefined && protetoresStreak > 0 && (
          <span
            title={`${protetoresStreak} protetor${protetoresStreak > 1 ? 'es' : ''} disponível${protetoresStreak > 1 ? 'eis' : ''}`}
            className="absolute -top-1 -right-1 bg-card border border-border rounded-full h-5 w-5 flex items-center justify-center"
          >
            <Shield className="h-3 w-3 text-blue-600" fill="currentColor" />
          </span>
        )}
      </div>

      {mostrarDias && (
        <div className="flex flex-col leading-tight">
          <span className={cn(s.num, 'font-bold', apagado ? 'text-neutral-400' : 'text-green')}>{sequenciaAtual}</span>
          <span className="text-xs text-neutral-600">dias</span>
        </div>
      )}
    </div>
  );
}
