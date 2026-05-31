'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Zap, History, Trophy, User, GraduationCap, FilePlus, ClipboardCheck, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ehProfessor } from '@/lib/role';
import type { Usuario } from '@/types';

const itensAluno = [
  { href: '/dashboard', label: 'Início', icon: Home },
  { href: '/novo-caso', label: 'Novo caso', icon: Zap },
  { href: '/historico', label: 'Histórico', icon: History },
  { href: '/ranking', label: 'Ranking', icon: Trophy },
  { href: '/perfil', label: 'Perfil', icon: User },
];

const itensProfessor = [
  { href: '/professor/dashboard', label: 'Painel', icon: LayoutDashboard },
  { href: '/professor/turmas', label: 'Turmas', icon: GraduationCap },
  { href: '/professor/casos/criar', label: 'Criar', icon: FilePlus },
  { href: '/professor/correcoes', label: 'Correções', icon: ClipboardCheck },
  { href: '/perfil', label: 'Perfil', icon: User },
];

export function MobileBottomNav({ usuario }: { usuario?: Partial<Usuario> }) {
  const pathname = usePathname();
  const itens = ehProfessor(usuario?.role) ? itensProfessor : itensAluno;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-black flex z-30"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navegação principal"
    >
      {itens.map(({ href, label, icon: Icon }) => {
        const ativo = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
              ativo ? 'bg-black text-white' : 'text-black hover:bg-neutral-100',
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider truncate max-w-full px-1">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
