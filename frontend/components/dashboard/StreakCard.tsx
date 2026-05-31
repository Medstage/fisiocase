'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Target } from 'lucide-react';
import { StreakDisplay } from './StreakDisplay';
import { calcularNivelFogo } from '@/lib/streak';

export interface StreakCardProps {
  sequenciaAtual: number;
  maiorSequencia: number;
  protetoresStreak: number;
  resolveuHoje: boolean;
}

export function StreakCard({ sequenciaAtual, maiorSequencia, protetoresStreak, resolveuHoje }: StreakCardProps) {
  const n = calcularNivelFogo(sequenciaAtual);
  const pct =
    n.proximoNivelDias && n.diasParaProximo !== null
      ? Math.round(((n.proximoNivelDias - n.diasParaProximo) / n.proximoNivelDias) * 100)
      : 100;

  return (
    <motion.div
      whileHover={{ borderColor: '#0F4D0F', y: -2 }}
      transition={{ duration: 0.2 }}
      className="border border-black rounded p-6 bg-white flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-neutral-600">Sequência</span>
          <span className="text-[10px] text-neutral-500">{n.label}</span>
        </div>
      </div>

      <StreakDisplay
        sequenciaAtual={sequenciaAtual}
        maiorSequencia={maiorSequencia}
        protetoresStreak={protetoresStreak}
        size="md"
      />

      {n.proximoNivelDias !== null ? (
        <div>
          <div className="flex justify-between text-[10px] text-neutral-600 mb-1">
            <span>Próximo nível</span>
            <span>{n.diasParaProximo} dia{n.diasParaProximo === 1 ? '' : 's'}</span>
          </div>
          <div className="h-1.5 border border-black rounded overflow-hidden">
            <motion.div
              className="h-full bg-green"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      ) : null}

      {resolveuHoje ? (
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle2 className="h-4 w-4 text-green" />
          <span className="text-green font-bold">Sequência garantida hoje</span>
        </div>
      ) : (
        <motion.div
          className="flex items-center gap-2 text-xs"
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Target className="h-4 w-4 text-orange-500" />
          <span className="font-bold">Resolva um caso para manter sua chama</span>
        </motion.div>
      )}
    </motion.div>
  );
}
