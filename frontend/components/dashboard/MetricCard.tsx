'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';

interface Props {
  label: string;
  value: number;
  icon?: LucideIcon;
  iconColor?: string;
  prefix?: string;
  suffix?: string;
  progress?: number;
  hint?: string;
  format?: boolean;
}

export function MetricCard({ label, value, icon: Icon, iconColor = 'text-neutral-600', prefix, suffix, progress, hint, format = true }: Props) {
  return (
    <motion.div
      whileHover={{ borderColor: '#0F4D0F', y: -2 }}
      transition={{ duration: 0.2 }}
      className="border border-border rounded p-6 bg-card"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider text-neutral-600">{label}</span>
        {Icon && <Icon className={`h-4 w-4 ${iconColor}`} />}
      </div>
      <div className="text-2xl font-bold flex items-baseline gap-1">
        {prefix && <span>{prefix}</span>}
        <AnimatedNumber value={value} format={format} />
        {suffix && <span className="text-base font-normal text-neutral-600">{suffix}</span>}
      </div>
      {progress !== undefined && (
        <div className="mt-3 h-2 border border-border rounded overflow-hidden">
          <motion.div
            className="h-full bg-green"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      )}
      {hint && <p className="text-xs text-neutral-600 mt-2">{hint}</p>}
    </motion.div>
  );
}
