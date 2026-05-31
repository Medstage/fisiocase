'use client';

import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import type { Usuario } from '@/types';

export function DashboardShell({ usuario, children }: { usuario?: Partial<Usuario>; children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white text-black">
      <Sidebar usuario={usuario} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar usuario={usuario} />
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
