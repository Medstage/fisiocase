import * as React from 'react';
import { cn } from '@/lib/utils';
import type { Dificuldade } from '@/types';
import { DIFICULDADE_LABEL } from '@/lib/constants';

type BadgeVariant = 'outline' | 'solid' | 'green';

const variants: Record<BadgeVariant, string> = {
  outline: 'border border-black text-black',
  solid: 'bg-black text-white',
  green: 'border border-green text-green',
};

export function Badge({
  children,
  variant = 'outline',
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-xs leading-none h-5',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Badge de dificuldade conforme o design: Fácil=outline, Médio=preto, Difícil=preto+bold. */
export function DificuldadeBadge({ dificuldade }: { dificuldade: Dificuldade }) {
  const label = DIFICULDADE_LABEL[dificuldade];
  if (dificuldade === 'FACIL') return <Badge variant="outline">{label}</Badge>;
  if (dificuldade === 'DIFICIL') return <Badge variant="solid" className="font-bold">{label}</Badge>;
  return <Badge variant="solid">{label}</Badge>;
}
