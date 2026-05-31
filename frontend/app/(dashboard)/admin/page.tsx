'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, FileText, MessageSquare, Star, Loader2, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AREA_LABEL } from '@/lib/constants';
import type { Area, Usuario } from '@/types';

interface Analytics {
  totalUsuarios: number;
  totalCasos: number;
  totalRespostas: number;
  mediaNotaGeral: number;
  casosPorArea: Array<{ area: Area; total: number }>;
  respostasUltimos7Dias: number;
  topUsuarios: Array<{ nome: string; xpTotal: number }>;
}

const ATALHOS = [
  { href: '/admin/criar-caso', label: 'Criar caso' },
  { href: '/admin/gerenciar-casos', label: 'Gerenciar casos' },
  { href: '/admin/respostas', label: 'Respostas' },
  { href: '/admin/usuarios', label: 'Usuários' },
  { href: '/admin/analytics', label: 'Analytics' },
];

export default function AdminPage() {
  const { data: session } = useSession();
  const habilitado = (session as { usuario?: Usuario } | null)?.usuario?.role === 'ADMIN';

  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => (await api.get('/api/admin/analytics')).data as Analytics,
    enabled: habilitado,
  });

  return (
    <AdminGuard>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <h1 className="text-2xl font-bold mb-2">Painel administrativo</h1>
        <p className="text-neutral-600 mb-8">Visão geral da plataforma e atalhos de gestão.</p>

        {isLoading ? (
          <div className="flex items-center gap-2 text-neutral-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando métricas...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <MetricCard label="Usuários" value={data?.totalUsuarios ?? 0} icon={Users} />
              <MetricCard label="Casos" value={data?.totalCasos ?? 0} icon={FileText} />
              <MetricCard label="Respostas" value={data?.totalRespostas ?? 0} icon={MessageSquare} />
              <MetricCard label="Nota média" value={data?.mediaNotaGeral ?? 0} icon={Star} format={false} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <section className="lg:col-span-2">
                <h2 className="text-lg font-bold mb-4">Gestão</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ATALHOS.map((a) => (
                    <Link key={a.href} href={a.href}>
                      <motion.div
                        whileHover={{ borderColor: '#0F4D0F', y: -2 }}
                        transition={{ duration: 0.2 }}
                        className="border border-black rounded p-6 bg-white flex items-center justify-between"
                      >
                        <span className="font-bold">{a.label}</span>
                        <ArrowRight className="h-4 w-4" />
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="text-lg font-bold mb-4">Top usuários (XP)</h2>
                <div className="border border-black rounded bg-white divide-y divide-black">
                  {(data?.topUsuarios ?? []).length === 0 && (
                    <p className="p-4 text-sm text-neutral-500">Nenhum usuário ainda.</p>
                  )}
                  {(data?.topUsuarios ?? []).map((u, i) => (
                    <div key={`${u.nome}-${i}`} className="flex items-center justify-between p-4">
                      <span className="flex items-center gap-3 text-sm">
                        <span className="w-5 text-neutral-600 font-bold">#{i + 1}</span>
                        {u.nome}
                      </span>
                      <span className="text-sm font-bold">
                        <AnimatedNumber value={u.xpTotal} /> XP
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="mt-8">
              <h2 className="text-lg font-bold mb-4">Casos por área</h2>
              <div className="border border-black rounded bg-white divide-y divide-black">
                {(data?.casosPorArea ?? []).length === 0 && (
                  <p className="p-4 text-sm text-neutral-500">Nenhum caso cadastrado.</p>
                )}
                {(data?.casosPorArea ?? []).map((c) => (
                  <div key={c.area} className="flex items-center justify-between p-4 text-sm">
                    <span>{AREA_LABEL[c.area] ?? c.area}</span>
                    <span className="font-bold">{c.total}</span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </motion.div>
    </AdminGuard>
  );
}
