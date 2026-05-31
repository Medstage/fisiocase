'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle2, Star, Flame, BarChart3, Pencil, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber';
import { Button } from '@/components/ui/button';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { AREA_LABEL } from '@/lib/constants';
import type { Usuario, Area } from '@/types';

interface Estatisticas {
  casosResolvidosPorArea: { area: Area; total: number }[];
  evolucaoSemanalXp: { semana: string; xp: number }[];
  maiorSequencia: number;
  melhorArea: string | null;
  totalCasos: number;
  mediaGeral: number;
}

function StatCard({ label, icon: Icon, iconColor = 'text-black', children }: { label: string; icon: typeof Star; iconColor?: string; children: React.ReactNode }) {
  return (
    <motion.div whileHover={{ borderColor: '#0F4D0F', y: -2 }} transition={{ duration: 0.2 }} className="border border-black rounded p-6 min-h-[120px] flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">{label}</span>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div className="text-3xl font-bold">{children}</div>
    </motion.div>
  );
}

export default function PerfilPage() {
  const { data: usuario, isLoading: loadingPerfil } = useQuery({
    queryKey: ['perfil-v2'],
    queryFn: async () => {
      const { data } = await api.get('/api/perfil');
      return (data?.user ?? data) as Usuario;
    },
  });
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['perfil-estatisticas'],
    queryFn: async () => (await api.get('/api/perfil/estatisticas')).data as Estatisticas,
  });

  if (loadingPerfil || loadingStats || !usuario?.nome) {
    return (
      <div className="flex items-center gap-2 text-neutral-600">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando perfil...
      </div>
    );
  }

  const areas = stats?.casosResolvidosPorArea ?? [];
  const maxArea = areas.reduce((m, a) => Math.max(m, a.total), 0);
  const evolucao = stats?.evolucaoSemanalXp ?? [];
  const melhorArea = stats?.melhorArea ? AREA_LABEL[stats.melhorArea as Area] ?? stats.melhorArea : '—';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="flex flex-col gap-6">
      {/* Header do perfil */}
      <section className="border border-black rounded p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative">
        <div className="h-20 w-20 shrink-0 rounded-full border border-black bg-black text-white flex items-center justify-center text-3xl font-bold">
          {usuario.nome.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col text-center sm:text-left gap-1 flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-2xl font-bold leading-none">{usuario.nome}</h2>
            <RoleBadge role={usuario.role} nivel={usuario.nivel} className="rounded-full px-3 py-1" />
          </div>
          {usuario.instituicao && <p className="text-base text-neutral-600">{usuario.instituicao}</p>}
          {usuario.bio && <p className="text-sm text-neutral-500 mt-1 max-w-2xl">{usuario.bio}</p>}
          {usuario.semestre ? <p className="text-xs text-neutral-500">{usuario.semestre}º semestre</p> : null}
        </div>
        <Link href="/perfil/editar" className="absolute top-4 right-4">
          <Button variant="outline" size="sm" className="gap-2">
            <Pencil className="h-4 w-4" /> Editar
          </Button>
        </Link>
      </section>

      {/* Métricas */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Casos resolvidos" icon={CheckCircle2} iconColor="text-green">
          <AnimatedNumber value={stats?.totalCasos ?? 0} format={false} />
        </StatCard>
        <StatCard label="Total XP" icon={Star} iconColor="text-amber-500">
          <AnimatedNumber value={usuario.xpTotal ?? 0} />
        </StatCard>
        <StatCard label="Maior sequência" icon={Flame} iconColor="text-orange-500">
          <AnimatedNumber value={stats?.maiorSequencia ?? usuario.maiorSequencia ?? 0} format={false} />
          <span className="text-base font-normal text-neutral-600 ml-1">dias</span>
        </StatCard>
        <StatCard label="Melhor área" icon={BarChart3} iconColor="text-purple-500">
          <span className="text-2xl truncate block">{melhorArea}</span>
        </StatCard>
      </section>

      {/* Gráficos */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Desempenho por área */}
        <div className="border border-black rounded p-6">
          <h3 className="text-lg font-bold mb-4 pb-3 border-b border-black">Casos por área</h3>
          <div className="flex flex-col gap-4">
            {areas.length === 0 && <p className="text-sm text-neutral-500">Resolva casos para ver seu desempenho por área.</p>}
            {areas.map((a) => {
              const pct = maxArea > 0 ? Math.round((a.total / maxArea) * 100) : 0;
              return (
                <div key={a.area} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{AREA_LABEL[a.area] ?? a.area}</span>
                    <span>{a.total}</span>
                  </div>
                  <div className="h-6 w-full border border-black bg-surface relative">
                    <motion.div className="absolute top-0 left-0 h-full bg-black" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Evolução semanal */}
        <div className="border border-black rounded p-6">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-black">
            <h3 className="text-lg font-bold">Evolução semanal (XP)</h3>
            <span className="text-xs font-bold border border-black px-2 py-1 rounded">Últimas semanas</span>
          </div>
          {evolucao.length === 0 ? (
            <p className="text-sm text-neutral-500">Sem dados ainda.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={evolucao} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <XAxis dataKey="semana" tick={{ fontSize: 11 }} axisLine={{ stroke: '#000' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={{ stroke: '#000' }} tickLine={false} width={40} />
                <Tooltip contentStyle={{ border: '1px solid #000', borderRadius: 4, fontSize: 12 }} />
                <Line type="monotone" dataKey="xp" stroke="#000000" strokeWidth={2} dot={{ r: 3, fill: '#0F4D0F', stroke: '#0F4D0F' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </motion.div>
  );
}
