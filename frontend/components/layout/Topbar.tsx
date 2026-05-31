'use client';

import { Menu, Search } from 'lucide-react';
import type { Usuario } from '@/types';
import { NotificationsBell } from './NotificationsBell';
import { useUiStore } from '@/store/uiStore';

function saudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function Topbar({ usuario }: { usuario?: Partial<Usuario> }) {
  const primeiroNome = usuario?.nome?.split(' ')[0] ?? '';
  const setMobileOpen = useUiStore((s) => s.setMobileOpen);

  return (
    <header className="h-16 shrink-0 border-b border-black bg-white flex items-center justify-between gap-3 px-4 md:px-8">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          type="button"
          aria-label="Abrir menu"
          onClick={() => setMobileOpen(true)}
          className="md:hidden border border-black rounded p-2 hover:bg-neutral-100 transition-colors shrink-0"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base md:text-lg font-bold truncate">
          {saudacao()}, {primeiroNome}.
        </h1>
      </div>

      <div className="flex items-center gap-3 md:gap-4 shrink-0">
        <div className="hidden lg:flex items-center gap-2 border border-black rounded px-3 h-10 w-64 focus-within:border-green transition-colors">
          <Search className="h-4 w-4 text-neutral-600" />
          <input
            placeholder="Buscar casos..."
            className="w-full bg-transparent outline-none text-sm placeholder:text-neutral-500"
          />
        </div>
        <NotificationsBell />
      </div>
    </header>
  );
}
