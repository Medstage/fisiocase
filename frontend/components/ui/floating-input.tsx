'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

// Input com floating label (padrão do Stitch): borda preta, foco verde, sem sombra.
export const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, id, className, children, ...props }, ref) => (
    <div className="relative flex items-center border border-black bg-white rounded transition-colors duration-150 focus-within:border-green">
      <input
        ref={ref}
        id={id}
        placeholder=" "
        className={cn(
          'peer block w-full px-4 pb-2 pt-5 text-black bg-transparent border-0 outline-none focus:ring-0 appearance-none text-sm',
          className,
        )}
        {...props}
      />
      <label
        htmlFor={id}
        className="absolute text-neutral-600 duration-150 transform -translate-y-3 scale-75 top-3.5 z-10 origin-[0] left-4 text-sm pointer-events-none peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3"
      >
        {label}
      </label>
      {children}
    </div>
  ),
);
FloatingInput.displayName = 'FloatingInput';
