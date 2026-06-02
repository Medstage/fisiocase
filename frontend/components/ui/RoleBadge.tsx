import { cn } from '@/lib/utils';
import type { Role } from '@/types';

/** Badge unificado: PROFESSOR/ADMIN exibem fixo; USER exibe o nível em verde. */
export function RoleBadge({
  role,
  nivel,
  className,
}: {
  role?: Role;
  nivel?: string;
  className?: string;
}) {
  if (role === 'PROFESSOR') {
    return (
      <span
        className={cn(
          'inline-flex items-center bg-foreground text-background text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wide',
          className,
        )}
      >
        Professor
      </span>
    );
  }
  if (role === 'ADMIN') {
    return (
      <span
        className={cn(
          'inline-flex items-center bg-foreground text-background text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wide',
          className,
        )}
      >
        Admin
      </span>
    );
  }
  return (
    <span
      className={cn(
        'inline-flex items-center border border-green text-green text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wide',
        className,
      )}
    >
      {nivel ?? 'Iniciante'}
    </span>
  );
}
