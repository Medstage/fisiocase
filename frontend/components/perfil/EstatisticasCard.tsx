'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string;
  icon?: LucideIcon;
  hint?: string;
}

/** Card de estatística para valores textuais (ex.: melhor área), no mesmo estilo do MetricCard. */
export function EstatisticasCard({ label, value, icon: Icon, hint }: Props) {
  return (
    <motion.div
      whileHover={{ borderColor: '#0F4D0F', y: -2 }}
      transition={{ duration: 0.2 }}
      className="border border-black rounded p-6 bg-white"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider text-neutral-600">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-neutral-600" />}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {hint && <p className="text-xs text-neutral-600 mt-2">{hint}</p>}
    </motion.div>
  );
}
