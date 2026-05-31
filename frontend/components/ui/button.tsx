'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'outline' | 'green' | 'ghost';
type Size = 'default' | 'sm' | 'lg' | 'icon';

// Botões "Strict Flat" do Stitch: primário = preto invertido (uppercase); outline = branco/borda preta.
const variantClasses: Record<Variant, string> = {
  default: 'bg-black text-white border border-black hover:bg-white hover:text-black uppercase tracking-wider',
  outline: 'bg-white text-black border border-black hover:bg-black hover:text-white',
  green: 'bg-green text-white border border-green hover:bg-green-dark',
  ghost: 'bg-transparent text-black border border-transparent hover:bg-neutral-100',
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
