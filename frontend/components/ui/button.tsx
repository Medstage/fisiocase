'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'outline' | 'green' | 'ghost';
type Size = 'default' | 'sm' | 'lg' | 'icon';

// Botões: primário = verde fisio (identidade), outline = neutro com borda, green = verde-vivo, ghost = transparente.
const variantClasses: Record<Variant, string> = {
  default:
    'bg-primary text-primary-foreground border border-primary hover:bg-brand hover:border-brand uppercase tracking-wider',
  outline:
    'bg-card text-foreground border border-border hover:bg-accent hover:border-primary hover:text-primary',
  green:
    'bg-brand text-brand-foreground border border-brand hover:bg-primary hover:border-primary',
  ghost:
    'bg-transparent text-foreground border border-transparent hover:bg-accent',
};

const sizeClasses: Record<Size, string> = {
  default: 'h-11 px-6 text-xs font-bold',
  sm: 'h-9 px-4 text-xs font-bold',
  lg: 'h-12 px-8 text-sm font-bold',
  icon: 'h-10 w-10',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded gap-2 transition-all duration-150 active:scale-[0.98] focus:outline-none disabled:opacity-50 disabled:pointer-events-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
