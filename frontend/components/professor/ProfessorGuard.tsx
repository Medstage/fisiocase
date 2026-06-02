'use client';

import { useSession } from 'next-auth/react';
import { ShieldAlert, Loader2 } from 'lucide-react';
import type { Usuario } from '@/types';
import { ehProfessor } from '@/lib/role';

/**
 * Bloqueia a UX para quem não é PROFESSOR ou ADMIN. O backend já protege os
 * endpoints — isto evita uma tela quebrada quando aluno acessa por engano.
 */
export function ProfessorGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const usuario = (session as { usuario?: Usuario } | null)?.usuario;

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2 text-neutral-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
      </div>
    );
  }

  if (!ehProfessor(usuario?.role)) {
    return (
      <div className="border border-border rounded p-8 bg-card flex items-center gap-3">
        <ShieldAlert className="h-5 w-5 shrink-0" />
        <p className="text-sm font-bold">Acesso restrito a professores.</p>
      </div>
    );
  }

  return <>{children}</>;
}
