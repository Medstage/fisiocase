'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/admin', label: 'Painel' },
  { href: '/admin/criar-caso', label: 'Criar caso' },
  { href: '/admin/gerenciar-casos', label: 'Gerenciar casos' },
  { href: '/admin/respostas', label: 'Respostas' },
  { href: '/admin/usuarios', label: 'Usuários' },
  { href: '/admin/professores', label: 'Professores' },
  { href: '/admin/analytics', label: 'Analytics' },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-6 mb-8 border-b border-border overflow-x-auto">
      {LINKS.map((l) => {
        const ativo = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              'shrink-0 px-1 pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors',
              ativo ? 'border-green text-foreground' : 'border-transparent text-neutral-500 hover:text-foreground',
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
