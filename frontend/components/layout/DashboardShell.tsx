'use client';

import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileBottomNav } from './MobileBottomNav';
import type { Usuario } from '@/types';

export function DashboardShell({ usuario, children }: { usuario?: Partial<Usuario>; children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar usuario={usuario} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar usuario={usuario} />
        <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8">{children}</main>
      </div>
      <MobileBottomNav usuario={usuario} />
    </div>
  );
}
