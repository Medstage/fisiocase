'use client';

import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';

interface Props {
  value: number;
  duration?: number;
  className?: string;
  format?: boolean;
}

export function AnimatedNumber({ value, duration = 600, className, format = true }: Props) {
  const animated = useAnimatedNumber(value, duration);
  return <span className={className}>{format ? animated.toLocaleString('pt-BR') : animated}</span>;
}
