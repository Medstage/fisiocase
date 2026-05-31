'use client';

import { useSession } from 'next-auth/react';
import { ShieldAlert } from 'lucide-react';
import type { Usuario } from '@/types';
import { AdminNav } from './AdminNav';

/**
 * Envolve cada página admin: exibe o sub-nav e bloqueia (apenas na UX) quem não
 * é ADMIN. O backend já exige ADMIN nas rotas — isto evita uma tela quebrada.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const usuario = (session as { usuario?: Usuario } | null)?.usuario;

  if (status !== 'loading' && usuario?.role !== 'ADMIN') {
    return (
      <div className="border border-black rounded p-8 bg-white flex items-center gap-3">
        <ShieldAlert className="h-5 w-5 shrink-0" />
        <p className="text-sm font-bold">Acesso restrito a administradores.</p>
      </div>
    );
  }

  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}
