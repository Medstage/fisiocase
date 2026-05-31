'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Trophy, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { CasoResolvidoCard } from '@/components/dashboard/CasoResolvidoCard';
import { RankingSemanal, type RankingItem } from '@/components/dashboard/RankingSemanal';
import { StreakCard } from '@/components/dashboard/StreakCard';
import { progressoNivel } from '@/lib/constants';
import type { Usuario, Resposta } from '@/types';

interface StreakResp {
  sequenciaAtual: number;
  maiorSequencia: number;
  protetoresStreak: number;
  resolveuHoje: boolean;
  quebrou: boolean;
  protetorUsado: boolean;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const usuario = (session as { usuario?: Usuario } | null)?.usuario;
  const habilitado = !!session;

  const { data: posicao } = useQuery({
    queryKey: ['ranking-posicao'],
    queryFn: async () => (await api.get('/api/ranking/posicao')).data as { posicao: number; total: number },
    enabled: habilitado,
  });

  const { data: ranking } = useQuery({
    queryKey: ['ranking-global-dash'],
    queryFn: async () => (await api.get('/api/ranking/global?limit=6')).data as { ranking: RankingItem[] },
    enabled: habilitado,
  });

  const { data: historico } = useQuery({
    queryKey: ['historico-dashboard'],
    queryFn: async () => (await api.get('/api/respostas/historico?limit=4')).data as { respostas: Resposta[] },
    enabled: habilitado,
  });

  const { data: streak } = useQuery({
    queryKey: ['streak'],
    queryFn: async () => (await api.get('/api/streak')).data as StreakResp,
    enabled: habilitado,
  });

  const xpTotal = usuario?.xpTotal ?? 0;
  const prog = progressoNivel(xpTotal);
  const respostas = historico?.respostas ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StreakCard
          sequenciaAtual={streak?.sequenciaAtual ?? usuario?.sequenciaAtual ?? 0}
          maiorSequencia={streak?.maiorSequencia ?? usuario?.maiorSequencia ?? 0}
          protetoresStreak={streak?.protetoresStreak ?? 0}
          resolveuHoje={streak?.resolveuHoje ?? false}
        />
        <MetricCard label="Total XP" value={xpTotal} icon={Zap} iconColor="text-amber-500" />
        {/* Nível (card custom — nome + progresso) */}
        <motion.div
          whileHover={{ borderColor: '#0F4D0F', y: -2 }}
          transition={{ duration: 0.2 }}
          className="border border-black rounded p-6 bg-white"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-neutral-600">Nível</span>
            <TrendingUp className="h-4 w-4 text-neutral-600" />
          </div>
          <div className="text-2xl font-bold">{prog.nivel}</div>
          <div className="mt-3 h-2 border border-black rounded overflow-hidden">
            <motion.div
              className="h-full bg-green"
              initial={{ width: 0 }}
              animate={{ width: `${prog.pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-neutral-600 mt-2">
            {prog.proximo ? `Faltam ${prog.faltam.toLocaleString('pt-BR')} XP para ${prog.proximo}` : 'Nível máximo!'}
          </p>
        </motion.div>
        <MetricCard label="Ranking geral" value={posicao?.posicao ?? 0} prefix="#" icon={Trophy} iconColor="text-yellow-500" format={false} />
      </div>

      {/* CTA */}
      <Link href="/novo-caso" className="block mb-8">
        <motion.div
          whileTap={{ scale: 0.99 }}
          className="bg-black text-white rounded h-14 flex items-center justify-center gap-2 font-bold uppercase tracking-wider hover:bg-green transition-colors"
        >
          <Plus className="h-5 w-5" />
          Iniciar novo caso
        </motion.div>
      </Link>

      {/* Conteúdo: últimos casos + ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2">
          <h2 className="text-lg font-bold mb-4">Últimos casos resolvidos</h2>
          <div className="space-y-4">
            {respostas.length === 0 && (
              <div className="border border-dashed border-neutral-400 rounded p-8 text-center text-sm text-neutral-500">
                Você ainda não resolveu nenhum caso. Que tal{' '}
                <Link href="/novo-caso" className="font-bold text-black underline">
                  começar agora
                </Link>
                ?
              </div>
            )}
            {respostas.map((r) => (
              <CasoResolvidoCard key={r.id} resposta={r} />
            ))}
          </div>
        </section>

        <section>
          <RankingSemanal itens={ranking?.ranking ?? []} meuId={usuario?.id} titulo="Ranking" />
        </section>
      </div>
    </motion.div>
  );
}
