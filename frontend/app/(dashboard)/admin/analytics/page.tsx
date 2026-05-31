'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, FileText, MessageSquare, Star, CalendarDays, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { api } from '@/lib/api';
import { MetricCard } from '@/components/dashboard/MetricCard';
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

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const habilitado = (session as { usuario?: Usuario } | null)?.usuario?.role === 'ADMIN';

  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => (await api.get('/api/admin/analytics')).data as Analytics,
    enabled: habilitado,
  });

  const grafico = (data?.casosPorArea ?? []).map((c) => ({
    area: AREA_LABEL[c.area] ?? c.area,
    total: c.total,
  }));

  return (
    <AdminGuard>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <h1 className="text-2xl font-bold mb-2">Analytics</h1>
        <p className="text-neutral-600 mb-8">Métricas detalhadas da plataforma.</p>

        {isLoading ? (
          <div className="flex items-center gap-2 text-neutral-600">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando analytics...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              <MetricCard label="Usuários" value={data?.totalUsuarios ?? 0} icon={Users} />
              <MetricCard label="Casos" value={data?.totalCasos ?? 0} icon={FileText} />
              <MetricCard label="Respostas" value={data?.totalRespostas ?? 0} icon={MessageSquare} />
              <MetricCard label="Nota média geral" value={data?.mediaNotaGeral ?? 0} icon={Star} format={false} />
              <MetricCard
                label="Respostas (7 dias)"
                value={data?.respostasUltimos7Dias ?? 0}
                icon={CalendarDays}
              />
            </div>

            <section className="mb-8">
              <h2 className="text-lg font-bold mb-4">Casos por área</h2>
              {grafico.length === 0 ? (
                <div className="border border-dashed border-neutral-400 rounded p-8 text-center text-sm text-neutral-500">
                  Nenhum caso cadastrado.
                </div>
              ) : (
                <div className="border border-black rounded bg-white p-6">
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={grafico} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                        <CartesianGrid stroke="#e5e5e5" vertical={false} />
                        <XAxis
                          dataKey="area"
                          tick={{ fontSize: 11, fill: '#525252' }}
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                          height={60}
                          stroke="#000"
                        />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#525252' }} stroke="#000" />
                        <Tooltip
                          cursor={{ fill: '#f5f5f5' }}
                          contentStyle={{ border: '1px solid #000', borderRadius: 4, fontSize: 12 }}
                        />
                        <Bar dataKey="total" fill="#000" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-6 border-t border-black divide-y divide-neutral-200">
                    {(data?.casosPorArea ?? []).map((c) => (
                      <div key={c.area} className="flex items-center justify-between py-3 text-sm">
                        <span>{AREA_LABEL[c.area] ?? c.area}</span>
                        <span className="font-bold">{c.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section>
              <h2 className="text-lg font-bold mb-4">Top usuários (XP)</h2>
              <div className="border border-black rounded bg-white divide-y divide-black">
                {(data?.topUsuarios ?? []).length === 0 && (
                  <p className="p-4 text-sm text-neutral-500">Nenhum usuário ainda.</p>
                )}
                {(data?.topUsuarios ?? []).map((u, i) => (
                  <div key={`${u.nome}-${i}`} className="flex items-center justify-between p-4 text-sm">
                    <span className="flex items-center gap-3">
                      <span className="w-5 text-neutral-600 font-bold">#{i + 1}</span>
                      {u.nome}
                    </span>
                    <span className="font-bold">{u.xpTotal.toLocaleString('pt-BR')} XP</span>
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
