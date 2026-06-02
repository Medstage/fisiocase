import type { ReactNode } from 'react';

/** Fundo branco com grade sutil de quadrados + card de auth centralizado. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-card relative overflow-hidden">
      {/* Grade de quadrados (sutil, sobre fundo branco) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="relative w-full max-w-md border border-border rounded bg-card p-8 sm:p-10">{children}</div>
    </div>
  );
}
