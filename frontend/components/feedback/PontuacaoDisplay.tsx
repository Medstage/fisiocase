'use client';

import { motion } from 'framer-motion';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';

function mensagem(nota: number): string {
  if (nota >= 90) return 'Excelente conduta clínica!';
  if (nota >= 80) return 'Muito bom — quase lá.';
  if (nota >= 70) return 'Bom, mas há pontos a melhorar.';
  if (nota >= 60) return 'Na média. Revise os conceitos.';
  return 'Precisa reforçar o raciocínio clínico.';
}

export function PontuacaoDisplay({ nota, xpGanho }: { nota: number; xpGanho?: number }) {
  return (
    <div className="border border-border rounded p-8 text-center">
      <p className="text-xs uppercase tracking-wider text-neutral-600 mb-2">Sua pontuação</p>
      <div className="text-6xl font-bold">
        <AnimatedNumber value={nota} format={false} />
        <span className="text-2xl text-neutral-600">/100</span>
      </div>
      <p className="text-sm text-neutral-600 mt-2">{mensagem(nota)}</p>

      <div className="mt-6 h-3 border border-border rounded overflow-hidden">
        <motion.div
          className="h-full bg-green"
          initial={{ width: 0 }}
          animate={{ width: `${nota}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {typeof xpGanho === 'number' && (
        <div className="mt-6 inline-flex items-center gap-2 bg-foreground text-background rounded px-4 h-10 font-bold">
          +<AnimatedNumber value={xpGanho} format={false} /> XP
        </div>
      )}
    </div>
  );
}
