'use client';

import { Search } from 'lucide-react';
import type { Usuario } from '@/types';
import { NotificationsBell } from './NotificationsBell';

function saudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function Topbar({ usuario }: { usuario?: Partial<Usuario> }) {
  const primeiroNome = usuario?.nome?.split(' ')[0] ?? '';
  return (
    <header className="h-16 shrink-0 border-b border-black bg-white flex items-center justify-between gap-4 px-8">
      <h1 className="text-lg font-bold truncate">
        {saudacao()}, {primeiroNome}.
      </h1>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 border border-black rounded px-3 h-10 w-64 focus-within:border-green transition-colors">
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
