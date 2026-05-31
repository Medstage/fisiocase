'use client';

import { motion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

function format(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function Timer({
  secondsLeft,
  running,
  onToggle,
}: {
  secondsLeft: number;
  running: boolean;
  onToggle: () => void;
}) {
  const critico = secondsLeft <= 60;
  return (
    <div className="flex items-center gap-2 border border-black rounded px-3 h-10">
      <motion.span
        animate={critico ? { opacity: [1, 0.4, 1] } : { opacity: 1 }}
        transition={critico ? { repeat: Infinity, duration: 1 } : {}}
        className={cn('font-bold tabular-nums', critico ? 'text-black' : 'text-green')}
      >
        {format(secondsLeft)}
      </motion.span>
      <button
        type="button"
        onClick={onToggle}
        aria-label={running ? 'Pausar' : 'Retomar'}
        className="text-neutral-600 hover:text-black"
      >
        {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
    </div>
  );
}
