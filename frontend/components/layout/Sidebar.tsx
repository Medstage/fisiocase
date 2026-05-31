'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Home,
  Zap,
  History,
  Trophy,
  User,
  Settings,
  LogOut,
  ShieldCheck,
  ChevronLeft,
  Users,
  LayoutDashboard,
  ClipboardCheck,
  FilePlus,
  GraduationCap,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/store/uiStore';
import { ehProfessor } from '@/lib/role';
import { RoleBadge } from '@/components/ui/RoleBadge';
import type { Usuario } from '@/types';

const itensPrincipais = [
  { href: '/dashboard', label: 'Início', icon: Home },
  { href: '/novo-caso', label: 'Novo caso', icon: Zap },
  { href: '/historico', label: 'Histórico', icon: History },
  { href: '/ranking', label: 'Ranking', icon: Trophy },
  { href: '/turmas', label: 'Minhas turmas', icon: Users },
  { href: '/conquistas', label: 'Conquistas', icon: Award },
  { href: '/perfil', label: 'Perfil', icon: User },
];

const itensProfessor = [
  { href: '/professor/dashboard', label: 'Painel professor', icon: LayoutDashboard },
  { href: '/professor/turmas', label: 'Minhas turmas (prof)', icon: GraduationCap },
  { href: '/professor/casos/criar', label: 'Criar caso', icon: FilePlus },
  { href: '/professor/correcoes', label: 'Correções', icon: ClipboardCheck },
];

export function Sidebar({ usuario }: { usuario?: Partial<Usuario> }) {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useUiStore();
  const inicial = usuario?.nome?.charAt(0).toUpperCase() ?? 'U';

  const Item = ({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Home }) => {
    const ativo = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        href={href}
        title={collapsed ? label : undefined}
        className={cn(
          'flex items-center h-11 rounded transition-colors',
          collapsed ? 'w-11 justify-center mx-auto' : 'gap-3 px-4',
          ativo ? 'bg-black text-white' : 'text-black hover:bg-neutral-100',
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!collapsed && <span className="text-sm truncate">{label}</span>}
      </Link>
    );
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.25 }}
      className="hidden md:flex flex-col shrink-0 border-r border-black bg-white h-screen sticky top-0"
    >
      {/* Logo + colapsar */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-black">
        {!collapsed && <span className="font-bold text-lg">FisioCase</span>}
        <button
          onClick={toggleCollapsed}
          aria-label="Recolher menu"
          className="p-1 hover:bg-neutral-100 rounded"
        >
          <ChevronLeft className={cn('h-5 w-5 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* Perfil resumido */}
      <div className={cn('flex items-center gap-3 px-4 py-4 border-b border-black', collapsed && 'justify-center px-0')}>
        <div className="h-9 w-9 shrink-0 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">
          {inicial}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">{usuario?.nome ?? 'Usuário'}</p>
            <RoleBadge role={usuario?.role} nivel={usuario?.nivel} className="text-[10px] px-1.5 py-0" />
          </div>
        )}
      </div>

      {/* Navegação */}
      <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto">
        {itensPrincipais.map((i) => (
          <Item key={i.href} {...i} />
        ))}
        {ehProfessor(usuario?.role) &&
          itensProfessor.map((i) => <Item key={i.href} {...i} />)}
        {usuario?.role === 'ADMIN' && <Item href="/admin" label="Admin" icon={ShieldCheck} />}
      </nav>

      {/* Rodapé */}
      <div className="flex flex-col gap-1 p-3 border-t border-black">
        <Item href="/configuracoes" label="Configurações" icon={Settings} />
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          title={collapsed ? 'Sair' : undefined}
          className={cn(
            'flex items-center h-11 rounded text-black hover:bg-neutral-100 transition-colors',
            collapsed ? 'w-11 justify-center mx-auto' : 'gap-3 px-4',
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span className="text-sm">Sair</span>}
        </button>
      </div>
    </motion.aside>
  );
}
